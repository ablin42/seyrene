const signUpButton = document.getElementById("signUp");
const signInButton = document.getElementById("signIn");
const container = document.getElementById("container");
const csrfToken = document.querySelector("meta[name=\"csrf-token\"]").getAttribute("content");

var CaptchaCallback = function () {
	const captchaDiv = document.querySelectorAll(".recaptcha-wrapper");
	captchaDiv.forEach(item => {
		grecaptcha.render(item, { sitekey: "6Ld8MaUZAAAAAOCR-6L6VcBgFJyBhFWWLnHPInJ9" });
	});
};

signUpButton.addEventListener("click", () => {
	container.classList.add("right-panel-active");
});
signInButton.addEventListener("click", () => {
	container.classList.remove("right-panel-active");
});

async function submitRegister(e) {
	e.preventDefault();

	const name = document.querySelector("#name").value;
	const email = document.querySelector("#email").value;
	const password = document.querySelector("#password").value;
	const password2 = document.querySelector("#password2").value;
	const captcha = grecaptcha.getResponse(0);

	let response = await fetch("/api/auth/register", {
		method: "POST",
		headers: {
			"Accept": "application/json, text/plain, */*",
			"Content-Type": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify({ name: name, email: email, password: password, password2: password2, captcha: captcha })
	});
	response = await response.json();

	let alertType = "success";
	if (response.error === true) alertType = "warning";
	else {
		document.querySelector("#name").value = "";
		document.querySelector("#email").value = "";
		document.querySelector("#password").value = "";
		document.querySelector("#password2").value = "";
		signInButton.click();
	}

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
}

async function submitLogin(e) {
	e.preventDefault();

	const email = document.querySelector("#login-email").value;
	const password = document.querySelector("#login-pw").value;
	const captcha = grecaptcha.getResponse(1);

	let response = await fetch("/api/auth/login", {
		method: "POST",
		headers: {
			"Accept": "application/json, text/plain, */*",
			"Content-Type": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify({ email: email, password: password, captcha: captcha })
	});
	response = await response.json();

	if (response.error === false) return (window.location.href = "/");

	let alert = createAlertNode(response.message, "warning");
	addAlert(alert, "#header");
}

async function submitLostpw(e) {
	e.preventDefault();

	const email = document.querySelector("#email-reset").value;
	const captcha = grecaptcha.getResponse(2);

	let response = await fetch("/api/user/lostpw", {
		method: "POST",
		headers: {
			"Accept": "application/json, text/plain, */*",
			"Content-Type": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify({ email: email, captcha: captcha })
	});
	response = await response.json();
	console.log(response);

	if (response.error === false) return (window.location.href = "/");

	let alert = createAlertNode(response.message, "warning");
	addAlert(alert, "#header");
}
