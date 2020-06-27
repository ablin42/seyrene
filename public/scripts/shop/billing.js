async function saveBilling(e) {
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

	let data = await fetch("/api/order/billing/save", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ billing: obj })
	});
	data = await data.json();

	if (data.error === true) {
		let alert = createAlertNode(data.message, "warning");
		addAlert(alert, "#header");
		return;
	} else window.location.href = "/Payment";
}
