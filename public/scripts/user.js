const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
let geo = document.querySelector("[data-geolocate]");

if (geo)
	geo.addEventListener("focus", function () {
		geolocate();
	});

$(".cancelbtn").on("click", function () {
	confirmDeletion($(".cancelbtn").data("id"));
});

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
