const { ERROR_MESSAGE } = require("../../controllers/helpers/errorMessages");

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

/*
function checkoutCaller(isLogged, isDelivery) {
  if (isLogged === "") {
    window.location.href = "/Account"; //need req message
  } else {
    if (isDelivery === "true") {
      // fetch total price from API
      fetch("/api/cart/totalprice", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      })
        .then(res => {
          return res.json();
        })
        .then(data => {
          console.log(data);
          if (data.err === false) {
            let price = Math.round(parseFloat(data.total) * 100); //stripe amount is in cents
            if (price != 0) {
              stripeHandler.open({
                amount: price,
                currency: "eur"
              });
            }
          } else {
            console.log("Something went wrong while fetching your cart items!");
            throw new Error(data.msg);
          }
        })
        .catch(err => {
          let alert = createAlertNode(err.message);
          addAlert(alert, "#header");
        });
    } else {
      let alert = createAlertNode("You need to fill your delivery informations <a href='/User'>here</a> in order to be able to purchase!");
      addAlert(alert, "#header");
    }
  }
}*/

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
				console.log(totalQty);
				/*let totalPrice = response.cart.totalPrice;
        let rowId = document.getElementById(itemId);

        if (rowId.classList.contains("cart-row-item")) {
          let itemQty = response.cart.items[itemId].qty;
          let itemPrice = response.cart.items[itemId].price;

          $(`#qty-${itemId}`).val(itemQty);
          rowId.childNodes[5].childNodes[1].childNodes[0].innerText = itemPrice + "€";
          document.getElementById("total-price").innerText = totalPrice + "€";
          document.getElementById("total-qty").innerText = totalQty;
        }*/
				document.getElementById("cartQty").innerText = totalQty;
			} else alertType = "warning";
			let alert = createAlertNode(response.msg, alertType);
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
	///////////////////////////always delete since max qty is 1
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
				let totalPrice = formatter.format(response.cart.price.totalIncludingTax).replace(",", "."); ////////////////////////////////fetch total price including tax (delivery)
				let rowId = document.getElementById(itemId);

				if (totalQty === 0) handleEmptiness();

				if (!rowId.classList.contains("card")) {
					if (response.cart.items[itemId]) {
						let itemQty = response.cart.items[itemId].qty;
						let itemPrice = response.cart.items[itemId].price;

						$(`#qty-${itemId}`).val(itemQty);
						rowId.childNodes[5].childNodes[1].childNodes[0].innerText = itemPrice + "€";
					} else rowId.remove();

					document.getElementById("total-price").innerText = totalPrice; //format here or in api
					document.getElementById("total-qty").innerText = totalQty;
				}
				document.getElementById("cartQty").innerText = totalQty;
			} else {
				console.log("error:", response);
				alertType = "warning";
			}
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
					let alert = createAlertNode(response.msg, alertType);
					addAlert(alert, "#header");
				})
				.catch(err => {
					let alert = createAlertNode(err.message, "danger");
					addAlert(alert, "#header");
				});
		} else throw new Error(ERROR_MESSAGE.invalidReference);
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
					let alert = createAlertNode(response.msg, alertType);
					addAlert(alert, "#header");
				})
				.catch(err => {
					let alert = createAlertNode(response.msg, alertType);
					addAlert(alert, "#header");
				});
		} else throw new Error(ERROR_MESSAGE.invalidReference);
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
						let alert = createAlertNode(response.msg, alertType);
						addAlert(alert, "#header");
					})
					.catch(err => {
						console.log("An error occurred while contacting the API:", err);
						let alert = createAlertNode(err.message, "danger");
						addAlert(alert, "#header");
					});
			} else throw new Error(ERROR_MESSAGE.qtyInteger);
		} else throw new Error(ERROR_MESSAGE.invalidQty);
	} catch (err) {
		item.value = 1;
		let alert = createAlertNode(err.message, "warning");
		addAlert(alert, "#header");
	}
}
