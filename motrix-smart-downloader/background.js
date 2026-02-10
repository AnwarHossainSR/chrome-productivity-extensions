// background.js — performs JSON-RPC requests to Motrix (aria2 RPC)
// Listens for messages from popup and retries on transient failures.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.action !== "addUri") return;

  (async () => {
    const { url, out, dir } = msg.payload || {};
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
        // send success back
        sendResponse({ success: true, data });
        return;
      } catch (err) {
        lastError = err;
        // If last attempt, break and return error
        if (attempt === maxRetries) break;
        // small backoff
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
        attempt++;
      }
    }

    sendResponse({
      success: false,
      error:
        lastError && lastError.message ? lastError.message : String(lastError),
    });
  })();

  // return true to indicate we'll call sendResponse asynchronously
  return true;
});
