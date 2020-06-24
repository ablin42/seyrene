async function postShop(e) {
	e.preventDefault();
	let title = $("#title").val(),
		content = $("#content").val(),
		price = $("#price").val(),
		img = document.querySelector("#img"),
		formData = new FormData();

	for (let i = 0; i < img.files.length; i++) formData.append("img", img.files[i]);

	formData.append("title", title);
	formData.append("content", content);
	formData.append("price", price);

	fetch("/api/shop/post", {
		method: "post",
		mode: "same-origin",
		body: formData
	})
		.then(response => response.json())
		.then(data => {
			if (data.err === true) {
				let alert = createAlertNode(data.message, "warning");
				addAlert(alert, "#header");
			} else window.location.href = data.url;
		});
}

async function patchShop(e, shopId) {
	e.preventDefault();
	let title = $("#title").val(),
		content = $("#content").val(),
		price = $("#price").val(),
		img = document.querySelector("#img"),
		formData = new FormData();

	for (let i = 0; i < img.files.length; i++) formData.append("img", img.files[i]);

	formData.append("title", title);
	formData.append("content", content);
	formData.append("price", price);

	fetch(`/api/shop/patch/${shopId}`, {
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

			let alertSuccess = `
				<div id="alert" class="alert alert-${type}" role="alert">
					<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
					${data.message}
				</div>`;
			addAlert(alertSuccess, "#header");
		});
}
