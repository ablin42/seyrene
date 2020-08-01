let dstring = document.querySelectorAll("[data-vstring]");
let demail = document.querySelectorAll("input[data-vemail]");
let dpw = document.querySelectorAll("input[data-vpw]");
let dpw2 = document.querySelectorAll("input[data-vpw2]");

if (dstring)
	dstring.forEach(item => {
		item.addEventListener("keyup", function () {
			let val = item.dataset.vstring.split(";");
			Validate.String(item, val[0], val[1]);
		});
	});

if (demail)
	demail.forEach(item => {
		item.addEventListener("keyup", function () {
			Validate.Email(item);
		});
	});

if (dpw)
	dpw.forEach(item => {
		item.addEventListener("keyup", function () {
			Validate.Password(item);
		});
	});

if (dpw2)
	dpw2.forEach(item => {
		item.addEventListener("keyup", function () {
			Validate.Password2(item);
		});
	});

function getInvalid(formId) {
	let submitId = "submit-" + formId,
		submit = document.getElementById(submitId),
		form = $(`#${formId}`),
		invalids = form.find(".invalid");

	submit.removeAttribute("disabled");
	if (invalids.length > 0) submit.setAttribute("disabled", "");
	return;
}

let Validate = {
	String: function (item, min, max = 10000000) {
		let inputId = item.id,
			spanInfo = document.getElementById(`i_${inputId}`),
			formId = item.form.id;

		if (item.value.length !== 0 && (item.value.length < min || item.value.length > max)) {
			spanInfo.style.display = "inline-block";
			item.classList.add("invalid");
		} else if (item.value.length >= min || item.value.length <= max) {
			spanInfo.style.display = "none";
			item.classList.remove("invalid");
			item.classList.add("valid");
		} else {
			spanInfo.style.display = "none";
			item.classList.remove("invalid");
			item.classList.remove("valid");
		}
		getInvalid(formId);
	},
	Email: function (email) {
		let inputId = email.id,
			spanInfo = document.getElementById(`i_${inputId}`),
			formId = email.form.id;

		if (email.value.length !== 0 && (email.value.length < 3 || email.value.length > 256)) {
			spanInfo.style.display = "inline-block";
			email.classList.add("invalid");
		} else if (email.value.length !== 0) {
			if (
				/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
					email.value
				)
			) {
				spanInfo.style.display = "none";
				email.classList.remove("invalid");
				email.classList.add("valid");
			} else {
				spanInfo.style.display = "inline-block";
				email.classList.add("invalid");
			}
		} else {
			spanInfo.style.display = "none";
			email.classList.remove("invalid");
			email.classList.remove("valid");
		}
		getInvalid(formId);
	},
	Password: function (password) {
		let inputId = password.id,
			spanInfo = document.getElementById(`i_${inputId}`),
			password2 = document.getElementById(`${inputId}2`),
			formId = password.form.id;

		if (
			password.value.length > 0 &&
			(password.value.length > 256 ||
				!/^(((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(.{8,})/.test(password.value))
		) {
			spanInfo.style.display = "inline-block";
			password.classList.add("invalid");
		} else if (password.value.length !== 0) {
			spanInfo.style.display = "none";
			password.classList.remove("invalid");
			password.classList.add("valid");
		} else {
			spanInfo.style.display = "none";
			password.classList.remove("invalid");
			password.classList.remove("valid");
		}
		this.Password2(password2);
		getInvalid(formId);
	},
	Password2: function (password2) {
		let inputId = password2.id,
			spanInfo = document.getElementById(`i_${inputId}`),
			formId = password2.form.id,
			password = document.getElementById("password");

		if (password2.value.length !== 0 && password.value !== password2.value) {
			spanInfo.style.display = "inline-block";
			password2.classList.add("invalid");
		} else if (password2.value.length !== 0) {
			spanInfo.style.display = "none";
			password2.classList.remove("invalid");
			password2.classList.add("valid");
		} else {
			spanInfo.style.display = "none";
			password2.classList.remove("invalid");
			password2.classList.remove("valid");
		}
		getInvalid(formId);
	}
};

function readURL(input) {
	if (input.files && input.files[0]) {
		$("#imglabel").addClass("imguploaded");
	} else {
		$("#imglabel").removeClass("imguploaded");
	}
}
