document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("url");
  const filenameInput = document.getElementById("filename");
  const dirInput = document.getElementById("dir");
  const sendBtn = document.getElementById("sendBtn");
  const spinner = document.getElementById("spinner");
  const status = document.getElementById("status");

  // true when this popup was opened from the context menu (has URL params)
  const params = new URLSearchParams(window.location.search);
  const paramUrl = params.get("url");
  const paramFilename = params.get("filename");
  const openedFromContextMenu = !!paramUrl;

  function setStatus(text, type) {
    status.textContent = text;
    status.className = "status" + (type ? " " + type : "");
  }

  // load last directory and recent dirs from storage
  chrome.storage.local.get(["lastDir", "recentDirs"], (res) => {
    dirInput.value = res && res.lastDir ? res.lastDir : "D:\\movie & series";

    // populate datalist with recent dirs
    const datalist = document.getElementById("dirSuggestions");
    if (datalist) {
      const recentDirs = Array.isArray(res.recentDirs) ? res.recentDirs : [];
      recentDirs.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d;
        datalist.appendChild(opt);
      });
    }

    // if opened from context menu, pre-fill URL & filename then focus dir
    if (openedFromContextMenu) {
      urlInput.value = paramUrl;
      filenameInput.value = paramFilename || guessFilenameFromUrl(paramUrl);
      // highlight the dir field so user can change it immediately
      dirInput.focus();
      dirInput.select();
    }
  });

  // try to auto-detect the active tab URL (only when NOT opened from context menu)
  if (!openedFromContextMenu) {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs && tabs[0];
        if (tab && tab.url) {
          urlInput.value = tab.url;
          filenameInput.value = guessFilenameFromUrl(tab.url);
        }
      });
    } catch (e) {
      // ignore if permissions not available
    }
  }

  // Browse button — opens native OS Save dialog; we extract the directory from the chosen path
  const browseBtn = document.getElementById("browseBtn");
  if (browseBtn) {
    browseBtn.addEventListener("click", () => {
      browseBtn.disabled = true;
      setStatus("Opening folder browser…", "");

      chrome.downloads.download(
        {
          url: "data:text/plain,",
          filename: "select_folder_here.tmp",
          saveAs: true,
        },
        (downloadId) => {
          if (chrome.runtime.lastError || downloadId == null) {
            browseBtn.disabled = false;
            setStatus("Could not open folder browser", "error");
            return;
          }

          let resolvedDir = null;

          const onChanged = (delta) => {
            if (delta.id !== downloadId) return;

            // Capture the path as soon as Chrome sets it (user clicked Save)
            if (delta.filename && delta.filename.current) {
              const fullPath = delta.filename.current;
              // Strip the filename to get just the directory
              resolvedDir = fullPath
                .replace(/[^\\/]*$/, "")
                .replace(/[\\/]+$/, "");
              if (resolvedDir) {
                dirInput.value = resolvedDir;
                setStatus("Folder selected", "success");
              }
            }

            // Once the (tiny) download finishes or is interrupted, clean up
            if (
              delta.state &&
              (delta.state.current === "complete" ||
                delta.state.current === "interrupted")
            ) {
              chrome.downloads.onChanged.removeListener(onChanged);
              browseBtn.disabled = false;
              if (!resolvedDir) setStatus("Ready", "");
              chrome.downloads.removeFile(downloadId, () => {
                chrome.downloads.erase({ id: downloadId });
              });
            }
          };

          chrome.downloads.onChanged.addListener(onChanged);
        },
      );
    });
  }

  sendBtn.addEventListener("click", async () => {
    const rawUrl = (urlInput.value || "").trim();
    if (!rawUrl) {
      setStatus("Please enter a download URL", "error");
      return;
    }

    const url = rawUrl;
    let out = (filenameInput.value || "").trim() || guessFilenameFromUrl(url);
    out = sanitizeFilename(out);
    let dir = (dirInput.value || "").trim() || "D:/Movies/2025";
    dir = sanitizeDir(dir);

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setStatus("Please use a valid http/https URL", "error");
      return;
    }

    // Heuristic: if URL looks like a webpage (no file extension or html-like), warn the user
    if (isLikelyWebpage(url)) {
      const ok = confirm(
        "The URL looks like a web page rather than a direct file link. Are you sure you want to send it to Motrix?",
      );
      if (!ok) {
        setStatus(
          "Cancelled — use a direct download link (right-click → Copy link)",
          "error",
        );
        return;
      }
    }

    sendBtn.disabled = true;
    spinner.classList.remove("hidden");
    setStatus("Sending to Motrix...", "");

    try {
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: "addUri", payload: { url, out, dir } },
          (resp) => resolve(resp),
        );
      });

      if (!result) throw new Error("No response from background worker");
      if (result.success) {
        const data = result.data;
        setStatus("Added ✓ GID: " + (data.result || ""), "success");
        status.classList.add("pulse");

        // persist dir to recent dirs list (keep last 10, newest first)
        chrome.storage.local.get(["recentDirs"], (res) => {
          let recentDirs = Array.isArray(res.recentDirs) ? res.recentDirs : [];
          recentDirs = [dir, ...recentDirs.filter((d) => d !== dir)].slice(
            0,
            10,
          );
          chrome.storage.local.set({ lastDir: dir, recentDirs });
        });

        // auto-close the window after a short delay when opened from context menu
        if (openedFromContextMenu) {
          setTimeout(() => window.close(), 1200);
        } else {
          setTimeout(() => status.classList.remove("pulse"), 900);
        }
      } else {
        const err = result.error || "Unknown error";
        if (
          err.toLowerCase().includes("network") ||
          err.toLowerCase().includes("fetch") ||
          err.toLowerCase().includes("refused")
        ) {
          setStatus(
            "Cannot connect to Motrix at http://localhost:16800 — is it running?",
            "error",
          );
        } else {
          setStatus("Error: " + err, "error");
        }
      }
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      setStatus("Error: " + msg, "error");
    } finally {
      sendBtn.disabled = false;
      spinner.classList.add("hidden");
    }
  });

  function guessFilenameFromUrl(u) {
    try {
      const urlObj = new URL(u);
      let name =
        urlObj.pathname.split("/").filter(Boolean).pop() ||
        urlObj.hostname ||
        "download";
      name = decodeURIComponent((name || "").split("?")[0]);
      if (!name || name.length === 0) name = "download";
      return name;
    } catch (e) {
      return "download";
    }
  }

  // sanitize filename for Windows: remove <>:"/\\|?* and control chars
  function sanitizeFilename(name) {
    name = name.replace(/[:<>"\\/|?*\x00-\x1F]/g, "").trim();
    name = name.replace(/[\.\s]+$/, "") || "download";
    if (name.length > 200) name = name.slice(0, 200);
    return name;
  }

  function sanitizeDir(d) {
    let out = d.trim();
    out = out.replace(/\\+/g, "\\");
    return out;
  }

  function isLikelyWebpage(u) {
    try {
      const urlObj = new URL(u);
      const path = urlObj.pathname || "";
      // trailing slash -> likely page
      if (path.endsWith("/")) return true;
      const last = path.split("/").filter(Boolean).pop() || "";
      if (!last) return true;
      const parts = last.split(".");
      if (parts.length === 1) return true; // no extension
      const ext = parts.pop().toLowerCase();
      const htmlExts = [
        "html",
        "htm",
        "php",
        "asp",
        "aspx",
        "jsp",
        "cgi",
        "pl",
        "cfm",
      ];
      if (htmlExts.includes(ext)) return true;
      if (ext.length > 6) return true; // weird long ext -> probably not a file
      return false;
    } catch (e) {
      return false;
    }
  }
});
