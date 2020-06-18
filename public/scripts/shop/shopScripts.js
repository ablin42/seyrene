async function postShop(e) {
	e.preventDefault();
	let title = $("#title").val(),
		content = $("#content").val(),
		price = $("#price").val(),
		isUnique = $("#isUnique").is(":checked"),
		img = document.querySelector("#img"),
		formData = new FormData();

	for (let i = 0; i < img.files.length; i++) formData.append("img", img.files[i]);

	formData.append("title", title);
	formData.append("content", content);
	formData.append("price", price);
	formData.append("isUnique", isUnique);

	fetch("/api/shop/post", {
		method: "post",
		mode: "same-origin",
		body: formData
	})
		.then(response => response.json())
		.then(data => {
			if (data.err) {
				let alert = createAlertNode(data.msg, "warning");
				addAlert(alert, "#header");
			} else window.location.href = data.url;
		});
}

async function patchShop(e, shopId) {
	e.preventDefault();
	let title = $("#title").val(),
		content = $("#content").val(),
		price = $("#price").val(),
		isUnique = $("#isUnique").is(":checked"),
		img = document.querySelector("#img"),
		formData = new FormData();

	for (let i = 0; i < img.files.length; i++) formData.append("img", img.files[i]);

	formData.append("title", title);
	formData.append("content", content);
	formData.append("price", price);
	formData.append("isUnique", isUnique);

	fetch(`/api/shop/patch/${shopId}`, {
		method: "post",
		mode: "same-origin",
		body: formData
	})
		.then(response => response.json())
		.then(data => {
			if (data.err) {
				let alert = createAlertNode(data.msg, "warning");
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
				console.log(divs);
				for (let i = 0; i < divs.length; i++) {
					divs[i].setAttribute("style", "display: block");
				}
				$(`#actDiv${item.id.substr(3)}`).attr("style", "display: none");
			}
			let alertErr = `
            <div id="alert" class="alert alert-${type}" role="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                ${data.msg}
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
			if (data.err === true) {
				let alertErr = `
            <div id="alert" class="alert alert-warning" role="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                ${data.msg}
            </div>`;
				addAlert(alertErr, "#header");
			} else {
				$(`#${item.id.substr(3)}`).remove();
				$(`#sel${item.id.substr(3)}`).remove();
				item.remove();

				let alertSuccess = `
				<div id="alert" class="alert alert-success" role="alert">
					<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
					${data.msg}
				</div>`;
				addAlert(alertSuccess, "#header");
			}
		});
}

function openTab(btn, tabName) {
	let tab = document.getElementsByClassName("tab");
	let buttons = document.getElementsByClassName("tab-btn");

	for (let i = 0; i < buttons.length; i++) buttons[i].classList.remove("active");

	btn.classList.add("active");

	for (let i = 0; i < tab.length; i++) tab[i].style.display = "none";

	document.getElementById(tabName).style.display = "grid";
	document.getElementById("infinitebtn").setAttribute("onclick", `infiniteShopItems("${tabName}");`);
	document.getElementById("infinitebtn").setAttribute("value", "Load More");
	document.getElementById("infinitebtn").removeAttribute("disabled");
}
