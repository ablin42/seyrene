const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
let inputFile = document.querySelectorAll(".inputfile");
let delbtn = document.querySelectorAll("a[data-del]");
let selbtn = document.querySelectorAll("a[data-sel]");
let patchshop = document.querySelector("form[data-patchshop]");
let postShopForm = document.querySelector("form[data-postshop]");

if (postShopForm)
	postShopForm.addEventListener("submit", function (e) {
		postShop(e);
	});

if (patchshop)
	patchshop.addEventListener("submit", function (e) {
		patchShop(e, document.querySelector("form[data-patchshop]").dataset.id);
	});

inputFile.forEach(input => {
	input.addEventListener("change", function () {
		readURL(input);
	});
});

delbtn.forEach(btn => {
	btn.addEventListener("click", function (e) {
		deleteImage(e, btn);
	});
});

selbtn.forEach(btn => {
	btn.addEventListener("click", function (e) {
		setMain(e, btn);
	});
});

async function postShop(e) {
	e.preventDefault();
	let title = $("#title").val(),
		content = $("#content").val(),
		price = $("#price").val(),
		img = document.querySelector("#img"),
		formData = new FormData();

	for (let i = 0; i < img.files.length; i++) formData.append("img", img.files[parseInt(i)]);

	formData.append("title", title);
	formData.append("content", content);
	formData.append("price", price);
	console.log(price);

	let data = await fetch("/api/shop/post", {
		method: "POST",
		mode: "same-origin",
		body: formData,
		headers: {
			"CSRF-Token": csrfToken
		}
	});
	data = await data.json();

	if (data.err === true) {
		let alert = createAlertNode(data.message, "warning");
		addAlert(alert, "#header");
	} else window.location.href = data.url;
}

async function patchShop(e, shopId) {
	e.preventDefault();
	let title = $("#title").val(),
		content = $("#content").val(),
		price = parseFloat($("#price").val()),
		img = document.querySelector("#img"),
		formData = new FormData();

	for (let i = 0; i < img.files.length; i++) formData.append("img", img.files[parseInt(i)]);

	formData.append("title", title);
	formData.append("content", content);
	formData.append("price", price);

	let data = await fetch(`/api/shop/patch/${shopId}`, {
		method: "POST",
		mode: "same-origin",
		body: formData,
		headers: {
			"CSRF-Token": csrfToken
		}
	});
	data = await data.json();

	if (data.err === true) {
		let alert = createAlertNode(data.message, "warning");
		addAlert(alert, "#header");
	} else window.location.href = data.url;
}

async function setMain(e, item) {
	e.preventDefault();

	let data = await fetch(item.href, {
		method: "POST",
		mode: "same-origin",
		headers: {
			"CSRF-Token": csrfToken
		}
	});
	data = await data.json();

	let type = "success";
	if (data.err === true) type = "warning";
	else {
		let divs = document.querySelectorAll(".action-div");
		for (let i = 0; i < divs.length; i++) divs[parseInt(i)].classList.remove("nodisplay");

		document.querySelector(`#actDiv${item.id.substr(3)}`).classList.add("nodisplay");
	}

	let alert = createAlertNode(data.message, type);
	addAlert(alert, "#header");
}

async function deleteImage(e, item) {
	e.preventDefault();

	let data = await fetch(item.href, {
		method: "POST",
		mode: "same-origin",
		headers: {
			"CSRF-Token": csrfToken
		}
	});
	data = await data.json();

	let type = "success";
	if (data.err === true) type = "warning";
	else {
		$(`#${item.id.substr(3)}`).remove();
		$(`#sel${item.id.substr(3)}`).remove();
		item.remove();
	}

	let alert = createAlertNode(data.message, type);
	addAlert(alert, "#header");
}
