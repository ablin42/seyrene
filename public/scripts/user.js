const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
let geo = document.querySelector("[data-geolocate]");

// Cache selectors
var topMenu = $("#top-menu"),
	topMenuHeight = topMenu.outerHeight() + 15,
	// All list items
	menuItems = topMenu.find("a"),
	// Anchors corresponding to menu items
	scrollItems = menuItems.map(function () {
		var item = $($(this).attr("href"));
		if (item.length) {
			return item;
		}
	});

// Bind to scroll
$(window).scroll(function () {
	// Get container scroll position
	var fromTop = $(this).scrollTop() + topMenuHeight;

	// Get id of current scroll item
	var cur = scrollItems.map(function () {
		if ($(this).offset().top < fromTop) return this;
	});
	// Get the id of the current element
	cur = cur[cur.length - 1];
	var id = cur && cur.length ? cur[0].id : "";

	// Set/remove active class
	menuItems
		.removeClass("active")
		.filter("[href='#" + id + "']")
		.addClass("active");

	if ($(window).scrollTop() + $(window).height() == $(document).height()) {
		menuItems.removeClass("active");
		menuItems[menuItems.length - 1].classList.add("active");
	}
});

if (geo)
	geo.addEventListener("focus", function () {
		geolocate();
	});

$(".cancelbtn").on("click", function () {
	confirmDeletion($(".cancelbtn").data("id"));
});

let nameform = document.querySelector("#nameform");
if (nameform)
	nameform.addEventListener("submit", function (e) {
		patchName(event);
	});

async function patchName(e) {
	e.preventDefault();

	let obj = {
		name: document.querySelector("#name").value
	};

	let response = await fetch(`/api/user/patch/name`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify(obj),
		credentials: "include",
		mode: "same-origin"
	});
	response = await response.json();

	let alertType = "success";
	if (response.error === true) alertType = "warning";

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
	return;
}

let emailform = document.querySelector("#emailform");
if (emailform)
	emailform.addEventListener("submit", function (e) {
		patchEmail(event);
	});

async function patchEmail(e) {
	e.preventDefault();

	let obj = {
		email: document.querySelector("#email").value
	};

	let response = await fetch(`/api/user/patch/email`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify(obj),
		credentials: "include",
		mode: "same-origin"
	});
	response = await response.json();

	let alertType = "success";
	if (response.error === true) alertType = "warning";

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
	return;
}

let passwordform = document.querySelector("#passwordform");
if (passwordform)
	passwordform.addEventListener("submit", function (e) {
		patchPassword(event);
	});

async function patchPassword(e) {
	e.preventDefault();

	let obj = {
		cpassword: document.querySelector("#cpassword").value,
		password: document.querySelector("#password").value,
		password2: document.querySelector("#password2").value
	};

	let response = await fetch(`/api/user/patch/password`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify(obj),
		credentials: "include",
		mode: "same-origin"
	});
	response = await response.json();

	let alertType = "success";
	if (response.error === true) alertType = "warning";

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
	return;
}

let deliveryform = document.querySelector("#deliveryform");
if (deliveryform)
	deliveryform.addEventListener("submit", function (e) {
		patchDelivery(event);
	});

async function patchDelivery(e) {
	e.preventDefault();

	let obj = {
		"firstname": document.querySelector("#firstname").value,
		"lastname": document.querySelector("#lastname").value,
		"fulltext_address": document.querySelector("#autocomplete").value,
		"street_name": document.querySelector("#route").value,
		"city": document.querySelector("#locality").value,
		"state": document.querySelector("#administrative_area_level_1").value,
		"zipcode": document.querySelector("#postal_code").value,
		"country": document.querySelector("#country").value,
		"country-iso": document.querySelector("#country-iso").value,
		"instructions": document.querySelector("#instructions").value
	};

	let response = await fetch("/api/user/patch/delivery-info", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify(obj)
	});
	response = await response.json();

	let alertType = "success";
	if (response.error === true) alertType = "warning";

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
	return;
}

function closeDialog() {
	if ($("#alert-dialog").length !== 0) {
		$("#alert-dialog").parent().css("opacity", 0);
		setTimeout(() => {
			$("#alert-dialog").parent().remove();
			$("#alert-dialog").remove();
		}, 300);
	}
	return;
}

function abortAction() {
	closeDialog();
	return;
}

async function deleteAcc(userId) {
	closeDialog();

	let response = await fetch(`/api/user/delete/${userId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"CSRF-Token": csrfToken
		},
		credentials: "include",
		mode: "same-origin"
	});
	response = await response.json();

	let alertType = "success";
	if (response.error === true) alertType = "warning";

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
	return;
}

function confirmDeletion(userId) {
	if ($("#alert-dialog").length === 0) {
		$("body").append(`<div id="alert-dialog" class="alert-dialog"> \
							<h3><b>DELETE</b> your ACCOUNT</h3><span>This action cannot be reversed</span> \
							<button class="tab-btn del-acc">Delete</button><button class="tab-btn abort-btn">Abort</button> \
						</div>`);
		$("#alert-dialog").wrap('<div class="dialog-wrapper"></div>');
		$(".dialog-wrapper").on("click", function () {
			closeDialog();
		});
		$(".abort-btn").on("click", function () {
			abortAction();
		});
		$(".del-acc").on("click", function () {
			deleteAcc(userId);
		});

		setTimeout(() => {
			$("#alert-dialog").parent().css("background-color", "rgba(17,17,17, 0.2)");
			$("#alert-dialog").parent().css("opacity", "1");
		}, 100);
	}
}
