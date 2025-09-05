# SecurePass Generator 🔐

A modern, secure, and user-friendly password generator Chrome extension that helps you create strong passwords with customizable options.

![SecurePass Generator](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome Extension](https://img.shields.io/badge/platform-Chrome%20Extension-yellow.svg)

## ✨ Features

- **🎯 Customizable Length**: Generate passwords from 4 to 64 characters
- **🔤 Character Options**:
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Special symbols (!@#$%^&\*()\_+-=[]{}|;:,.<>?)
- **💪 Real-time Strength Meter**: Visual feedback on password security
- **👁️ Show/Hide Toggle**: Securely view your generated password
- **📋 One-Click Copy**: Instantly copy passwords to clipboard
- **💾 Settings Memory**: Remembers your preferred settings
- **🎨 Modern UI**: Clean, intuitive interface with smooth animations
- **🔒 Privacy-First**: All generation happens locally, no data sent to servers

## 🚀 Installation

### From Chrome Web Store

1. Visit the [Chrome Web Store](#) (link coming soon)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The SecurePass icon will appear in your extensions toolbar

## 🎯 How to Use

1. **Click the Extension**: Click the SecurePass icon in your Chrome toolbar
2. **Customize Settings**:
   - Adjust password length using the slider
   - Select desired character types (uppercase, lowercase, numbers, symbols)
3. **Generate Password**: Click "Generate Password" button
4. **Copy & Use**: Click the copy button to copy your new secure password

## 🛠️ Technical Details

### Files Structure

```
securepass-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Main interface
├── popup.js              # Core functionality
├── styles.css            # Styling
└── icons/               # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Password Generation Algorithm

- **Entropy-Based Strength**: Uses character set size and length to calculate password entropy
- **Guaranteed Diversity**: Ensures at least one character from each selected character set
- **Cryptographically Secure**: Uses `Math.random()` for character selection
- **Fisher-Yates Shuffle**: Randomizes character order for additional security

### Security Features

- **Local Generation**: All passwords generated client-side
- **No Data Storage**: Passwords are not saved or transmitted
- **Memory Management**: Settings stored securely using Chrome's sync storage
- **No External Dependencies**: Self-contained with no third-party libraries

## 🔧 Development

### Prerequisites

- Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript

### Setup Development Environment

1. Clone the repository:

   ```bash
   git clone https://github.com/AnwarHossainSR/securepass-generator.git
   cd securepass-generator
   ```

2. Load the extension in Chrome:

   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

3. Make your changes and reload the extension to test

### Key Components

#### Password Generation (`generatePassword()`)

- Builds character set based on user selections
- Ensures character diversity
- Implements Fisher-Yates shuffle algorithm

#### Strength Calculation (`calculateStrength()`)

- Calculates entropy using formula: `length × log₂(charset_size)`
- Provides contextual feedback for password improvement
- Maps entropy scores to strength levels

#### UI Interactions

- Real-time length slider updates
- Checkbox validation (ensures at least one option selected)
- Smooth animations and transitions

## 🎨 Customization

### Themes

The extension uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #48bb78;
  --background: rgba(255, 255, 255, 0.95);
}
```

### Character Sets

Modify character sets in `popup.js`:

```javascript
const charSets = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute

- 🐛 **Bug Reports**: Found a bug? [Open an issue](https://github.com/AnwarHossainSR/password-geneartor-extension/issues)
- 💡 **Feature Requests**: Have an idea? [Start a discussion](https://github.com/AnwarHossainSR/password-geneartor-extension/discussions)
- 🔧 **Code Contributions**: Submit a pull request

### Development Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add comments for complex logic
- Test all functionality before submitting

## 📋 Roadmap

### Version 1.1 (Planned)

- [ ] Dark mode theme
- [ ] Password history (with user consent)
- [ ] Pronounceable password option
- [ ] Bulk password generation
- [ ] Export passwords to file

### Version 1.2 (Future)

- [ ] Password strength testing against common patterns
- [ ] Integration with popular password managers
- [ ] Multi-language support
- [ ] Advanced entropy visualization

## 🔐 Security & Privacy

### Privacy Commitment

- **No Data Collection**: We don't collect, store, or transmit any personal data
- **Local Processing**: All password generation happens on your device
- **No Analytics**: No tracking or analytics code included
- **Open Source**: Complete transparency through open source code

### Security Best Practices

- Passwords are generated using cryptographically secure methods
- No passwords are stored in memory longer than necessary
- Extension permissions are minimal and justified
- Regular security audits of the codebase

## 🙏 Acknowledgments

- Design inspiration from modern password managers
- Community feedback and contributions

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/AnwarHossainSR/password-geneartor-extension/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/AnwarHossainSR/password-geneartor-extension/discussions)
- 📧 **Email**: support@securepass-extension.com

---

**Made with ❤️ by Anwar**

_Stay secure, stay protected!_ 🛡️
