(() => {
  const themeKey = "thakronix-theme:v7";
  const toggleSelector = [
    'button[id*="theme" i]',
    'button[title*="mode" i]',
    'button[aria-label*="theme" i]'
  ].join(",");
  const protectedVisual = /swatch|color-chip|palette|canvas|image-preview|photo-preview|checkerboard/i;

  function savedTheme() {
    try {
      return localStorage.getItem(themeKey) === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  }

  function updateToggle(button, darkMode) {
    button.classList.add("tf-theme-toggle");
    button.setAttribute("aria-label", `Switch to ${darkMode ? "light" : "dark"} mode`);
    button.title = `Switch to ${darkMode ? "light" : "dark"} mode`;

    const iconOnly = button.classList.contains("theme-btn") && button.querySelector("i");
    if (iconOnly) {
      iconOnly.className = darkMode ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
      return;
    }

    if (button.querySelector(".theme-icon")) {
      button.innerHTML = darkMode
        ? '<span class="theme-icon" aria-hidden="true">☼</span><span class="theme-label">Light</span>'
        : '<span class="theme-icon" aria-hidden="true">☾</span><span class="theme-label">Dark</span>';
      button.classList.add("tf-theme-labeled");
      return;
    }

    if (button.querySelector("i")) {
      button.classList.add("tf-theme-labeled");
      button.innerHTML = darkMode
        ? '<i class="bi bi-sun" aria-hidden="true"></i><span class="theme-label">Light mode</span>'
        : '<i class="bi bi-moon-stars" aria-hidden="true"></i><span class="theme-label">Dark mode</span>';
    } else {
      button.classList.add("tf-theme-labeled");
      button.innerHTML = darkMode
        ? '<span class="theme-icon" aria-hidden="true">☼</span><span class="theme-label">Light mode</span>'
        : '<span class="theme-icon" aria-hidden="true">☾</span><span class="theme-label">Dark mode</span>';
    }
  }

  function isLightSurface(element) {
    if (!(element instanceof HTMLElement)) return false;
    if (element === document.body || element === document.documentElement) return false;
    if (/^(IMG|VIDEO|CANVAS|SVG|PICTURE|IFRAME|INPUT|SELECT|TEXTAREA|BUTTON)$/.test(element.tagName)) return false;
    if (protectedVisual.test(typeof element.className === "string" ? element.className : "")) return false;

    const style = getComputedStyle(element);
    const hasText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    const text = style.color.match(/rgba?\(([^)]+)\)/);
    if (hasText && text) {
      const [r, g, b] = text[1].split(/[, /]+/).map(Number);
      if ((r * 0.2126 + g * 0.7152 + b * 0.0722) / 255 < 0.34) {
        element.classList.add("tf-theme-auto-text");
      }
    }

    if (style.backgroundImage !== "none") return false;
    const match = style.backgroundColor.match(/rgba?\(([^)]+)\)/);
    if (!match) return false;
    const [red, green, blue, alpha = 1] = match[1].split(/[, /]+/).map(Number);
    if (alpha < 0.65) return false;
    const brightness = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
    if (brightness > 0.84) element.classList.add("tf-theme-auto-surface");

    return true;
  }

  function scanSurfaces(root = document.body) {
    if (!root) return;
    if (root instanceof HTMLElement) isLightSurface(root);
    root.querySelectorAll?.("*").forEach(isLightSurface);
  }

  function applyTheme(theme, persist = true) {
    const profileOwnsTheme = document.body?.classList.contains("developer-profile-page");
    const darkMode = !profileOwnsTheme && (document.body?.classList.contains("home-page") || theme === "dark");
    const value = darkMode ? "dark" : "light";
    document.documentElement.dataset.theme = value;
    if (document.body) {
      document.body.dataset.theme = value;
      document.body.classList.toggle("dark", darkMode);
      document.body.classList.toggle("dark-mode", darkMode);
      document.body.classList.toggle("media-dark", darkMode);
      scanSurfaces();
      document.querySelectorAll(toggleSelector).forEach((button) => updateToggle(button, darkMode));
    }
    if (persist && !document.body?.classList.contains("home-page") && !profileOwnsTheme) {
      try { localStorage.setItem(themeKey, value); } catch { /* Storage can be disabled. */ }
    }
    document.dispatchEvent(new CustomEvent("Thakronix:themechange", { detail: { theme: value } }));
  }

  applyTheme(savedTheme());
  window.addEventListener("load", () => applyTheme(savedTheme(), false), { once: true });

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.(toggleSelector);
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    applyTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
  }, true);

  window.addEventListener("storage", (event) => {
    if (event.key === themeKey) applyTheme(event.newValue, false);
  });

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) scanSurfaces(node);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
