function submitContact(e) {
	e.preventDefault();

	const name = document.querySelector("#name").value;
	const email = document.querySelector("#email").value;
	const title = document.querySelector("#title").value;
	const content = document.querySelector("#content").value;
	const captcha = document.querySelector("#g-recaptcha-response").value;

	fetch("/api/contact/", {
		method: "POST",
		headers: {
			"Accept": "application/json, text/plain, */*",
			"Content-Type": "application/json"
		},
		body: JSON.stringify({name: name, email: email, title: title, content: content, captcha: captcha})
	})
		.then((res) => res.json())
		.then((response) => {
			let alertType = "success";
			if (response.error === true)
				alertType = "warning";
			else {
				document.querySelector("#name").value = "";
				document.querySelector("#email").value = "";
				document.querySelector("#title").value = "";
				document.querySelector("#content").value = "";
			}

			let alert = createAlertNode(response.message, alertType);
			addAlert(alert, "#header");
		})
		.catch(err => {
			let alert = createAlertNode(err.message, "danger");
			addAlert(alert, "#header");
		});
}