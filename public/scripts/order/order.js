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
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		credentials: "include",
		mode: "same-origin"
	});
	response = await response.json();

	let alertType = "success";
	console.log(response);
	if (response.error === "true") alertType = "warning";

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
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		credentials: "include",
		mode: "same-origin"
	});
	response = await response.json();

	console.log(response);
	let alertType = "success";
	if (response.error === true) alertType = "warning";

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
	return;
}

async function cancelOrder(orderId) {
	console.log("CANCEL ORDER:", orderId);

	if ($("#alert-dialog").length === 0) {
		$("body").append(`<div id="alert-dialog" class="alert-dialog"> \
                        <h3>CANCEL the order?</h3><span>This action is irreversible, are you sure?</span> \
                        <button class="tab-btn" onclick="confirmDelete('${orderId}')">CONFIRM</button><button class="tab-btn" onclick="abortAction()">ABORT</button> \
                      </div>`);
		$("#alert-dialog").wrap('<div onclick="closeDialog()" class="dialog-wrapper"></div>');

		setTimeout(() => {
			$("#alert-dialog").parent().css("background-color", "rgba(17,17,17, 0.2)");
			$("#alert-dialog").parent().css("opacity", "1");
		}, 100);
	}
	return;
}

async function approveOrder(orderId) {
	console.log("APPROVE ORDER:", orderId);

	if ($("#alert-dialog").length === 0) {
		$("body").append(`<div id="alert-dialog" class="alert-dialog"> \
                        <h3>APPROVE the order?</h3><span>This action is irreversible, are you sure?</span> \
                        <button class="tab-btn" onclick="confirmApproval('${orderId}')">CONFIRM</button><button class="tab-btn" onclick="abortAction()">ABORT</button> \
                      </div>`);
		$("#alert-dialog").wrap('<div onclick="closeDialog()" class="dialog-wrapper"></div>');

		setTimeout(() => {
			$("#alert-dialog").parent().css("background-color", "rgba(17,17,17, 0.2)");
			$("#alert-dialog").parent().css("opacity", "1");
		}, 100);
	}
	return;
}
