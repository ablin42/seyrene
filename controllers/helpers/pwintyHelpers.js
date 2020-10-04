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
const utils = require("./utils");

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
			total += parseFloat(item.unitPriceIncludingTax) * item.quantity;
		});

		return parseInt(total * 100);
	},
	sumUnitWithoutTax: function (items) {
		let total = 0;
		items.forEach(item => {
			total += parseFloat(item.unitPriceExcludingTax) * item.quantity;
		});

		return parseInt(total * 100);
	},
	addMargin: function (shipmentOption) {
		let appliedMargin = {
			unitPriceIncludingTax: this.calculateMargin(shipmentOption.shipments[0].items[0].unitPriceIncludingTax),

			shippingPriceIncludingTax: this.convertPrice(shipmentOption.shippingPriceIncludingTax),
			shippingPriceExcludingTax: this.convertPrice(shipmentOption.shippingPriceExcludingTax),
			shipments: shipmentOption.shipments,

			totalPriceIncludingTax: 0,
			totalPriceExcludingTax: 0
		};

		shipmentOption.shipments.forEach((shipment, index) => {
			appliedMargin.shipments[index].shippingPriceIncludingTax = this.convertPrice(shipment.shippingPriceIncludingTax);
			appliedMargin.shipments[index].shippingPriceExcludingTax = this.convertPrice(shipment.shippingPriceExcludingTax);

			let items = [];
			shipment.items.forEach(item => {
				let obj = {
					identifier: item.identifier,
					sku: item.sku,
					unitPriceIncludingTax: this.add99ct(this.convertPrice(this.calculateMargin(item.unitPriceIncludingTax))),
					unitPriceExcludingTax: this.convertPrice(this.calculateMargin(item.unitPriceExcludingTax)),
					quantity: item.quantity
				};
				obj.totalPriceIncludingTax += obj.unitPriceIncludingTax * obj.quantity;
				obj.totalPriceExcludingTax += obj.unitPriceExcludingTax * obj.quantity;

				items.push(obj);
			});
			appliedMargin.shipments[index].items = items;

			appliedMargin.totalPriceIncludingTax += parseFloat(this.sumUnitWithTax(appliedMargin.shipments[index].items) / 100);
			appliedMargin.totalPriceIncludingTax += parseFloat(shipment.shippingPriceIncludingTax);

			appliedMargin.totalPriceExcludingTax += parseFloat(this.sumUnitWithoutTax(appliedMargin.shipments[index].items) / 100);
			appliedMargin.totalPriceExcludingTax += parseFloat(shipment.shippingPriceExcludingTax);
		});

		return appliedMargin;
	},
	convertPrice: function (price) {
		return utils.parsePrice(fx.convert(price / 100, "GBP", "EUR"));
	},
	treatShipment: function (shipmentOptions) {
		let formatted = [];

		shipmentOptions.forEach(shipmentOption => {
			if (shipmentOption.isAvailable && shipmentOption.shippingMethod === "Standard") {
				let margined = this.addMargin(shipmentOption);

				formatted = {
					isAvailable: shipmentOption.isAvailable,
					unitPriceIncludingTax: this.add99ct(this.convertPrice(margined.unitPriceIncludingTax)),

					totalPriceIncludingTax: margined.totalPriceIncludingTax,
					totalPriceExcludingTax: margined.totalPriceExcludingTax,

					shippingMethod: shipmentOption.shippingMethod,
					shippingPriceIncludingTax: margined.shippingPriceIncludingTax,
					shippingPriceExcludingTax: margined.shippingPriceExcludingTax,

					shipments: margined.shipments
				};
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
					price: utils.parsePrice(item.unitPrice * element.qty),
					shortcontent: item.attributes.content.substr(0, 128),
					shorttitle: item.attributes.title.substr(0, 64),
					details: "",
					mainImg: item.attributes.mainImg
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
