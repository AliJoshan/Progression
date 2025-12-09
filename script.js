const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
const closeBtn = document.querySelector(".close-btn");

hamburger.addEventListener("click", () => {
    navLinks.classList.add("mobile-active");

    const overlay = document.createElement("div");
    overlay.classList.add("menu-overlay");
    overlay.addEventListener("click", closeMenu);
    document.body.appendChild(overlay);
});

closeBtn.addEventListener("click", closeMenu);

function closeMenu() {
    navLinks.classList.remove("mobile-active");

    const overlay = document.querySelector(".menu-overlay");
    if (overlay) overlay.remove();
}

window.addEventListener("load", () => {
    document.getElementById("hero-section").classList.add("hero-loaded");
});