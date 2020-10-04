const utils = require("./utils");
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
				_id: shopItems[parseInt(i)]._id,
				title: shopItems[parseInt(i)].title,
				content: shopItems[parseInt(i)].content,
				shortcontent: shopItems[parseInt(i)].content.substr(0, 256),
				shorttitle: shopItems[parseInt(i)].title.substr(0, 100),
				price: utils.parsePrice(shopItems[parseInt(i)].price),
				date: shopItems[parseInt(i)].date,
				createdAt: shopItems[parseInt(i)].createdAt,
				updatedAt: shopItems[parseInt(i)].updatedAt,
				__v: shopItems[parseInt(i)].__v
			};

			let [err, img] = await utils.to(Image.findOne({ _itemId: shopItems[parseInt(i)]._id, itemType: "Shop", isMain: true }));
			if (err || !img) throw new Error(ERROR_MESSAGE.fetchImg);
			obj.mainImgPath = img.path;
			arr.push(obj);
		}
		return arr;
	}
};
