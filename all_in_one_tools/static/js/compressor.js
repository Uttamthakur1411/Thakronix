const uploadArea =
    document.getElementById("uploadArea");

const imageInput =
    document.getElementById("imageInput");

const browseBtn =
    document.getElementById("browseBtn");

const previewSection =
    document.getElementById("previewSection");

const previewImage =
    document.getElementById("previewImage");

const fileName =
    document.getElementById("fileName");

const originalSize =
    document.getElementById("originalSize");

const originalFormat =
    document.getElementById("originalFormat");

const removeBtn =
    document.getElementById("removeBtn");

const compressBtn =
    document.getElementById("compressBtn");

const qualitySlider =
    document.getElementById("qualitySlider");

const qualityValue =
    document.getElementById("qualityValue");

const processing =
    document.getElementById("processing");

const resultBox =
    document.getElementById("resultBox");

const resultOriginal =
    document.getElementById("resultOriginal");

const resultCompressed =
    document.getElementById("resultCompressed");

const reduction =
    document.getElementById("reduction");

const downloadBtn =
    document.getElementById("downloadBtn");

const anotherBtn =
    document.getElementById("anotherBtn");

const targetSizeInput =
    document.getElementById("targetSizeInput");

const formatButtons =
    document.querySelectorAll(".format-btn");


let selectedFile = null;

let selectedFormat = "JPEG";

let downloadURL = null;



// ==========================================
// BROWSE
// ==========================================

if (browseBtn && imageInput) {

    browseBtn.addEventListener(
        "click",
        () => {

            imageInput.click();

        }
    );

}



// ==========================================
// FILE SELECT
// ==========================================

if (imageInput) {

    imageInput.addEventListener(
        "change",
        () => {

            if (
                imageInput.files &&
                imageInput.files.length > 0
            ) {

                handleFile(
                    imageInput.files[0]
                );

            }

        }
    );

}



// ==========================================
// DRAG & DROP
// ==========================================

if (uploadArea) {

    uploadArea.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            uploadArea.classList.add(
                "dragover"
            );

        }
    );


    uploadArea.addEventListener(
        "dragleave",
        () => {

            uploadArea.classList.remove(
                "dragover"
            );

        }
    );


    uploadArea.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            uploadArea.classList.remove(
                "dragover"
            );

            if (
                event.dataTransfer.files.length
            ) {

                handleFile(
                    event.dataTransfer.files[0]
                );

            }

        }
    );

}



// ==========================================
// HANDLE FILE
// ==========================================

function handleFile(file) {

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "Please select a valid image."
        );

        return;

    }


    if (
        file.size >
        20 * 1024 * 1024
    ) {

        alert(
            "Maximum file size is 20 MB."
        );

        return;

    }


    selectedFile = file;


    fileName.textContent =
        file.name;


    originalSize.textContent =
        formatBytes(
            file.size
        );


    let format =
        file.type
            .split("/")
            .pop()
            .toUpperCase();


    if (
        format === "JPEG"
    ) {

        format = "JPG";

    }


    originalFormat.textContent =
        format;


    const reader =
        new FileReader();


    reader.onload =
        event => {

            previewImage.src =
                event.target.result;

        };


    reader.readAsDataURL(file);


    uploadArea.style.display =
        "none";


    previewSection.classList.add(
        "show"
    );

}



// ==========================================
// QUALITY
// ==========================================

if (qualitySlider) {

    qualitySlider.addEventListener(
        "input",
        () => {

            qualityValue.textContent =
                qualitySlider.value;

        }
    );

}



// ==========================================
// FORMAT
// ==========================================

formatButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                formatButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                selectedFormat =
                    button.dataset.format;

            }
        );

    }
);



// ==========================================
// COMPRESS
// ==========================================

if (compressBtn) {

    compressBtn.addEventListener(
        "click",
        async () => {

            if (!selectedFile) {

                alert(
                    "Please select an image first."
                );

                return;

            }


            const formData =
                new FormData();


            formData.append(
                "image",
                selectedFile
            );


            formData.append(
                "quality",
                qualitySlider.value
            );

            if (
                targetSizeInput &&
                targetSizeInput.value.trim()
            ) {
                formData.append(
                    "target_size",
                    targetSizeInput.value.trim()
                );
            }

            formData.append(
                "format",
                selectedFormat
            );

            compressBtn.style.display =
                "none";

            processing.style.display =
                "block";
            processing.classList.add(
                "show"
            );


            try {

                const response =
                    await fetch(
                        "/compress-image",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                if (!response.ok) {

                    const error =
                        await response.json();

                    throw new Error(
                        error.message ||
                        "Compression failed."
                    );

                }


                const blob =
                    await response.blob();


                let original =
                    parseInt(
                        response.headers.get(
                            "X-Original-Size"
                        )
                    );

                if (!original) {
                    original = selectedFile.size;
                }

                let compressed =
                    parseInt(
                        response.headers.get(
                            "X-Compressed-Size"
                        )
                    );

                if (!compressed) {
                    compressed = blob.size;
                }


                const percent =
                    original > 0
                        ? Math.max(
                            0,
                            Math.round(
                                (
                                    1 -
                                    compressed /
                                    original
                                ) * 100
                            )
                        )
                        : 0;


                resultOriginal.textContent =
                    formatBytes(
                        original
                    );


                resultCompressed.textContent =
                    formatBytes(
                        compressed
                    );


                reduction.textContent =
                    `${percent}% Size Reduced`;


                downloadURL =
                    URL.createObjectURL(
                        blob
                    );

                processing.classList.remove(
                    "show"
                );
            processing.style.display =
                "none";

                resultBox.classList.add(
                    "show"
                );
            resultBox.style.display =
                "block";


            } catch (error) {

                console.error(
                    error
                );


                processing.classList.remove(
                    "show"
                );
            processing.style.display =
                "none";

                compressBtn.style.display =
                    "block";


                alert(
                    error.message
                );

            }

        }
    );

}



// ==========================================
// DOWNLOAD
// ==========================================

if (downloadBtn) {

    downloadBtn.addEventListener(
        "click",
        () => {

            if (!downloadURL) {

                return;

            }


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                downloadURL;


            const extension =
                selectedFormat === "JPEG"
                    ? "jpg"
                    : selectedFormat.toLowerCase();


            link.download =
                `compressed-image.${extension}`;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();

        }
    );

}



// ==========================================
// REMOVE / RESET
// ==========================================

if (removeBtn) {

    removeBtn.addEventListener(
        "click",
        resetTool
    );

}


if (anotherBtn) {

    anotherBtn.addEventListener(
        "click",
        resetTool
    );

}


function resetTool() {

    selectedFile = null;


    if (downloadURL) {

        URL.revokeObjectURL(
            downloadURL
        );

        downloadURL = null;

    }


    imageInput.value =
        "";


    previewImage.src =
        "";


    previewSection.classList.remove(
        "show"
    );


    resultBox.classList.remove(
        "show"
    );
resultBox.style.display =
        "none";


    processing.classList.remove(
        "show"
    );
processing.style.display =
        "none";


    compressBtn.style.display =
        "block";


    uploadArea.style.display =
        "block";

}



// ==========================================
// FORMAT BYTES
// ==========================================

function formatBytes(bytes) {

    if (
        !bytes ||
        bytes === 0
    ) {

        return "0 Bytes";

    }


    const sizes = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const i =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        parseFloat(
            (
                bytes /
                Math.pow(
                    1024,
                    i
                )
            ).toFixed(2)
        )
        +
        " " +
        sizes[i]
    );

}


console.log(
    "Image Compressor loaded successfully."
);