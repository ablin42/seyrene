async function postGallery(e) {
	e.preventDefault();
	let tagInput = document.getElementsByClassName("label-info"),
		title = $("#title").val(),
		content = $("#content").val(),
		img = document.querySelector("#img"),
		formData = new FormData(),
		tags = [];

	for (let i = 0; i < tagInput.length; i++) tags.push(tagInput[i].textContent);

	for (let i = 0; i < img.files.length; i++) formData.append("img", img.files[i]);

	formData.append("title", title);
	formData.append("content", content);
	formData.append("tags", JSON.stringify(tags));

	fetch("/api/gallery/post", {
		method: "post",
		mode: "same-origin",
		body: formData
	})
		.then(response => response.json())
		.then(data => {
			if (data.err) {
				let alert = createAlertNode(data.message, "warning");
				addAlert(alert, "#header");
			} else window.location.href = data.url;
		});
}

async function patchGallery(e, galleryId) {
	e.preventDefault();
	let tagInput = document.getElementsByClassName("label-info"),
		title = $("#title").val(),
		content = $("#content").val(),
		img = document.querySelector("#img"),
		formData = new FormData(),
		tags = [];

	for (let i = 0; i < tagInput.length; i++) tags.push(tagInput[i].textContent);

	for (let i = 0; i < img.files.length; i++) formData.append("img", img.files[i]);

	formData.append("title", title);
	formData.append("content", content);
	formData.append("tags", JSON.stringify(tags));

	fetch(`/api/gallery/patch/${galleryId}`, {
		method: "post",
		mode: "same-origin",
		body: formData
	})
		.then(response => response.json())
		.then(data => {
			if (data.err) {
				let alert = createAlertNode(data.message, "warning");
				addAlert(alert, "#header");
			} else window.location.href = data.url;
		});
}

function setMain(e, item) {
	e.preventDefault();

	fetch(item.href, {
		method: "get",
		mode: "same-origin"
	})
		.then(response => response.json())
		.then(data => {
			let type = "success";
			if (data.err === true) type = "warning";
			else {
				let divs = $(".action-div");
				for (let i = 0; i < divs.length; i++) divs[i].setAttribute("style", "display: block");

				$(`#actDiv${item.id.substr(3)}`).attr("style", "display: none");
			}
			let alertErr = `
				<div id="alert" class="alert alert-${type}" role="alert">
					<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
					${data.message}
				</div>`;
			addAlert(alertErr, "#header");
		});
}

function deleteImage(e, item) {
	e.preventDefault();
	fetch(item.href, {
		method: "get",
		mode: "same-origin"
	})
		.then(response => response.json())
		.then(data => {
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
		});
}
