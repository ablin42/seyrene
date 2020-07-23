window.addEventListener("load", event => {
	let parentwidth = document.querySelector(".menu").getBoundingClientRect().width;
	document.querySelector(".fixed-arrow").style.width = parentwidth + "px";
});

window.addEventListener("resize", event => {
	let parentwidth = document.querySelector(".menu").getBoundingClientRect().width;
	document.querySelector(".fixed-arrow").style.width = parentwidth + "px";
});
