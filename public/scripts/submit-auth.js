const signUpButton = document.getElementById("signUp");
const signInButton = document.getElementById("signIn");
const container = document.getElementById("container");
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
let lostpw = document.querySelector("[data-lostpw]");
let log = document.querySelector("[data-sublogin]");
let reg = document.querySelector("[data-subreg]");

// Cache selectors
var topMenu = $("#top-menu"),
    topMenuHeight = topMenu.outerHeight()+15,
    // All list items
    menuItems = topMenu.find("a"),
    // Anchors corresponding to menu items
    scrollItems = menuItems.map(function(){
      var item = $($(this).attr("href"));
      if (item.length) { return item; }
    });

// Bind to scroll
$(window).scroll(function(){
   // Get container scroll position
   var fromTop = $(this).scrollTop()+topMenuHeight;

   // Get id of current scroll item
   var cur = scrollItems.map(function(){
     if ($(this).offset().top < fromTop)
       return this;
   });
   // Get the id of the current element
   cur = cur[cur.length-1];
   var id = cur && cur.length ? cur[0].id : "";

   // Set/remove active class
	 menuItems
     .removeClass("active")
     .filter("[href='#"+id+"']").addClass("active");

     if($(window).scrollTop() + $(window).height() == $(document).height()) {
       menuItems.removeClass("active")
       menuItems[menuItems.length - 1].classList.add("active");
     }
});

if (lostpw)
	lostpw.addEventListener("submit", function (e) {
		submitLostpw(e);
	});

if (log)
	log.addEventListener("submit", function (e) {
		submitLogin(e);
	});

if (reg)
	reg.addEventListener("submit", function (e) {
		submitRegister(e);
	});

var CaptchaCallback = function () {
	const captchaDiv = document.querySelectorAll(".recaptcha-wrapper");
	captchaDiv.forEach(item => {
		grecaptcha.render(item, { sitekey: "6LdiD7oZAAAAAIMXlnCVHOjQQ7UqvLl8vUtaMMA9" });
	});
};

/*
signUpButton.addEventListener("click", () => {
	container.classList.add("right-panel-active");
});
signInButton.addEventListener("click", () => {
	container.classList.remove("right-panel-active");
});*/

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
	if (response.error === false) return (window.location.href = "/Login");

	let alert = createAlertNode(response.message, "warning");
	addAlert(alert, "#header");
}
