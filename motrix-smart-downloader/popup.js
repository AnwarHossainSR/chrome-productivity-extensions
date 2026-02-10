document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("url");
  const filenameInput = document.getElementById("filename");
  const dirInput = document.getElementById("dir");
  const sendBtn = document.getElementById("sendBtn");
  const spinner = document.getElementById("spinner");
  const status = document.getElementById("status");

  function setStatus(text, type) {
    status.textContent = text;
    status.className = "status" + (type ? " " + type : "");
  }

  // load last directory from storage or use an example
  chrome.storage.local.get(["lastDir"], (res) => {
    dirInput.value = res && res.lastDir ? res.lastDir : "D:\\movie & series";
  });

  // try to auto-detect the active tab URL
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
        setTimeout(() => status.classList.remove("pulse"), 900);
        chrome.storage.local.set({ lastDir: dir });
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
});
