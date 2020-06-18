const format = require("date-format");
const utils = require("../helpers/utils");
const Blog = require("../../models/Blog");
const User = require("../../models/User");
const { ERROR_MESSAGE } = require("./errorMessages");

module.exports = {
	getName: async function (authorId) {
		let err, user;

		[err, user] = await utils.to(User.findById(authorId));
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
		if (err) throw new Error(ERROR_MESSAGE.fetchBlog);
		const blogs = query.docs;
		blogsParsed = await this.parseBlogs(blogs);

		return blogsParsed;
	}
};
