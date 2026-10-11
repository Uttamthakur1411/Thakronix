document.addEventListener("DOMContentLoaded", function () {
    const qrInput = document.getElementById("qrInputText");
    const qrGenerateBtn = document.getElementById("qrGenerateBtn");
    const qrClearBtn = document.getElementById("qrClearBtn");
    const qrDownloadPngBtn = document.getElementById("qrDownloadPngBtn");
    const qrDownloadJpgBtn = document.getElementById("qrDownloadJpgBtn");
    const qrDownloadSvgBtn = document.getElementById("qrDownloadSvgBtn");
    const qrCopyBtn = document.getElementById("qrCopyBtn");
    const qrStatus = document.getElementById("qrStatusMessage");
    const qrPreviewCanvas = document.getElementById("qrPreviewCanvas");
    const qrEmptyState = document.getElementById("qrEmptyState");
    const qrPreviewFrame = document.getElementById("qrPreviewFrame");
    const qrDataOutput = document.getElementById("qrOutputText");
    const qrForeground = document.getElementById("qrForegroundColor");
    const qrBackground = document.getElementById("qrBackgroundColor");
    const qrSize = document.getElementById("qrSizeSelect");
    const qrStyle = document.getElementById("qrStyleSelect");
    const qrErrorCorrection = document.getElementById("qrErrorCorrection");
    const qrLogoInput = document.getElementById("qrLogoInput");
    const qrLogoName = document.getElementById("qrLogoName");
    const qrLogoClearBtn = document.getElementById("qrLogoClearBtn");

    if (!qrInput || !qrGenerateBtn || !qrPreviewCanvas) {
        return;
    }

    let currentText = "";
    let currentLogoDataUrl = "";
    let currentSvgString = "";

    function sanitizeText(value) {
        return value ? String(value).trim() : "";
    }

    function setStatus(message, type) {
        if (!qrStatus) {
            return;
        }
        qrStatus.textContent = message;
        qrStatus.classList.toggle("error", type === "error");
        qrStatus.classList.toggle("success", type === "success");
    }

    function clearStatus() {
        setStatus("", "");
    }

    function disableActionButtons(disabled) {
        [qrDownloadPngBtn, qrDownloadJpgBtn, qrDownloadSvgBtn, qrCopyBtn].forEach(function (button) {
            if (button) {
                button.disabled = disabled;
            }
        });
    }

    function setPreviewState(isReady) {
        if (qrPreviewCanvas) {
            qrPreviewCanvas.style.display = isReady ? "block" : "none";
            qrPreviewCanvas.style.opacity = isReady ? "1" : "0";
        }
        if (qrEmptyState) {
            qrEmptyState.style.display = isReady ? "none" : "grid";
        }
        if (qrPreviewFrame) {
            qrPreviewFrame.classList.toggle("has-preview", isReady);
        }
    }

    function renderEmptyPreview() {
        setPreviewState(false);
        if (qrDataOutput) {
            qrDataOutput.textContent = "-";
        }
        disableActionButtons(true);
    }

    function updateLogoPreviewLabel(name) {
        if (!qrLogoName) {
            return;
        }
        qrLogoName.textContent = name || "No logo selected";
    }

    function clearLogoSelection() {
        currentLogoDataUrl = "";
        if (qrLogoInput) {
            qrLogoInput.value = "";
        }
        updateLogoPreviewLabel("");
        clearStatus();
    }

    function drawModule(ctx, x, y, size, radius, color) {
        if (radius === "rounded") {
            const r = Math.min(size * 0.45, 5);
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + size - r, y);
            ctx.quadraticCurveTo(x + size, y, x + size, y + r);
            ctx.lineTo(x + size, y + size - r);
            ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
            ctx.lineTo(x + r, y + size);
            ctx.quadraticCurveTo(x, y + size, x, y + size - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, size, size);
        }
    }

    function generateSvgString(text, colorDark, colorLight, size, style, errorCorrection, logoDataUrl) {
        const qr = window.QRCode.create(text, {
            errorCorrectionLevel: errorCorrection,
            typeNumber: 0
        });
        const cellCount = qr.modules.size;
        const margin = 10;
        const viewSize = size + margin * 2;
        const cellSize = size / cellCount;
        const svgParts = [];

        svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
        svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${viewSize}" height="${viewSize}" viewBox="0 0 ${viewSize} ${viewSize}" shape-rendering="crispEdges">`);
        svgParts.push(`<rect width="100%" height="100%" fill="${colorLight}"/>`);

        for (let row = 0; row < cellCount; row += 1) {
            for (let col = 0; col < cellCount; col += 1) {
                if (qr.modules.get(row, col)) {
                    const x = margin + col * cellSize;
                    const y = margin + row * cellSize;
                    if (style === "rounded") {
                        const radius = Math.min(cellSize * 0.45, 5);
                        svgParts.push(`<path d="M${x + radius},${y} H${x + cellSize - radius} Q${x + cellSize},${y} ${x + cellSize},${y + radius} V${y + cellSize - radius} Q${x + cellSize},${y + cellSize} ${x + cellSize - radius},${y + cellSize} H${x + radius} Q${x},${y + cellSize} ${x},${y + cellSize - radius} V${y + radius} Q${x},${y} ${x + radius},${y} Z" fill="${colorDark}"/>`);
                    } else {
                        svgParts.push(`<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${colorDark}"/>`);
                    }
                }
            }
        }

        if (logoDataUrl) {
            const logoSize = Math.min(size * 0.2, 110);
            const logoPosition = (viewSize - logoSize) / 2;
            svgParts.push(`<rect x="${logoPosition - 8}" y="${logoPosition - 8}" width="${logoSize + 16}" height="${logoSize + 16}" rx="18" fill="${colorLight}" opacity="0.96"/>`);
            svgParts.push(`<image href="${logoDataUrl}" x="${logoPosition}" y="${logoPosition}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid slice"/>`);
        }

        svgParts.push(`</svg>`);
        return svgParts.join("");
    }

    function renderQrPreview() {
        const text = sanitizeText(qrInput.value);
        const foreground = qrForeground ? qrForeground.value : "#0e172c";
        const background = qrBackground ? qrBackground.value : "#ffffff";
        const size = qrSize ? Number(qrSize.value) : 360;
        const style = qrStyle ? qrStyle.value : "square";
        const errorCorrection = qrErrorCorrection ? qrErrorCorrection.value : "Q";

        if (!text) {
            renderEmptyPreview();
            clearStatus();
            currentText = "";
            currentSvgString = "";
            return;
        }

        if (!window.QRCode || typeof window.QRCode.create !== "function") {
            renderEmptyPreview();
            setStatus("QR library is unavailable. Please refresh the page and try again.", "error");
            return;
        }

        try {
            const qr = window.QRCode.create(text, {
                errorCorrectionLevel: errorCorrection,
                typeNumber: 0
            });
            const moduleCount = qr.modules.size;
            const canvas = qrPreviewCanvas;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                throw new Error("Unable to access canvas context.");
            }

            ctx.clearRect(0, 0, size, size);
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = foreground;
            const moduleSize = size / moduleCount;

            for (let row = 0; row < moduleCount; row += 1) {
                for (let col = 0; col < moduleCount; col += 1) {
                    if (qr.modules.get(row, col)) {
                        const x = Math.round(col * moduleSize);
                        const y = Math.round(row * moduleSize);
                        drawModule(ctx, x, y, Math.ceil(moduleSize), style, foreground);
                    }
                }
            }

            if (currentLogoDataUrl) {
                const logoImage = new Image();
                logoImage.onload = function () {
                    const maxLogoWidth = Math.min(size * 0.22, 120);
                    const aspectRatio = logoImage.width / logoImage.height || 1;
                    let logoWidth = maxLogoWidth;
                    let logoHeight = maxLogoWidth;
                    if (aspectRatio > 1) {
                        logoHeight = maxLogoWidth / aspectRatio;
                    } else if (aspectRatio < 1) {
                        logoWidth = maxLogoWidth * aspectRatio;
                    }
                    const logoX = (size - logoWidth) / 2;
                    const logoY = (size - logoHeight) / 2;
                    ctx.fillStyle = background;
                    ctx.beginPath();
                    ctx.roundRect(logoX - 8, logoY - 8, logoWidth + 16, logoHeight + 16, 18);
                    ctx.fill();
                    ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
                    setPreviewState(true);
                };
                logoImage.onerror = function () {
                    setStatus("Unable to load logo image. QR generated without logo.", "error");
                    setPreviewState(true);
                };
                logoImage.src = currentLogoDataUrl;
            } else {
                setPreviewState(true);
            }

            currentText = text;
            currentSvgString = generateSvgString(text, foreground, background, size, style, errorCorrection, currentLogoDataUrl);
            if (qrDataOutput) {
                qrDataOutput.textContent = text;
            }
            disableActionButtons(false);
            clearStatus();
        } catch (error) {
            renderEmptyPreview();
            setStatus("Unable to generate QR code. Please try different content.", "error");
            currentText = "";
            currentSvgString = "";
        }
    }

    function downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.setAttribute("download", fileName);
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    }

    function saveSvgFile() {
        if (!currentSvgString) {
            setStatus("Generate a QR code before downloading.", "error");
            return;
        }
        const blob = new Blob([currentSvgString], { type: "image/svg+xml;charset=utf-8" });
        downloadBlob(blob, "qr-code.svg");
    }

    function savePngFile() {
        if (!qrPreviewCanvas) {
            return;
        }
        qrPreviewCanvas.toBlob(function (blob) {
            if (blob) {
                downloadBlob(blob, "qr-code.png");
            } else {
                setStatus("Unable to create PNG download.", "error");
            }
        }, "image/png");
    }

    function saveJpgFile() {
        if (!qrPreviewCanvas) {
            return;
        }
        qrPreviewCanvas.toBlob(function (blob) {
            if (blob) {
                const image = new Image();
                const url = URL.createObjectURL(blob);
                image.onload = function () {
                    URL.revokeObjectURL(url);
                    const jpegCanvas = document.createElement("canvas");
                    jpegCanvas.width = image.width;
                    jpegCanvas.height = image.height;
                    const ctx = jpegCanvas.getContext("2d");
                    if (!ctx) {
                        setStatus("Unable to create JPG download.", "error");
                        return;
                    }
                    ctx.fillStyle = qrBackground ? qrBackground.value : "#ffffff";
                    ctx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
                    ctx.drawImage(image, 0, 0);
                    jpegCanvas.toBlob(function (jpegBlob) {
                        if (jpegBlob) {
                            downloadBlob(jpegBlob, "qr-code.jpg");
                        } else {
                            setStatus("Unable to create JPG download.", "error");
                        }
                    }, "image/jpeg", 0.95);
                };
                image.src = url;
            } else {
                setStatus("Unable to create JPG download.", "error");
            }
        }, "image/png");
    }

    function copyTextToClipboard() {
        const contentToCopy = currentText || sanitizeText(qrInput.value);
        if (!contentToCopy) {
            setStatus("Enter content to copy.", "error");
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(contentToCopy).then(function () {
                setStatus("Copied successfully!", "success");
            }, function () {
                setStatus("Unable to copy text in this browser.", "error");
            });
            return;
        }
        const tempInput = document.createElement("textarea");
        tempInput.value = contentToCopy;
        tempInput.setAttribute("readonly", "readonly");
        tempInput.style.position = "absolute";
        tempInput.style.left = "-9999px";
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
            const successful = document.execCommand("copy");
            setStatus(successful ? "Copied successfully!" : "Unable to copy text.", successful ? "success" : "error");
        } catch (err) {
            setStatus("Unable to copy text.", "error");
        }
        document.body.removeChild(tempInput);
    }

    function validateLogoFile(file) {
        if (!file) {
            return false;
        }
        if (!file.type.startsWith("image/")) {
            setStatus("Logo must be an image file.", "error");
            return false;
        }
        if (file.size > 2 * 1024 * 1024) {
            setStatus("Logo image must be smaller than 2 MB.", "error");
            return false;
        }
        return true;
    }

    function handleLogoInput(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }
        if (!validateLogoFile(file)) {
            if (qrLogoInput) {
                qrLogoInput.value = "";
            }
            currentLogoDataUrl = "";
            updateLogoPreviewLabel("");
            return;
        }
        const reader = new FileReader();
        reader.onload = function (loadEvent) {
            const result = loadEvent.target && loadEvent.target.result;
            if (typeof result === "string") {
                currentLogoDataUrl = result;
                updateLogoPreviewLabel(file.name);
                clearStatus();
                renderQrPreview();
            }
        };
        reader.readAsDataURL(file);
    }

    function clearForm() {
        if (qrInput) {
            qrInput.value = "";
        }
        if (qrForeground) {
            qrForeground.value = "#0e172c";
        }
        if (qrBackground) {
            qrBackground.value = "#ffffff";
        }
        if (qrSize) {
            qrSize.value = "360";
        }
        if (qrStyle) {
            qrStyle.value = "square";
        }
        if (qrErrorCorrection) {
            qrErrorCorrection.value = "Q";
        }
        clearLogoSelection();
        renderEmptyPreview();
        currentText = "";
        currentSvgString = "";
    }

    function handleGenerateClick() {
        const text = sanitizeText(qrInput.value);
        if (!text) {
            renderEmptyPreview();
            setStatus("Please enter a URL, text, phone number or email.", "error");
            return;
        }
        setStatus("Generating QR code…", "success");
        renderQrPreview();
    }

    function handleInputChange() {
        const text = sanitizeText(qrInput.value);
        if (!text) {
            renderEmptyPreview();
            clearStatus();
            return;
        }
        renderQrPreview();
    }

    if (qrInput) {
        qrInput.addEventListener("input", handleInputChange);
    }
    if (qrForeground) {
        qrForeground.addEventListener("change", renderQrPreview);
    }
    if (qrBackground) {
        qrBackground.addEventListener("change", renderQrPreview);
    }
    if (qrSize) {
        qrSize.addEventListener("change", renderQrPreview);
    }
    if (qrStyle) {
        qrStyle.addEventListener("change", renderQrPreview);
    }
    if (qrErrorCorrection) {
        qrErrorCorrection.addEventListener("change", renderQrPreview);
    }
    if (qrLogoInput) {
        qrLogoInput.addEventListener("change", handleLogoInput);
    }
    if (qrLogoClearBtn) {
        qrLogoClearBtn.addEventListener("click", function () {
            clearLogoSelection();
            renderQrPreview();
        });
    }
    if (qrGenerateBtn) {
        qrGenerateBtn.addEventListener("click", handleGenerateClick);
    }
    if (qrClearBtn) {
        qrClearBtn.addEventListener("click", function () {
            clearForm();
        });
    }
    if (qrDownloadPngBtn) {
        qrDownloadPngBtn.addEventListener("click", function () {
            if (!currentText) {
                setStatus("Generate a QR code before downloading.", "error");
                return;
            }
            savePngFile();
        });
    }
    if (qrDownloadJpgBtn) {
        qrDownloadJpgBtn.addEventListener("click", function () {
            if (!currentText) {
                setStatus("Generate a QR code before downloading.", "error");
                return;
            }
            saveJpgFile();
        });
    }
    if (qrDownloadSvgBtn) {
        qrDownloadSvgBtn.addEventListener("click", function () {
            if (!currentText) {
                setStatus("Generate a QR code before downloading.", "error");
                return;
            }
            saveSvgFile();
        });
    }
    if (qrCopyBtn) {
        qrCopyBtn.addEventListener("click", copyTextToClipboard);
    }

    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
            if (typeof radius === "number") {
                radius = { tl: radius, tr: radius, br: radius, bl: radius };
            }
            this.beginPath();
            this.moveTo(x + radius.tl, y);
            this.lineTo(x + width - radius.tr, y);
            this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
            this.lineTo(x + width, y + height - radius.br);
            this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
            this.lineTo(x + radius.bl, y + height);
            this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
            this.lineTo(x, y + radius.tl);
            this.quadraticCurveTo(x, y, x + radius.tl, y);
            this.closePath();
            this.fill();
        };
    }

    clearForm();
});
