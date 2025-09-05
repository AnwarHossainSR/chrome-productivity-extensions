// Content script for Smart Bookmarks
// This runs on every page and provides additional functionality

class SmartBookmarksContent {
  constructor() {
    this.isInitialized = false;
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Add keyboard shortcut
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        this.showQuickSaveDialog();
      }
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "getPageContent") {
        sendResponse(this.getPageContent());
      }
    });

    console.log("Smart Bookmarks content script loaded");
  }

  getPageContent() {
    // Extract meaningful content from the page
    const title = document.title;
    const url = window.location.href;

    // Try to get page description
    let description = "";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      description = metaDesc.content;
    } else {
      // Fallback: get first paragraph or text content
      const firstP = document.querySelector("p");
      if (firstP) {
        description = firstP.textContent.substring(0, 200) + "...";
      }
    }

    // Get page type (social media, article, etc.)
    let pageType = "general";
    const hostname = window.location.hostname.toLowerCase();

    if (hostname.includes("linkedin.com")) pageType = "linkedin";
    else if (hostname.includes("facebook.com")) pageType = "facebook";
    else if (hostname.includes("twitter.com") || hostname.includes("x.com"))
      pageType = "twitter";
    else if (hostname.includes("reddit.com")) pageType = "reddit";
    else if (hostname.includes("medium.com")) pageType = "article";
    else if (hostname.includes("github.com")) pageType = "github";

    return {
      title,
      url,
      description,
      pageType,
      timestamp: Date.now(),
    };
  }

  showQuickSaveDialog() {
    // Remove existing dialog
    const existing = document.getElementById("smart-bookmarks-dialog");
    if (existing) {
      existing.remove();
    }

    // Create quick save dialog
    const dialog = document.createElement("div");
    dialog.id = "smart-bookmarks-dialog";
    dialog.className = "smart-bookmarks-dialog";

    const pageContent = this.getPageContent();

    dialog.innerHTML = `
      <div class="smart-bookmarks-dialog-content">
        <div class="smart-bookmarks-header">
          <h3>Quick Save Bookmark</h3>
          <button class="smart-bookmarks-close">&times;</button>
        </div>
        <div class="smart-bookmarks-page-info">
          <div class="smart-bookmarks-title">${pageContent.title}</div>
          <div class="smart-bookmarks-url">${pageContent.url}</div>
        </div>
        <div class="smart-bookmarks-form">
          <input type="text" id="smart-bookmarks-tags" placeholder="Add tags (comma separated)" />
          <div class="smart-bookmarks-quick-tags">
            <button type="button" data-tag="${pageContent.pageType}">${pageContent.pageType}</button>
            <button type="button" data-tag="important">important</button>
            <button type="button" data-tag="read-later">read later</button>
            <button type="button" data-tag="work">work</button>
          </div>
          <div class="smart-bookmarks-actions">
            <button type="button" id="smart-bookmarks-cancel">Cancel</button>
            <button type="button" id="smart-bookmarks-save">Save</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Add event listeners
    dialog
      .querySelector(".smart-bookmarks-close")
      .addEventListener("click", () => {
        dialog.remove();
      });

    dialog
      .querySelector("#smart-bookmarks-cancel")
      .addEventListener("click", () => {
        dialog.remove();
      });

    // Quick tag buttons
    dialog
      .querySelectorAll(".smart-bookmarks-quick-tags button")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const tag = btn.dataset.tag;
          const input = dialog.querySelector("#smart-bookmarks-tags");
          const currentTags = input.value
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);
          if (!currentTags.includes(tag)) {
            currentTags.push(tag);
            input.value = currentTags.join(", ");
          }
        });
      });

    // Save button
    dialog
      .querySelector("#smart-bookmarks-save")
      .addEventListener("click", () => {
        this.saveBookmarkFromDialog(dialog, pageContent);
      });

    // Close on escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        dialog.remove();
      }
    });

    // Focus on input
    setTimeout(() => {
      dialog.querySelector("#smart-bookmarks-tags").focus();
    }, 100);
  }

  async saveBookmarkFromDialog(dialog, pageContent) {
    const tagsInput = dialog.querySelector("#smart-bookmarks-tags");
    const tags = tagsInput.value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    if (tags.length === 0) {
      alert("Please add at least one tag");
      return;
    }

    const bookmark = {
      id: Date.now().toString(),
      title: pageContent.title,
      url: pageContent.url,
      description: pageContent.description,
      tags: tags,
      pageType: pageContent.pageType,
      timestamp: Date.now(),
    };

    try {
      // Get existing bookmarks
      const result = await chrome.storage.local.get(["smartBookmarks"]);
      const bookmarks = result.smartBookmarks || [];

      // Add new bookmark
      bookmarks.unshift(bookmark);

      // Save back
      await chrome.storage.local.set({ smartBookmarks: bookmarks });

      // Show success message
      this.showSuccessMessage();
      dialog.remove();
    } catch (error) {
      console.error("Error saving bookmark:", error);
      alert("Failed to save bookmark");
    }
  }

  showSuccessMessage() {
    const message = document.createElement("div");
    message.className = "smart-bookmarks-success";
    message.textContent = "Bookmark saved!";
    document.body.appendChild(message);

    setTimeout(() => {
      message.classList.add("show");
    }, 10);

    setTimeout(() => {
      message.classList.remove("show");
      setTimeout(() => message.remove(), 300);
    }, 2000);
  }
}

// Initialize when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new SmartBookmarksContent();
  });
} else {
  new SmartBookmarksContent();
}
