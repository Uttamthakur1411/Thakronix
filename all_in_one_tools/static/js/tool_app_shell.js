(() => {
  if (location.pathname === "/" || document.body.classList.contains("home-page")) return;
  if (location.pathname === "/developer" || location.pathname.startsWith("/developer/projects/")) return;

  const body = document.body;
  body.classList.add("tf-tool-page");
  if (location.pathname === "/image-compressor") body.classList.add("tf-image-compressor-page");

  let header = document.querySelector("body > header, body > nav.navbar, body > .topbar, body > .media-topbar, body > .sketch-topbar");
  if (!header) {
    header = document.createElement("header");
    body.prepend(header);
  }
  header.classList.add("tf-app-topbar");

  if (!header.querySelector('a[href="/"]')) {
    const brand = document.createElement("a");
    brand.className = "tf-app-brand";
    brand.href = "/";
    brand.textContent = "Thakronix";
    header.prepend(brand);
  }

  let actions = header.querySelector(".tf-app-actions");
  if (!actions) {
    actions = document.createElement("div");
    actions.className = "tf-app-actions";
    header.append(actions);
  }

  const themeButton = document.querySelector('button[id*="theme" i], button[title*="mode" i], button[aria-label*="theme" i]');
  if (themeButton && !header.contains(themeButton)) actions.append(themeButton);
  if (!themeButton) {
    const button = document.createElement("button");
    button.id = "tfGlobalTheme";
    button.type = "button";
    button.className = "tf-global-theme";
    button.setAttribute("aria-label", "Switch to dark mode");
    button.title = "Switch to dark mode";
    button.innerHTML = '<i class="bi bi-moon-stars" aria-hidden="true"></i><span>Dark</span>';
    actions.append(button);
  }

  if (!header.querySelector('a[href="/"]')) {
    const back = document.createElement("a");
    back.className = "tf-app-back";
    back.href = "/";
    back.textContent = "Back";
    actions.append(back);
  }

  const hasToolSidebar = document.querySelector(".sidebar, .security-sidebar, .utility-sidebar, .ai-sidebar, .calculator-nav");
  if (hasToolSidebar) return;
  if (location.pathname === "/image-compressor") {
    document.querySelector(".navbar-toggler")?.remove();
    actions.querySelector('button[id*="theme" i], button[title*="mode" i], button[aria-label*="theme" i], .tf-theme-toggle')?.remove();
    const placeBackLink = () => {
      const backLink = document.querySelector(".tool-back-button");
      if (!backLink) return false;
      if (!actions.contains(backLink)) actions.prepend(backLink);
      document.querySelector(".tool-back-fallback")?.remove();
      return true;
    };
    if (!placeBackLink()) {
      const observer = new MutationObserver(() => {
        if (placeBackLink()) observer.disconnect();
      });
      observer.observe(body, { childList: true, subtree: true });
    }
    return;
  }

  const tools = [
    ["/tools", "All tools", "bi-grid"],
    ["/calculators", "Calculators", "bi-calculator"],
    ["/ai-tools", "AI tools", "bi-stars"],
    ["/security-tools", "Security", "bi-shield-lock"],
    ["/utility-studio", "Text & utilities", "bi-text-paragraph"],
    ["/image-tools", "Image & media", "bi-images"],
    ["/documents", "Documents", "bi-file-earmark-text"],
    ["/qr-studio", "QR studio", "bi-qr-code"],
    ["/youtube", "YouTube", "bi-youtube"],
    ["/audio-tools", "Audio tools", "bi-soundwave"],
    ["/finance", "Finance", "bi-wallet2"],
    ["/student-tools", "Student tools", "bi-mortarboard"],
    ["/workflow-studio", "Workflows", "bi-diagram-3"],
    ["/entertainment", "Entertainment", "bi-controller"],
    ["/real-world-tools", "Real-world tools", "bi-compass"],
    ["/device-lab", "Device lab", "bi-phone"],
    ["/life-admin", "Life admin", "bi-calendar-check"]
  ];
  const sidebar = document.createElement("aside");
  sidebar.className = "tf-global-sidebar";
  sidebar.setAttribute("aria-label", "Tool categories");
  sidebar.innerHTML = '<div class="tf-sidebar-label">Thakronix</div><nav></nav>';
  const nav = sidebar.querySelector("nav");
  for (const [href, label, icon] of tools) {
    const link = document.createElement("a");
    link.href = href;
    link.className = location.pathname === href || location.pathname.startsWith(`${href}/`) ? "active" : "";
    link.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i><span>${label}</span>`;
    nav.append(link);
  }
  body.classList.add("tf-has-global-sidebar");
  body.append(sidebar);

  const menu = document.createElement("button");
  menu.type = "button";
  menu.className = "tf-mobile-menu";
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Open tool navigation");
  menu.innerHTML = '<i class="bi bi-list" aria-hidden="true"></i><span>Tools</span>';
  menu.addEventListener("click", () => {
    const isOpen = body.classList.toggle("tf-nav-open");
    menu.setAttribute("aria-expanded", String(isOpen));
    menu.setAttribute("aria-label", isOpen ? "Close tool navigation" : "Open tool navigation");
    sidebar.style.setProperty("transform", isOpen ? "translateX(0)" : "translateX(-105%)", "important");
  });
  actions.prepend(menu);
})();