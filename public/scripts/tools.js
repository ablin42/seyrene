function openTab(e, item, tabName) {
	e.preventDefault();
	let menuItems = document.getElementsByClassName("menu-link");
	for (let i = 0; i < menuItems.length; i++) {
		menuItems[i].classList.remove("active");
		menuItems[i].classList.remove("disabled");
	}
	item.classList.add("active");
	item.classList.add("disabled");
	let tab = document.getElementsByClassName("tab");
	for (let i = 0; i < tab.length; i++) {
		tab[i].style.display = "none";
	}
	document.getElementById(tabName).style.display = "flex";
}

function expand(image) {
	let expand = $("#expandImg");
	if (expand) {
		expand.src = image.src;
		expand.attr("src", image.src);
	}
}
