function saveBilling(e) {
	e.preventDefault();

	let obj = {
		firstname: $("#firstname")[0].value,
		lastname: $("#lastname")[0].value,
		fulltext_address: $("#autocomplete")[0].value,
		route: $("#route")[0].value,
		city: $("#locality")[0].value,
		state: $("#administrative_area_level_1")[0].value,
		postal_code: $("#postal_code")[0].value,
		country: $("#country")[0].value
	};

	fetch("/api/order/billing/save", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ billing: obj })
	})
		.then(function (result) {
			return result.json();
		})
		.then(function (data) {
			if (data.error === true) {
				let alert = createAlertNode(data.message, "warning");
				addAlert(alert, "#header");
				return;
			}
			let alert = createAlertNode("Billing information successfully saved!", "success");
			addAlert(alert, "#header");
			window.location.href = "/Payment";
		});
}
