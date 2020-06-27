async function checkSKU(SKU) {
	let data = await fetch("/api/pwinty/countries/FR", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		body: JSON.stringify({ skus: [SKU] })
	});
	data = await data.json();
	if (data.prices[0].price) {
		if (data.prices[0].price === 0) {
			console.log(data.prices[0].sku);
			return 1;
		}
		return 0;
	} else {
		console.log(data.prices[0].sku);
		return 1;
	}
}

async function checkIsDelivery(SKU) {
	let response = await fetch("/api/pwinty/pricing/FR", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		body: JSON.stringify({ items: [{ SKU: SKU, quantity: 1 }] }),
		credentials: "include",
		mode: "same-origin"
	});
	response = await response.json();
	if (response.error === true || response.response.length <= 0) {
		console.log(`No delivery option for: ${SKU}`);
		return;
	}
}

function testSKU(category, subcategory) {
	let arr = [];

	switch (category) {
		case "CAN":
			{
				switch (subcategory) {
					case "STR":
						{
							Object.keys(CAN_sizes).forEach(singleSize => {
								let SKU = "GLOBAL" + "-" + category + "-" + singleSize;
								let objArr = { SKU: SKU, error: 2 };
								objArr.error = checkSKU(SKU);
								checkIsDelivery(SKU);
								arr.push(objArr);
							});
						}
						break;

					case "ROL":
						{
							Object.keys(CAN_ROL_sizes).forEach(singleSize => {
								Object.keys(CAN_substrate).forEach(singleSubstrate => {
									let SKU = category + "-" + subcategory + "-" + singleSubstrate + "-" + singleSize;
									let objArr = { SKU: SKU, error: 2 };
									objArr.error = checkSKU(SKU);
									checkIsDelivery(SKU);
									arr.push(objArr);
								});
							});

							Object.keys(CAN_substrate).forEach(singleSubstrate => {
								if (singleSubstrate !== "PC") {
									Object.keys(CAN_ROL_sizes).forEach(singleSize => {
										let SKU = category + "-" + subcategory + "-" + singleSubstrate + "-" + singleSize + "-VAR";
										let objArr = { SKU: SKU, error: 2 };
										objArr.error = checkSKU(SKU);
										checkIsDelivery(SKU);
										arr.push(objArr);
									});
								}
							});
						}
						break;

					case "FRA":
						{
							Object.keys(CAN_sizes).forEach(singleSize => {
								let SKU = "GLOBAL" + "-" + subcategory + "-" + category + "-" + singleSize;
								let objArr = { SKU: SKU, error: 2 };
								objArr.error = checkSKU(SKU);
								checkIsDelivery(SKU);
								arr.push(objArr);
							});
						}
						break;
				}
			}
			break;

		case "PRINT":
			{
				Object.keys(PRINT_substrate).forEach(singleSubstrate => {
					Object.keys(PRINT_sizes).forEach(singleSize => {
						let SKU = "GLOBAL" + "-" + singleSubstrate + "-" + singleSize;
						let objArr = { SKU: SKU, error: 2 };
						objArr.error = checkSKU(SKU);
						checkIsDelivery(SKU);
						arr.push(objArr);
					});
				});
			}
			break;

		case "FRA":
			{
				switch (subcategory) {
					case "BOX":
						{
							Object.keys(FRA_sizes).forEach(singleSize => {
								Object.keys(mountType).forEach(singleMount => {
									Object.keys(glazeType).forEach(singleGlaze => {
										Object.keys(substrateType).forEach(singleSubstrate => {
											let SKU =
												category +
												"-" +
												subcategory +
												"-" +
												singleSubstrate +
												"-" +
												singleMount +
												"-" +
												singleGlaze +
												"-" +
												singleSize;
											let objArr = { SKU: SKU, error: 2 };
											objArr.error = checkSKU(SKU);
											checkIsDelivery(SKU);
											arr.push(objArr);
										});
									});
								});
							});
						}
						break;

					case "CLA":
						{
							Object.keys(FRA_sizes).forEach(singleSize => {
								Object.keys(mountType).forEach(singleMount => {
									Object.keys(glazeType).forEach(singleGlaze => {
										Object.keys(substrateType).forEach(singleSubstrate => {
											let SKU =
												category +
												"-" +
												subcategory +
												"-" +
												singleSubstrate +
												"-" +
												singleMount +
												"-" +
												singleGlaze +
												"-" +
												singleSize;
											let objArr = { SKU: SKU, error: 2 };
											objArr.error = checkSKU(SKU);
											checkIsDelivery(SKU);
											arr.push(objArr);
										});
									});
								});
							});
						}
						break;

					case "GLO":
						{
							Object.keys(FRA_sizes).forEach(singleSize => {
								Object.keys(mountType).forEach(singleMount => {
									Object.keys(substrateType).forEach(singleSubstrate => {
										let SKU =
											category + "-" + subcategory + "-" + singleSubstrate + "-" + singleMount + "-" + "ACRY" + "-" + singleSize;
										let objArr = { SKU: SKU, error: 2 };
										objArr.error = checkSKU(SKU);
										checkIsDelivery(SKU);
										arr.push(objArr);
									});
								});
							});
						}
						break;

					case "SPACE":
						{
							Object.keys(FRA_sizes).forEach(singleSize => {
								Object.keys(glazeType).forEach(singleGlaze => {
									Object.keys(substrateType).forEach(singleSubstrate => {
										let SKU = category + "-" + subcategory + "-" + singleSubstrate + "-NM-" + singleGlaze + "-" + singleSize;
										let objArr = { SKU: SKU, error: 2 };
										objArr.error = checkSKU(SKU);
										checkIsDelivery(SKU);
										arr.push(objArr);
									});
								});
							});
						}
						break;

					case "SUR1":
						{
							Object.keys(FRA_SUR_sizes).forEach(singleSize => {
								Object.keys(substrateType).forEach(singleSubstrate => {
									let SKU = category + "-" + subcategory + "-" + singleSubstrate + "-NM-" + singleSize;
									let objArr = { SKU: SKU, error: 2 };
									objArr.error = checkSKU(SKU);
									checkIsDelivery(SKU);
									arr.push(objArr);
								});
							});
						}
						break;

					case "SUR2":
						{
							Object.keys(FRA_SUR_sizes).forEach(singleSize => {
								Object.keys(substrateType).forEach(singleSubstrate => {
									let SKU = category + "-" + subcategory + "-" + singleSubstrate + "-NM-" + singleSize;
									let objArr = { SKU: SKU, error: 2 };
									objArr.error = checkSKU(SKU);
									checkIsDelivery(SKU);
									arr.push(objArr);
								});
							});
						}
						break;

					case "SWO":
						{
							Object.keys(FRA_sizes).forEach(singleSize => {
								Object.keys(mountType).forEach(singleMount => {
									Object.keys(substrateType).forEach(singleSubstrate => {
										let SKU =
											category + "-" + subcategory + "-" + singleSubstrate + "-" + singleMount + "-" + "ACRY" + "-" + singleSize;
										let objArr = { SKU: SKU, error: 2 };
										objArr.error = checkSKU(SKU);
										checkIsDelivery(SKU);
										arr.push(objArr);
									});
								});
							});
						}
						break;
				}
			}
			break;
	}
	//console.log(arr)
}

function filtersize() {
	let arr = [];

	Object.keys(CAN_ROL_sizes).forEach(size => {
		if (arr.length === 0) arr.push(size);
		let split = size.split("x");
		let newNb = split[1] + "x" + split[0];
		let found = 0;

		arr.forEach((item, index) => {
			if (item == newNb || item == size) found = 1;
			if (index === arr.length - 1 && found === 0) arr.push(size);
		});
	});

	console.log(arr);
	//generateNewObject(arr);
	return;
}

function generateNewObject(arr) {
	let str = "";

	arr.forEach(item => {
		const split = item.split("x");
		const aCm = Math.round(split[0] / 0.3937008);
		const bCm = Math.round(split[1] / 0.3937008);

		str += `"${item}": "${aCm}x${bCm}cm", `;
	});
	console.log(str);
}
