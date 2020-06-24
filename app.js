const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("express-flash");
const expressSanitizer = require("express-sanitizer");
const sanitize = require("mongo-sanitize");
require("dotenv").config();

const { setUser } = require("./controllers/helpers/verifySession");

//Connect to DB
mongoose.connect(
	process.env.DB_CONNECTION,
	{
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false,
		useUnifiedTopology: true
	},
	err => {
		if (err) throw err;
		console.log("Connected to database");
	}
);

// Express
const app = express();
app.use(express.static(__dirname + "/public"));

// Middleware
//-- Body parser --//
// Parse app/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true, limit: 100000000 }));
// Parse app/json
app.use(bodyParser.json({ limit: 100000000 }));
//-- Cross origin --//
app.use(cors());
//-- Cookie parser --//
app.use(cookieParser());
//-- Express Session --//
app.use(
	session({
		secret: "keyboard cat",
		resave: false,
		saveUninitialized: true,
		cookie: { maxAge: 180 * 60 * 1000 }, //, sameSite: 'none', secure: true}, // 180 = 3mn
		sameSite: "Lax" //remove if bug
	})
);

//-- Flash --//
app.use(flash());
// Mount express-sanitizer middleware here
app.use(expressSanitizer());

app.use((req, res, next) => {
	res.locals.session = req.session;
	next();
});

app.use((req, res, next) => {
	req.body = sanitize(req.body);
	req.query = sanitize(req.query);

	next();
});

// Routes
const pagesRoute = require("./controllers/pages");
const authRoute = require("./controllers/auth");
const blogsRoute = require("./controllers/blogs");
const userRoute = require("./controllers/user");
const contactRoute = require("./controllers/contact");
const galleryRoute = require("./controllers/galleries");
const cartRoute = require("./controllers/cart");
const shopRoute = require("./controllers/shop");
const orderRoute = require("./controllers/order");
const frontRoute = require("./controllers/front");
const imageRoute = require("./controllers/images");
const pwintyRoute = require("./controllers/pwinty");
const stripeRoute = require("./controllers/stripe");

app.use("/", pagesRoute);
app.use("/api/auth", authRoute);
app.use("/api/blog", blogsRoute);
app.use("/api/user", userRoute);
app.use("/api/contact", contactRoute);
app.use("/api/gallery", galleryRoute);
app.use("/api/cart", cartRoute);
app.use("/api/shop", shopRoute);
app.use("/api/order", orderRoute);
app.use("/api/front", frontRoute);
app.use("/api/image", imageRoute);
app.use("/api/pwinty", pwintyRoute);
app.use("/api/stripe", stripeRoute);

// Handles multer error
app.use((err, req, res, next) => {
	// treat as 404
	if (err.message && (~err.message.indexOf("not found") || ~err.message.indexOf("Cast to ObjectId failed"))) {
		return next();
	}
	console.error(err.stack);

	// multer error
	if (
		req.originalUrl.indexOf("/api/gallery/") != -1 ||
		req.originalUrl.indexOf("/api/shop/") != -1 ||
		req.originalUrl.indexOf("/api/front/") != -1
	)
		return res.status(500).json({ url: "/", message: err.message, err: true });

	if (err.message) console.log(err.message);
	return res.status(500).redirect("back");
});

// set the view engine to ejs
app.set("view engine", "ejs");

app.get("*", setUser, (req, res) => {
	try {
		let obj = { active: "404" };
		if (req.user) obj.user = req.user;

		return res.status(404).render("404", obj);
	} catch (err) {
		console.log("404 ROUTE ERROR", err);
		return res.status(404).render("404", obj);
	}
});

const port = process.env.PORT || 8089;
app.listen(port, () => console.log(`Listening on port ${port}...`));
