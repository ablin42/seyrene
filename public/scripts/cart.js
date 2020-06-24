let PWINTY_DATA = [];
const formatter = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR"
});

function cooldownBtn(caller, time) {
	caller.disabled = true;
	caller.style.pointerEvents = "none";
	setTimeout(() => {
		caller.disabled = false;
		caller.style.pointerEvents = "auto";
	}, time);
}

function handleEmptiness() {
	$(".payment-div").attr("style", "display: none");
	$("#alertEmpty").attr("style", "display: inline-block");
	$("#cart-row-header").attr("style", "display: none");
}

async function cartAdd(itemId, caller) {
	cooldownBtn(caller, 1500);
	await fetch(`/api/cart/add/${itemId}`, {
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
			let alertType = "info";
			if (response.error === false) {
				let totalQty = response.cart.totalQty;
				document.getElementById("cartQty").innerText = totalQty;
			} else alertType = "warning";
			let alert = createAlertNode(response.message, alertType);
			addAlert(alert, "#header");
		})
		.catch(err => {
			console.log(err);
			let alert = createAlertNode(err.message, "danger");
			addAlert(alert, "#header");
		});
	return;
}

async function cartDel(itemId, caller) {
	cooldownBtn(caller, 1500);
	await fetch(`/api/cart/del/${itemId}`, {
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
			let alertType = "info";
			if (response.error === false) {
				let totalQty = response.cart.totalQty;
				let totalPrice = formatter.format(response.cart.price.totalIncludingTax).replace(",", ".");
				let rowId = document.getElementById(itemId);

				if (totalQty === 0) handleEmptiness();

				rowId.remove();

				document.getElementById("total-price").innerText = totalPrice;
				document.getElementById("total-qty").innerText = totalQty;
				document.getElementById("cartQty").innerText = totalQty;
			} else alertType = "warning";

			let alert = createAlertNode(response.message, alertType);
			addAlert(alert, "#header");
		})
		.catch(err => {
			console.log(err);
			let alert = createAlertNode(err.message, "danger");
			addAlert(alert, "#header");
		});
	return;
}

async function pwintyCartAdd(itemId, referenceId, caller) {
	try {
		if (PWINTY_DATA.length > 0) {
			cooldownBtn(caller, 1500);
			let SKU = PWINTY_DATA[referenceId].SKU;
			let attributes = PWINTY_DATA[referenceId].attributes;
			PWINTY_DATA[referenceId].attributes.SKU = undefined;
			let price = PWINTY_DATA[referenceId].price;

			await fetch(`api/cart/add/pwinty/${itemId}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json"
				},
				body: JSON.stringify({ SKU, price, attributes }),
				credentials: "include",
				mode: "same-origin"
			})
				.then(res => {
					return res.json();
				})
				.then(function (response) {
					console.log(response);
					let alertType = "success";
					if (response.error === false) {
						let totalQty = response.cart.totalQty;
						console.log(response.cart.price.totalIncludingTax, response.cart.totalPrice);
						let totalPrice = formatter.format(response.cart.price.totalIncludingTax).replace(",", ".");
						let rowId = document.getElementById(`${itemId}-${referenceId}`);

						if (rowId.classList.contains("cart-row-item")) {
							$(`#qty-${itemId}-${referenceId}`).val(response.item.qty);
							rowId.childNodes[5].childNodes[1].childNodes[0].innerText = formatter.format(response.item.price).replace(",", ".");
							document.getElementById("total-price").innerText = totalPrice;
							document.getElementById("total-qty").innerText = totalQty;
						}
						document.getElementById("cartQty").innerText = totalQty;
					} else alertType = "warning";
					let alert = createAlertNode(response.message, alertType);
					addAlert(alert, "#header");
				})
				.catch(err => {
					let alert = createAlertNode(err.message, "danger");
					addAlert(alert, "#header");
				});
		} else throw new Error(ERROR_MESSAGE.itemNotFound);
	} catch (err) {
		let alert = createAlertNode(err.message, "warning");
		addAlert(alert, "#header");
	}
}

