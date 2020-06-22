const { ERROR_MESSAGE } = require("../../controllers/helpers/errorMessages");

function closeAllSelect(elmnt) {
	let x,
		y,
		i,
		arrNo = [];
	x = document.getElementsByClassName("select-items");
	y = document.getElementsByClassName("select-selected");

	for (i = 0; i < y.length; i++) {
		if (elmnt == y[i]) arrNo.push(i);
		else y[i].classList.remove("select-arrow-active");
	}
	for (i = 0; i < x.length; i++) {
		if (arrNo.indexOf(i)) x[i].classList.add("select-hide");
	}
}

async function checkSKU(SKU) {
	fetch("/api/pwinty/countries/FR", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		body: JSON.stringify({ skus: [SKU] })
	})
		.then(res => {
			return res.json();
		})
		.then(data => {
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
		})
		.catch(err => {
			return 1;
		});
}

async function checkIsDelivery(SKU) {
	await fetch("/api/pwinty/pricing/FR", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		body: JSON.stringify({ items: [{ SKU: SKU, quantity: 1 }] }),
		credentials: "include",
		mode: "same-origin"
	})
		.then(res => {
			return res.json();
		})
		.then(async function (response) {
			if (response.error === true || response.response.length <= 0) {
				console.log(`No delivery option for: ${SKU}`);
				return;
			}
		})
		.catch(err => {
			console.log(`No delivery option for: ${SKU}`);
			return;
		});
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

class PwintyObject {
	constructor(item) {
		this.SKU = "";
		this.category = item.value;
		this.subcategory = "";
		this.attributes = {};
		this.width = $("img[alt=\"0slide\"]")[0].naturalWidth;
		this.height = $("img[alt=\"0slide\"]")[0].naturalHeight;
		this.ratio = Math.round((this.width / this.height + Number.EPSILON) * 100) / 100;
		this.megapixel = this.width * this.height;

		document.getElementById("subcategories").innerHTML = "";
		document.getElementById("attributes").innerHTML = "";
		this.hidePricing();

		let selection = "";
		Object.keys(PWINTY_ITEMS[this.category]).forEach(subcategory => {
			let subcategoryRadio = `<label for="${subcategory}">
                                    <div class="sku-item unselectable">
                                        <p>${PWINTY_ITEMS[this.category][subcategory].fullname}</p>
                                        <input data-category="${
	this.category
}" name="pwinty-subcategory" id="${subcategory}" value="${subcategory}" type="radio" onclick="Pwinty.loadSubCategory(this)">
                                    </div>
                                </label>`;
			if (subcategory !== "sharedAttributes") selection += subcategoryRadio;
			document.getElementById("subcategories").innerHTML = selection;
		});
	}

	checkSize(attributeSelect, subcategory, i) {
		let dimensions = Object.keys(PWINTY_ITEMS[this.category][subcategory]["size"])[i].split("x");

		if (isNaN(parseInt(dimensions[0]))) {
			for (let j = 0; j < A_FORMAT.length; j++) {
				if (dimensions[0] === A_FORMAT[j].code) dimensions = A_FORMAT[j].size.split("x");
			}
		}

		let sizeRatio = Math.round((dimensions[0] / dimensions[1] + Number.EPSILON) * 100) / 100;
		let ratioMarginOffset = 0.2;

		let maxDimension = parseInt(dimensions[0]);
		if (parseInt(dimensions[1]) > parseInt(dimensions[0])) {
			maxDimension = parseInt(dimensions[1]);
			sizeRatio = Math.round((dimensions[1] / dimensions[0] + Number.EPSILON) * 10) / 10;
		}

		if (this.category !== "FRA") maxDimension = maxDimension * 2.54; //conversion from inches to cm

		if (this.megapixel > 9300000) {
			if (sizeRatio > this.ratio - this.ratio * ratioMarginOffset && sizeRatio < this.ratio + this.ratio * ratioMarginOffset)
				attributeSelect += `<option value="${Object.keys(PWINTY_ITEMS[this.category][subcategory]["size"])[i]}">\
                    ${Object.values(PWINTY_ITEMS[this.category][subcategory]["size"])[i]}</option>`;
		} else {
			let index = 0;
			let max;
			if (this.category !== "CAN") {
				while (this.megapixel > DIMENSIONS_FRAMES[index].megapixel) index++;
				max = DIMENSIONS_FRAMES[index].max;
			} else {
				while (this.megapixel > DIMENSIONS_CANVAS[index].megapixel) index++;
				max = DIMENSIONS_CANVAS[index].max;
			}

			if (maxDimension <= max) {
				if (sizeRatio > this.ratio - this.ratio * ratioMarginOffset && sizeRatio < this.ratio + this.ratio * ratioMarginOffset)
					attributeSelect += `<option value="${Object.keys(PWINTY_ITEMS[this.category][subcategory]["size"])[i]}">\
                        ${Object.values(PWINTY_ITEMS[this.category][subcategory]["size"])[i]}</option>`;
			}
		}

		return attributeSelect;
	}

