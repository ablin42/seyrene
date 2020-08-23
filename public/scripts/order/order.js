const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
let cancelEN = $("[data-cancelbtn]");

$(".completebtn").on("click", function () {
	completeOrder($(".completebtn").data("id"));
});
$(".cancelbtn").on("click", function () {
	cancelOrder($(".cancelbtn").data("id"));
});

if (cancelEN) {
	cancelEN.prop("onclick", null).off("click");
	cancelEN.on("click", function () {
		cancelOrderEN($(".cancelbtn").data("id"));
	});
}

$(".approvebtn").on("click", function () {
	approveOrder($(".approvebtn").data("id"));
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

async function confirmDelete(orderId) {
	closeDialog();
	let response = await fetch(`/api/order/cancel/${orderId}`, {
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

function abortAction() {
	closeDialog();
	return;
}

async function confirmApproval(orderId) {
	closeDialog();
	let response = await fetch(`/api/order/approve/${orderId}`, {
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

async function confirmCompletion(orderId) {
	closeDialog();
	let response = await fetch(`/api/order/complete/${orderId}`, {
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

async function cancelOrder(orderId) {
	if ($("#alert-dialog").length === 0) {
		$("body").append(`<div id="alert-dialog" class="alert-dialog"> \
                        <h3><b>ANNULER</b> la commande</h3><span>Cette action est irréversible</span> \
                        <button class="tab-btn confirm-delete">Confirmer</button><button class="tab-btn abort-btn">Annuler</button> \
                      </div>`);
		$("#alert-dialog").wrap('<div class="dialog-wrapper"></div>');
		$(".dialog-wrapper").on("click", function () {
			closeDialog();
		});
		$(".abort-btn").on("click", function () {
			abortAction();
		});
		$(".confirm-delete").on("click", function () {
			confirmDelete(orderId);
		});

		setTimeout(() => {
			$("#alert-dialog").parent().css("background-color", "rgba(17,17,17, 0.2)");
			$("#alert-dialog").parent().css("opacity", "1");
		}, 100);
	}
	return;
}

async function cancelOrderEN(orderId) {
	if ($("#alert-dialog").length === 0) {
		$("body").append(`<div id="alert-dialog" class="alert-dialog"> \
                        <h3><b>CANCEL</b> the order</h3><span>This action cannot be reversed</span> \
                        <button class="tab-btn confirm-delete">Confirm</button><button class="tab-btn abort-btn">Abort</button> \
                      </div>`);
		$("#alert-dialog").wrap('<div class="dialog-wrapper"></div>');
		$(".dialog-wrapper").on("click", function () {
			closeDialog();
		});
		$(".abort-btn").on("click", function () {
			abortAction();
		});
		$(".confirm-delete").on("click", function () {
			confirmDelete(orderId);
		});

		setTimeout(() => {
			$("#alert-dialog").parent().css("background-color", "rgba(17,17,17, 0.2)");
			$("#alert-dialog").parent().css("opacity", "1");
		}, 100);
	}
	return;
}

async function approveOrder(orderId) {
	if ($("#alert-dialog").length === 0) {
		$("body").append(`<div id="alert-dialog" class="alert-dialog"> \
                        <h3><b>APPROUVER</b> la commande</h3><span>Cette action est irréversible</span> \
                        <button class="tab-btn confirm-approval" >Confirmer</button><button class="tab-btn abort-btn">Annuler</button> \
                      </div>`);
		$("#alert-dialog").wrap('<div class="dialog-wrapper"></div>');
		$(".dialog-wrapper").on("click", function () {
			closeDialog();
		});
		$(".abort-btn").on("click", function () {
			abortAction();
		});
		$(".confirm-approval").on("click", function () {
			confirmApproval(orderId);
		});

		setTimeout(() => {
			$("#alert-dialog").parent().css("background-color", "rgba(17,17,17, 0.2)");
			$("#alert-dialog").parent().css("opacity", "1");
		}, 100);
	}
	return;
}

async function completeOrder(orderId) {
	if ($("#alert-dialog").length === 0) {
		$("body").append(`<div id="alert-dialog" class="alert-dialog"> \
                        <h3><b>COMPLETER</b> la commande</h3><span>Cette action est irréversible</span> \
                        <button class="tab-btn complete-order">Confirmer</button><button class="tab-btn abort-btn">Annuler</button> \
                      </div>`);
		$("#alert-dialog").wrap('<div class="dialog-wrapper"></div>');
		$(".dialog-wrapper").on("click", function () {
			closeDialog();
		});
		$(".abort-btn").on("click", function () {
			abortAction();
		});
		$(".complete-order").on("click", function () {
			confirmCompletion(orderId);
		});

		setTimeout(() => {
			$("#alert-dialog").parent().css("background-color", "rgba(17,17,17, 0.2)");
			$("#alert-dialog").parent().css("opacity", "1");
		}, 100);
	}
	return;
}
