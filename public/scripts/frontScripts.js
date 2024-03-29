const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
let delbtn = document.querySelectorAll(".delbtn");
let inputFile = document.querySelectorAll(".inputfile");
let forms = document.querySelectorAll(".front-form");

delbtn.forEach(btn => {
	btn.addEventListener("click", function (e) {
		deleteImage(btn, e);
	});
});

inputFile.forEach(input => {
	input.addEventListener("change", function () {
		readURL(input);
	});
});

forms.forEach(form => {
	form.addEventListener("submit", function (e) {
		postFront(e, form);
	});
});

window.onload = function () {
	for (let i = 0; i < 5; i++) {
		let src = $(`#image${i}`)[0].getAttribute("data-uploaded");
		if (src == "true") {
			document.querySelector(`#uploadGroup${i}`).classList.add("nodisplay");
		}
	}
};

async function deleteImage(item, e) {
	e.preventDefault();

	let imageItemId = "image" + item.id.substr(6, 1);
	let imageItem = document.getElementById(imageItemId);

	removeItem(imageItem);
	removeItem(item);
	let groupId = document.querySelector("#uploadGroup" + item.id.substr(6, 1));
	let uploadBtnId = document.querySelector("#uploadbtn" + item.id.substr(6, 1));
	uploadBtnId.classList.add("nodisplay");
	groupId.classList.remove("nodisplay");

	if (imageItem.getAttribute("data-uploaded") === "true") {
		let data = await fetch(`/api/front/delete/${item.id.substr(6, 1)}`, {
			method: "POST",
			mode: "same-origin",
			headers: {
				"CSRF-Token": csrfToken
			}
		});

		data = await data.json();
		let alertType = "success";
		if (data.error === true) alertType = "warning";

		let alert = createAlertNode(data.message, alertType);
		addAlert(alert, "#header");
	} else {
		let alert = createAlertNode(ERROR_MESSAGE.itemDeleted, "success");
		addAlert(alert, "#header");
	}
}

function removeItem(item) {
	item.classList.add("nodisplay");
	item.src = "";
}

function readURL(input) {
	let targetImgId = "#image" + input.id.substr(6, 1);
	let targetBtnId = "#uploadGroup" + input.id.substr(6, 1);
	let targetDeleteId = "#delete" + input.id.substr(6, 1);
	let targetUploadId = "#uploadbtn" + input.id.substr(6, 1);
	if (input.files && input.files[0]) {
		let reader = new FileReader();

		reader.onload = function (e) {
			$(targetImgId).attr("src", e.target.result);
			$(targetImgId).attr("data-uploaded", "false");
			document.querySelector(targetImgId).classList.remove("nodisplay");
			document.querySelector(targetDeleteId).classList.remove("nodisplay");
			document.querySelector(targetUploadId).classList.remove("nodisplay");
			document.querySelector(targetBtnId).classList.remove("nodisplay");
		};
		reader.readAsDataURL(input.files[0]);
	}
}

async function postFront(e, form) {
	e.preventDefault();

	let formData = new FormData();
	formData.append("img", form.querySelector('input[type="file"]').files[0]);
	formData.append("referenceId", form.querySelector('input[name="referenceId"]').value);

	let data = await fetch("/api/front/post", {
		method: "POST",
		mode: "same-origin",
		body: formData,
		headers: {
			"CSRF-Token": csrfToken
		}
	});
	data = await data.json();

	let alertType = "success";
	if (data.err === true || data.error === true) alertType = "warning";

	let alert = createAlertNode(data.message, alertType);
	addAlert(alert, "#header");
}
