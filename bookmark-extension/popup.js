class SmartBookmarks {
  constructor() {
    this.currentTab = "save";
    this.bookmarks = [];
    this.allTags = new Set();
    this.activeFilters = new Set();

    this.init();
  }

  async init() {
    await this.loadBookmarks();
    this.setupEventListeners();
    this.loadCurrentPageInfo();
    this.renderFilterTags();
    this.renderBookmarks();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Quick tags
    document.querySelectorAll(".quick-tag").forEach((tag) => {
      tag.addEventListener("click", (e) => {
        this.addQuickTag(e.target.dataset.tag);
      });
    });

    // Tag input with suggestions
    const tagInput = document.getElementById("tag-input");
    tagInput.addEventListener("input", (e) => {
      this.showTagSuggestions(e.target.value);
    });

    tagInput.addEventListener("blur", () => {
      setTimeout(() => this.hideTagSuggestions(), 200);
    });

    // Save button
    document.getElementById("save-btn").addEventListener("click", () => {
      this.saveCurrentPage();
    });

    // Search
    document.getElementById("search-input").addEventListener("input", (e) => {
      this.filterBookmarks(e.target.value);
    });

    // Export
    document.getElementById("export-btn").addEventListener("click", () => {
      this.exportBookmarks();
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });

    // Show/hide content
    document.getElementById("save-tab").style.display =
      tabName === "save" ? "block" : "none";
    document.getElementById("browse-tab").style.display =
      tabName === "browse" ? "block" : "none";

    if (tabName === "browse") {
      this.renderBookmarks();
      this.renderFilterTags();
    }
  }

  async loadCurrentPageInfo() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const pageElement = document.getElementById("current-page");
      pageElement.textContent = `${tab.title}\n${tab.url}`;
    } catch (error) {
      console.error("Error loading page info:", error);
      document.getElementById("current-page").textContent =
        "Unable to load page info";
    }
  }

  addQuickTag(tag) {
    const tagInput = document.getElementById("tag-input");
    const currentTags = tagInput.value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      tagInput.value = currentTags.join(", ");
    }
  }

  showTagSuggestions(inputValue) {
    const suggestions = document.getElementById("tag-suggestions");

    if (!inputValue) {
      suggestions.style.display = "none";
      return;
    }

    const currentTags = inputValue
      .split(",")
      .map((t) => t.trim().toLowerCase());
    const lastTag = currentTags[currentTags.length - 1];

    if (!lastTag) {
      suggestions.style.display = "none";
      return;
    }

    const matchingTags = Array.from(this.allTags)
      .filter(
        (tag) =>
          tag.toLowerCase().includes(lastTag) &&
          !currentTags.includes(tag.toLowerCase())
      )
      .slice(0, 5);

    if (matchingTags.length === 0) {
      suggestions.style.display = "none";
      return;
    }

    suggestions.innerHTML = matchingTags
      .map(
        (tag) => `<div class="tag-suggestion" data-tag="${tag}">${tag}</div>`
      )
      .join("");

    // Add click handlers
    suggestions.querySelectorAll(".tag-suggestion").forEach((suggestion) => {
      suggestion.addEventListener("click", (e) => {
        const selectedTag = e.target.dataset.tag;
        const tagInput = document.getElementById("tag-input");
        const tags = tagInput.value.split(",").map((t) => t.trim());
        tags[tags.length - 1] = selectedTag;
        tagInput.value = tags.join(", ");
        suggestions.style.display = "none";
      });
    });

    suggestions.style.display = "block";
  }

  hideTagSuggestions() {
    document.getElementById("tag-suggestions").style.display = "none";
  }

  async saveCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tagInput = document.getElementById("tag-input");
      const tags = tagInput.value
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      if (tags.length === 0) {
        alert("Please add at least one tag");
        return;
      }

      const bookmark = {
        id: Date.now().toString(),
        title: tab.title,
        url: tab.url,
        tags: tags,
        timestamp: Date.now(),
        favicon: tab.favIconUrl || null,
      };

      this.bookmarks.unshift(bookmark);
      tags.forEach((tag) => this.allTags.add(tag));

      await this.saveBookmarks();

      // Reset form
      tagInput.value = "";

      // Show success
      const saveBtn = document.getElementById("save-btn");
      saveBtn.textContent = "Saved!";
      saveBtn.style.background = "#4CAF50";

      setTimeout(() => {
        saveBtn.textContent = "Save This Page";
        saveBtn.style.background = "#4CAF50";
      }, 2000);
    } catch (error) {
      console.error("Error saving bookmark:", error);
      alert("Failed to save bookmark");
    }
  }

  async loadBookmarks() {
    try {
      const result = await chrome.storage.local.get(["smartBookmarks"]);
      this.bookmarks = result.smartBookmarks || [];

      // Build tags set
      this.allTags.clear();
      this.bookmarks.forEach((bookmark) => {
        bookmark.tags.forEach((tag) => this.allTags.add(tag));
      });
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      this.bookmarks = [];
    }
  }

  async saveBookmarks() {
    try {
      await chrome.storage.local.set({ smartBookmarks: this.bookmarks });
    } catch (error) {
      console.error("Error saving bookmarks:", error);
    }
  }

  renderFilterTags() {
    const container = document.getElementById("filter-tags");
    const tags = Array.from(this.allTags).sort();

    container.innerHTML = tags
      .map((tag) => {
        const isActive = this.activeFilters.has(tag);
        return `<div class="filter-tag ${
          isActive ? "active" : ""
        }" data-tag="${tag}">${tag}</div>`;
      })
      .join("");

    // Add click handlers
    container.querySelectorAll(".filter-tag").forEach((filterTag) => {
      filterTag.addEventListener("click", (e) => {
        const tag = e.target.dataset.tag;
        if (this.activeFilters.has(tag)) {
          this.activeFilters.delete(tag);
          e.target.classList.remove("active");
        } else {
          this.activeFilters.add(tag);
          e.target.classList.add("active");
        }
        this.renderBookmarks();
      });
    });
  }

  renderBookmarks(searchTerm = "") {
    const container = document.getElementById("bookmarks-list");

    let filteredBookmarks = this.bookmarks;

    // Apply tag filters
    if (this.activeFilters.size > 0) {
      filteredBookmarks = filteredBookmarks.filter((bookmark) =>
        bookmark.tags.some((tag) => this.activeFilters.has(tag))
      );
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredBookmarks = filteredBookmarks.filter(
        (bookmark) =>
          bookmark.title.toLowerCase().includes(term) ||
          bookmark.url.toLowerCase().includes(term) ||
          bookmark.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    if (filteredBookmarks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>${
            this.bookmarks.length === 0
              ? "No bookmarks yet"
              : "No matching bookmarks"
          }</p>
          <p>${
            this.bookmarks.length === 0
              ? "Start saving pages to see them here!"
              : "Try different tags or search terms"
          }</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredBookmarks
      .map((bookmark) => {
        const date = new Date(bookmark.timestamp).toLocaleDateString();
        return `
        <div class="bookmark-item" data-url="${bookmark.url}">
          <div class="bookmark-title">${bookmark.title}</div>
          <div class="bookmark-url">${bookmark.url}</div>
          <div class="bookmark-tags">
            ${bookmark.tags
              .map((tag) => `<span class="bookmark-tag">${tag}</span>`)
              .join("")}
          </div>
          <div class="bookmark-date">${date}</div>
        </div>
      `;
      })
      .join("");

    // Add click handlers
    container.querySelectorAll(".bookmark-item").forEach((item) => {
      item.addEventListener("click", () => {
        const url = item.dataset.url;
        chrome.tabs.create({ url });
      });
    });
  }

  filterBookmarks(searchTerm) {
    this.renderBookmarks(searchTerm);
  }

  exportBookmarks() {
    if (this.bookmarks.length === 0) {
      alert("No bookmarks to export");
      return;
    }

    const data = {
      exportDate: new Date().toISOString(),
      bookmarks: this.bookmarks,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-bookmarks-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();

    URL.revokeObjectURL(url);
  }
}

// Initialize when popup loads
document.addEventListener("DOMContentLoaded", () => {
  new SmartBookmarks();
});
