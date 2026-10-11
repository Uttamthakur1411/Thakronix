// ==========================================
// ELEMENT SELECTIONS
// ==========================================
const uploadArea = document.getElementById("uploadArea");
const imageInput = document.getElementById("imageInput");
const browseBtn = document.getElementById("browseBtn");
const previewSection = document.getElementById("previewSection");
const previewImage = document.getElementById("previewImage");
const fileName = document.getElementById("fileName");
const originalSize = document.getElementById("originalSize");
const originalFormat = document.getElementById("originalFormat");
const removeBtn = document.getElementById("removeBtn");

// Convert aur Compress dono button IDs ko support karne ke liye
const actionBtn = document.getElementById("convertBtn") || document.getElementById("compressBtn");

const qualitySlider = document.getElementById("qualitySlider");
const qualityValue = document.getElementById("qualityValue");
const processing = document.getElementById("processing");
const resultBox = document.getElementById("resultBox");
const resultOriginal = document.getElementById("resultOriginal");
const resultCompressed = document.getElementById("resultCompressed");
const reduction = document.getElementById("reduction");
const downloadBtn = document.getElementById("downloadBtn");
const anotherBtn = document.getElementById("anotherBtn");
const formatButtons = document.querySelectorAll(".format-btn");

let selectedFile = null;
let selectedFormat = "PNG"; // Default format for converter
let downloadURL = null;


// ==========================================
// BROWSE & FILE INPUT
// ==========================================
if (browseBtn && imageInput) {
    browseBtn.addEventListener("click", () => {
        imageInput.click();
    });
}

if (imageInput) {
    imageInput.addEventListener("change", () => {
        if (imageInput.files && imageInput.files.length > 0) {
            handleFile(imageInput.files[0]);
        }
    });
}


// ==========================================
// DRAG & DROP
// ==========================================
if (uploadArea) {
    uploadArea.addEventListener("dragover", (event) => {
        event.preventDefault();
        uploadArea.classList.add("dragover");
    });

    uploadArea.addEventListener("dragleave", () => {
        uploadArea.classList.remove("dragover");
    });

    uploadArea.addEventListener("drop", (event) => {
        event.preventDefault();
        uploadArea.classList.remove("dragover");
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            handleFile(event.dataTransfer.files[0]);
        }
    });
}


// ==========================================
// HANDLE FILE FUNCTION
// ==========================================
function handleFile(file) {
    if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        alert("Maximum file size allowed is 20 MB.");
        return;
    }

    selectedFile = file;

    if (fileName) fileName.textContent = file.name;
    if (originalSize) originalSize.textContent = formatBytes(file.size);

    let format = file.type.split("/").pop().toUpperCase();
    if (format === "JPEG") format = "JPG";
    if (originalFormat) originalFormat.textContent = format;

    const reader = new FileReader();
    reader.onload = (event) => {
        if (previewImage) previewImage.src = event.target.result;
    };
    reader.readAsDataURL(file);

    if (uploadArea) uploadArea.style.display = "none";
    if (previewSection) previewSection.classList.add("show");
}


// ==========================================
// QUALITY SLIDER
// ==========================================
if (qualitySlider && qualityValue) {
    qualitySlider.addEventListener("input", () => {
        qualityValue.textContent = qualitySlider.value;
    });
}


// ==========================================
// FORMAT BUTTONS SELECTION
// ==========================================
formatButtons.forEach((button) => {
    button.addEventListener("click", () => {
        formatButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        selectedFormat = button.dataset.format || "PNG";
    });
});


// ==========================================
// CONVERT / COMPRESS ACTION
// ==========================================
if (actionBtn) {
    actionBtn.addEventListener("click", async () => {
        if (!selectedFile) {
            alert("Please select an image first.");
            return;
        }

        const formData = new FormData();
        formData.append("image", selectedFile);
        formData.append("quality", qualitySlider ? qualitySlider.value : 90);
        formData.append("format", selectedFormat);

        // Detect correct API Endpoint based on button ID or URL path
        const isConvertMode = actionBtn.id === "convertBtn" || window.location.pathname.includes("convert");
        const endpoint = isConvertMode ? "/convert-image" : "/compress-image";

        actionBtn.style.display = "none";
        if (processing) processing.classList.add("show");

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || "Action failed on server.");
            }

            const blob = await response.blob();

            // Handle file size calculation (with fallback for /convert-image)
            const origHeader = response.headers.get("X-Original-Size");
            const compHeader = response.headers.get("X-Compressed-Size");

            const originalBytes = origHeader ? parseInt(origHeader) : selectedFile.size;
            const finalBytes = compHeader ? parseInt(compHeader) : blob.size;

            const percent = originalBytes > 0
                ? Math.max(0, Math.round((1 - finalBytes / originalBytes) * 100))
                : 0;

            if (resultOriginal) resultOriginal.textContent = formatBytes(originalBytes);
            if (resultCompressed) resultCompressed.textContent = formatBytes(finalBytes);
            if (reduction) reduction.textContent = isConvertMode ? "Image Converted Successfully!" : `${percent}% Size Reduced`;

            downloadURL = URL.createObjectURL(blob);

            if (processing) processing.classList.remove("show");
            if (resultBox) resultBox.classList.add("show");

        } catch (error) {
            console.error("Image processing error:", error);
            if (processing) processing.classList.remove("show");
            actionBtn.style.display = "block";
            alert(error.message || "Failed to process image.");
        }
    });
}


// ==========================================
// DOWNLOAD FILE
// ==========================================
if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
        if (!downloadURL) return;

        const link = document.createElement("a");
        link.href = downloadURL;

        const extension = selectedFormat.toUpperCase() === "JPEG" ? "jpg" : selectedFormat.toLowerCase();
        link.download = `converted-image.${extension}`;

        document.body.appendChild(link);
        link.click();
        link.remove();
    });
}


// ==========================================
// REMOVE / RESET TOOL
// ==========================================
if (removeBtn) removeBtn.addEventListener("click", resetTool);
if (anotherBtn) anotherBtn.addEventListener("click", resetTool);

function resetTool() {
    selectedFile = null;

    if (downloadURL) {
        URL.revokeObjectURL(downloadURL);
        downloadURL = null;
    }

    if (imageInput) imageInput.value = "";
    if (previewImage) previewImage.src = "";

    if (previewSection) previewSection.classList.remove("show");
    if (resultBox) resultBox.classList.remove("show");
    if (processing) processing.classList.remove("show");

    if (actionBtn) actionBtn.style.display = "block";
    if (uploadArea) uploadArea.style.display = "block";
}


// ==========================================
// FORMAT BYTES UTILITY
// ==========================================
function formatBytes(bytes) {
    if (!bytes || isNaN(bytes) || bytes === 0) return "0 Bytes";

    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

console.log("Image Converter & Compressor JS Loaded Successfully.");