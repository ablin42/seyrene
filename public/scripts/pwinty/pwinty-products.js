const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

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

class PwintyObject {
	constructor(item) {
		this.SKU = "";
		this.category = item.value;
		this.subcategory = "";
		this.attributes = {};
		this.width = $('img[alt="0slide"]')[0].naturalWidth;
		this.height = $('img[alt="0slide"]')[0].naturalHeight;
		this.ratio = Math.round((this.width / this.height + Number.EPSILON) * 100) / 100;
		if (this.height > this.width) this.ratio = Math.round((this.height / this.width + Number.EPSILON) * 100) / 100;
		this.megapixel = this.width * this.height;

		document.getElementById("subcategories").innerHTML = "";
		document.getElementById("attributes").innerHTML = "";
		document.querySelector("[data-attributes]").classList.add("nodisplay");
		this.hidePricing();

		let selection = "";
		Object.keys(PWINTY_ITEMS[this.category]).forEach(subcategory => {
			let subcategoryRadio = `<label for="${subcategory}">
                                    <div class="sku-item unselectable cat-list" data-classname="active-subcat">
                                        <p>${PWINTY_ITEMS[this.category][subcategory].fullname}</p>
										<input class="pwinty-input" data-category="${this.category}" 
										name="pwinty-subcategory" id="${subcategory}" value="${subcategory}"
										type="radio" data-subload="true">
                                    </div>
                                </label>`;
			if (subcategory !== "sharedAttributes") selection += subcategoryRadio;
			document.getElementById("subcategories").innerHTML = selection;
			document.querySelector("[data-subcategories]").classList.remove("nodisplay");

			document.querySelectorAll("[data-classname]").forEach(function (item) {
				item.addEventListener("click", function () {
					toggleActive(item, item.dataset.classname);
				});
			});

			document.querySelectorAll("[data-subload]").forEach(function (item) {
				item.addEventListener("click", function () {
					Pwinty.loadSubCategory(item);
				});
			});
		});
	}

