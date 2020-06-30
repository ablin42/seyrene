const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const morgan = require("morgan");
const csrf = require("csurf");
const flash = require("express-flash");
const expressSanitizer = require("express-sanitizer");
var rfs = require("rotating-file-stream");
const path = require("path");
const sanitize = require("mongo-sanitize");
const MongoStore = require("connect-mongo")(session);
const { setUser } = require("./controllers/helpers/verifySession");
require("dotenv").config();

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
const { ERROR_MESSAGE } = require("./controllers/helpers/errorMessages");

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

// For logging filenames
const pad = num => (num > 9 ? "" : "0") + num;
const generator = (time, index) => {
	if (!time) return "file.log";

	let year = time.getFullYear();
	let month = pad(time.getMonth() + 1);
	let day = pad(time.getDate());
	let hour = pad(time.getHours());
	let minute = pad(time.getMinutes());

	return `${year}-${day}-${month}-${hour}h${minute}-${index}-file.log`;
};

app.use(
	morgan("dev", {
		skip: function (req, res) {
			return res.statusCode < 400;
		}
	})
);
// Log write stream
const accessLogStream = rfs.createStream(generator, { interval: "6h", path: "./logs/" });

app.use(morgan("combined", { stream: accessLogStream }));

app.use(express.static(__dirname + "/public"));

//Helmet
app.use(helmet());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy({ policy: "same-origin" }));

//-- Cross origin --//
app.use(cors());
//-- Cookie parser --//
app.use(cookieParser());

//-- Express Session --//
app.use(
	session({
		store: new MongoStore({
			mongooseConnection: mongoose.connection,
			ttl: 14 * 24 * 60 * 60
		}),
		name: "overlord",
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUninitialized: false,
		cookie: { path: "/", maxAge: 14 * 24 * 60 * 60 * 1000, httpOnly: false, secure: false }, //secure = true (or auto) requires https else it wont work
		sameSite: "Lax"
	})
);

app.use(flash());

// Body-Parser
app.use(bodyParser.urlencoded({ extended: true, limit: 100000000 }));
app.use(bodyParser.json({ limit: 100000000 }));
// BP Error handler
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
		req.flash("warning", err.message);
		return res.status(403).redirect(req.headers.referer);
	}
	return res.status(200).json({ error: true, message: err.message });
});

app.set("view engine", "ejs");
app.use(expressSanitizer());
app.use(csrf({ cookie: false }));

// handle CSRF token errors here
app.use(function (err, req, res, next) {
	if (err.code !== "EBADCSRFTOKEN") return next(err);

	console.log("csrf error");
	if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
		req.flash("warning", ERROR_MESSAGE.incorrectInput);
		return res.status(403).redirect(req.headers.referer);
	}

	return res.status(200).json({ error: true, message: ERROR_MESSAGE.incorrectInput });
});

// Keep session
app.use((req, res, next) => {
	res.locals.session = req.session;
	next();
});

// Sanitize body and query params
app.use((req, res, next) => {
	req.body = sanitize(req.body);
	req.query = sanitize(req.query);

	next();
});

// Routes
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

// 404 route
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
