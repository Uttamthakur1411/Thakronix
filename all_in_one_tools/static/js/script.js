// ==========================================
// TOOL SEARCH
// ==========================================

const searchInput = document.getElementById("toolSearch");
const searchResults = document.getElementById("toolSearchResults");
const searchSubmit = document.getElementById("toolSearchSubmit");
const toolDirectory = document.getElementById("toolDirectory");
const toolDirectoryCount = document.getElementById("toolDirectoryCount");
const toolCategoryRail = document.getElementById("toolCategoryRail");

if (searchInput && searchResults) {
    const catalogPages = [
        "/calculators", "/ai-tools", "/security-tools", "/privacy-dev-tools",
        "/real-world-tools", "/device-lab", "/utility-studio", "/documents",
        "/entertainment", "/finance", "/home-tools", "/student-tools",
        "/travel-tools", "/workflow-studio", "/life-admin", "/media-tools",
        "/media-tools/pdf-tools", "/media-studio", "/audio-tools",
        "/downloader-studio", "/youtube", "/qr-generator", "/tools"
    ];
    const entries = [];
    let catalogPromise;
    let activeIndex = -1;
    let selectedCategory = "All tools";
    let directoryRenderTimer;
    const statsKey = "Thakronix:tool-stats:v1";
    const hubRoutes = new Set([...catalogPages, "/image-tools", "/pdf-tools", "/home-travel-tools"]);
    const routeCategories = [
        ["/calculators", "Calculators"], ["/ai-tools", "AI Tools"],
        ["/security-tools", "Security"], ["/privacy-dev-tools", "Privacy & Developer"],
        ["/real-world-tools", "Internet & Network"], ["/device-lab", "Device & Hardware"],
        ["/utility-studio", "Text & Utilities"], ["/documents", "Documents & Files"],
        ["/entertainment", "Entertainment"], ["/finance", "Finance"],
        ["/home-tools", "Home & Lifestyle"], ["/travel-tools", "Travel & Vehicle"],
        ["/student-tools", "Student Tools"], ["/workflow-studio", "Workflows"],
        ["/life-admin", "Life Admin"], ["/media-tools/pdf-tools", "Documents & PDF"],
        ["/media-tools", "Image & Media"], ["/media-studio", "Image & Media Studio"],
        ["/audio-tools", "Audio"], ["/downloader-studio", "Downloader"],
        ["/youtube", "YouTube"], ["/qr-generator", "QR & Barcode"]
    ];
    const categoryIcons = {
        "Calculators": "bi-calculator", "AI Tools": "bi-stars", "Security": "bi-shield-lock",
        "Privacy & Developer": "bi-incognito", "Internet & Network": "bi-globe2",
        "Device & Hardware": "bi-cpu", "Text & Utilities": "bi-collection",
        "Documents & Files": "bi-file-earmark-richtext", "Documents & PDF": "bi-file-earmark-pdf",
        "Entertainment": "bi-film", "Finance": "bi-wallet2", "Home & Lifestyle": "bi-house-heart",
        "Travel & Vehicle": "bi-car-front", "Student Tools": "bi-mortarboard",
        "Workflows": "bi-kanban", "Life Admin": "bi-grid-1x2", "Image & Media": "bi-images",
        "Image & Media Studio": "bi-camera-reels", "Audio": "bi-music-note-beamed",
        "Downloader": "bi-download", "YouTube": "bi-youtube", "QR & Barcode": "bi-qr-code"
    };
    const categoryTints = {
        ai: "#9b7bff",
        image: "#51c9e8",
        document: "#a78bfa",
        calculator: "#55c7a2",
        media: "#56a9f5",
        code: "#6bd3be",
        utility: "#8b9bb4"
    };

    const normalize = (value) => value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    const toolKey = (name) => normalize(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    function directoryCategoryFor(category) {
        return category.split(" · ")[0].trim();
    }

    function toolKindFor(tool) {
        const category = normalize(tool.category);
        const details = normalize(`${tool.name} ${tool.description}`);
        if (/image|photo|media/.test(category) || /image|photo|watermark|collage|sketch|drawing/.test(details)) return "image";
        if (category.includes("ai") || /\b(ai|prompt)\b/.test(details)) return "ai";
        if (/document|pdf|file/.test(category) || /\b(pdf|document)\b/.test(details)) return "document";
        if (/calculator|finance/.test(category) || /calculator|\bemi\b|percentage/.test(details)) return "calculator";
        if (/audio|music|youtube|video|downloader/.test(category) || /audio|music|video|youtube/.test(details)) return "media";
        if (/security|privacy|developer/.test(category) || /regex|json|sql|password|encrypt/.test(details)) return "code";
        return "utility";
    }
    const toolIconRules = [
        [/\b(?:password|secret|encrypt|jwt|security|privacy|phish|safe|shield)\b/, "bi-shield-lock"],
        [/\b(?:qr|barcode)\b/, "bi-qr-code"],
        [/\b(?:pdf|document|form|scan|signature|paper|archive)\b/, "bi-file-earmark-pdf"],
        [/\b(?:image|photo|picture|screenshot|watermark|collage|selfie)\b/, "bi-image"],
        [/\b(?:youtube|video|movie|stream|playlist|thumbnail)\b/, "bi-play-btn"],
        [/\b(?:audio|music|song|sound|dj|ringtone|waveform)\b/, "bi-music-note-beamed"],
        [/\b(?:calculator|age|bmi|gst|emi|percentage|loan|discount|currency)\b/, "bi-calculator"],
        [/\b(?:budget|finance|money|wallet|expense|invoice|bill|saving|salary)\b/, "bi-wallet2"],
        [/\b(?:network|internet|domain|dns|wifi|browser|website|url)\b/, "bi-globe2"],
        [/\b(?:ip address|ip intelligence)\b/, "bi-hdd-network"],
        [/\b(?:student|study|flashcard|school|exam|gpa|attendance)\b/, "bi-mortarboard"],
        [/\b(?:travel|vehicle|car|trip|flight|fuel|parking)\b/, "bi-car-front"],
        [/\b(?:home|house|room|paint|tile|garden|moving)\b/, "bi-house"],
        [/\b(?:game|quiz|joke|spinner|challenge|retro|drawing)\b/, "bi-controller"],
        [/\b(?:email|mail|message|letter|newsletter|rss|contact)\b/, "bi-envelope"],
        [/\b(?:interview|coach|chat|conversation)\b/, "bi-chat-dots"],
        [/\b(?:code|developer|json|api|regex|sql|html|css|script|debug)\b/, "bi-code-slash"],
        [/\b(?:chart|analytics|statistics|data|report|insight|trend|counter)\b/, "bi-graph-up-arrow"],
        [/\b(?:color|palette|design|art|sketch|graffiti|font|logo)\b/, "bi-palette2"],
        [/\b(?:clock|timer|stopwatch|date|calendar|time|countdown)\b/, "bi-clock-history"],
        [/\b(?:user|profile|resume|person|name|bio|identity|compliment)\b/, "bi-person-badge"],
        [/\b(?:upload|download|file|zip|compress|convert|extract|merge|split)\b/, "bi-file-earmark-arrow-down"],
        [/\b(?:ai|prompt|idea|generator|assistant|writer)\b/, "bi-stars"]
    ];

    function iconForTool(name, category, providedIcon) {
        const details = normalize(`${name} ${category}`);
        const match = toolIconRules.find(([pattern]) => pattern.test(details));
        if (match) return match[1];
        if (providedIcon && !/(?:^|\s)bi-grid(?:\s|$)/.test(providedIcon)) return providedIcon;
        const categoryIcon = Object.keys(categoryIcons).find((key) => category.startsWith(key));
        return categoryIcon ? categoryIcons[categoryIcon] : "bi-stars";
    }

    function categoryFor(pageUrl, card) {
        const path = new URL(pageUrl).pathname;
        if (/social identity/i.test(card.querySelector(".tool-tag")?.textContent || "")) return "Social Identity";
        if (path === "/ai-tools") {
            const section = card.closest(".ai-section")?.querySelector(".ai-section-head h3")?.textContent.trim();
            return section ? `AI · ${section}` : "AI Tools";
        }
        if (path === "/real-world-tools") {
            return card.closest(".category-block")?.querySelector(".category-title h3")?.textContent.trim() || "Internet & Network";
        }
        if (path === "/downloader-studio") {
            const subtype = { files: "Files", media: "Public Media", music: "Music Metadata", audio: "Audio" }[card.dataset.category];
            return subtype ? `Downloader · ${subtype}` : "Downloader";
        }
        if (path === "/entertainment" && card.dataset.category) {
            return `Entertainment · ${card.dataset.category[0].toUpperCase()}${card.dataset.category.slice(1)}`;
        }
        if (path === "/workflow-studio" && card.dataset.category) return `Workflows · ${card.dataset.category}`;
        if (path === "/calculators") {
            const detail = card.querySelector("small")?.textContent.trim().toLowerCase() || "";
            if (/loan|finance|investment|wealth|gst|salary/.test(detail)) return "Calculators · Finance";
            if (/study|gpa|marks/.test(detail)) return "Calculators · Study";
            if (/text|writing/.test(detail)) return "Calculators · Text";
            return "Calculators · Everyday";
        }
        const found = routeCategories.find(([route]) => path === route || path.startsWith(`${route}/`));
        if (found) return found[1];
        if (path === "/sketch") return "AI & Creative";
        if (path.startsWith("/image-")) return "Image & Media";
        if (path.startsWith("/pdf-")) return "Documents & PDF";
        if (/image|photo|sketch/i.test(card.querySelector(".tool-tag")?.textContent || "")) return "Image & Media";
        if (/pdf|document/i.test(card.querySelector(".tool-tag")?.textContent || "")) return "Documents & PDF";
        return "Everyday Tools";
    }

    function getPopularity(name, href) {
        try {
            const tools = JSON.parse(localStorage.getItem(statsKey) || "{}").tools || {};
            const destination = new URL(href);
            const id = destination.searchParams.get("tool");
            const record = tools[toolKey(name)] || Object.values(tools).find((item) =>
                (id && item.id === id) || item.href === href
            );
            if (!record) return 0;
            return Math.min(150, (record.uses || 0) * 8 + (record.opens || 0) + (record.rating || 0) * 3);
        } catch {
            return 0;
        }
    }

    function addEntry(name, description, href, keywords = "", category = "Everyday Tools", icon = "") {
        const normalizedCategory = normalize(category);
        if (/^ai\s*·|^ai\s+tools?$|^ai\s+workspace$|^fun(?:\s|$)|^entertainment(?:\s|$)/.test(normalizedCategory)) return;
        if (!name || !href || entries.some((entry) => entry.href === href && entry.name === name)) return;
        entries.push({ name, description, href, category, icon, searchText: normalize(`${name} ${description} ${keywords} ${category}`) });
    }

    document.querySelectorAll("#legacyToolGrid .tool-card").forEach((card) => {
        const link = card.querySelector("a[href]");
        if (!link || hubRoutes.has(new URL(link.href).pathname)) return;
        const category = categoryFor(link.href, card);
        addEntry(card.querySelector("h3")?.textContent.trim(), card.querySelector("p")?.textContent.trim(), link.href, card.dataset.name || "", category, card.querySelector(".tool-icon i")?.className || "");
    });

    function catalogEntry(card, pageUrl) {
        if (card.classList.contains("planned-card")) return;
        const name = card.querySelector("strong")?.textContent.trim() || card.querySelector("b")?.textContent.trim() || card.querySelector("h2")?.textContent.trim() || card.querySelector("h3")?.textContent.trim() || card.querySelector("h4")?.textContent.trim() || card.getAttribute("aria-label") || (card.matches("[data-tool], [data-security-tool]") ? card.textContent.trim() : "");
        if (!name) return;
        let description = card.querySelector("small")?.textContent.trim() || card.querySelector("p")?.textContent.trim() || "";
        const link = card.matches("a[href]") ? card : card.querySelector("a[href]");
        let href = link?.href;
        const pagePath = new URL(pageUrl).pathname;
        const toolId = card.dataset.tool || card.dataset.utilityTool || card.dataset.securityTool;
        if (!description && pagePath === "/ai-tools") description = card.closest(".ai-section")?.querySelector(".ai-section-head span")?.textContent.trim() || "AI workspace";
        if (!href && pagePath === "/security-tools" && card.dataset.securityTool) href = `${pagePath}#tool=${card.dataset.securityTool}`;
        if (!href && pagePath === "/ai-tools") {
            const action = card.querySelector("[data-ai-generate]")?.dataset.aiGenerate;
            const sectionId = card.closest(".ai-section")?.id;
            if (action) href = `${pagePath}?tool=${encodeURIComponent(action)}#ai-tool-${encodeURIComponent(action)}`;
            else if (sectionId) href = `${pagePath}#${sectionId}`;
        }
        if (!href && pagePath === "/downloader-studio" && card.dataset.title) {
            href = `/downloader-tools/${normalize(card.dataset.title).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
        }
        if (!href && pagePath === "/media-studio" && card.dataset.tool) {
            const mediaRoutes = {
                converter: "/media-tools/image-converter", pdf: "/media-tools/image-to-pdf",
                collage: "/media-tools/photo-collage", profile: "/media-tools/profile-picture",
                watermark: "/media-tools/watermarker", "text-image": "/media-tools/text-to-image",
                passport: "/media-tools/passport-photo", url: "/media-tools/image-url-downloader",
                library: "/media-tools/video-library", vibe: "/media-tools/photo-vibe-analyzer",
                designer: "/media-tools/advanced-text-designer"
            };
            href = mediaRoutes[card.dataset.tool];
        }
        if (!href && toolId) {
            const destination = new URL(pageUrl);
            destination.searchParams.set("tool", toolId);
            href = destination.href;
        }
        if (!href && card.dataset.slug) {
            const destination = new URL(pageUrl);
            destination.searchParams.set("tool", card.dataset.slug);
            href = destination.href;
        }
        if (!href && new URL(pageUrl).pathname === "/qr-generator") {
            const slug = normalize(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            const destination = new URL(pageUrl);
            destination.searchParams.set("tool", slug);
            destination.searchParams.set("panel", card.dataset.panel || "createPanel");
            destination.searchParams.set("title", name);
            if (card.dataset.type) destination.searchParams.set("type", card.dataset.type);
            href = destination.href;
        }
        if (!href && card.dataset.workflow) href = pageUrl;
        if (!href && (pagePath === "/audio-tools" || pagePath === "/media-studio") && card.dataset.tool) {
            const destination = new URL(pageUrl);
            destination.searchParams.set("tool", card.dataset.tool);
            href = destination.href;
        }
        const category = categoryFor(pageUrl, card);
        const icon = card.querySelector("i[class*='bi-']")?.className || categoryIcons[category] || "bi-grid";
        addEntry(name, description, href, `${card.dataset.name || ""} ${card.dataset.category || ""} ${card.dataset.search || ""} ${toolId || ""}`, category, icon);
    }

    function renderDirectory(query = "") {
        if (!toolDirectory) return;
        const terms = normalize(query).split(/\s+/).filter(Boolean);
        const visibleEntries = entries.filter((entry) => {
            const categoryMatches = selectedCategory === "All tools" || directoryCategoryFor(entry.category) === selectedCategory;
            const queryMatches = !terms.length || terms.some((term) => entry.searchText.split(/\s+/).some((word) => word.startsWith(term)));
            return categoryMatches && queryMatches;
        });
        toolDirectory.replaceChildren();
        if (toolDirectoryCount) toolDirectoryCount.textContent = `${visibleEntries.length} tools`;
        if (!visibleEntries.length) {
            const empty = document.createElement("p");
            empty.className = "tool-directory-empty";
            empty.textContent = query ? "No tools match this search." : "No tools are available right now.";
            toolDirectory.append(empty);
            return;
        }
        const grid = document.createElement("div");
        grid.className = "tools-grid tool-directory-grid";
        visibleEntries.sort((left, right) => left.category.localeCompare(right.category) || left.name.localeCompare(right.name)).forEach((tool, index) => {
            const card = document.createElement("article");
            card.className = "tool-card directory-tool-card";
            card.dataset.name = `${tool.name} ${tool.description} ${tool.category}`;
            card.dataset.category = tool.category;
            card.style.setProperty("--card-index", index % 24);
            const toolKind = toolKindFor(tool);
            card.dataset.kind = toolKind;
            card.style.setProperty("--tool-tint", categoryTints[toolKind]);

            const top = document.createElement("div");
            top.className = "directory-tool-top";
            const icon = document.createElement("span");
            icon.className = "tool-icon directory-tool-icon";
            const iconGlyph = document.createElement("i");
            iconGlyph.className = iconForTool(tool.name, tool.category, tool.icon);
            iconGlyph.setAttribute("aria-hidden", "true");
            icon.append(iconGlyph);
            const category = document.createElement("span");
            category.className = "directory-tool-category";
            category.textContent = tool.category;
            top.append(icon, category);

            const name = document.createElement("h3");
            name.textContent = tool.name;
            const description = document.createElement("p");
            description.textContent = tool.description || `Open ${tool.name} workspace.`;

            const previewContent = {
                ai: ["bi-stars", "Describe your task", "Generate"],
                image: ["bi-cloud-arrow-up", "Drop an image", "Browse"],
                document: ["bi-file-earmark-pdf", "Select a PDF", "Choose"],
                calculator: ["bi-calculator", "Enter values", "Calculate"],
                media: ["bi-soundwave", "Add media file", "Browse"],
                code: ["bi-braces", "Paste code or text", "Run"],
                utility: [iconForTool(tool.name, tool.category, tool.icon), "Workspace ready", "Open"]
            }[toolKind];
            const preview = document.createElement("div");
            preview.className = `directory-tool-preview preview-${toolKind}`;
            preview.setAttribute("aria-hidden", "true");
            const previewIcon = document.createElement("i");
            previewIcon.className = `bi ${previewContent[0]}`;
            const previewLabel = document.createElement("span");
            previewLabel.className = "directory-preview-label";
            previewLabel.textContent = previewContent[1];
            const previewAction = document.createElement("span");
            previewAction.className = "directory-preview-action";
            previewAction.textContent = previewContent[2];
            preview.append(previewIcon, previewLabel, previewAction);

            const open = document.createElement("a");
            open.className = "tool-link";
            open.href = tool.href;
            open.setAttribute("aria-label", `Open ${tool.name}`);
            open.append(document.createTextNode("Open tool "));
            const arrow = document.createElement("i");
            arrow.className = "bi bi-arrow-up-right";
            arrow.setAttribute("aria-hidden", "true");
            open.append(arrow);
            card.append(top, name, description, preview, open);
            grid.append(card);
        });
        toolDirectory.append(grid);
    }

    function renderCategoryRail() {
        if (!toolCategoryRail) return;
        const categoryCounts = new Map();
        entries.forEach((entry) => {
            const category = directoryCategoryFor(entry.category);
            categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
        });
        toolCategoryRail.replaceChildren();
        const categories = ["All tools", ...[...categoryCounts.keys()].sort((left, right) => left.localeCompare(right))];
        categories.forEach((category) => {
            const button = document.createElement("button");
            button.className = "tool-category-chip";
            button.type = "button";
            button.setAttribute("aria-pressed", String(category === selectedCategory));
            const icon = document.createElement("i");
            icon.className = `bi ${category === "All tools" ? "bi-grid-3x3-gap" : categoryIcons[category] || "bi-grid"}`;
            icon.setAttribute("aria-hidden", "true");
            const label = document.createElement("span");
            label.textContent = category;
            const count = document.createElement("small");
            count.textContent = category === "All tools" ? entries.length : categoryCounts.get(category);
            button.append(icon, label, count);
            button.addEventListener("click", () => {
                selectedCategory = category;
                renderCategoryRail();
                renderDirectory(searchInput.value.trim());
            });
            toolCategoryRail.append(button);
        });
    }

    function refreshCatalogView() {
        const query = searchInput.value.trim();
        renderDirectory(query);
        renderCategoryRail();
        if (query) renderResults(query);
    }

    function scheduleCatalogRender() {
        window.clearTimeout(directoryRenderTimer);
        directoryRenderTimer = window.setTimeout(refreshCatalogView, 120);
    }

    function loadCatalogs() {
        if (catalogPromise) return catalogPromise;
        const pageLoads = Promise.all(catalogPages.map(async (path) => {
            try {
                const response = await fetch(path, { credentials: "same-origin" });
                if (!response.ok) return;
                const pageUrl = new URL(path, location.href).href;
                const documentPage = new DOMParser().parseFromString(await response.text(), "text/html");
                documentPage.querySelectorAll(".tool-card, .hub-card[data-tool], .catalog-tool, .media-tool-card, .nav-item[data-tool], .security-nav-item[data-security-tool], .utility-nav-item, .tool-item, .workflow-card[data-workflow], .ai-tool-panel, .tool-tabs [data-tool], .tab[data-tool]")
                    .forEach((card) => catalogEntry(card, pageUrl));
                scheduleCatalogRender();
            } catch (error) {
                console.debug(`Tool catalog unavailable: ${path}`, error);
            }
        }));
        const renderedLoads = Promise.all(["/privacy-dev-tools", "/real-world-tools"].map((path) => new Promise((resolve) => {
            const frame = document.createElement("iframe");
            let finished = false;
            frame.hidden = true;
            frame.addEventListener("load", () => {
                if (finished) return;
                finished = true;
                try {
                    const selector = path === "/privacy-dev-tools" ? ".tool-item" : ".hub-card[data-tool-id]";
                    frame.contentDocument.querySelectorAll(selector).forEach((card) => {
                        const name = card.querySelector("strong, h4")?.textContent.trim() || "";
                        const description = card.querySelector("small, p")?.textContent.trim() || "";
                        const href = card.matches("a[href]") ? card.href : card.querySelector("a[href]")?.href;
                        addEntry(name, description, href, `${card.dataset.category || ""} ${card.dataset.toolId || ""}`, categoryFor(path, card), card.querySelector("i[class*='bi-']")?.className || "");
                    });
                    scheduleCatalogRender();
                } catch (error) {
                    console.debug(`Rendered tool catalog unavailable: ${path}`, error);
                }
                frame.remove();
                resolve();
            }, { once: true });
            frame.src = path;
            document.body.append(frame);
            window.setTimeout(() => {
                if (finished) return;
                finished = true;
                frame.remove();
                resolve();
            }, 10000);
        })));
        renderedLoads.catch((error) => console.debug("Rendered tool catalog unavailable", error));
        catalogPromise = pageLoads;
        return catalogPromise;
    }

    function matches(query) {
        const terms = normalize(query).split(/\s+/).filter(Boolean);
        if (!terms.length) return [];
        return entries.map((entry) => {
            const hits = terms.filter((term) => entry.searchText.split(/\s+/).some((word) => word.startsWith(term))).length;
            const score = hits === terms.length ? 100 : hits ? 40 : 0;
            return { ...entry, score: score + (entry.searchText.startsWith(terms[0]) ? 10 : 0) + getPopularity(entry.name, entry.href) };
        }).filter((entry) => entry.score > 0)
            .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
            .slice(0, 8);
    }

    function closeResults() {
        searchResults.hidden = true;
        searchInput.setAttribute("aria-expanded", "false");
        searchInput.removeAttribute("aria-activedescendant");
        activeIndex = -1;
    }

    function renderResults(query) {
        const found = matches(query);
        searchResults.replaceChildren();
        activeIndex = -1;
        if (!query.trim()) return closeResults();
        if (!found.length) {
            const empty = document.createElement("div");
            empty.className = "tool-search-empty";
            empty.textContent = "No matching tools found.";
            searchResults.append(empty);
        } else {
            found.forEach((entry, index) => {
                const option = document.createElement("div");
                option.className = "tool-search-result";
                option.id = `tool-search-option-${index}`;
                option.setAttribute("role", "option");
                option.setAttribute("aria-selected", "false");
                option.tabIndex = -1;
                const name = document.createElement("strong");
                name.textContent = entry.name;
                const details = document.createElement("small");
                details.textContent = entry.description || new URL(entry.href).pathname.replaceAll("-", " ").replaceAll("/", " · ").trim();
                option.append(name, details);
                option.addEventListener("click", () => { window.location.href = entry.href; });
                searchResults.append(option);
            });
        }
        searchResults.hidden = false;
        searchInput.setAttribute("aria-expanded", "true");
    }

    function selectActive(offset) {
        const options = [...searchResults.querySelectorAll("[role='option']")];
        if (!options.length) return;
        activeIndex = activeIndex < 0 ? (offset > 0 ? 0 : options.length - 1) : (activeIndex + offset + options.length) % options.length;
        options.forEach((option, index) => option.setAttribute("aria-selected", String(index === activeIndex)));
        searchInput.setAttribute("aria-activedescendant", options[activeIndex].id);
    }

    function goToFirstResult() {
        const options = [...searchResults.querySelectorAll("[role='option']")];
        const selected = options[activeIndex] || options[0];
        if (selected) selected.click();
        else if (toolDirectory) toolDirectory.scrollIntoView({ behavior: "smooth" });
    }

    searchInput.addEventListener("input", function () {
        const searchValue = this.value.trim();
        renderDirectory(searchValue);
        renderResults(searchValue);
        loadCatalogs().then(() => {
            if (searchInput.value.trim() === searchValue) refreshCatalogView();
        });
    });

    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") { event.preventDefault(); selectActive(1); }
        else if (event.key === "ArrowUp") { event.preventDefault(); selectActive(-1); }
        else if (event.key === "Enter") { event.preventDefault(); goToFirstResult(); }
        else if (event.key === "Escape") closeResults();
    });
    searchSubmit?.addEventListener("click", goToFirstResult);
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".search-box")) closeResults();
    });
    searchInput.addEventListener("focus", () => { if (searchInput.value.trim()) renderResults(searchInput.value); });
    if (toolDirectory) {
        refreshCatalogView();
        loadCatalogs().then(refreshCatalogView).catch(() => {
            if (toolDirectoryCount) toolDirectoryCount.textContent = "Tool directory unavailable";
        });
    }

    const commandCenter = document.getElementById("commandCenter");
    const commandCenterInput = document.getElementById("commandCenterInput");
    const commandCenterResults = document.getElementById("commandCenterResults");
    const commandCenterTrigger = document.getElementById("commandCenterTrigger");
    const commandCenterClose = document.getElementById("commandCenterClose");
    const quickCommandActions = [
        { id: "image-to-pdf", name: "Image to PDF", description: "Turn images into a clean multi-page PDF.", href: "/media-tools/image-to-pdf", icon: "bi-file-earmark-pdf", keywords: "pdf banana hai pdf banana pdf banao make pdf create pdf convert images to pdf photo to pdf", quick: true },
        { id: "qr-generator", name: "QR Generator", description: "Create QR codes for links, contact cards and more.", href: "/qr-generator", icon: "bi-qr-code", keywords: "qr code generate make qr qr banana", quick: true },
        { id: "speed-test", name: "Internet Speed Test", description: "Check download speed, upload speed and latency.", href: "/real-world-tools/speed-test", icon: "bi-speedometer2", keywords: "internet slow slow internet wifi slow speed test network slow", quick: true },
        { id: "bluetooth-lab", name: "Bluetooth Device Lab", description: "Inspect Bluetooth LE and nearby device capabilities.", href: "/device-lab?panel=bluetooth", icon: "bi-bluetooth", keywords: "bluetooth check bluetooth device scan connect ble", quick: true },
        { id: "password-generator", name: "Password Generator", description: "Generate strong passwords locally in your browser.", href: "/security-tools#tool=password-generator", icon: "bi-shield-lock", keywords: "password banana password banao create password generate password secure password", quick: true }
    ];
    const commandNavigationActions = [
        { id: "pdf-tools", name: "PDF Tools", description: "Open the PDF and document toolbox.", href: "/media-tools/pdf-tools", icon: "bi-files", keywords: "pdf banana hai pdf banana pdf tools document compress merge split" },
        { id: "stability-test", name: "Stability Test", description: "Check connection continuity, jitter and drops.", href: "/real-world-tools/stability-test", icon: "bi-activity", keywords: "internet slow slow internet connection drops unstable wifi" },
        { id: "network-diagnostic", name: "Network Diagnostic", description: "Troubleshoot connection problems step by step.", href: "/real-world-tools/network-troubleshooter", icon: "bi-tools", keywords: "internet slow slow internet network diagnostic internet problem wifi issue" },
        { id: "ai-blog", name: "AI Blog Studio", description: "Build a blog outline and draft with AI tools.", href: "/ai-tools?tool=blog", icon: "bi-journal-richtext", keywords: "ai blog studio writer outline content" },
        { id: "image-converter", name: "Image Converter", description: "Convert and resize images in your browser.", href: "/media-tools/image-converter", icon: "bi-images", keywords: "image converter jpg png webp resize" }
    ];
    const commandActions = [...quickCommandActions, ...commandNavigationActions];
    let commandActiveIndex = -1;
    let commandFocusReturn = null;

    function normalizedCommandHref(href) {
        const destination = new URL(href, location.href);
        return `${destination.pathname}${destination.search}${destination.hash}`;
    }

    function scoreCommandItem(item, query) {
        const normalizedQuery = normalize(query).trim();
        const terms = normalizedQuery.split(/\s+/).filter(Boolean);
        if (!terms.length) return 0;
        const searchable = item.searchText || normalize(`${item.name} ${item.description || ""} ${item.category || ""} ${item.keywords || ""}`);
        const words = searchable.split(/\s+/);
        const hits = terms.filter((term) => words.some((word) => word.startsWith(term))).length;
        const keywordHit = item.keywords && normalize(item.keywords).includes(normalizedQuery);
        if (!hits && !keywordHit) return 0;
        return hits * 24 + (hits === terms.length ? 80 : 0) + (keywordHit ? 130 : 0) + (item.quick ? 8 : 0);
    }

    function createCommandItem(item, index) {
        const link = document.createElement("a");
        link.className = "command-center-item";
        link.href = item.href;
        link.id = `command-center-option-${index}`;
        link.setAttribute("role", "option");
        link.setAttribute("aria-selected", "false");
        link.dataset.commandOption = "true";

        const icon = document.createElement("span");
        icon.className = "command-center-icon";
        const glyph = document.createElement("i");
        glyph.className = `bi ${item.icon || "bi-stars"}`;
        glyph.setAttribute("aria-hidden", "true");
        icon.append(glyph);

        const copy = document.createElement("span");
        copy.className = "command-center-copy";
        const name = document.createElement("strong");
        name.textContent = item.name;
        const description = document.createElement("small");
        description.textContent = item.description || "Open this Thakronix workspace.";
        copy.append(name, description);

        const arrow = document.createElement("i");
        arrow.className = "bi bi-arrow-up-right";
        arrow.setAttribute("aria-hidden", "true");
        link.append(icon, copy, arrow);
        link.addEventListener("click", () => closeCommandCenter(false));
        return link;
    }

    function renderCommandSection(title, iconName, items, indexOffset = 0) {
        const section = document.createElement("section");
        section.className = "command-center-section";
        const heading = document.createElement("h3");
        const icon = document.createElement("i");
        icon.className = `bi ${iconName}`;
        icon.setAttribute("aria-hidden", "true");
        heading.append(icon, document.createTextNode(title));
        const list = document.createElement("div");
        list.className = "command-center-list";
        list.setAttribute("role", "listbox");
        items.forEach((item, index) => list.append(createCommandItem(item, indexOffset + index)));
        section.append(heading, list);
        commandCenterResults.append(section);
    }

    function recentlyUsedCommands() {
        try {
            const stats = JSON.parse(localStorage.getItem(statsKey) || "{}");
            return Object.values(stats.tools || {})
                .filter((record) => record.href && record.lastOpenedAt)
                .sort((left, right) => right.lastOpenedAt - left.lastOpenedAt)
                .slice(0, 5)
                .map((record) => {
                    const known = [...commandActions, ...entries].find((item) => normalizedCommandHref(item.href) === normalizedCommandHref(record.href));
                    return known || { ...record, icon: "bi-clock-history", description: "Recently opened on this device." };
                });
        } catch {
            return [];
        }
    }

    function renderCommandCenter(query = "") {
        if (!commandCenterResults) return;
        commandCenterResults.replaceChildren();
        commandActiveIndex = -1;
        commandCenterInput?.removeAttribute("aria-activedescendant");
        const normalizedQuery = query.trim();
        if (!normalizedQuery) {
            renderCommandSection("Quick Actions", "bi-lightning-charge-fill", quickCommandActions, 0);
            const recent = recentlyUsedCommands();
            if (recent.length) renderCommandSection("Recently Used", "bi-clock-history", recent, quickCommandActions.length);
            else {
                const emptySection = document.createElement("section");
                emptySection.className = "command-center-section command-center-recent-empty";
                const heading = document.createElement("h3");
                const icon = document.createElement("i");
                icon.className = "bi bi-clock-history";
                icon.setAttribute("aria-hidden", "true");
                heading.append(icon, document.createTextNode("Recently Used"));
                const empty = document.createElement("p");
                empty.className = "command-center-empty";
                empty.textContent = "Tools you open will appear here.";
                emptySection.append(heading, empty);
                commandCenterResults.append(emptySection);
            }
            return;
        }

        const candidates = new Map();
        [...commandActions, ...entries].forEach((item) => {
            if (!item.href) return;
            const score = scoreCommandItem(item, normalizedQuery);
            if (!score) return;
            const key = normalizedCommandHref(item.href);
            const previous = candidates.get(key);
            if (!previous || score > previous.score) candidates.set(key, { ...item, score });
        });
        const matches = [...candidates.values()]
            .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
            .slice(0, 10);
        if (matches.length) renderCommandSection("Search Results", "bi-search", matches);
        else {
            const empty = document.createElement("p");
            empty.className = "command-center-empty";
            empty.textContent = "No matching tools found.";
            commandCenterResults.append(empty);
        }
    }

    function openCommandCenter() {
        if (!commandCenter) return;
        commandFocusReturn = document.activeElement;
        commandCenter.hidden = false;
        document.body.classList.add("command-center-open");
        if (commandCenterInput) commandCenterInput.value = "";
        renderCommandCenter();
        commandCenterInput?.focus();
        loadCatalogs().then(() => {
            if (!commandCenter.hidden) renderCommandCenter(commandCenterInput?.value || "");
        });
    }

    function closeCommandCenter(restoreFocus = true) {
        if (!commandCenter) return;
        commandCenter.hidden = true;
        document.body.classList.remove("command-center-open");
        commandActiveIndex = -1;
        if (restoreFocus && commandFocusReturn instanceof HTMLElement) commandFocusReturn.focus();
    }

    function moveCommandSelection(offset) {
        const options = [...(commandCenterResults?.querySelectorAll("[data-command-option]") || [])];
        if (!options.length) return;
        commandActiveIndex = commandActiveIndex < 0
            ? (offset > 0 ? 0 : options.length - 1)
            : (commandActiveIndex + offset + options.length) % options.length;
        options.forEach((option, index) => option.setAttribute("aria-selected", String(index === commandActiveIndex)));
        commandCenterInput?.setAttribute("aria-activedescendant", options[commandActiveIndex].id);
        options[commandActiveIndex].scrollIntoView({ block: "nearest" });
    }

    commandCenterTrigger?.addEventListener("click", openCommandCenter);
    commandCenterClose?.addEventListener("click", () => closeCommandCenter());
    commandCenter?.addEventListener("click", (event) => {
        if (event.target === commandCenter) closeCommandCenter();
    });
    commandCenterInput?.addEventListener("input", () => {
        renderCommandCenter(commandCenterInput.value);
        const query = commandCenterInput.value.trim();
        loadCatalogs().then(() => {
            if (!commandCenter.hidden && commandCenterInput.value.trim() === query) renderCommandCenter(query);
        });
    });

    document.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            if (commandCenter?.hidden) openCommandCenter();
            else closeCommandCenter();
            return;
        }
        if (!commandCenter || commandCenter.hidden) return;
        if (event.key === "Escape") {
            event.preventDefault();
            closeCommandCenter();
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            moveCommandSelection(1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveCommandSelection(-1);
        } else if (event.key === "Enter") {
            const options = [...commandCenterResults.querySelectorAll("[data-command-option]")];
            const selected = options[commandActiveIndex] || options[0];
            if (selected) {
                event.preventDefault();
                selected.click();
            }
        } else if (event.key === "Tab") {
            const focusable = [...commandCenter.querySelectorAll("input, button:not([disabled]), a[href]")];
            const first = focusable[0];
            const last = focusable.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });

}


// ==========================================
// THEME TOGGLE
// ==========================================

const themeToggle =
    document.getElementById("themeToggle");

if (themeToggle) {
    const applyTheme = (darkMode) => {
        document.body.dataset.theme = darkMode ? "dark" : "light";
        const icon = themeToggle.querySelector("i");
        if (icon) {
            icon.className = darkMode ? "bi bi-moon-stars-fill" : "bi bi-sun-fill";
        }
        themeToggle.setAttribute("aria-label", darkMode ? "Switch to light mode" : "Switch to dark mode");
        themeToggle.title = darkMode ? "Switch to light mode" : "Switch to dark mode";
        localStorage.setItem("thakronix-theme:v7", darkMode ? "dark" : "light");
    };

    const savedTheme = localStorage.getItem("thakronix-theme:v7");
    applyTheme(savedTheme !== "light");

    themeToggle.onclick = function () {
        const darkMode = document.body.dataset.theme !== "light";
        applyTheme(!darkMode);
    };
}


// ==========================================
// NAVBAR SCROLL EFFECT
// ==========================================

let previousScrollY = window.scrollY;

window.addEventListener(
    "scroll",
    function () {

        const navbar =
            document.querySelector(".navbar");

        if (!navbar) {
            return;
        }

        const currentScrollY = window.scrollY;
        const menuIsOpen = navbar.querySelector(".navbar-collapse.show");
        const navbarHasFocus = navbar.contains(document.activeElement);

        if (currentScrollY > 80 && currentScrollY > previousScrollY && !menuIsOpen && !navbarHasFocus) {
            navbar.classList.add("is-hidden");
        } else {
            navbar.classList.remove("is-hidden");
        }

        if (currentScrollY > 50) {

            navbar.style.background =
                "rgba(7,7,11,0.95)";

        } else {

            navbar.style.background =
                "rgba(7,7,11,0.75)";

        }

        previousScrollY = currentScrollY;

    },
    { passive: true }
);


// ==========================================
// TOOL CARD HOVER
// ==========================================

const cards =
    document.querySelectorAll(".tool-card");

if (cards.length > 0) {

    cards.forEach(card => {

        card.addEventListener(
            "mouseenter",
            function () {

                this.style.transform =
                    "translateY(-8px)";

            }
        );


        card.addEventListener(
            "mouseleave",
            function () {

                this.style.transform =
                    "";

            }
        );

    });

}


// ==========================================
// SMOOTH SCROLL
// ==========================================

document.querySelectorAll(
    'a[href^="#"]'
).forEach(anchor => {

    anchor.addEventListener(
        "click",
        function (event) {

            const target =
                document.querySelector(
                    this.getAttribute("href")
                );

            if (target) {

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }
    );

});


// ==========================================
// TOOL REQUEST EMAIL
// ==========================================

const toolRequestForm = document.getElementById("toolRequestForm");

if (toolRequestForm) {
    toolRequestForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!this.reportValidity()) return;

        const submitButton = this.querySelector(".tool-request-submit");
        const submitLabel = submitButton.querySelector("span");
        const note = document.getElementById("toolRequestNote");
        const success = document.getElementById("toolRequestSuccess");
        submitButton.disabled = true;
        submitLabel.textContent = "Sending...";
        note.textContent = "Sending your request...";
        note.classList.remove("is-error");

        try {
            const response = await fetch("/api/tool-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    request: document.getElementById("toolRequestDescription").value.trim(),
                    replyEmail: document.getElementById("toolRequestReplyEmail").value.trim()
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "We couldn't send your request. Please try again.");

            this.hidden = true;
            success.hidden = false;
            success.focus();
        } catch (error) {
            note.textContent = error.message || "Something went wrong. Please try again.";
            note.classList.add("is-error");
            submitButton.disabled = false;
            submitLabel.textContent = "Send request";
        }
    });
}


// ==========================================
// HOME PAGE SCROLL REVEALS
// ==========================================

const homePage = document.querySelector(".home-page");
if (homePage && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealTargets = [
        ".stats-section",
        ".tools-section .section-heading",
        ".tools-section .tool-category-rail",
        ".tool-request-panel",
        ".about-box",
        "footer .footer-content",
        "footer .footer-bottom",
        ".stats-grid > *",
        ".about-features > *"
    ];
    const revealObserver = new IntersectionObserver((items, observer) => {
        items.forEach((item) => {
            if (!item.isIntersecting) return;
            item.target.classList.add("is-visible");
            observer.unobserve(item.target);
        });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    const observeRevealTargets = (root) => {
        root.querySelectorAll(revealTargets.join(",")).forEach((element, index) => {
            if (element.dataset.scrollRevealObserved) return;
            element.dataset.scrollRevealObserved = "true";
            element.style.setProperty("--reveal-delay", `${Math.min(index % 8, 5) * 65}ms`);
            revealObserver.observe(element);
        });
        root.querySelectorAll("#toolDirectory .directory-tool-card").forEach((element, index) => {
            if (element.dataset.scrollRevealObserved) return;
            element.dataset.scrollRevealObserved = "true";
            element.style.setProperty("--reveal-delay", `${Math.min(index % 8, 5) * 45}ms`);
            revealObserver.observe(element);
        });
    };

    homePage.classList.add("scroll-reveal-enabled");
    observeRevealTargets(homePage);
    if (toolDirectory) {
        const directoryObserver = new MutationObserver(() => observeRevealTargets(toolDirectory));
        directoryObserver.observe(toolDirectory, { childList: true, subtree: true });
    }
}


// ==========================================
// PAGE LOADED
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Thakronix main script loaded successfully."
        );

    }
);