require("newrelic");
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
const rfs = require("rotating-file-stream");
const sanitize = require("mongo-sanitize");
const MongoStore = require("connect-mongo")(session);
const { setUser } = require("./controllers/helpers/middlewares");
const path = require("path");
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
const { fullLog, threatLog } = require("./controllers/helpers/log4");
const { body } = require("express-validator");

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
		fullLog.trace("Connected to database");
	}
);

// Express
const app = express();
//app.use(express.static(__dirname + "/public")); (if re-enabled, change all routes in ejs to remove /public)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1);

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

// Log write stream
const accessLogStream = rfs.createStream(generator, { interval: "6h", path: "./tmp/logs/" });
app.use(morgan("combined", { stream: accessLogStream }));

//Helmet
app.use(helmet());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy({ policy: "same-origin" }));
app.use(
	helmet.contentSecurityPolicy({
		directives: {
			reportUri: "/report-violation",
			defaultSrc: ["'self'"],
			styleSrc: [
				"'self'",
				"stackpath.bootstrapcdn.com",
				"cdn.quilljs.com",
				"kit-free.fontawesome.com",
				"fonts.googleapis.com",
				"cdnjs.cloudflare.com",
				"'sha256-ajZEDDdILRcc4lWO9JfCUcWV8WPtU5+drQz8E5IfQ0w='",
				"'sha256-zwHi7E6JKCpD7iSjei/XVSaXpNq1WUE8eBFAiJJV/lA='"
			],
			fontSrc: ["'self'", "fonts.googleapis.com", "kit-free.fontawesome.com", "fonts.gstatic.com"],
			scriptSrc: [
				"'self'",
				"cdnjs.cloudflare.com",
				"www.googletagmanager.com",
				"kit.fontawesome.com",
				"stackpath.bootstrapcdn.com",
				"cdn.quilljs.com",
				"https://www.google.com/recaptcha/",
				"www.gstatic.com",
				"maps.googleapis.com",
				"maps.gstatic.com",
				"js.stripe.com"
			],
			frameSrc: ["https://www.google.com", "js.stripe.com"],
			imgSrc: ["'self'", "data:", "maps.gstatic.com"]
		},
		reportOnly: false
	})
);

// Set ip object and logs info
app.use((req, res, next) => {
	req.ipAddress =
		(req.headers["x-forwarded-for"] || "").split(",")[0] ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		req.connection.socket.remoteAddress;

	fullLog.trace({ ip: req.ipAddress, host: req.headers.host, referer: req.headers.referer, forward: req.url });
	next();
});

app.use(cors());
app.use(cookieParser());

//-- Express Session --//
app.use(
	session({
		store: new MongoStore({
			mongooseConnection: mongoose.connection,
			ttl: 365 * 24 * 60 * 60
		}),
		name: "overlord",
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: { path: "/", maxAge: 14 * 24 * 60 * 60 * 1000, httpOnly: false, secure: false }, //secure = true (or auto) requires https else it wont work
		sameSite: "Lax"
	})
);

app.use(flash());

// Body-Parser
app.use(bodyParser.urlencoded({ extended: true, limit: 25000000 }));
app.use(
	bodyParser.json({
		verify: function (req, res, buf) {
			let url = req.originalUrl;
			if (url.startsWith("/api/order/confirm")) req.rawBody = buf.toString();
		},
		limit: 25000000
	})
);
// BP Error handler
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
		req.flash("warning", err.message);
		return res.status(403).redirect(req.headers.referer);
	}
	return res.status(200).json({ error: true, message: err.message });
});

app.use(expressSanitizer());

app.post("/report-violation", (req, res) => {
	if (req.body) {
		threatLog.warn("CSP Violation: ", req.ip, req.body);
	} else {
		threatLog.error("CSP Violation: No data received!", req.ip);
	}

	res.status(204).end();
});

app.use(csrf({ cookie: false }));
// handle CSRF token errors here
app.use(function (err, req, res, next) {
	if (req.path === "/api/order/confirm" || req.path === "/api/pwinty/callback/status") return next();
	if (err.code !== "EBADCSRFTOKEN") return next(err);

	threatLog.warn("CSRF error", { headers: req.headers });
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

app.post("/plsauth", (req, res) => {
	//DELPROD//
	if (req.body.authlog === process.env.AUTHLOG) {
		req.session.authprod = process.env.ACCESS_TOKEN;
		return res.status(200).redirect("/");
	} else return res.status(200).redirect("plsauth");
});

app.use((req, res, next) => {
	//DELPROD//
	req.session.authprod;
	if (req.session.authprod && req.session.authprod === process.env.ACCESS_TOKEN) {
		req.session.authprod = process.env.ACCESS_TOKEN;
		return next();
	}

	return res.status(200).render("plsauth", { csrfToken: req.csrfToken() });
});

app.get("/plsauth", (req, res) => {
	//DELPROD//
	res.status(200).render("plsauth", { csrfToken: req.csrfToken() });
});

//DELPROD// del plsauth.ejs

// Routes
app.use("/", pagesRoute);

// 404 route
app.get("*", setUser, (req, res) => {
	try {
		let obj = { active: "404" };
		if (req.user) obj.user = req.user;

		return res.status(404).render("404", obj);
	} catch (err) {
		threatLog.error("404 ROUTE ERROR", err, req.headers, req.ipAddress);
		return res.status(404).render("404", { active: "404" });
	}
});

const port = process.env.PORT;
app.listen("/tmp/nginx.socket", () => fullLog.trace(`Listening on port ${port}...`)); //
