const { ERROR_MESSAGE } = require("./errorMessages");
const utils = require("./utils");
const Image = require("../../models/Image");

module.exports = {
	parseTags: function (tags) {
		try {
			if (tags) {
				let parsed = JSON.parse(tags);
				let trimmed = parsed.map(item => {
					return (item = item.trim());
				});

				return trimmed;
			} else return [];
		} catch (err) {
			throw new Error(ERROR_MESSAGE.serverError);
		}
	},
	fetchMainImg: async function (galleries) {
		let arr = [];
		for (let i = 0; i < galleries.length; i++) {
			let obj = {
				_id: galleries[i]._id,
				title: galleries[i].title,
				content: galleries[i].content,
				shortcontent: galleries[i].content.substr(0, 128),
				shorttitle: galleries[i].title.substr(0, 64),
				date: galleries[i].date,
				createdAt: galleries[i].createdAt,
				updatedAt: galleries[i].updatedAt,
				tags: galleries[i].tags,
				mainImgId: "",
				__v: galleries[i].__v
			};
			let [err, img] = await utils.to(Image.findOne({ _itemId: galleries[i]._id, itemType: "Gallery", isMain: true }));
			if (err || img == null) throw new Error(ERROR_MESSAGE.fetchImg);
			obj.mainImgId = img._id;
			arr.push(obj);
		}
		return arr;
	}
};
