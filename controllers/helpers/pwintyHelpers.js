const Money = require("money-exchange");
const rp = require("request-promise");
const country = require("country-list-js");
require("dotenv").config();
const fx = new Money();
fx.init();
const formatter = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR"
});
const utils = require("./utils");
const { ERROR_MESSAGE } = require("./errorMessages");

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
	treatShipment: function (shipmentOptions) {
		let formatted = [];

		shipmentOptions.forEach(shipmentOption => {
			if (shipmentOption.isAvailable && shipmentOption.shippingMethod === "Standard") {
				formatted = {
					isAvailable: shipmentOption.isAvailable,
					unitPriceIncludingTax: formatter
						.format(fx.convert(shipmentOption.shipments[0].items[0].unitPriceIncludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					totalPriceIncludingTax: formatter
						.format(fx.convert(shipmentOption.totalPriceIncludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					totalPriceExcludingTax: formatter
						.format(fx.convert(shipmentOption.totalPriceExcludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					shippingMethod: shipmentOption.shippingMethod,
					shippingPriceIncludingTax: formatter
						.format(fx.convert(shipmentOption.shippingPriceIncludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					shippingPriceExcludingTax: formatter
						.format(fx.convert(shipmentOption.shippingPriceExcludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					shipments: shipmentOption.shipments
				};
			}
		});

		return formatted;
	},
	formatAttributes: function (element) {
		let details = "";
		Object.keys(element.attributes).forEach(attribute => {
			details +=
				attribute.charAt(0).toUpperCase() +
				attribute.slice(1) +
				": " +
				element.attributes[attribute].charAt(0).toUpperCase() +
				element.attributes[attribute].slice(1) +
				" / ";
		});
		details = details.substr(0, details.length - 3);

		return details;
	},
	getDeliveryPrice: async function (req, cart, countryName) {
		let countryCode = country.findByName(utils.toTitleCase(countryName));
		if (countryCode) countryCode = countryCode.code.iso2;
		else throw new Error(ERROR_MESSAGE.countryCode);

		let options = {
			uri: `${process.env.BASEURL}/api/pwinty/pricing/${countryCode}`,
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
