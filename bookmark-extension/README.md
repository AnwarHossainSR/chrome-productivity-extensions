# Smart Bookmarks Chrome Extension

A modern, intuitive bookmark manager that lets you save and organize web content with custom tags.

## Features

✨ **Smart Tagging** - Organize bookmarks with custom tags  
🚀 **Quick Save** - Ctrl+Shift+S keyboard shortcut  
🎯 **Context Menu** - Right-click to save pages, links, or text selections  
🔍 **Smart Search** - Find bookmarks by title, URL, or tags  
📱 **Modern UI** - Clean, responsive design  
📤 **Export Data** - JSON export for backup  
⚡ **Fast & Lightweight** - No external dependencies

## Installation

### Method 1: Load Unpacked (Development)

1. **Download the files** - Create a new folder and save all the provided files:

   - `manifest.json`
   - `popup.html`
   - `popup.js`
   - `content.js`
   - `content.css`
   - `background.js`

2. **Create icons folder** - Create an `icons` folder and add icon files:

   - `icon16.png` (16x16)
   - `icon32.png` (32x32)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)

3. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select your extension folder

### Method 2: Create Icons (if you don't have them)

You can create simple colored squares as placeholders:

```html
<!-- Create these as 16x16, 32x32, 48x48, 128x128 PNG files -->
<!-- Use any image editor or online icon generator -->
<!-- Background: #667eea, Text: "SB" in white -->
```

## File Structure

```
smart-bookmarks/
├── manifest.json          # Extension configuration
├── popup.html             # Main popup interface
├── popup.js               # Popup logic
├── content.js             # Page integration script
├── content.css            # Styles for content script
├── background.js          # Service worker
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Usage

### Saving Bookmarks

**Method 1: Extension Popup**

- Click the Smart Bookmarks icon in toolbar
- Add tags (comma-separated)
- Click "Save This Page"

**Method 2: Keyboard Shortcut**

- Press `Ctrl+Shift+S` anywhere on a page
- Quick dialog appears
- Add tags and save

**Method 3: Context Menu**

- Right-click on page → "Save page with Smart Bookmarks"
- Right-click on link → "Save link with Smart Bookmarks"
- Select text + right-click → "Save selection with Smart Bookmarks"

### Managing Bookmarks

**Browse Tab**

- Search by title, URL, or tags
- Click tag filters to narrow results
- Click any bookmark to open

**Export Data**

- Click "Export All Bookmarks" in Browse tab
- Downloads JSON file with all your data

## Tag Suggestions

The extension automatically suggests:

- **Page Type**: linkedin, facebook, twitter, github, etc.
- **Quick Tags**: important, moderate, work, personal
- **Previous Tags**: Shows tags you've used before

## Storage

- Uses Chrome's local storage (no external database)
- Data stays on your device
- Automatic cleanup keeps last 1000 bookmarks
- Export feature for backup

## Keyboard Shortcuts

| Shortcut       | Action            |
| -------------- | ----------------- |
| `Ctrl+Shift+S` | Quick save dialog |
| `Escape`       | Close dialogs     |

## Permissions Explained

- **storage** - Save your bookmarks locally
- **activeTab** - Get current page info
- **scripting** - Show quick save dialog

## Troubleshooting

**Extension not loading?**

- Make sure all files are in the same folder
- Check that manifest.json is valid
- Ensure icons folder exists (even with placeholder images)

**Quick save not working?**

- Try refreshing the page
- Check if Ctrl+Shift+S conflicts with other shortcuts

**Bookmarks not saving?**

- Check Chrome's extension permissions
- Look for errors in Chrome DevTools console

## Customization

### Add New Quick Tags

Edit `popup.html` line with quick-tag buttons:

```html
<button class="quick-tag" data-tag="your-tag">Your Tag</button>
```

### Change Keyboard Shortcut

Add to `manifest.json`:

```json
"commands": {
  "quick-save": {
    "suggested_key": {
      "default": "Ctrl+Shift+B"
    },
    "description": "Quick save bookmark"
  }
}
```

### Modify Auto-Tags

Edit the `getPageType()` function in `background.js`:

```javascript
if (hostname.includes("yoursite.com")) return "yoursite";
```

## Data Format

Bookmarks are stored as JSON objects:

```json
{
  "id": "timestamp",
  "title": "Page title",
  "url": "https://example.com",
  "tags": ["tag1", "tag2"],
  "timestamp": 1234567890,
  "favicon": "https://example.com/favicon.ico"
}
```

## Privacy

- No data sent to external servers
- Everything stored locally in Chrome
- No tracking or analytics
- Open source - inspect the code

## Browser Compatibility

- Chrome 88+ (Manifest V3)
- Chromium-based browsers (Edge, Brave, Opera)

## Contributing

Want to improve the extension? Here are some ideas:

- Folder/category system
- Import from other bookmark managers
- Sync across devices
- Advanced search filters
- Bookmark sharing

---

**Need help?** Check the browser console for error messages or create an issue with your specific problem.
