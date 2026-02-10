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
    dirInput.value = res && res.lastDir ? res.lastDir : "D:/Movies/2025";
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
    const url = urlInput.value.trim();
    if (!url) {
      setStatus("Please enter a download URL", "error");
      return;
    }
    const out =
      filenameInput.value && filenameInput.value.trim()
        ? filenameInput.value.trim()
        : guessFilenameFromUrl(url);
    const dir =
      dirInput.value && dirInput.value.trim()
        ? dirInput.value.trim()
        : "D:/Movies/2025";

    sendBtn.disabled = true;
    spinner.classList.remove("hidden");
    setStatus("Sending to Motrix...", "");

    const body = {
      jsonrpc: "2.0",
      id: "ext-" + Date.now(),
      method: "aria2.addUri",
      params: [[url], { out, dir }],
    };

    try {
      const resp = await fetch("http://localhost:16800/jsonrpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) throw new Error("Network response was not ok");
      const data = await resp.json();
      if (data.error) {
        setStatus(
          "RPC Error: " + (data.error.message || JSON.stringify(data.error)),
          "error",
        );
      } else {
        setStatus("Added ✓ GID: " + (data.result || ""), "success");
        status.classList.add("pulse");
        setTimeout(() => status.classList.remove("pulse"), 900);
        chrome.storage.local.set({ lastDir: dir });
      }
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      if (
        msg.includes("Failed to fetch") ||
        msg.includes("Network") ||
        msg.includes("refused")
      ) {
        setStatus(
          "Cannot connect to Motrix at http://localhost:16800 — is it running?",
          "error",
        );
      } else {
        setStatus("Error: " + msg, "error");
      }
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
});