	loadSubCategory(subcategory) {
		this.hidePricing();
		this.subcategory = subcategory.value;
		this.attributes = {};

		let selection = "";
		Object.keys(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"]).forEach(attribute => {
			this.attributes[attribute] = "";

			let attributeSelect = `
				<label for="${attribute}">
                    <div class="sku-item unselectable select-list">
                        <p>${PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute].fullname}</p>
                    	<div class="select-wrapper">
							<select data-attribute="${attribute}" name="${attribute}" id="${attribute}">
								<option disabled selected>Pick one</option>`;

			Object.keys(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute]).forEach((option, i) => {
				if (attribute !== "size") {
					if (option !== "fullname")
						attributeSelect += `
							<option value="${Object.keys(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute])[i]}">\
							${Object.values(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute])[i]}</option>`;
				} else attributeSelect = this.checkSize(attributeSelect, "sharedAttributes", i);
			});

			attributeSelect += `
							</select>
						</div>
                    </div>
                </label>`;
			selection += attributeSelect;
		});

		Object.keys(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory]).forEach(attribute => {
			if (attribute !== "fullname") {
				this.attributes[attribute] = "";
				let attributeSelect = `
					<label for="${attribute}">
                        <div class="sku-item unselectable select-list">
                            <p>${PWINTY_ITEMS[subcategory.dataset.category][this.subcategory][attribute].fullname}</p>
                            <div class="select-wrapper">
                                <select data-attribute="${attribute}" name="${attribute}" id="${attribute}">
                               	 	<option disabled selected>Pick one</option>`;

				Object.keys(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory][attribute]).forEach((option, i) => {
					if (attribute !== "size") {
						if (option !== "fullname")
							attributeSelect += `
								<option value="${Object.keys(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory][attribute])[i]}">\
								${Object.values(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory][attribute])[i]}</option>`;
					} else attributeSelect = this.checkSize(attributeSelect, this.subcategory, i);
				});

				attributeSelect += `
								</select>
							</div>
                    	</div>
                    </label>`;
				selection += attributeSelect;
			}
		});

		document.getElementById("attributes").innerHTML = selection;
		document.querySelector("[data-attributes]").classList.remove("nodisplay");

		this.selectScript();
	}

	checkSize(attributeSelect, subcategory, i) {
		let dimensions = Object.keys(PWINTY_ITEMS[this.category][subcategory]["size"])[i].split("x");

		if (isNaN(parseInt(dimensions[0]))) {
			for (let j = 0; j < A_FORMAT.length; j++) {
				if (dimensions[0] === A_FORMAT[j].code) dimensions = A_FORMAT[j].size.split("x");
			}
		}

		let sizeRatio = Math.round((dimensions[0] / dimensions[1] + Number.EPSILON) * 100) / 100;
		let ratioMarginOffset = 0.25;

		let maxDimension = parseInt(dimensions[0]);
		if (parseInt(dimensions[1]) > parseInt(dimensions[0])) {
			maxDimension = parseInt(dimensions[1]);
			sizeRatio = Math.round((dimensions[1] / dimensions[0] + Number.EPSILON) * 100) / 100;
		}

		if (this.category !== "FRA") maxDimension = maxDimension * 2.54; //conversion from inches to cm

		if (this.megapixel > 9300000) {
			if (sizeRatio > this.ratio - this.ratio * ratioMarginOffset && sizeRatio < this.ratio + this.ratio * ratioMarginOffset)
				attributeSelect += `
					<option value="${Object.keys(PWINTY_ITEMS[this.category][subcategory]["size"])[i]}">\
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
					attributeSelect += `
						<option value="${Object.keys(PWINTY_ITEMS[this.category][subcategory]["size"])[i]}">\
                        ${Object.values(PWINTY_ITEMS[this.category][subcategory]["size"])[i]}</option>`;
			}
		}

		return attributeSelect;
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
	}

	hideAttribute(attributeName) {
		let attributeItem = document.getElementById(attributeName);
		attributeItem.parentNode.parentNode.classList.add("nodisplay");
		this.attributes[attributeName] = undefined;
	}

	displayAttribute(attributeName) {
		let attributeItem = document.getElementById(attributeName);
		attributeItem.parentNode.parentNode.classList.remove("nodisplay");
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
		let response = await this.fetchCountryCode();
		let countryCode;
		if (response.error === true) {
			let alert = createAlertNode(response.message, "warning");
			addAlert(alert, "#header");
			return;
		} else countryCode = response.countryCode;

		let data = await fetch(`/api/pwinty/pricing/${countryCode}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
				"CSRF-Token": csrfToken
			},
			body: JSON.stringify({ items: [{ SKU: this.SKU, quantity: 1 }] })
		});
		data = await data.json();

		if (data.error === true || data.response.length <= 0) {
			this.hidePricing();

			let alert = createAlertNode(ERROR_MESSAGE.notFoundCatalog, "warning");
			addAlert(alert, "#header");
		} else {
			this.price = data.response.unitPriceIncludingTax;
			this.displayPricing();
		}
	}

	displayPricing() {
		document.getElementById("price").innerHTML = this.price + "€";
		document.getElementById("purchasebox").classList.remove("nodisplay");
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
		});
		let response = await countryCode.json();
		if (response.error === true) return { error: true, message: response.message };

		return { error: false, countryCode: response.countryCode };
	}

	async cartAdd(itemId, caller) {
		let SKU = this.SKU;
		let attributes = this.attributes;
		attributes.category = this.category;
		attributes.subcategory = this.subcategory;

		let response = await this.fetchCountryCode();
		let countryCode;
		if (response.error === true) {
			let alert = createAlertNode(response.message, "warning");
			addAlert(alert, "#header");
			return;
		} else countryCode = response.countryCode;

		caller.disabled = true;
		caller.style.pointerEvents = "none";
		setTimeout(() => {
			caller.disabled = false;
			caller.style.pointerEvents = "auto";
		}, 1500);

		response = await fetch(`/api/pwinty/pricing/${countryCode}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
				"CSRF-Token": csrfToken
			},
			body: JSON.stringify({ items: [{ SKU: SKU, quantity: 1 }] }),
			credentials: "include",
			mode: "same-origin"
		});
		response = await response.json();

		if (response.error === true || response.response.length <= 0) {
			let alert = createAlertNode(ERROR_MESSAGE.noShipment, "warning");
			addAlert(alert, "#header");
			return;
		} else {
			response = await fetch(`/api/cart/add/pwinty/${itemId}`, {
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

			let alertType = "success";
			if (response.error === false) {
				let totalQty = response.cart.totalQty;
				document.getElementById("cartQty").innerText = totalQty;
			} else alertType = "warning";

			let alert = createAlertNode(response.message, alertType);
			addAlert(alert, "#header");
		}
		return;
	}

	hidePricing() {
		document.getElementById("purchasebox").classList.add("nodisplay");
	}
	printInfo() {
		console.log(this);
	}
}

let Pwinty;
function loadCategory(item) {
	Pwinty = new PwintyObject(item);
	return;
}
