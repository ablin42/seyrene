/*(() => {
	document.getElementById("img").onchange = () => {
		const files = document.getElementById("img").files;

		for (i = 0; i < files.length; i++) {
			if (files[i] == null) {
				let alert = createAlertNode("One or more files can't be read!", "warning");
				addAlert(alert, "#header");
				return;
			}

			getSignedRequest(files[i]);
		}
	};
})();

async function getSignedRequest(file) {
	let response = await fetch(`/api/image/sign-s3?file-name=${file.name}&file-type=${file.type}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		credentials: "include",
		mode: "same-origin"
	});
	response = await response.json();

	if (response.error === true) {
		let alert = createAlertNode(response.message, "warning");
		addAlert(alert, "#header");
		return;
	} else uploadFile(file, response.data.signedRequest, response.data.url);
}

//fire this function when clicking submit? fire this function from back-end after img verif ?
//file isnt checked before being sent
async function uploadFile(file, signedRequest, url) {
	let response = await fetch(signedRequest, {
		method: "PUT",
		body: file
	});

	if (response.status != 200 || response.ok != true) {
		let alert = createAlertNode("Could not upload file", "warning");
		addAlert(alert, "#header");
		return;
	}
	document.getElementById("imgUrl").value += url + ";";
}
*/
