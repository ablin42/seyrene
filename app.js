const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const expressSanitizer = require('express-sanitizer');
const filter = require('content-filter');
const MongoStore = require('connect-mongo')(session);
require('dotenv/config');

const stripeSecret = process.env.STRIPE_SECRET;
const stripePublic = process.env.STRIPE_PUBLIC;

/*
const stripe = require("stripe")(stripeSecret);//put api key in dotenv
(async () => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000,
      currency: 'eur',
      payment_method_types: ['card'],
      receipt_email: 'jenny.rodzzdsen@example.com',
    });
    console.log(paymentIntent)
  })();*/

//Connect to DB
mongoose.connect(
    process.env.DB_CONNECTION, { 
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true }, (err) => {if (err) throw err; console.log("Connected to database")}
);  

// Express
const app = express();
app.use(express.static(__dirname + '/public'));

// Middleware
//-- Body parser --//
    // Parse app/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({extended: false}));
    // Parse app/json
    app.use(bodyParser.json());
//-- Cross origin --//
app.use(cors());
//-- Cookie parser --//
app.use(cookieParser());
//-- Express Session --//
app.use(session({
     secret: 'keyboard cat', 
     resave: false,
     saveUninitialized: true,
     //store: new MongoStore({mongooseConnection: mongoose.connection}),
     cookie: {maxAge: 180 * 60 * 1000}//, sameSite: 'none', secure: true}, // 180 = 3mn
}));
//-- Flash --//
app.use(flash());
var blacklist = ['$','{','&&','||'];
app.use(filter({urlBlackList: blacklist, bodyBlackList: blacklist, bodyMessage: 'A forbidden expression has been found in your data', urlMessage: 'A forbidden expression has been found in your data', dispatchToErrorHandler: true}));
// Mount express-sanitizer middleware here
app.use(expressSanitizer());

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
})

// Routes
const pagesRoute = require('./controllers/pages');
const authRoute = require('./controllers/auth');
const blogsRoute = require('./controllers/blogs');
const userRoute = require('./controllers/user');
const contactRoute = require('./controllers/contact');
const galleryRoute = require('./controllers/galleries');
const cartRoute = require('./controllers/cart');
const shopRoute = require('./controllers/shop');

app.use('/', pagesRoute);
app.use('/api/auth', authRoute);
app.use('/api/blog', blogsRoute);
app.use('/api/user', userRoute);
app.use('/api/contact', contactRoute);
app.use('/api/gallery', galleryRoute);
app.use('/api/cart', cartRoute);
app.use('/api/shop', shopRoute);


// Handles multer error
app.use((err, req, res, next) => {//////
    // treat as 404
    if (err.message && (~err.message.indexOf('not found') || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();
    }
    console.error(err.stack);
    // error as json
    if (req.originalUrl.indexOf("/api/gallery/") != -1) 
        return res.status(500).json({url: "/", msg: err.message, err: true})
    req.flash("warning", err.message)
    return res.status(500).redirect("back")
});

   
// set the view engine to ejs
app.set('view engine', 'ejs');

app.get('*', (req, res) => {
    let obj = {
        active: "404"
    }
    res.status(404).render('404', obj);
  });

const port = process.env.PORT || 8089;
app.listen(port, () => console.log(`Listening on port ${port}...`));