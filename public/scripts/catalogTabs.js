function openTab(btn, tabName) {
	let tab = document.getElementsByClassName("tab");
	let buttons = document.querySelectorAll(".catalog-wrapper .tab-btn");

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