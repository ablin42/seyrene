const hamburger = document.querySelector(".hamburger");
const links = document.querySelectorAll(".nav-links li");
const navContainer = document.querySelector(".navbar-container");
const logo = document.querySelector(".logo");
const header = document.querySelector("#header");

header.addEventListener("mouseover", function () {
	logo.setAttribute("src", "/svg/logo_blue.svg");
});

header.addEventListener("mouseout", function () {
	logo.setAttribute("src", "/svg/logo_white.svg");
});

hamburger.addEventListener("click", () => {
	hamburger.classList.toggle("toggle");
	navContainer.classList.toggle("open");
	links.forEach(link => {
		link.classList.toggle("fading");
	});
	logo.classList.toggle("fading");
});
