const Money = require("money-exchange");
const rp = require("request-promise");
require("dotenv").config();
const fx = new Money();
fx.init();
const formatter = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR"
});
const { ERROR_MESSAGE } = require("./errorMessages");
const { attributesList } = require("./pwintyData");

module.exports = {
	genPricingObj: function (items) {
		let result = [];

		items.forEach(item => {
			if (item && item.attributes && item.attributes.isUnique !== true) {
				let obj = {
					sku: item.elements[0].attributes.SKU,
					quantity: item.qty
				};
				result.push(obj);
			} else if (item && item.SKU) {
				let obj = {
					sku: item.SKU,
					quantity: item.quantity
				};
				result.push(obj);
			}
		});
		return result;
	},
	add99ct: function (price) {
		let priceWith99 = price.toString().slice(0, -2);
		priceWith99 = priceWith99 + 99;

		return priceWith99;
	},
	calculateMargin: function (price) {
		switch (true) {
			case price < 3500:
				return price * 1.35;
				break;
			case price >= 3500 && price < 5000:
				return price * 1.3;
				break;
			case price >= 5000 && price < 8000:
				return price * 1.4;
				break;
			case price >= 8000 && price < 10000:
				return price * 1.45;
				break;
			case price >= 10000:
				return price * 1.5;
				break;
			default:
				return price * 1.35;
				break;
		}
	},
	sumUnitWithTax: function (items) {
		let total = 0;
		items.forEach(item => {
			total += this.calculateMargin(item.unitPriceIncludingTax);
		});

		return total;
	},
	sumUnitWithoutTax: function (items) {
		let total = 0;
		items.forEach(item => {
			total += this.calculateMargin(item.unitPriceExcludingTax);
		});

		return total;
	},
	addMargin: function (shipmentOption) {
		let appliedMargin = {
			unitPriceIncludingTax: this.calculateMargin(shipmentOption.shipments[0].items[0].unitPriceIncludingTax),
			//might be an addition of multiple items with different margin range
			totalPriceIncludingTax: this.sumUnitWithTax(shipmentOption.shipments[0].items) + shipmentOption.shippingPriceIncludingTax,
			//might be an addition of multiple items with different margin range
			totalPriceExcludingTax:
				this.sumUnitWithoutTax(shipmentOption.shipments[0].items) + shipmentOption.shippingPriceExcludingTax,
			shippingPriceIncludingTax: shipmentOption.shippingPriceIncludingTax,
			shippingPriceExcludingTax: shipmentOption.shippingPriceExcludingTax,
			shipments: shipmentOption.shipments
		};
		appliedMargin.shipments[0].items[0].unitPriceIncludingTax = this.calculateMargin(
			appliedMargin.shipments[0].items[0].unitPriceIncludingTax
		);
		appliedMargin.shipments[0].items[0].unitPriceExcludingTax = this.calculateMargin(
			appliedMargin.shipments[0].items[0].unitPriceExcludingTax
		);
		appliedMargin.shipments[0].items[0].totalPriceIncludingTax = this.calculateMargin(
			appliedMargin.shipments[0].items[0].totalPriceIncludingTax
		);
		appliedMargin.shipments[0].items[0].totalPriceExcludingTax = this.calculateMargin(
			appliedMargin.shipments[0].items[0].totalPriceExcludingTax
		);

		console.log(appliedMargin, appliedMargin.shipments[0].items[0]);
		return appliedMargin;
	},
	treatShipment: function (shipmentOptions) {
		let formatted = [];

		shipmentOptions.forEach(shipmentOption => {
			if (shipmentOption.isAvailable && shipmentOption.shippingMethod === "Standard") {
				let margined = this.addMargin(shipmentOption);

				formatted = {
					isAvailable: shipmentOption.isAvailable,
					unitPriceIncludingTax: formatter
						.format(fx.convert(margined.shipments[0].items[0].unitPriceIncludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					totalPriceIncludingTax: formatter
						.format(fx.convert(margined.totalPriceIncludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					totalPriceExcludingTax: formatter
						.format(fx.convert(margined.totalPriceExcludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					shippingMethod: shipmentOption.shippingMethod,
					shippingPriceIncludingTax: formatter
						.format(fx.convert(margined.shippingPriceIncludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					shippingPriceExcludingTax: formatter
						.format(fx.convert(margined.shippingPriceExcludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					shipments: margined.shipments
				};
				console.log(formatted.unitPriceIncludingTax);
			}
		});

		return formatted;
	},
	formatAttributes: function (element) {
		let details = "";
		Object.keys(element.attributes).forEach(attribute => {
			if (attributesList.indexOf(attribute) >= 0) {
				details +=
					attribute.charAt(0).toUpperCase() +
					attribute.slice(1) +
					": " +
					element.attributes[attribute].charAt(0).toUpperCase() +
					element.attributes[attribute].slice(1) +
					" / ";
			}
		});
		details = details.substr(0, details.length - 3);

		return details;
	},
	getDeliveryPrice: async function (req, cart, isoCode) {
		let options = {
			uri: `${process.env.BASEURL}/api/pwinty/pricing/${isoCode}`,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
				"CSRF-Token": req.csrfToken(),
				"cookie": req.headers.cookie
			},
			body: { items: cart.generatePwintyArray() },
			json: true
		};
		let result = await rp(options);
		if (result.error === true || result.response.length <= 0) throw new Error(ERROR_MESSAGE.noShipment);

		return result;
	},
	formatPwintyItems: function (item) {
		let obj = [];
		item.elements.forEach(element => {
			if (element.attributes) {
				itemObj = {
					item: item.attributes,
					attributes: element.attributes,
					stringifiedAttributes: JSON.stringify(element.attributes),
					qty: element.qty,
					unitPrice: item.unitPrice,
					price: formatter.format(item.unitPrice * element.qty).substr(2),
					shortcontent: item.attributes.content.substr(0, 128),
					shorttitle: item.attributes.title.substr(0, 64),
					details: ""
				};
				itemObj.details = this.formatAttributes(element);

				obj.push(itemObj);
			}
		});

		return obj;
	},
	cancelPwintyOrder: async function (pwintyOrderId) {
		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/pwinty/orders/${pwintyOrderId}`,
			body: {},
			json: true,
			headers: {
				ACCESS_TOKEN: process.env.ACCESS_TOKEN
			}
		};
		let response = await rp(options);
		if (response.error === true) throw new Error(ERROR_MESSAGE.fetchStatus);
		if (response.response.canCancel !== true) throw new Error(ERROR_MESSAGE.badOrderStatus);

		options.method = "POST";
		options.uri = `${process.env.BASEURL}/api/pwinty/orders/${pwintyOrderId}/submit`;
		options.body = { status: "Cancelled" };
		response = await rp(options);
		if (response.error === true) throw new Error(ERROR_MESSAGE.cancelOrder);

		return;
	}
};
