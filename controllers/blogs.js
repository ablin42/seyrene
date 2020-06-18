const express = require("express");
const router = express.Router();
const { vBlog } = require("./validators/vBlog");

const Blog = require("../models/Blog");
const { ROLE, setUser, authUser, authRole } = require("./helpers/verifySession");
const bHelpers = require("./helpers/blogHelpers");
const utils = require("./helpers/utils");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");

async function formatBlogData(blogs) {
	let arr = [];
	for (let i = 0; i < blogs.length; i++) {
		let images = blogs[i].content.match(/<img src=(["'])(?:(?=(\\?))\2.)*?\1>/);
		let obj = {
			_id: blogs[i]._id,
			title: blogs[i].title,
			content: blogs[i].content,
			shorttitle: blogs[i].title.substr(0, 128),
			shortcontent: blogs[i].content.replace(/<img src=(["'])(?:(?=(\\?))\2.)*?\1>/g, "").substr(0, 512),
			thumbnail: images,
			date: blogs[i].date,
			createdAt: blogs[i].createdAt,
			updatedAt: blogs[i].updatedAt,
			author: blogs[i].author,
			__v: blogs[i].__v
		};
		if (images && images.length > 1) obj.thumbnail = images[0];
		arr.push(obj);
	}
	return arr;
}

//blog pagination
router.get("/", setUser, async (req, res) => {
	try {
		const options = {
			page: parseInt(req.query.page, 10) || 1,
			limit: 6,
			sort: { date: -1 }
		};
		let result = await bHelpers.getBlogs(options);
		result = await formatBlogData(result);

		return res.status(200).json(result);
	} catch (err) {
		console.log("BLOG FETCH ERROR", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

// get a blog object
router.get("/single/:blogId", setUser, async (req, res) => {
	try {
		let [err, blog] = await utils.to(Blog.findById(req.params.blogId));
		if (err) throw new Error(ERROR_MESSAGE.fetchBlog);

		if (blog === null) throw new Error(ERROR_MESSAGE.blogNotFound);
		blog = await bHelpers.parseBlogs(blog, true);

		return res.status(200).json(blog);
	} catch (err) {
		console.log("ERROR FETCHING A BLOG:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

// post a blog
router.post("/", setUser, authUser, authRole(ROLE.ADMIN), vBlog, async (req, res) => {
	try {
		const obj = {
			//sanitize
			authorId: req.user._id,
			title: req.body.title,
			content: req.body.content
		};
		req.session.formData = { title: obj.title, content: obj.content };

		const blog = new Blog(obj);
		let [err, savedBlog] = await utils.to(blog.save());
		if (err) throw new Error(ERROR_MESSAGE.saveBlog);

		req.flash("success", "Post successfully uploaded");
		return res.status(200).redirect(`/Admin/Blog/Patch/${blog._id}`);
	} catch (err) {
		console.log("POST BLOG ERROR", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Admin/Blog/Post");
	}
});

// patch a blog
router.post("/patch/:blogId", setUser, authUser, authRole(ROLE.ADMIN), vBlog, async (req, res) => {
	try {
		let id = req.params.blogId;
		req.session.formData = {
			title: req.body.title,
			content: req.body.content
		};

		let [err, patchedBlog] = await utils.to(
			Blog.updateOne({ _id: id }, { $set: { title: req.body.title, content: req.body.content } })
		);
		if (err) throw new Error(ERROR_MESSAGE.saveBlog);

		req.flash("success", "Post corrigé avec succès");
		return res.status(200).redirect(`/Blog/${req.params.blogId}`);
	} catch (err) {
		console.log("PATCH BLOG ERROR", err);
		req.flash("warning", err.message);
		return res.status(400).redirect(`/Admin/Blog/Patch/${req.params.blogId}`);
	}
});

// delete a blog
router.get("/delete/:blogId", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let blogId = req.params.blogId;

		let [err, removedBlog] = await utils.to(Blog.deleteOne({ _id: blogId }));
		if (err) throw new Error(ERROR_MESSAGE.delBlog);

		req.flash("success", "Item successfully deleted!");
		return res.status(200).redirect("/About");
	} catch (err) {
		console.log("DELETE BLOG ERROR", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/About");
	}
});

module.exports = router;
