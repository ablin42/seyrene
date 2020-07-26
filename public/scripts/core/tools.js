function openTab(e, item, tabName) {
	e.preventDefault();
	let menuItems = document.getElementsByClassName("menu-link");
	for (let i = 0; i < menuItems.length; i++) {
		menuItems[parseInt(i)].classList.remove("active");
		menuItems[parseInt(i)].classList.remove("disabled");
	}
	item.classList.add("active");
	item.classList.add("disabled");
	let tab = document.getElementsByClassName("tab");
	for (let i = 0; i < tab.length; i++) {
		tab[parseInt(i)].classList.add("nodisplay");
	}
	document.getElementById(tabName).classList.remove("nodisplay");
}

function expand(image, e = null, gallery = false) {
	let expand = $("#expandImg");
	if (expand) {
		if (gallery === false) {
			expand.src = image.src;
			expand.attr("src", image.src);
		} else {
			console.log(e.path[0], e.path[0].classList.contains("blog-overlay"), e.path[0].classList);
			if (e.path[0].classList.contains("blog-overlay")) $(`#${image} img`).click();
		}
	}
}
