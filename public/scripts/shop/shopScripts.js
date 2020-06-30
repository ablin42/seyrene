const csrfToken = document.querySelector("meta[name=\"csrf-token\"]").getAttribute("content");

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
		price = $("#price").val(),
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
		for (let i = 0; i < divs.length; i++) divs[parseInt(i)].setAttribute("style", "display: block");

		$(`#actDiv${item.id.substr(3)}`).attr("style", "display: none");
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

	let alertSuccess = `
				<div id="alert" class="alert alert-${type}" role="alert">
					<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
					${data.message}
				</div>`;
	addAlert(alertSuccess, "#header");
}
