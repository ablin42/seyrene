const utils = require("../helpers/utils");
const Image = require("../../models/Image");
const { ERROR_MESSAGE } = require("./errorMessages");
const formatter = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR"
});

module.exports = {
	parse: async function (shopItems) {
		let arr = [];
		for (let i = 0; i < shopItems.length; i++) {
			let obj = {
				_id: shopItems[i]._id,
				title: shopItems[i].title,
				content: shopItems[i].content,
				shortcontent: shopItems[i].content.substr(0, 256),
				shorttitle: shopItems[i].title.substr(0, 100),
				price: formatter.format(shopItems[i].price).substr(2),
				date: shopItems[i].date,
				createdAt: shopItems[i].createdAt,
				updatedAt: shopItems[i].updatedAt,
				mainImgId: "",
				__v: shopItems[i].__v
			};

			let [err, img] = await utils.to(Image.findOne({ _itemId: shopItems[i]._id, itemType: "Shop", isMain: true }));
			if (err || img == null) throw new Error(ERROR_MESSAGE.fetchImg);

			obj.mainImgId = img._id;
			arr.push(obj);
		}
		return arr;
	}
};
