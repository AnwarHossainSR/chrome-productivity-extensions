// Background service worker for Smart Bookmarks
// Handles context menus, keyboard shortcuts, and other background tasks

class SmartBookmarksBackground {
  constructor() {
    this.init();
  }

  init() {
    // Create context menu when extension installs
    chrome.runtime.onInstalled.addListener(() => {
      this.createContextMenus();
    });

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });

    // Handle keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });

    // Handle extension icon clicks
    chrome.action.onClicked.addListener((tab) => {
      // This is handled by the popup, but we can add fallback logic here
      console.log("Extension icon clicked");
    });

    console.log("Smart Bookmarks background script loaded");
  }

  createContextMenus() {
    chrome.contextMenus.create({
      id: "save-page",
      title: "Save page with Smart Bookmarks",
      contexts: ["page"],
    });

    chrome.contextMenus.create({
      id: "save-link",
      title: "Save link with Smart Bookmarks",
      contexts: ["link"],
    });

    chrome.contextMenus.create({
      id: "save-selection",
      title: "Save selection with Smart Bookmarks",
      contexts: ["selection"],
    });
  }

  async handleContextMenuClick(info, tab) {
    try {
      switch (info.menuItemId) {
        case "save-page":
          await this.saveCurrentPage(tab);
          break;
        case "save-link":
          await this.saveLink(info.linkUrl, tab);
          break;
        case "save-selection":
          await this.saveSelection(info.selectionText, tab);
          break;
      }
    } catch (error) {
      console.error("Context menu error:", error);
    }
  }

  async handleCommand(command) {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      switch (command) {
        case "quick-save":
          // Inject content script to show quick save dialog
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              // Trigger the quick save dialog
              const event = new CustomEvent("smartBookmarksQuickSave");
              document.dispatchEvent(event);
            },
          });
          break;
        case "open-popup":
          // This is handled by the popup, but we can add logic here if needed
          break;
      }
    } catch (error) {
      console.error("Command error:", error);
    }
  }

  async saveCurrentPage(tab, suggestedTags = []) {
    try {
      // Get existing bookmarks
      const result = await chrome.storage.local.get(["smartBookmarks"]);
      const bookmarks = result.smartBookmarks || [];

      // Determine page type for auto-tagging
      const pageType = this.getPageType(tab.url);
      const autoTags = [pageType, "context-menu"];

      const bookmark = {
        id: Date.now().toString(),
        title: tab.title,
        url: tab.url,
        tags: [...new Set([...autoTags, ...suggestedTags])],
        timestamp: Date.now(),
        favicon: tab.favIconUrl || null,
        source: "context-menu",
      };

      bookmarks.unshift(bookmark);
      await chrome.storage.local.set({ smartBookmarks: bookmarks });

      // Show notification
      this.showNotification(
        "Page saved!",
        `"${tab.title}" has been bookmarked`
      );
    } catch (error) {
      console.error("Error saving page:", error);
      this.showNotification("Save failed", "Could not save bookmark");
    }
  }

  async saveLink(linkUrl, tab) {
    try {
      // Get link title by injecting script
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (url) => {
          const link = document.querySelector(`a[href="${url}"]`);
          return link ? link.textContent.trim() : url;
        },
        args: [linkUrl],
      });

      const linkTitle = results[0].result || linkUrl;
      const pageType = this.getPageType(linkUrl);

      const result = await chrome.storage.local.get(["smartBookmarks"]);
      const bookmarks = result.smartBookmarks || [];

      const bookmark = {
        id: Date.now().toString(),
        title: linkTitle,
        url: linkUrl,
        tags: [pageType, "link", "context-menu"],
        timestamp: Date.now(),
        source: "context-menu-link",
        parentPage: tab.url,
      };

      bookmarks.unshift(bookmark);
      await chrome.storage.local.set({ smartBookmarks: bookmarks });

      this.showNotification(
        "Link saved!",
        `"${linkTitle}" has been bookmarked`
      );
    } catch (error) {
      console.error("Error saving link:", error);
      this.showNotification("Save failed", "Could not save link");
    }
  }

  async saveSelection(selectionText, tab) {
    try {
      const result = await chrome.storage.local.get(["smartBookmarks"]);
      const bookmarks = result.smartBookmarks || [];

      const pageType = this.getPageType(tab.url);
      const truncatedSelection =
        selectionText.length > 100
          ? selectionText.substring(0, 100) + "..."
          : selectionText;

      const bookmark = {
        id: Date.now().toString(),
        title: `"${truncatedSelection}" from ${tab.title}`,
        url: tab.url,
        tags: [pageType, "selection", "quote"],
        timestamp: Date.now(),
        favicon: tab.favIconUrl || null,
        source: "context-menu-selection",
        selection: selectionText,
      };

      bookmarks.unshift(bookmark);
      await chrome.storage.local.set({ smartBookmarks: bookmarks });

      this.showNotification(
        "Selection saved!",
        "Text selection has been bookmarked"
      );
    } catch (error) {
      console.error("Error saving selection:", error);
      this.showNotification("Save failed", "Could not save selection");
    }
  }

  getPageType(url) {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes("linkedin.com")) return "linkedin";
    if (hostname.includes("facebook.com")) return "facebook";
    if (hostname.includes("twitter.com") || hostname.includes("x.com"))
      return "twitter";
    if (hostname.includes("reddit.com")) return "reddit";
    if (hostname.includes("medium.com")) return "article";
    if (hostname.includes("github.com")) return "github";
    if (hostname.includes("youtube.com")) return "youtube";
    if (hostname.includes("stackoverflow.com")) return "stackoverflow";

    return "general";
  }

  showNotification(title, message) {
    if (chrome.notifications) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: title,
        message: message,
      });
    } else {
      console.log(`Notification: ${title} - ${message}`);
    }
  }

  // Cleanup old bookmarks (optional maintenance)
  async cleanupOldBookmarks() {
    try {
      const result = await chrome.storage.local.get(["smartBookmarks"]);
      const bookmarks = result.smartBookmarks || [];

      // Keep only last 1000 bookmarks to prevent storage issues
      if (bookmarks.length > 1000) {
        const trimmed = bookmarks.slice(0, 1000);
        await chrome.storage.local.set({ smartBookmarks: trimmed });
        console.log(`Cleaned up ${bookmarks.length - 1000} old bookmarks`);
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }
}

// Initialize background script
new SmartBookmarksBackground();
