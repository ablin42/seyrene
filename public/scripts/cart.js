let PWINTY_DATA = [];
const formatter = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR"
});
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
let addUnique = document.querySelectorAll("input[data-addcart]");
let pwintyAdd = document.querySelectorAll("[data-padd]");
let pwintyDel = document.querySelectorAll("[data-pdel]");
let pwintyUpd = document.querySelectorAll("[data-pupd]");
let inputData = document.querySelectorAll("[data-sku]");
let delUnique = document.querySelectorAll("[data-delcart]");

delUnique.forEach(item => {
	item.addEventListener("click", function () {
		cartDel(item.dataset.delcart, item);
	});
});

inputData.forEach(item => {
	PWINTY_DATA[item.dataset.index] = {
		SKU: item.dataset.sku,
		attributes: JSON.parse(item.dataset.attributes.replace(/&#34;/gi, '"'))
	};
});

pwintyUpd.forEach(item => {
	item.addEventListener("change", function (e) {
		pwintyUpdateValue(e, item, item.dataset.id, item.dataset.reference);
	});
});

pwintyDel.forEach(item => {
	item.addEventListener("click", function () {
		pwintyCartDel(item.dataset.id, item.dataset.reference, item);
	});
});

pwintyAdd.forEach(item => {
	item.addEventListener("click", function () {
		pwintyCartAdd(item.dataset.id, item.dataset.reference, item);
	});
});

addUnique.forEach(btn => {
	btn.addEventListener("click", function (e) {
		cartAdd(btn.dataset.addcart, btn);
	});
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
	document.querySelector(".payment-div").classList.add("nodisplay");
	document.querySelector("#alertEmpty").classList.remove("nodisplay");
	document.querySelector("#cart-row-header").classList.add("nodisplay");
}

async function cartAdd(itemId, caller) {
	cooldownBtn(caller, 1500);
	let alertType = "success";

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
	console.log(referenceId);

	if (PWINTY_DATA <= 0) throw new Error(ERROR_MESSAGE.itemNotFound);
	let SKU = PWINTY_DATA[parseInt(referenceId)].SKU;
	let attributes = PWINTY_DATA[parseInt(referenceId)].attributes;

	let response = await fetch(`api/cart/add/pwinty/${itemId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify({ SKU, attributes }),
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

	let SKU = PWINTY_DATA[parseInt(referenceId)].SKU;
	let attributes = PWINTY_DATA[parseInt(referenceId)].attributes;

	let response = await fetch(`/api/cart/del/pwinty/${itemId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify({ SKU, attributes }),
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
	let SKU = PWINTY_DATA[parseInt(referenceId)].SKU;
	let attributes = PWINTY_DATA[parseInt(referenceId)].attributes;
	let alertType = "info";

	if (!Number.isInteger(qty) && qty <= 0) throw new Error(ERROR_MESSAGE.updateQty);

	let response = await fetch(`/api/cart/update/pwinty/${itemId}/${qty}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify({ SKU, attributes }),
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
