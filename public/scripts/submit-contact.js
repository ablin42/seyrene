const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
let form = document.querySelector("#contact");

let callToGallery = document.querySelector("#goto-gallery");

if (callToGallery)
	callToGallery.addEventListener("click", function () {
		window.location.href = "/Galerie";
	});

if (form)
	form.addEventListener("submit", function (e) {
		submitContact(e);
	});

async function submitContact(e) {
	e.preventDefault();

	const name = document.querySelector("#name").value;
	const email = document.querySelector("#email").value;
	const title = document.querySelector("#title").value;
	const content = document.querySelector("#content").value;
	const captcha = document.querySelector("#g-recaptcha-response").value;

	let response = await fetch("/api/contact/", {
		method: "POST",
		headers: {
			"Accept": "application/json, text/plain, */*",
			"Content-Type": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify({ name: name, email: email, title: title, content: content, captcha: captcha })
	});
	response = await response.json();

	let alertType = "success";
	if (response.error === true) alertType = "warning";
	else {
		document.querySelector("#name").value = "";
		document.querySelector("#email").value = "";
		document.querySelector("#title").value = "";
		document.querySelector("#content").value = "";
	}

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
}
