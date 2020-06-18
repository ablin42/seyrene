const signUpButton = document.getElementById("signUp");
const signInButton = document.getElementById("signIn");
const container = document.getElementById("container");

signUpButton.addEventListener("click", () => {
	container.classList.add("right-panel-active");
});
signInButton.addEventListener("click", () => {
	container.classList.remove("right-panel-active");
});

function submitRegister(e) {
	e.preventDefault();

	const name = document.querySelector("#name").value;
	const email = document.querySelector("#email").value;
	const password = document.querySelector("#password").value;
	const password2 = document.querySelector("#password2").value;
	const captcha = document.querySelector("#g-recaptcha-response").value;

	fetch("/api/auth/register", {
		method: "POST",
		headers: {
			"Accept": "application/json, text/plain, */*",
			"Content-Type": "application/json"
		},
		body: JSON.stringify({name: name, email: email, password: password, password2: password2, captcha: captcha})
	})
		.then((res) => res.json())
		.then((response) => {
			let alertType = "success";
			if (response.error === true)
				alertType = "warning";
			else {
				document.querySelector("#name").value = "";
				document.querySelector("#email").value = "";
				document.querySelector("#password").value = "";
				document.querySelector("#password2").value = "";
				signInButton.click();
			}

			let alert = createAlertNode(response.message, alertType);
			addAlert(alert, "#header");
		})
		.catch(err => {
			let alert = createAlertNode(err.message, "danger");
			addAlert(alert, "#header");
		});
}