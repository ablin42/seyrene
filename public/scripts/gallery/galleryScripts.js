if (typeof csrfToken === "undefined") var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
let inputFile = document.querySelectorAll(".inputfile");
let delbtn = document.querySelectorAll("a[data-del]");
let selbtn = document.querySelectorAll("a[data-sel]");

document.querySelector("form[data-patchgal]").addEventListener("submit", function (e) {
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
		title = $("#title").val(),
		content = $("#content").val(),
		img = document.querySelector("#img"),
		formData = new FormData(),
		tags = [];

	for (let i = 0; i < tagInput.length; i++) tags.push(tagInput[parseInt(i)].textContent);

	for (let i = 0; i < img.files.length; i++) formData.append("img", img.files[parseInt(i)]);

	formData.append("title", title);
	formData.append("content", content);
	formData.append("tags", JSON.stringify(tags));

	let data = await fetch("/api/gallery/post", {
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

async function patchGallery(e, galleryId) {
	e.preventDefault();
	let tagInput = document.getElementsByClassName("label-info"),
		title = $("#title").val(),
		content = $("#content").val(),
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
