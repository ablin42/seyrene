let inputFile = document.querySelectorAll(".inputfile");
let form = document.querySelector("#bio");

if (form)
	form.addEventListener("submit", function (e) {
		postBio(e);
	});

inputFile.forEach(input => {
	input.addEventListener("change", function () {
		readURL(input);
	});
});

async function postBio(e) {
	e.preventDefault();

	const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
	let formData = new FormData();
	let img = document.querySelector("#img");
	formData.append("img", img.files[0]);

	let data = await fetch("/api/front/bio", {
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
	} else {
		let alert = createAlertNode(data.message, "success");
		addAlert(alert, "#header");
	}
}
