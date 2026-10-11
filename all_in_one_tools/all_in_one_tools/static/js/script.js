// ==========================================
// TOOL SEARCH
// ==========================================

const searchInput = document.getElementById("toolSearch");
const toolCards = document.querySelectorAll(".tool-card");

if (searchInput) {

    searchInput.addEventListener("input", function () {

        const searchValue = this.value
            .toLowerCase()
            .trim();

        toolCards.forEach(card => {

            const toolName =
                (card.dataset.name || "").toLowerCase();

            if (toolName.includes(searchValue)) {

                card.style.display = "";

            } else {

                card.style.display = "none";

            }

        });

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
        localStorage.setItem("thakronix-theme", darkMode ? "dark" : "light");
    };

    const savedTheme = localStorage.getItem("thakronix-theme");
    applyTheme(savedTheme !== "light");

    themeToggle.onclick = function () {
        const darkMode = document.body.dataset.theme !== "light";
        applyTheme(!darkMode);
    };
}


// ==========================================
// NAVBAR SCROLL EFFECT
// ==========================================

window.addEventListener(
    "scroll",
    function () {

        const navbar =
            document.querySelector(".navbar");

        if (!navbar) {
            return;
        }

        if (window.scrollY > 50) {

            navbar.style.background =
                "rgba(7,7,11,0.95)";

        } else {

            navbar.style.background =
                "rgba(7,7,11,0.75)";

        }

    }
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