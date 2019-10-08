const format = require('date-format');
const utils = require('../helpers/utils');
const Blog = require('../../models/Blog');
const User = require('../../models/User');

module.exports = {
    getName: async function (authorId) {
        var err, user;
        [err, user] = await utils.to(User.findById(authorId));
        if (err)
            throw new Error("An error occured while looking for author's name")
        return user.name;
    },
    objBlog: async function (item) {
        let obj = {
            _id: item._id,
            author: "",
            title: item.title,
            content: item.content,
            date: format.asString("Le dd/MM/yy à hh:mm:ss", new Date(item.date)),
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
        var err, query, blogsParsed;
        [err, query] = await utils.to(Blog.paginate({}, options));
        if (err)
            throw new Error("An error occured while fetching blogs");
        const blogs = query.docs;
        blogsParsed = await this.parseBlogs(blogs);
    
        return blogsParsed;
    }
}


