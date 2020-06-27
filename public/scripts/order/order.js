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

	let alertType = "success";
	if (response.error === true) alertType = "warning";

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
	return;
}

async function confirmCompletion(orderId) {
	closeDialog();
	let response = await fetch(`/api/order/complete/${orderId}`, {
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
	if (response.error === true) alertType = "warning";

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
	return;
}

async function cancelOrder(orderId) {
	console.log("CANCEL ORDER:", orderId);

	if ($("#alert-dialog").length === 0) {
		$("body").append(`<div id="alert-dialog" class="alert-dialog"> \
                        <h3><b>ANNULER</b> la commande</h3><span>Cette action est irréversible</span> \
                        <button class="tab-btn" onclick="confirmDelete('${orderId}')">Confirmer</button><button class="tab-btn" onclick="abortAction()">Annuler</button> \
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
                        <h3><b>APPROUVER</b> la commande</h3><span>Cette action est irréversible</span> \
                        <button class="tab-btn" onclick="confirmApproval('${orderId}')">Confirmer</button><button class="tab-btn" onclick="abortAction()">Annuler</button> \
                      </div>`);
		$("#alert-dialog").wrap('<div onclick="closeDialog()" class="dialog-wrapper"></div>');

		setTimeout(() => {
			$("#alert-dialog").parent().css("background-color", "rgba(17,17,17, 0.2)");
			$("#alert-dialog").parent().css("opacity", "1");
		}, 100);
	}
	return;
}

async function completeOrder(orderId) {
	console.log("APPROVE ORDER:", orderId);

	if ($("#alert-dialog").length === 0) {
		$("body").append(`<div id="alert-dialog" class="alert-dialog"> \
                        <h3><b>COMPLETER</b> la commande</h3><span>Cette action est irréversible</span> \
                        <button class="tab-btn" onclick="confirmCompletion('${orderId}')">Confirmer</button><button class="tab-btn" onclick="abortAction()">Annuler</button> \
                      </div>`);
		$("#alert-dialog").wrap('<div onclick="closeDialog()" class="dialog-wrapper"></div>');

		setTimeout(() => {
			$("#alert-dialog").parent().css("background-color", "rgba(17,17,17, 0.2)");
			$("#alert-dialog").parent().css("opacity", "1");
		}, 100);
	}
	return;
}
