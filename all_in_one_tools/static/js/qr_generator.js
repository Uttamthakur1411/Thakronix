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
    const qrDataOutput = document.getElementById("qrOutputText");
    const qrForeground = document.getElementById("qrForegroundColor");
    const qrBackground = document.getElementById("qrBackgroundColor");
    const qrSize = document.getElementById("qrSizeSelect");
    const qrErrorCorrection = document.getElementById("qrErrorCorrection");
    const qrLogoInput = document.getElementById("qrLogoInput");
    const qrLogoName = document.getElementById("qrLogoName");
    const qrLogoClearBtn = document.getElementById("qrLogoClearBtn");

    const wifiSsid = document.getElementById("wifiSsid");
    const wifiPassword = document.getElementById("wifiPassword");
    const wifiType = document.getElementById("wifiType");
    const generateWifiBtn = document.getElementById("generateWifiBtn");
    const wifiQrCanvas = document.getElementById("wifiQrCanvas");

    const urlInput = document.getElementById("urlInput");
    const generateUrlBtn = document.getElementById("generateUrlBtn");
    const urlQrCanvas = document.getElementById("urlQrCanvas");

    const vcardName = document.getElementById("vcardName");
    const vcardPhone = document.getElementById("vcardPhone");
    const vcardEmail = document.getElementById("vcardEmail");
    const vcardOrg = document.getElementById("vcardOrg");
    const generateVcardBtn = document.getElementById("generateVcardBtn");
    const vcardQrCanvas = document.getElementById("vcardQrCanvas");

    const barcodeValue = document.getElementById("barcodeValue");
    const barcodeType = document.getElementById("barcodeType");
    const generateBarcodeBtn = document.getElementById("generateBarcodeBtn");
    const barcodeSvg = document.getElementById("barcodeSvg");

    const passwordLength = document.getElementById("passwordLength");
    const generatePasswordBtn = document.getElementById("generatePasswordBtn");
    const passwordOutput = document.getElementById("passwordOutput");

    const randomMin = document.getElementById("randomMin");
    const randomMax = document.getElementById("randomMax");
    const generateUuidBtn = document.getElementById("generateUuidBtn");
    const generateRandomBtn = document.getElementById("generateRandomBtn");
    const uuidOutput = document.getElementById("uuidOutput");
    const randomOutput = document.getElementById("randomOutput");

    const cameraPreview = document.getElementById("cameraPreview");
    const cameraCanvas = document.getElementById("cameraCanvas");
    const cameraStartBtn = document.getElementById("cameraStartBtn");
    const qrScanUpload = document.getElementById("qrScanUpload");
    const scannerOutput = document.getElementById("scannerOutput");

    if (!qrInput || !qrGenerateBtn || !qrPreviewCanvas) {
        return;
    }

    let currentText = "";
    let currentLogoDataUrl = "";
    let currentSvgString = "";
    let currentStream = null;

    function sanitizeText(value) {
        return value ? String(value).trim() : "";
    }

    function setStatus(message, type) {
        if (!qrStatus) return;
        qrStatus.textContent = message;
        qrStatus.classList.toggle("error", type === "error");
        qrStatus.classList.toggle("success", type === "success");
    }

    function clearStatus() {
        setStatus("", "");
    }

    function disableActionButtons(disabled) {
        [qrDownloadPngBtn, qrDownloadJpgBtn, qrDownloadSvgBtn, qrCopyBtn].forEach(function (button) {
            if (button) button.disabled = disabled;
        });
    }

    function setPreviewState(isReady) {
        qrPreviewCanvas.style.display = isReady ? "block" : "none";
        qrPreviewCanvas.style.opacity = isReady ? "1" : "0";
        if (qrEmptyState) qrEmptyState.style.display = isReady ? "none" : "grid";
    }

    function renderEmptyPreview() {
        setPreviewState(false);
        if (qrDataOutput) qrDataOutput.textContent = "-";
        disableActionButtons(true);
    }

    function updateLogoPreviewLabel(name) {
        if (qrLogoName) qrLogoName.textContent = name || "No logo selected";
    }

    function clearLogoSelection() {
        currentLogoDataUrl = "";
        if (qrLogoInput) qrLogoInput.value = "";
        updateLogoPreviewLabel("");
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
        if (!window.QRCode || typeof window.QRCode.create !== "function") return "";
        const qr = window.QRCode.create(text, { errorCorrectionLevel: errorCorrection, typeNumber: 0 });
        const cellCount = qr.modules.size;
        const margin = 10;
        const viewSize = size + margin * 2;
        const cellSize = size / cellCount;
        const svgParts = [];
        svgParts.push('<?xml version="1.0" encoding="UTF-8"?>');
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

        svgParts.push("</svg>");
        return svgParts.join("");
    }

    function renderQrPreview() {
        const text = sanitizeText(qrInput.value);
        const foreground = qrForeground ? qrForeground.value : "#0e172c";
        const background = qrBackground ? qrBackground.value : "#ffffff";
        const size = qrSize ? Number(qrSize.value) : 360;
        const errorCorrection = qrErrorCorrection ? qrErrorCorrection.value : "Q";
        const style = "square";

        if (!text) {
            renderEmptyPreview();
            currentText = "";
            currentSvgString = "";
            return;
        }

        try {
            const qr = window.QRCode.create(text, { errorCorrectionLevel: errorCorrection, typeNumber: 0 });
            const moduleCount = qr.modules.size;
            const canvas = qrPreviewCanvas;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
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
                    if (aspectRatio > 1) logoHeight = maxLogoWidth / aspectRatio;
                    else if (aspectRatio < 1) logoWidth = maxLogoWidth * aspectRatio;
                    const logoX = (size - logoWidth) / 2;
                    const logoY = (size - logoHeight) / 2;
                    ctx.fillStyle = background;
                    ctx.beginPath();
                    ctx.roundRect(logoX - 8, logoY - 8, logoWidth + 16, logoHeight + 16, 18);
                    ctx.fill();
                    ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
                    setPreviewState(true);
                };
                logoImage.src = currentLogoDataUrl;
            } else {
                setPreviewState(true);
            }

            currentText = text;
            currentSvgString = generateSvgString(text, foreground, background, size, style, errorCorrection, currentLogoDataUrl);
            if (qrDataOutput) qrDataOutput.textContent = text;
            disableActionButtons(false);
            clearStatus();
        } catch (error) {
            renderEmptyPreview();
            setStatus("Unable to generate QR code.", "error");
        }
    }

    function downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
        qrPreviewCanvas.toBlob(function (blob) {
            if (blob) downloadBlob(blob, "qr-code.png");
            else setStatus("Unable to create PNG download.", "error");
        }, "image/png");
    }

    function saveJpgFile() {
        qrPreviewCanvas.toBlob(function (blob) {
            if (!blob) {
                setStatus("Unable to create JPG download.", "error");
                return;
            }
            const image = new Image();
            const url = URL.createObjectURL(blob);
            image.onload = function () {
                URL.revokeObjectURL(url);
                const jpegCanvas = document.createElement("canvas");
                jpegCanvas.width = image.width;
                jpegCanvas.height = image.height;
                const ctx = jpegCanvas.getContext("2d");
                ctx.fillStyle = qrBackground ? qrBackground.value : "#ffffff";
                ctx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
                ctx.drawImage(image, 0, 0);
                jpegCanvas.toBlob(function (jpegBlob) {
                    if (jpegBlob) downloadBlob(jpegBlob, "qr-code.jpg");
                    else setStatus("Unable to create JPG download.", "error");
                }, "image/jpeg", 0.95);
            };
            image.src = url;
        }, "image/png");
    }

    function copyTextToClipboard() {
        const content = currentText || sanitizeText(qrInput.value);
        if (!content) {
            setStatus("Enter content to copy.", "error");
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(content).then(() => setStatus("Copied successfully!", "success")).catch(() => setStatus("Unable to copy text.", "error"));
            return;
        }
        const temp = document.createElement("textarea");
        temp.value = content;
        temp.style.position = "fixed";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
        setStatus("Copied successfully!", "success");
    }

    function handleLogoInput(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setStatus("Logo must be an image file.", "error");
            return;
        }
        const reader = new FileReader();
        reader.onload = function (evt) {
            currentLogoDataUrl = evt.target.result;
            updateLogoPreviewLabel(file.name);
            renderQrPreview();
        };
        reader.readAsDataURL(file);
    }

    function renderQrFromText(text, canvasEl) {
        if (!window.QRCode) return;
        const qr = window.QRCode.create(text, { errorCorrectionLevel: "Q", typeNumber: 0 });
        const size = canvasEl.width;
        const ctx = canvasEl.getContext("2d");
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        const moduleSize = size / qr.modules.size;
        for (let row = 0; row < qr.modules.size; row += 1) {
            for (let col = 0; col < qr.modules.size; col += 1) {
                if (qr.modules.get(row, col)) {
                    ctx.fillStyle = "#0e172c";
                    ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
                }
            }
        }
    }

    function generateWifiQr() {
        const ssid = sanitizeText(wifiSsid.value);
        if (!ssid) {
            setStatus("Please enter a WiFi SSID.", "error");
            return;
        }
        const password = sanitizeText(wifiPassword.value);
        const security = wifiType ? wifiType.value : "WPA";
        const payload = security === "nopass" ? `WIFI:T:nopass;S:${ssid};P:;` : `WIFI:T:${security};S:${ssid};P:${password};`;
        renderQrFromText(payload, wifiQrCanvas);
        setStatus("WiFi QR generated successfully.", "success");
    }

    function generateUrlQr() {
        const url = sanitizeText(urlInput.value);
        if (!url) {
            setStatus("Please enter a URL.", "error");
            return;
        }
        renderQrFromText(url, urlQrCanvas);
        setStatus("URL QR generated successfully.", "success");
    }

    function generateVcardQr() {
        const name = sanitizeText(vcardName.value);
        const phone = sanitizeText(vcardPhone.value);
        const email = sanitizeText(vcardEmail.value);
        const org = sanitizeText(vcardOrg.value);
        if (!name && !phone && !email && !org) {
            setStatus("Please fill in at least one vCard field.", "error");
            return;
        }
        let vcard = "BEGIN:VCARD\nVERSION:3.0\n";
        if (name) vcard += `FN:${name}\n`;
        if (phone) vcard += `TEL:${phone}\n`;
        if (email) vcard += `EMAIL:${email}\n`;
        if (org) vcard += `ORG:${org}\n`;
        vcard += "END:VCARD";
        renderQrFromText(vcard, vcardQrCanvas);
        setStatus("vCard QR generated successfully.", "success");
    }

    function generateBarcode() {
        const value = sanitizeText(barcodeValue.value);
        if (!value) {
            setStatus("Please enter a barcode value.", "error");
            return;
        }
        const type = barcodeType ? barcodeType.value : "CODE128";
        if (barcodeSvg) {
            JsBarcode(barcodeSvg, value, { format: type, displayValue: true, lineColor: "#0f172a", width: 2, height: 80, background: "#ffffff" });
            setStatus("Barcode generated successfully.", "success");
        }
    }

    function generatePassword() {
        const length = Math.max(8, Math.min(64, Number(passwordLength.value || 16)));
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
        let result = "";
        for (let i = 0; i < length; i += 1) result += chars[Math.floor(Math.random() * chars.length)];
        if (passwordOutput) passwordOutput.value = result;
        setStatus("Password generated successfully.", "success");
    }

    function generateUuid() {
        const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        if (uuidOutput) uuidOutput.value = uuid;
        setStatus("UUID generated successfully.", "success");
    }

    function generateRandomNumber() {
        const min = Number(randomMin.value || 0);
        const max = Number(randomMax.value || 100);
        const lower = Math.min(min, max);
        const upper = Math.max(min, max);
        const value = Math.floor(Math.random() * (upper - lower + 1)) + lower;
        if (randomOutput) randomOutput.value = value;
        setStatus("Random number generated successfully.", "success");
    }

    function stopCamera() {
        if (currentStream) {
            currentStream.getTracks().forEach(function (track) { track.stop(); });
            currentStream = null;
        }
        if (cameraPreview) cameraPreview.srcObject = null;
    }

    async function startCameraScanner() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setStatus("Camera access is not supported in this browser.", "error");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            currentStream = stream;
            if (cameraPreview) cameraPreview.srcObject = stream;
            setStatus("Camera is active. Point it at a QR code.", "success");
            const scanFrame = async () => {
                if (!cameraPreview || !cameraCanvas || !stream) return;
                const ctx = cameraCanvas.getContext("2d");
                cameraCanvas.width = cameraPreview.videoWidth || 640;
                cameraCanvas.height = cameraPreview.videoHeight || 480;
                ctx.drawImage(cameraPreview, 0, 0, cameraCanvas.width, cameraCanvas.height);
                const imageData = ctx.getImageData(0, 0, cameraCanvas.width, cameraCanvas.height);
                const code = window.jsQR ? window.jsQR(imageData.data, imageData.width, imageData.height) : null;
                if (code) {
                    if (scannerOutput) scannerOutput.value = code.data;
                    setStatus("QR code scanned successfully.", "success");
                    stopCamera();
                    return;
                }
                if (currentStream) requestAnimationFrame(scanFrame);
            };
            requestAnimationFrame(scanFrame);
        } catch (error) {
            setStatus("Camera permission was denied or no camera is available.", "error");
        }
    }

    async function handleScanUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (imgEvent) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = window.jsQR ? window.jsQR(imageData.data, imageData.width, imageData.height) : null;
                if (code && scannerOutput) scannerOutput.value = code.data;
                else setStatus("No QR code found in the uploaded image.", "error");
            };
            img.src = imgEvent.target.result;
        };
        reader.readAsDataURL(file);
    }

    function attachHandlers() {
        if (qrGenerateBtn) qrGenerateBtn.addEventListener("click", function () { if (!sanitizeText(qrInput.value)) { setStatus("Please enter content for your QR code.", "error"); return; } setStatus("Generating QR code...", "success"); renderQrPreview(); });
        if (qrClearBtn) qrClearBtn.addEventListener("click", function () { qrInput.value = ""; currentText = ""; currentLogoDataUrl = ""; clearLogoSelection(); renderEmptyPreview(); clearStatus(); });
        if (qrForeground) qrForeground.addEventListener("change", renderQrPreview);
        if (qrBackground) qrBackground.addEventListener("change", renderQrPreview);
        if (qrSize) qrSize.addEventListener("change", renderQrPreview);
        if (qrErrorCorrection) qrErrorCorrection.addEventListener("change", renderQrPreview);
        if (qrDownloadPngBtn) qrDownloadPngBtn.addEventListener("click", function () { if (!currentText) { setStatus("Generate a QR code before downloading.", "error"); return; } savePngFile(); });
        if (qrDownloadJpgBtn) qrDownloadJpgBtn.addEventListener("click", function () { if (!currentText) { setStatus("Generate a QR code before downloading.", "error"); return; } saveJpgFile(); });
        if (qrDownloadSvgBtn) qrDownloadSvgBtn.addEventListener("click", function () { if (!currentText) { setStatus("Generate a QR code before downloading.", "error"); return; } saveSvgFile(); });
        if (qrCopyBtn) qrCopyBtn.addEventListener("click", copyTextToClipboard);
        if (qrLogoInput) qrLogoInput.addEventListener("change", handleLogoInput);
        if (qrLogoClearBtn) qrLogoClearBtn.addEventListener("click", () => { clearLogoSelection(); renderQrPreview(); });
        if (qrInput) qrInput.addEventListener("input", function () { const value = sanitizeText(qrInput.value); if (!value) { renderEmptyPreview(); clearStatus(); return; } renderQrPreview(); });

        if (generateWifiBtn) generateWifiBtn.addEventListener("click", generateWifiQr);
        if (generateUrlBtn) generateUrlBtn.addEventListener("click", generateUrlQr);
        if (generateVcardBtn) generateVcardBtn.addEventListener("click", generateVcardQr);
        if (generateBarcodeBtn) generateBarcodeBtn.addEventListener("click", generateBarcode);
        if (generatePasswordBtn) generatePasswordBtn.addEventListener("click", generatePassword);
        if (generateUuidBtn) generateUuidBtn.addEventListener("click", generateUuid);
        if (generateRandomBtn) generateRandomBtn.addEventListener("click", generateRandomNumber);

        if (cameraStartBtn) cameraStartBtn.addEventListener("click", startCameraScanner);
        if (qrScanUpload) qrScanUpload.addEventListener("change", handleScanUpload);
    }

    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
            if (typeof radius === "number") radius = { tl: radius, tr: radius, br: radius, bl: radius };
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

    renderEmptyPreview();
    attachHandlers();
});
