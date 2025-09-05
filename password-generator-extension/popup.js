document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const lengthSlider = document.getElementById("length");
  const lengthValue = document.getElementById("lengthValue");
  const uppercaseCheck = document.getElementById("uppercase");
  const lowercaseCheck = document.getElementById("lowercase");
  const numbersCheck = document.getElementById("numbers");
  const symbolsCheck = document.getElementById("symbols");
  const generateBtn = document.getElementById("generateBtn");
  const copyBtn = document.getElementById("copyBtn");
  const passwordField = document.getElementById("generatedPassword");
  const strengthIndicator = document.getElementById("strengthIndicator");
  const strengthText = document.getElementById("strengthText");
  const notification = document.getElementById("notification");

  // Show/hide password toggle logic
  const showHideBtn = document.getElementById("showHideBtn");
  if (showHideBtn) {
    showHideBtn.addEventListener("click", function () {
      if (passwordField.type === "password") {
        passwordField.type = "text";
        showHideBtn.textContent = "🙈";
      } else {
        passwordField.type = "password";
        showHideBtn.textContent = "👁️";
      }
    });
  }

  // Character sets
  const charSets = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  };

  // Update length value display
  lengthSlider.addEventListener("input", function () {
    lengthValue.textContent = this.value;
    if (passwordField.value) {
      generatePassword();
    }
  });

  // Update password when options change
  [uppercaseCheck, lowercaseCheck, numbersCheck, symbolsCheck].forEach(
    (checkbox) => {
      checkbox.addEventListener("change", function () {
        // Ensure at least one option is selected
        const checkedBoxes = document.querySelectorAll(
          'input[type="checkbox"]:checked'
        );
        if (checkedBoxes.length === 0) {
          this.checked = true;
        }

        if (passwordField.value) {
          generatePassword();
        }
      });
    }
  );

  // Generate password button
  generateBtn.addEventListener("click", generatePassword);

  // Copy password button
  copyBtn.addEventListener("click", copyToClipboard);

  // Generate password on Enter key in password field
  passwordField.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      generatePassword();
    }
  });

  function generatePassword() {
    const length = parseInt(lengthSlider.value);
    let availableChars = "";

    // Build character set based on selected options
    if (uppercaseCheck.checked) availableChars += charSets.uppercase;
    if (lowercaseCheck.checked) availableChars += charSets.lowercase;
    if (numbersCheck.checked) availableChars += charSets.numbers;
    if (symbolsCheck.checked) availableChars += charSets.symbols;

    if (availableChars === "") {
      passwordField.value = "";
      updateStrengthMeter(0);
      return;
    }

    let password = "";

    // Ensure at least one character from each selected set
    const selectedSets = [];
    if (uppercaseCheck.checked) selectedSets.push(charSets.uppercase);
    if (lowercaseCheck.checked) selectedSets.push(charSets.lowercase);
    if (numbersCheck.checked) selectedSets.push(charSets.numbers);
    if (symbolsCheck.checked) selectedSets.push(charSets.symbols);

    // Add one character from each selected set
    selectedSets.forEach((set) => {
      password += set.charAt(Math.floor(Math.random() * set.length));
    });

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += availableChars.charAt(
        Math.floor(Math.random() * availableChars.length)
      );
    }

    // Shuffle the password
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    passwordField.value = password;
    updateStrengthMeter(calculateStrength(password));

    // Save settings
    saveSettings();
  }

  function calculateStrength(password) {
    // Improved entropy-based strength calculation
    if (!password) return { score: 0, feedback: "Generate a password" };
    let charsetSize = 0;
    let feedback = [];
    if (/[a-z]/.test(password)) charsetSize += 26;
    else feedback.push("Add lowercase letters");
    if (/[A-Z]/.test(password)) charsetSize += 26;
    else feedback.push("Add uppercase letters");
    if (/[0-9]/.test(password)) charsetSize += 10;
    else feedback.push("Add numbers");
    if (/[^A-Za-z0-9]/.test(password)) charsetSize += 32;
    else feedback.push("Add symbols");
    const length = password.length;
    // Entropy formula: log2(charset^length) = length * log2(charset)
    let entropy = charsetSize > 0 ? length * Math.log2(charsetSize) : 0;
    // Feedback for short passwords
    if (length < 8) feedback.unshift("Too short");
    // Score mapping: 0-30 weak, 31-60 fair, 61-80 good, 81+ strong
    let score = Math.min(100, Math.round((entropy / 80) * 100));
    if (score > 100) score = 100;
    return {
      score,
      feedback: feedback.length ? feedback.join(", ") : undefined,
    };
  }

  function updateStrengthMeter(strength) {
    const { score, feedback } =
      typeof strength === "object"
        ? strength
        : { score: strength, feedback: undefined };
    strengthIndicator.style.width = score + "%";
    let strengthLabel = "";
    let color = "";
    if (score === 0) {
      strengthLabel = feedback || "Generate a password";
      color = "#e2e8f0";
    } else if (score < 30) {
      strengthLabel = feedback ? `Weak: ${feedback}` : "Weak";
      color = "#fc8181";
    } else if (score < 60) {
      strengthLabel = feedback ? `Fair: ${feedback}` : "Fair";
      color = "#f6ad55";
    } else if (score < 80) {
      strengthLabel = feedback ? `Good: ${feedback}` : "Good";
      color = "#68d391";
    } else {
      strengthLabel = "Strong";
      color = "#4fd1c7";
    }
    strengthText.textContent = strengthLabel;
    strengthIndicator.style.background = color;
  }

  function copyToClipboard() {
    if (!passwordField.value) {
      showNotification("Generate a password first!", "error");
      return;
    }

    navigator.clipboard
      .writeText(passwordField.value)
      .then(() => {
        showNotification("Password copied to clipboard!", "success");
      })
      .catch(() => {
        // Fallback for older browsers
        passwordField.select();
        document.execCommand("copy");
        showNotification("Password copied to clipboard!", "success");
      });
  }

  function showNotification(message, type = "success") {
    notification.textContent = message;
    notification.className = `notification show ${type}`;

    setTimeout(() => {
      notification.classList.remove("show");
    }, 2000);
  }

  function saveSettings() {
    const settings = {
      length: lengthSlider.value,
      uppercase: uppercaseCheck.checked,
      lowercase: lowercaseCheck.checked,
      numbers: numbersCheck.checked,
      symbols: symbolsCheck.checked,
    };

    chrome.storage.sync.set(settings);
  }

  function loadSettings() {
    chrome.storage.sync.get(
      {
        length: 16,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
      },
      function (settings) {
        lengthSlider.value = settings.length;
        lengthValue.textContent = settings.length;
        uppercaseCheck.checked = settings.uppercase;
        lowercaseCheck.checked = settings.lowercase;
        numbersCheck.checked = settings.numbers;
        symbolsCheck.checked = settings.symbols;
      }
    );
  }

  // Load settings on startup
  loadSettings();

  // Generate initial password
  generatePassword();
});