async function pwintyCartDel(itemId, referenceId, caller) {
	try {
		if (PWINTY_DATA.length > 0) {
			cooldownBtn(caller, 1500);
			let SKU = PWINTY_DATA[referenceId].SKU;
			let attributes = PWINTY_DATA[referenceId].attributes;
			PWINTY_DATA[referenceId].attributes.SKU = undefined;
			let price = PWINTY_DATA[referenceId].price;

			await fetch(`/api/cart/del/pwinty/${itemId}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json"
				},
				body: JSON.stringify({ SKU, price, attributes }),
				credentials: "include",
				mode: "same-origin"
			})
				.then(res => {
					return res.json();
				})
				.then(function (response) {
					let alertType = "warning";
					if (response.error === false) {
						let totalQty = response.cart.totalQty;
						let totalPrice = formatter.format(response.cart.price.totalIncludingTax).replace(",", ".");
						let deliveryPrice = response.cart.price.shippingIncludingTax;
						let rowId = document.getElementById(`${itemId}-${referenceId}`);

						if (deliveryPrice === 0) deliveryPrice = "FREE";
						else deliveryPrice = formatter.format(response.cart.price.shippingIncludingTax).replace(",", ".");

						if (totalQty === 0) handleEmptiness();

						if (response.cart.items[SKU]) {
							if (response.item.qty === 0) rowId.remove();
							$(`#qty-${itemId}-${referenceId}`).val(response.item.qty);
							rowId.childNodes[5].childNodes[1].childNodes[0].innerText = formatter.format(response.item.price).replace(",", ".");
						} else rowId.remove();

						document.getElementById("total-price").innerText = totalPrice;
						document.getElementById("delivery-price").innerText = deliveryPrice;
						document.getElementById("total-qty").innerText = totalQty;
						document.getElementById("cartQty").innerText = totalQty;
					} else {
						console.log("error:", response);
						alertType = "warning";
					}
					let alert = createAlertNode(response.message, alertType);
					addAlert(alert, "#header");
				})
				.catch(err => {
					let alert = createAlertNode(response.message, alertType);
					addAlert(alert, "#header");
				});
		} else throw new Error(ERROR_MESSAGE.itemNotFound);
	} catch (err) {
		let alert = createAlertNode(err.message, "warning");
		addAlert(alert, "#header");
	}
}

async function pwintyUpdateValue(e, item, itemId, referenceId) {
	try {
		if (item.value && PWINTY_DATA.length > 0) {
			let qty = parseInt(item.value);
			let SKU = PWINTY_DATA[referenceId].SKU;
			let attributes = PWINTY_DATA[referenceId].attributes;
			PWINTY_DATA[referenceId].attributes.SKU = undefined;
			let price = PWINTY_DATA[referenceId].price;

			if (Number.isInteger(qty) && qty >= 0) {
				await fetch(`/api/cart/update/pwinty/${itemId}/${qty}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Accept": "application/json"
					},
					body: JSON.stringify({ SKU, price, attributes }),
					credentials: "include",
					mode: "same-origin"
				})
					.then(res => {
						return res.json();
					})
					.then(function (response) {
						let alertType = "info";
						if (response.error === false) {
							let totalQty = response.cart.totalQty;
							let totalPrice = formatter.format(response.cart.price.totalIncludingTax).replace(",", ".");
							let rowId = document.getElementById(`${itemId}-${referenceId}`);
							let deliveryPrice = response.cart.price.shippingIncludingTax;

							if (deliveryPrice === 0) deliveryPrice = "FREE";
							else deliveryPrice = formatter.format(response.cart.price.shippingIncludingTax).replace(",", ".");

							if (totalQty === 0) handleEmptiness();

							document.getElementById("total-price").innerText = totalPrice;
							document.getElementById("delivery-price").innerText = deliveryPrice;
							document.getElementById("total-qty").innerText = totalQty;
							document.getElementById("cartQty").innerText = totalQty;

							if (qty === 0) document.getElementById(`${itemId}-${referenceId}`).remove();
							else {
								if (!rowId.classList.contains("card")) {
									item.value = response.item.qty; // useless??
									rowId.childNodes[5].childNodes[1].childNodes[0].innerText = formatter
										.format(response.item.price)
										.replace(",", ".");
								}
							}
						} else {
							console.log("API answered with error:", response);
							alertType = "warning";
						}
						let alert = createAlertNode(response.message, alertType);
						addAlert(alert, "#header");
					})
					.catch(err => {
						console.log("An error occurred while contacting the API:", err);
						let alert = createAlertNode(err.message, "danger");
						addAlert(alert, "#header");
					});
			} else throw new Error(ERROR_MESSAGE.updateQty);
		} else throw new Error(ERROR_MESSAGE.updateQty);
	} catch (err) {
		item.value = 1;
		let alert = createAlertNode(err.message, "warning");
		addAlert(alert, "#header");
	}
}
