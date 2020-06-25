let rp = require("request-promise");
const { ERROR_MESSAGE } = require("../controllers/helpers/errorMessages");
require("dotenv").config();

module.exports = function Cart(oldCart) {
	this.items = oldCart.items || {};
	this.totalQty = oldCart.totalQty || 0;
	this.totalPrice = oldCart.totalPrice || 0;
	this.price = oldCart.price || { shippingIncludingTax: 0, shippingExcludingTax: 0, totalIncludingTax: 0, totalExcludingTax: 0 };
	this.uniquePriceTotal = oldCart.uniquePriceTotal || 0;

	/* UNIQUE */
	this.add = function (item, id) {
		item.isUnique = true;
		let storedItem = this.items[id];
		if (!storedItem) storedItem = this.items[id] = { attributes: item, qty: 1, price: 0, unitPrice: 0 };
		this.items[id].unitPrice = parseFloat(storedItem.attributes.price);

		storedItem.price = this.items[id].unitPrice.toFixed(2);
		this.totalQty++;
		this.uniquePriceTotal = parseFloat((Math.round((this.uniquePriceTotal + this.items[id].unitPrice) * 100) / 100).toFixed(2));
		this.price.totalIncludingTax += this.uniquePriceTotal;
		this.totalPrice = parseFloat((Math.round((this.totalPrice + this.items[id].unitPrice) * 100) / 100).toFixed(2));

		this.generateArray();
	};

	this.delete = function (item, id) {
		let storedItem = this.items[id];

		if (storedItem) {
			let singlePrice = parseFloat((storedItem.price / storedItem.qty).toFixed(2));
			this.items[id] = undefined;
			storedItem = undefined;
			this.totalQty--;
			this.uniquePriceTotal = parseFloat((Math.round((this.uniquePriceTotal - singlePrice) * 100) / 100).toFixed(2));
			this.price.totalIncludingTax = parseFloat(
				(Math.round((this.price.totalIncludingTax - singlePrice) * 100) / 100).toFixed(2)
			);
			this.totalPrice = parseFloat((Math.round((this.totalPrice - singlePrice) * 100) / 100).toFixed(2));
		}
	};
	/* END UNIQUE */

	this.pwintyAdd = async function (item, data) {
		let storedItem = this.items[data.SKU];
		let attributes = data.attributes;
		attributes.SKU = data.SKU;
		let retData = {
			qty: 0,
			price: 0
		};

		if (!storedItem)
			storedItem = this.items[data.SKU] = {
				attributes: item,
				elements: [{ attributes: attributes, qty: 1 }],
				qty: 1,
				price: data.price,
				unitPrice: data.price
			};
		else {
			let found = 0;
			this.items[data.SKU].qty++;
			this.items[data.SKU].price = parseFloat(
				(Math.round(this.items[data.SKU].unitPrice * this.items[data.SKU].qty * 100) / 100).toFixed(2)
			);

			storedItem.elements.forEach((element, index) => {
				if (JSON.stringify(element.attributes) === JSON.stringify(data.attributes)) {
					found++;
					this.items[data.SKU].elements[index].qty++;
					retData.qty = this.items[data.SKU].elements[index].qty;
				}
			});
			if (found === 0) storedItem.elements.push({ attributes: attributes, qty: 1 });
		}
		this.totalQty++;
		this.totalPrice = parseFloat((Math.round((this.totalPrice + data.price) * 100) / 100).toFixed(2));
		retData.price = parseFloat((Math.round(this.items[data.SKU].unitPrice * retData.qty * 100) / 100).toFixed(2));

		await this.fetchPrice();
		return retData;
	};

	this.pwintyDelete = async function (data) {
		let storedItem = this.items[data.SKU];
		let attributes = data.attributes;
		attributes.SKU = data.SKU;
		let retData = {
			qty: 0,
			price: 0
		};

		if (storedItem) {
			let unitPrice = storedItem.unitPrice;
			storedItem.elements.forEach((element, index) => {
				if (JSON.stringify(element.attributes) === JSON.stringify(data.attributes)) {
					this.items[data.SKU].elements[index].qty--;
					retData.qty = this.items[data.SKU].elements[index].qty;
					if (this.items[data.SKU].elements[index].qty <= 0) this.items[data.SKU].elements.splice(index, 1);
				}
			});
			storedItem.qty--;
			storedItem.price = parseFloat((storedItem.qty * unitPrice).toFixed(2));
			if (storedItem.qty === 0) {
				this.items[data.SKU] = undefined;
				storedItem = undefined;
			}
			this.totalQty--;
			this.totalPrice = parseFloat((Math.round((this.totalPrice - unitPrice) * 100) / 100).toFixed(2));
			retData.price = parseFloat((Math.round(unitPrice * retData.qty * 100) / 100).toFixed(2));
		}

		await this.fetchPrice();
		return retData;
	};

	this.pwintyUpdate = async function (data, qty) {
		let storedItem = this.items[data.SKU];
		let attributes = data.attributes;
		attributes.SKU = data.SKU;
		let retData = {
			qty: qty,
			price: 0
		};

		if (storedItem) {
			let unitPrice = storedItem.unitPrice;
			let qtyOffset;
			let priceOffset;
			storedItem.elements.forEach((element, index) => {
				if (JSON.stringify(element.attributes) === JSON.stringify(data.attributes)) {
					qtyOffset = qty - this.items[data.SKU].elements[index].qty;
					priceOffset = parseFloat(qtyOffset * unitPrice);
					this.items[data.SKU].elements[index].qty = qty;
					retData.qty = this.items[data.SKU].elements[index].qty;
					if (this.items[data.SKU].elements[index].qty <= 0) this.items[data.SKU].elements.splice(index, 1);
				}
			});

			storedItem.qty = storedItem.qty + qtyOffset;
			storedItem.price = parseFloat((unitPrice * storedItem.qty).toFixed(2));
			if (storedItem.qty === 0) {
				this.items[data.SKU] = undefined;
				storedItem = undefined;
			}

			this.totalQty = this.totalQty + qtyOffset;
			this.totalPrice = parseFloat((Math.round((this.totalPrice + priceOffset) * 100) / 100).toFixed(2));
			retData.price = parseFloat((Math.round(unitPrice * retData.qty * 100) / 100).toFixed(2));
		}

		await this.fetchPrice();
		return retData;
	};

	this.clearCart = function () {
		this.items = {};
		this.totalQty = 0;
		this.totalPrice = 0;
	};

	this.generateArray = function () {
		let arr = [];

		for (let id in this.items) {
			arr.push(this.items[id]);
		}
		return arr;
	};

	this.generatePwintyArray = function () {
		let arr = [];
		for (let id in this.items) {
			if (this.items[id] && !this.items[id].attributes.isUnique) arr.push(this.items[id]);
		}
		return arr;
	};

	this.fetchPrice = async function () {
		let items = this.generatePwintyArray();
		if (items.length <= 0) {
			this.price = {
				shippingIncludingTax: 0,
				shippingExcludingTax: 0,
				totalIncludingTax: this.uniquePriceTotal,
				totalExcludingTax: 0
			};
			return;
		}

		let countryCode = await this.fetchCountryCode();

		let options = {
			uri: `${process.env.BASEURL}/api/pwinty/pricing/${countryCode}`,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json"
			},
			body: { items: items },
			json: true
		};

		let obj = await rp(options);
		if (obj.error === true || obj.response.length <= 0) {
			this.clearCart();
			throw new Error(ERROR_MESSAGE.noShipment);
		} else {
			this.price = {
				shippingIncludingTax: parseFloat(obj.response.shippingPriceIncludingTax),
				shippingExcludingTax: parseFloat(obj.response.shippingPriceExcludingTax),
				totalIncludingTax: parseFloat(obj.response.totalPriceIncludingTax) + this.uniquePriceTotal,
				totalExcludingTax: parseFloat(obj.response.totalPriceExcludingTax)
			};
		}
	};

	this.fetchCountryCode = async function () {
		let options = {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json"
			},
			credentials: "include",
			mode: "same-origin"
		};

		let response = await rp(`${process.env.BASEURL}/api/user/countryCode/`, options);
		if (response.error === false) return response.countryCode;
		return "FR"; ///// defaults return fr, might need to return an error though
	};
};
