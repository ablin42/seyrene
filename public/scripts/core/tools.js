let menu = document.querySelectorAll(".menu-link");
menu.forEach(btn => {
	let target = btn.id.slice(0, -4);
	btn.addEventListener("click", function (e) {
		openTab(e, btn, target);
	});
});

let imgExp = document.querySelectorAll(".expandable");
imgExp.forEach(img => {
	let isGallery = false;
	if (img.dataset.isgallery) isGallery = true;
	let target = img;
	if (img.dataset.id) target = img.dataset.id;

	img.addEventListener("click", function (e) {
		expand(target, e, isGallery);
	});
});

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
			if (e.path && e.path[0].classList.contains("blog-overlay")) $(`#${image} img`).click();
			if (e.currentTarget.classList.contains("blog-overlay")) $(`img[data-imgid="${image}"]`).click();
		}
	}
}
