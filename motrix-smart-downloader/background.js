// background.js — performs JSON-RPC requests to Motrix (aria2 RPC)
// Listens for messages from popup and retries on transient failures.

// Helper: try to open Motrix app
async function ensureMotrixRunning() {
  try {
    await chrome.tabs.create({ url: "motrix://", active: false });
    await new Promise((r) => setTimeout(r, 1500));
    const tabs = await chrome.tabs.query({ url: "motrix://*" });
    if (tabs.length) await chrome.tabs.remove(tabs.map((t) => t.id));
  } catch (e) {}
}

// Helper: send JSON-RPC to Motrix (aria2)
async function sendToMotrix(url, out, dir) {
  const body = {
    jsonrpc: "2.0",
    id: "ext-" + Date.now(),
    method: "aria2.addUri",
    params: [[url], { out, dir }],
  };

  const endpoint = "http://localhost:16800/jsonrpc";
  const maxRetries = 2;
  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok)
        throw new Error("Network response was not ok (" + resp.status + ")");
      const data = await resp.json();
      return { success: true, data };
    } catch (err) {
      lastError = err;
      if (attempt === 0) await ensureMotrixRunning();
      if (attempt === maxRetries) break;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      attempt++;
    }
  }

  return {
    success: false,
    error:
      lastError && lastError.message ? lastError.message : String(lastError),
  };
}

// Respond to popup direct requests
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.action !== "addUri") return;
  (async () => {
    const { url, out, dir } = msg.payload || {};
    const res = await sendToMotrix(url, out, dir);
    sendResponse(res);
  })();
  return true;
});

// Create context menu for links
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-to-motrix-link",
    title: "Send link to Motrix",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "send-to-motrix-link") return;
  const link = info.linkUrl || info.srcUrl || info.pageUrl;
  if (!link) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.svg",
      title: "Motrix",
      message: "No link detected to send.",
    });
    return;
  }

  const filename = (() => {
    try {
      const u = new URL(link);
      return decodeURIComponent(
        (u.pathname.split("/").filter(Boolean).pop() || u.hostname).split(
          "?",
        )[0],
      );
    } catch (e) {
      return "";
    }
  })();

  // Open a popup window so the user can confirm / change the destination dir
  const popupUrl =
    chrome.runtime.getURL("popup.html") +
    "?url=" +
    encodeURIComponent(link) +
    "&filename=" +
    encodeURIComponent(filename || "");

  chrome.windows.create({
    url: popupUrl,
    type: "popup",
    width: 420,
    height: 330,
    focused: true,
  });
});
