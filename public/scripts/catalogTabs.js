let main = document.querySelectorAll(".main-btn");
let sub = document.querySelectorAll(".cat-btn");

let callToGallery = document.querySelector("#goto-gallery");

if (callToGallery)
	callToGallery.addEventListener("click", function () {
		window.location.href = "/Galerie";
	});

let callToPapers = document.querySelector("#goto-papers");

if (callToPapers)
	callToPapers.addEventListener("click", function () {
		window.location.href = "#framed-papers";
	});

let callToStretched = document.querySelector("#stretched-btn-call");
let stretchBtn = document.querySelector("#stretched-btn");

if (callToStretched) {
	callToStretched.addEventListener("click", function () {
		openSubCategory(stretchBtn, "stretched", "canvas");
	});
}

main.forEach(btn => {
	let target = btn.id.slice(0, -4);
	btn.addEventListener("click", function () {
		openTabCat(btn, target);
	});
});

sub.forEach(btn => {
	let target = btn.id.slice(0, -4);
	let category = btn.dataset.category;
	btn.addEventListener("click", function () {
		openSubCategory(btn, target, category);
	});
});

function openTabCat(btn, tabName) {
	let tab = document.getElementsByClassName("tab");
	let buttons = document.querySelectorAll(".main-btn");

	for (let i = 0; i < buttons.length; i++) buttons[i].classList.remove("active");

	btn.classList.add("active");

	for (let i = 0; i < tab.length; i++) {
		tab[i].classList.remove("grid");
		tab[i].classList.add("nodisplay");
	}

	document.getElementById(tabName).classList.remove("nodisplay");
	document.getElementById(tabName).classList.add("grid");
}

function openSubCategory(btn, tabName, category) {
	let tab = document.getElementsByClassName(`${category} sub-toggle`);
	let buttons = document.getElementsByClassName(`${category} cat-btn`);

	for (let i = 0; i < buttons.length; i++) buttons[i].classList.remove("active");
	btn.classList.add("active");

	for (let i = 0; i < tab.length; i++) {
		tab[i].classList.remove("grid");
		tab[i].classList.add("nodisplay");
	}

	document.getElementById(tabName).classList.remove("nodisplay");
	document.getElementById(tabName).classList.add("grid");
}
