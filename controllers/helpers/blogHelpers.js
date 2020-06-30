const format = require("date-format");
const utils = require("../helpers/utils");
const Blog = require("../../models/Blog");
const User = require("../../models/User");
const { ERROR_MESSAGE } = require("./errorMessages");

module.exports = {
	getName: async function (authorId) {
		let [err, user] = await utils.to(User.findById(authorId));
		if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);

		return user.name;
	},
	objBlog: async function (item) {
		let obj = {
			_id: item._id,
			author: "",
			title: item.title,
			content: item.content,
			date: format.asString("le dd/MM/yy à hh:mm:ss", new Date(item.date)),
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
			__v: 0
		};

		obj.author = await this.getName(item.authorId);
		return obj;
	},
	parseBlogs: async function (blogs, one = false) {
		let blogsParsed = [];

		if (one === false) {
			for (let item of blogs) {
				let obj = await this.objBlog(item);
				blogsParsed.push(obj);
			}
		} else {
			let obj = await this.objBlog(blogs);
			return obj;
		}

		return blogsParsed;
	},
	getBlogs: async function (options) {
		let err, query, blogsParsed;

		[err, query] = await utils.to(Blog.paginate({}, options));
		if (err) throw new Error(ERROR_MESSAGE.fetchError);
		const blogs = query.docs;
		blogsParsed = await this.parseBlogs(blogs);

		return blogsParsed;
	},
	formatBlogData: async function (blogs) {
		let arr = [];
		for (let i = 0; i < blogs.length; i++) {
			let images = blogs[parseInt(i)].content.match(/<img src=(["'])(?:(?=(\\?))\2.)*?\1>/);
			let obj = {
				_id: blogs[parseInt(i)]._id,
				title: blogs[parseInt(i)].title,
				content: blogs[parseInt(i)].content,
				shorttitle: blogs[parseInt(i)].title.substr(0, 128),
				shortcontent: blogs[parseInt(i)].content.replace(/<img src=(["'])(?:(?=(\\?))\2.)*?\1>/g, "").substr(0, 512),
				thumbnail: images,
				date: blogs[parseInt(i)].date,
				createdAt: blogs[parseInt(i)].createdAt,
				updatedAt: blogs[parseInt(i)].updatedAt,
				author: blogs[parseInt(i)].author,
				__v: blogs[parseInt(i)].__v
			};
			if (images && images.length > 1) obj.thumbnail = images[0];
			arr.push(obj);
		}
		return arr;
	}
};
