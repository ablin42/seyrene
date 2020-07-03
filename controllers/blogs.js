const express = require("express");
const router = express.Router();
const { vBlog } = require("./validators/vBlog");
const sanitize = require("mongo-sanitize");

const Blog = require("../models/Blog");
const { ROLE, setUser, authUser, authRole, authToken } = require("./helpers/middlewares");
const bHelpers = require("./helpers/blogHelpers");
const utils = require("./helpers/utils");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const { fullLog, threatLog } = require("./helpers/log4");

//blog pagination
router.get("/", async (req, res) => {
	try {
		const options = {
			page: parseInt(req.query.page, 10) || 1,
			limit: 6,
			sort: { date: -1 }
		};
		let result = await bHelpers.getBlogs(options);
		result = await bHelpers.formatBlogData(result);

		return res.status(200).json({ error: false, blogs: result });
	} catch (err) {
		threatLog.error("BLOG FETCH ERROR", err, req.headers, req.ip);
		return res.status(200).json({ error: true, message: err.message });
	}
});

// get a blog object
router.get("/single/:blogId", authToken, async (req, res) => {
	try {
		const blogId = sanitize(req.params.blogId);
		if (typeof blogId !== "string") throw new Error(ERROR_MESSAGE.fetchError);

		let [err, blog] = await utils.to(Blog.findById(blogId));
		if (err) throw new Error(ERROR_MESSAGE.fetchError);

		if (!blog) throw new Error(ERROR_MESSAGE.noResult);
		blog = await bHelpers.parseBlogs(blog, true);

		return res.status(200).json({ error: false, blog: blog });
	} catch (err) {
		threatLog.error("ERROR FETCHING A BLOG:", err, req.headers, req.ip);
		return res.status(200).json({ error: true, message: err.message });
	}
});

// post a blog
router.post("/", vBlog, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		const obj = {
			authorId: req.user._id,
			title: req.body.title,
			content: req.body.content
		};
		req.session.formData = { title: obj.title, content: obj.content };

		const blog = new Blog(obj);
		let [err, savedBlog] = await utils.to(blog.save());
		if (err || !savedBlog) throw new Error(ERROR_MESSAGE.saveError);

		fullLog.info(`Blog posted: ${blog._id}`);
		req.flash("success", ERROR_MESSAGE.itemUploaded);
		return res.status(200).redirect(`/Blog/${blog._id}`);
	} catch (err) {
		threatLog.error("POST BLOG ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Admin/Blog/Post");
	}
});

// patch a blog
router.post("/patch/:blogId", vBlog, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		const blogId = sanitize(req.params.blogId);
		req.session.formData = {
			title: req.body.title,
			content: req.body.content
		};

		let [err, patchedBlog] = await utils.to(
			Blog.updateOne({ _id: blogId }, { $set: { title: req.body.title, content: req.body.content } })
		);
		if (err || !patchedBlog) throw new Error(ERROR_MESSAGE.updateError);

		fullLog.info(`Blog patched: ${blogId}`);
		req.flash("success", ERROR_MESSAGE.itemUploaded);
		return res.status(200).redirect(`/Blog/${blogId}`);
	} catch (err) {
		threatLog.error("PATCH BLOG ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect(`/Admin/Blog/Patch/${blogId}`);
	}
});

// delete a blog
router.post("/delete/:blogId", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let blogId = sanitize(req.params.blogId);
		if (typeof blogId !== "string") throw new Error(ERROR_MESSAGE.delError);

		let [err, removedBlog] = await utils.to(Blog.deleteOne({ _id: blogId }));
		if (err) throw new Error(ERROR_MESSAGE.delError);

		fullLog.info(`Blog deleted: ${blogId}`);
		req.flash("success", ERROR_MESSAGE.itemDeleted);
		return res.status(200).redirect("/About");
	} catch (err) {
		threatLog("DELETE BLOG ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/About");
	}
});

module.exports = router;
