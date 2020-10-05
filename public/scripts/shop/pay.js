const stripePublicKey = document.getElementById("stripePublicKey").value;
const stripe = Stripe(stripePublicKey);
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
let billing = JSON.parse(document.getElementById("billingInfo").value);
let loader = document.querySelector("#loader");

let orderId;
let clientSecret;
let card;
let data;

async function initialize() {
	data = await fetch("/api/stripe/create-intent", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"CSRF-Token": csrfToken
		},
		body: []
	});

	data = await data.json();

	if (data.error === true) {
		let alert = createAlertNode(data.message, "warning");
		addAlert(alert, "#header");
		document.querySelector(".btn-pay").disabled = true;
		return;
	}
	orderId = data.orderId;
	clientSecret = data.clientSecret;

	let elements = stripe.elements();
	let style = {
		base: {
			"color": "#32325d",
			"fontFamily": '"Helvetica Neue", Helvetica, sans-serif',
			"fontSmoothing": "antialiased",
			"fontSize": "16px",
			"::placeholder": {
				color: "#aab7c4"
			}
		},
		invalid: {
			color: "#fa755a",
			iconColor: "#fa755a"
		}
	};

	let card = elements.create("card", { style: style });
	card.mount("#card-element");

	card.on("change", function (event) {
		document.querySelector("button").disabled = event.empty;
		document.querySelector("#card-errors").textContent = event.error ? event.error.message : "";
	});

	let form = document.getElementById("payment-form");
	form.addEventListener("submit", function (event) {
		event.preventDefault();
		payWithCard(stripe, card, data.clientSecret);
	});
}

initialize();

let payWithCard = async function (stripe, card, clientSecret) {
	if (loader) loader.classList.add("block");
	let result = await stripe.confirmCardPayment(clientSecret, {
		receipt_email: document.getElementById("email").value,
		payment_method: {
			card: card
		},
		shipping: {
			address: {
				city: billing.city,
				country: billing.country,
				line1: billing.full_address,
				line2: null,
				postal_code: billing.zipcode,
				state: billing.state
			},
			name: billing.lastname + " " + billing.firstname,
			phone: null
		}
	});

	if (result.error) {
		let alert = createAlertNode(result.error.message, "warning");
		addAlert(alert, "#header");
		return;
	}

	let confirm = await fetch("/api/order/confirm", {
		// to remove once live using webhooks
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify({ type: "payment_intent.succeeded", data: { object: { id: result.paymentIntent.id } } })
	});

	if (confirm.error === true) {
		let alert = createAlertNode(confirm.message);
		addAlert(alert, "#header");
		return;
	} else {
		setTimeout(function () {
			window.location.href = `/api/cart/clear/${orderId}`;
		}, 2000);
	}
	if (loader) loader.classList.remove("block");
};
