let PWINTY_DATA = [];
const formatter = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR"
});

const csrfToken = document.querySelector("meta[name=\"csrf-token\"]").getAttribute("content");

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
	let alertType = "success";

	console.log(itemId);
	let response = await fetch(`/api/cart/add/${itemId}`, {
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

	if (response.error === false) {
		let totalQty = response.cart.totalQty;
		document.getElementById("cartQty").innerText = totalQty;
	} else alertType = "warning";

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
	return;
}

async function cartDel(itemId, caller) {
	cooldownBtn(caller, 1500);
	let alertType = "info";

	let response = await fetch(`/api/cart/del/${itemId}`, {
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

	if (response.error === false) {
		let totalQty = response.cart.totalQty;
		let totalPrice = formatter.format(response.cart.price.totalIncludingTax).replace(",", ".");
		let rowId = document.getElementById(itemId);

		rowId.remove();
		if (totalQty === 0) handleEmptiness();

		document.getElementById("total-price").innerText = totalPrice;
		document.getElementById("total-qty").innerText = totalQty;
		document.getElementById("cartQty").innerText = totalQty;
	} else alertType = "warning";

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
	return;
}

async function pwintyCartAdd(itemId, referenceId, caller) {
	cooldownBtn(caller, 1500);
	let alertType = "success";

	if (PWINTY_DATA <= 0) throw new Error(ERROR_MESSAGE.itemNotFound);

	let SKU = PWINTY_DATA[referenceId].SKU;
	let attributes = PWINTY_DATA[referenceId].attributes;
	let price = PWINTY_DATA[referenceId].price;

	let response = await fetch(`api/cart/add/pwinty/${itemId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify({ SKU, price, attributes }),
		credentials: "include",
		mode: "same-origin"
	});
	response = await response.json();

	if (response.error === false) {
		let totalQty = response.cart.totalQty;
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
}

async function pwintyCartDel(itemId, referenceId, caller) {
	cooldownBtn(caller, 1500);
	let alertType = "warning";

	if (PWINTY_DATA.length <= 0) throw new Error(ERROR_MESSAGE.itemNotFound);

	let SKU = PWINTY_DATA[referenceId].SKU;
	let attributes = PWINTY_DATA[referenceId].attributes;
	let price = PWINTY_DATA[referenceId].price;

	let response = await fetch(`/api/cart/del/pwinty/${itemId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify({ SKU, price, attributes }),
		credentials: "include",
		mode: "same-origin"
	});
	response = await response.json();

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
			else {
				$(`#qty-${itemId}-${referenceId}`).val(response.item.qty);
				rowId.childNodes[5].childNodes[1].childNodes[0].innerText = formatter.format(response.item.price).replace(",", ".");
			}
		} else rowId.remove();

		document.getElementById("total-price").innerText = totalPrice;
		document.getElementById("delivery-price").innerText = deliveryPrice;
		document.getElementById("total-qty").innerText = totalQty;
		document.getElementById("cartQty").innerText = totalQty;
	} else alertType = "warning";

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
}

async function pwintyUpdateValue(e, item, itemId, referenceId) {
	if (PWINTY_DATA.length <= 0) throw new Error(ERROR_MESSAGE.itemNotFound);
	if (!item.value) throw new Error(ERROR_MESSAGE.updateQty);

	let qty = parseInt(item.value);
	let SKU = PWINTY_DATA[referenceId].SKU;
	let attributes = PWINTY_DATA[referenceId].attributes;
	let price = PWINTY_DATA[referenceId].price;
	let alertType = "info";

	if (!Number.isInteger(qty) && qty <= 0) throw new Error(ERROR_MESSAGE.updateQty);

	let response = await fetch(`/api/cart/update/pwinty/${itemId}/${qty}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify({ SKU, price, attributes }),
		credentials: "include",
		mode: "same-origin"
	});
	response = await response.json();

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
			item.value = response.item.qty;
			rowId.childNodes[5].childNodes[1].childNodes[0].innerText = formatter.format(response.item.price).replace(",", ".");
		}
	} else alertType = "warning";

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
}
