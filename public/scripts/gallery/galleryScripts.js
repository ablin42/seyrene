if (typeof csrfToken !== "string") csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
let inputFile = document.querySelectorAll(".inputfile");
let delbtn = document.querySelectorAll("a[data-del]");
let selbtn = document.querySelectorAll("a[data-sel]");
let patchgal = document.querySelector("form[data-patchgal]");
let togglable = document.querySelectorAll("[data-classname]");
let pwintyCat = document.querySelectorAll(".pwinty-input");
let addbtn = document.querySelector("[data-addpwinty]");
let postGal = document.querySelector("form[data-postgal]");

if (postGal)
	postGal.addEventListener("submit", function (e) {
		postGallery(e);
	});

if (addbtn)
	addbtn.addEventListener("click", function () {
		Pwinty.cartAdd(addbtn.dataset.addpwinty, addbtn);
	});

togglable.forEach(item => {
	item.addEventListener("click", function () {
		toggleActive(item, item.dataset.classname);
	});
});

pwintyCat.forEach(item => {
	item.addEventListener("click", function () {
		loadCategory(item);
	});
});

if (patchgal)
	patchgal.addEventListener("submit", function (e) {
		patchGallery(e, document.querySelector("form[data-patchgal]").dataset.id);
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

async function postGallery(e) {
	e.preventDefault();
	let tagInput = document.getElementsByClassName("label-info"),
		title = document.querySelector("#title").value,
		content = document.querySelector("#content").value,
		img = document.querySelector("#img"),
		imgUrl = document.querySelector("#imgUrl").value,
		formData = new FormData(),
		tags = [];

	for (let i = 0; i < tagInput.length; i++) tags.push(tagInput[parseInt(i)].textContent);

	for (let i = 0; i < img.files.length; i++) formData.append("img", img.files[parseInt(i)]);

	formData.append("title", title);
	formData.append("content", content);
	formData.append("tags", tags);
	//formData.append("imgUrl", imgUrl);

	let data = await fetch("/api/gallery/post", {
		method: "POST",
		mode: "same-origin",
		body: formData, //JSON.stringify({ title, content, tags, imgUrl }),
		headers: {
			//"Content-Type": "application/json",
			//"Accept": "application/json",
			"CSRF-Token": csrfToken
		}
	});
	data = await data.json();
	console.log(data);

	if (data.err == true) {
		let alert = createAlertNode(data.message, "warning");
		addAlert(alert, "#header");
	} //else window.location.href = data.url;
}

async function patchGallery(e, galleryId) {
	e.preventDefault();
	let tagInput = document.getElementsByClassName("label-info"),
		title = document.querySelector("#title").value,
		content = document.querySelector("#content").value,
		img = document.querySelector("#img"),
		formData = new FormData(),
		tags = [];

	for (let i = 0; i < tagInput.length; i++) tags.push(tagInput[parseInt(i)].textContent);

	for (let i = 0; i < img.files.length; i++) formData.append("img", img.files[parseInt(i)]);

	formData.append("title", title);
	formData.append("content", content);
	formData.append("tags", JSON.stringify(tags));

	let data = await fetch(`/api/gallery/patch/${galleryId}`, {
		method: "POST",
		mode: "same-origin",
		body: formData,
		headers: {
			"CSRF-Token": csrfToken
		}
	});
	data = await data.json();

	if (data.err) {
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
		let divs = $(".action-div");
		for (let i = 0; i < divs.length; i++) divs[parseInt(i)].classList.remove("nodisplay");

		document.querySelector(`#actDiv${item.id.substr(3)}`).classList.add("nodisplay");
	}
	let alertErr = `
				<div id="alert" class="alert alert-${type}" role="alert">
					<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
					${data.message}
				</div>`;
	addAlert(alertErr, "#header");
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
	let alert = `
			<div id="alert" class="alert alert-${type}" role="alert">
				<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
				${data.message}
			</div>`;
	addAlert(alert, "#header");
}

function toggleActive(item, className) {
	document.querySelectorAll(`.${className}`).forEach(obj => {
		obj.classList.remove(`${className}`);
	});

	item.classList.add(`${className}`);
}
