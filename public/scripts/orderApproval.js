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

async function confirmApproval(orderId) {
	closeDialog();
	await fetch(`/api/order/approve/${orderId}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		credentials: "include",
		mode: "same-origin"
	})
		.then(res => {
			return res.json();
		})
		.then(function (response) {
			let alertType = "success";
			if (response.err === "true") alertType = "warning";

			let alert = createAlertNode(response.message, alertType);
			addAlert(alert, "#header");
		})
		.catch(err => {
			console.log(err);
		});
	return;
}

async function approveOrder(orderId) {
	console.log("APPROVE ORDER:", orderId);

	if ($("#alert-dialog").length === 0) {
		$("body").append(`<div id="alert-dialog" class="alert-dialog"> \
                        <h3>APPROVE the order?</h3><span>This action is irreversible, are you sure?</span> \
                        <button class="tab-btn" onclick="confirmApproval('${orderId}')">CONFIRM</button><button class="tab-btn" onclick="abortAction()">ABORT</button> \
                      </div>`);
		$("#alert-dialog").wrap("<div onclick=\"closeDialog()\" class=\"dialog-wrapper\"></div>");

		setTimeout(() => {
			$("#alert-dialog").parent().css("background-color", "rgba(17,17,17, 0.2)");
			$("#alert-dialog").parent().css("opacity", "1");
		}, 100);
	}
	return;
}

async function infiniteApprovalOrders() {
	if ($("#container-admin-orders").length === 0) return;
	let nbItem = $("tbody tr").length,
		page = 1 + Math.floor(nbItem / 20),
		loader = $("#loader");
	loader.css("display", "block");

	await fetch(`/api/order?page=${page}&approval=true`)
		.then(function (response) {
			response.json().then(function (data) {
				if (!data.error) {
					if (data.orders.length > 0) {
						data.orders.forEach(order => {
							let id = order._id;
							console.log(id, $(`#${id}`));
							if ($(`#${id}`).length === 0) {
								toAppend = `
                          <tr>
                            <th scope="row" class="date-grid">${order.date_f}</th>
                            <td class="status-grid">${order.status}</td>
                            <td class="price-grid">${order.price}€</td>
                            <td class="name-grid">${order.firstname[0]}. ${order.lastname}</td>
                            <td class="id-grid"><a id="${order._id}" href="/Admin/Order/${order._id}">#${order._id}</a></td>
                          </tr>`;

								$("#container-admin-orders").append(toAppend);
							} else {
								$("#infinitebtn").val("Nothing more to load");
								$("#infinitebtn").attr("disabled");
								$("#infinitebtn").attr("onclick", "");
							}
						});
					} else {
						$("#infinitebtn").val("Nothing more to load");
						$("#infinitebtn").attr("disabled");
						$("#infinitebtn").attr("onclick", "");
					}
				} else {
					let alert = createAlertNode(data.message, "warning");
					addAlert(alert, "#header");
				}
			});
		})
		.catch(err => {
			let alert = createAlertNode(err.message, "warning");
			addAlert(alert, "#header");
		});
	loader.css("display", "none");
}

$(window).scroll(function () {
	const val1 = Math.ceil($(window).scrollTop() + $(window).height());
	const val2 = $(document).height();
	if (val1 >= val2) infiniteApprovalOrders();
});
