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
				_id: galleries[parseInt(i)]._id,
				title: galleries[parseInt(i)].title,
				content: galleries[parseInt(i)].content,
				shortcontent: galleries[parseInt(i)].content.substr(0, 128),
				shorttitle: galleries[parseInt(i)].title.substr(0, 64),
				date: galleries[parseInt(i)].date,
				createdAt: galleries[parseInt(i)].createdAt,
				updatedAt: galleries[parseInt(i)].updatedAt,
				tags: galleries[parseInt(i)].tags,
				mainImgId: "",
				__v: galleries[parseInt(i)].__v
			};
			let [err, img] = await utils.to(Image.findOne({ _itemId: galleries[parseInt(i)]._id, itemType: "Gallery", isMain: true }));
			if (err || !img) throw new Error(ERROR_MESSAGE.fetchImg);
			obj.mainImgId = img._id;
			arr.push(obj);
		}

		return arr;
	}
};