	loadSubCategory(subcategory) {
		this.hidePricing();
		this.subcategory = subcategory.value;
		this.attributes = {};

		//filtersize();
		//testSKU(this.category, this.subcategory);

		let selection = "";
		Object.keys(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"]).forEach(attribute => {
			this.attributes[attribute] = "";

			let attributeSelect = `<label for="${attribute}">
                                    <div class="sku-item unselectable select-list">
                                        <p>${
	PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute].fullname
}</p>
                                        <div class="select-wrapper">
                                        <select data-attribute="${attribute}" name="${attribute}" id="${attribute}">
                                            <option disabled selected>Pick one</option>`;

			Object.keys(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute]).forEach((option, i) => {
				if (option !== "size") {
					if (option !== "fullname")
						attributeSelect += `<option value="${
							Object.keys(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute])[i]
						}">\
												${Object.values(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute])[i]}</option>`;
				} else {
					attributeSelect = this.checkSize(attributeSelect, "sharedAttributes", i);
				}
			});

			attributeSelect += `</select></div>
                                    </div>
                                </label>`;
			selection += attributeSelect;
		});

		Object.keys(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory]).forEach(attribute => {
			if (attribute !== "fullname") {
				this.attributes[attribute] = "";
				let attributeSelect = `<label for="${attribute}">
                                    <div class="sku-item unselectable select-list">
                                        <p>${PWINTY_ITEMS[subcategory.dataset.category][this.subcategory][attribute].fullname}</p>
                                        <div class="select-wrapper">
                                        <select data-attribute="${attribute}" name="${attribute}" id="${attribute}">
                                            <option disabled selected>Pick one</option>`;

				Object.keys(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory][attribute]).forEach((option, i) => {
					if (option !== "size") {
						if (option !== "fullname")
							attributeSelect += `<option value="${
								Object.keys(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory][attribute])[i]
							}">\
												${Object.values(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory][attribute])[i]}</option>`;
					} else {
						attributeSelect = this.checkSize(attributeSelect, this.subcategory, i);
					}
				});

				attributeSelect += `</select></div>
                                    </div>
                                </label>`;
				selection += attributeSelect;
			}
		});

		document.getElementById("attributes").innerHTML = selection;
		this.selectScript();
		//this.printInfo();
	}

	selectScript() {
		let x, i, j, selElmnt, a, b, c;
		x = document.getElementsByClassName("select-wrapper");

		for (i = 0; i < x.length; i++) {
			selElmnt = x[i].getElementsByTagName("select")[0];
			a = document.createElement("DIV");
			a.setAttribute("class", "select-selected");
			a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
			x[i].appendChild(a);
			b = document.createElement("DIV");
			b.setAttribute("class", "select-items select-hide");

			for (j = 1; j < selElmnt.length; j++) {
				c = document.createElement("DIV");
				c.dataset.value = selElmnt.options[j].value;
				c.innerHTML = selElmnt.options[j].innerHTML;

				c.addEventListener("click", function (e) {
					let y, i, k, s, h;
					s = this.parentNode.parentNode.getElementsByTagName("select")[0];
					h = this.parentNode.previousSibling;

					Pwinty.updateAttribute(s, this.dataset.value);

					for (i = 0; i < s.length; i++) {
						if (s.options[i].innerHTML == this.innerHTML) {
							s.selectedIndex = i;
							h.innerHTML = this.innerHTML;
							y = this.parentNode.getElementsByClassName("same-as-selected");
							for (k = 0; k < y.length; k++) y[k].removeAttribute("class");
							this.setAttribute("class", "same-as-selected");
							break;
						}
					}
					h.click();
				});
				b.appendChild(c);
			}
			x[i].appendChild(b);

			a.addEventListener("click", function (e) {
				e.stopPropagation();
				closeAllSelect(this);
				this.nextSibling.classList.toggle("select-hide");
				this.classList.toggle("select-arrow-active");
			});
		}
		document.addEventListener("click", closeAllSelect(this));
	}

	updateAttribute(attribute, optionValue = "") {
		if (optionValue === "") this.attributes[attribute.name] = attribute.options[attribute.selectedIndex].value;
		else this.attributes[attribute.name] = optionValue;

		this.checkAttributes();
		//this.printInfo();
	}

	hideAttribute(attributeName) {
		let attributeItem = document.getElementById(attributeName);
		attributeItem.parentNode.parentNode.setAttribute("style", "display: none");
		this.attributes[attributeName] = undefined;
	}

	displayAttribute(attributeName) {
		let attributeItem = document.getElementById(attributeName);
		attributeItem.parentNode.parentNode.setAttribute("style", "display: block");
	}

	checkAttributes() {
		let nbAttributes = this.checkDisabledAttributes();
		let selectedAttributes = 0;

		Object.keys(this.attributes).forEach(attribute => {
			if (this.attributes[attribute]) selectedAttributes++;
		});

		if (selectedAttributes >= nbAttributes) this.generateSku();
	}

	checkDisabledAttributes() {
		let nbAttributes = Object.keys(this.attributes).length;
		if (this.attributes["mountType"]) {
			if (this.attributes["mountType"] === "NM") {
				this.hideAttribute("mountColour");
				nbAttributes--;
			} else this.displayAttribute("mountColour");
		}
		if (this.category === "CAN" && this.subcategory === "ROL" && this.attributes["substrateType"]) {
			if (this.attributes["substrateType"] === "PC") {
				this.hideAttribute("glaze");
				nbAttributes--;
			} else this.displayAttribute("glaze");
		}

		return nbAttributes;
	}

	generateSku() {
		this.SKU = "";
		if (this.category === "FRA") {
			this.SKU += this.category + "-" + this.subcategory + "-" + this.attributes["substrateType"] + "-";
			if (this.attributes["depth"])
				this.SKU =
					this.category + "-" + this.subcategory + this.attributes["depth"] + "-" + this.attributes["substrateType"] + "-";

			if (this.attributes["mountType"]) this.SKU += this.attributes["mountType"] + "-";
			else if (this.category === "FRA" && !this.attributes["mountType"]) this.SKU += "NM" + "-";
			if (this.attributes["glaze"]) this.SKU += this.attributes["glaze"] + "-";
			this.SKU += this.attributes["size"];
		} else if (this.category === "CAN") {
			if (this.subcategory === "ROL") {
				this.SKU +=
					this.category + "-" + this.subcategory + "-" + this.attributes["substrateType"] + "-" + this.attributes["size"];
				if (this.attributes["glaze"] && this.attributes["glaze"] !== "NONE") this.SKU += "-VAR";
			} else {
				this.SKU = "GLOBAL" + "-";
				if (this.subcategory !== "STR") this.SKU += this.subcategory + "-";
				this.SKU += this.category + "-" + this.attributes["size"];
			}
		} else if (this.category === "PRINT") {
			if (this.subcategory === "GLOBAL") this.SKU = this.subcategory + "-" + this.attributes["substrateType"] + "-";
			this.SKU += this.attributes["size"];
		}

		console.log(this.SKU);
		this.generatePricing();
	}

	async generatePricing() {
		let countryCode = await this.fetchCountryCode();
		fetch(`/api/pwinty/pricing/${countryCode}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json"
			},
			body: JSON.stringify({ items: [{ SKU: this.SKU, quantity: 1 }] })
		})
			.then(res => {
				return res.json();
			})
			.then(data => {
				if (data.response.unitPriceIncludingTax) {
					if (data.response.unitPriceIncludingTax === 0) throw new Error(ERROR_MESSAGE.notFoundCatalog);
					this.price = data.response.unitPriceIncludingTax;
					this.displayPricing();
				} else throw new Error(ERROR_MESSAGE.notFoundCatalog);
			})
			.catch(err => {
				this.hidePricing();
				let alert = createAlertNode(
					err.message,
					"warning",
					"position: fixed;z-index: 33;margin: -5% 50% 0 50%;transform: translate(-50%,0px);"
				);
				addAlert(alert, "#header");
			});
	}

	displayPricing() {
		document.getElementById("price").innerHTML = this.price + "€";
		document.getElementById("purchasebox").setAttribute("style", "display: block");
	}

	async cartAdd(itemId, caller) {
		let SKU = this.SKU;
		let attributes = this.attributes;
		attributes.category = this.category;
		attributes.subcategory = this.subcategory;
		let price = this.price;
		let countryCode = await this.fetchCountryCode();

		caller.disabled = true;
		caller.style.pointerEvents = "none";
		setTimeout(() => {
			caller.disabled = false;
			caller.style.pointerEvents = "auto";
		}, 1500);

		//fetch delivery pricing
		await fetch(`/api/pwinty/pricing/${countryCode}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json"
			},
			body: JSON.stringify({ items: [{ SKU: SKU, quantity: 1 }] }),
			credentials: "include",
			mode: "same-origin"
		})
			.then(res => {
				return res.json();
			})
			.then(async function (response) {
				if (response.error === true || response.response.length <= 0) {
					let alert = createAlertNode(
						"Sorry, there are no shipment options available to the selected destination for these products",
						"warning",
						"position: fixed;z-index: 33;margin: -5% 50% 0 50%;transform: translate(-50%,0px);"
					);
					addAlert(alert, "#header");
					return;
				} else {
					await fetch(`/api/cart/add/pwinty/${itemId}`, {
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
							let alertType = "success";
							if (response.error === false) {
								let totalQty = response.cart.totalQty;
								document.getElementById("cartQty").innerText = totalQty;
							} else alertType = "warning";

							let alert = createAlertNode(
								response.message,
								alertType,
								"position: fixed;z-index: 33;margin: -5% 50% 0 50%;transform: translate(-50%,0px);"
							);
							addAlert(alert, "#header");
						})
						.catch(err => {
							let alert = createAlertNode(
								response.message,
								alertType,
								"position: fixed;z-index: 33;margin: -5% 50% 0 50%;transform: translate(-50%,0px);"
							);
							addAlert(alert, "#header");
						});
				}
			})
			.catch(err => {
				let alert = createAlertNode(
					ERROR_MESSAGE.noShipment,
					alertType,
					"position: fixed;z-index: 33;margin: -5% 50% 0 50%;transform: translate(-50%,0px);"
				);
				addAlert(alert, "#header");
			});

		return;
	}

	async fetchCountryCode() {
		let countryCode = await fetch("/api/user/countryCode/", {
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
				if (response.error === false) return response.countryCode;
				else {
					let alert = createAlertNode(
						response.message,
						"warning",
						"position: fixed;z-index: 33;margin: -5% 50% 0 50%;transform: translate(-50%,0px);"
					);
					addAlert(alert, "#header");
					return "FR";
				}
			})
			.catch(err => {
				console.log(err);
				let alert = createAlertNode(
					ERROR_MESSAGE.countryCode,
					"warning",
					"position: fixed;z-index: 33;margin: -5% 50% 0 50%;transform: translate(-50%,0px);"
				);
				addAlert(alert, "#header");
				return "FR";
			});
		return countryCode;
	}

	hidePricing() {
		document.getElementById("purchasebox").setAttribute("style", "display: none");
	}
	printInfo() {
		console.log(this);
	}
}

let Pwinty;
function loadCategory(item) {
	Pwinty = new PwintyObject(item);
	Pwinty.printInfo();
	return;
}
