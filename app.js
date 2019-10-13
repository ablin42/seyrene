const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const expressSanitizer = require('express-sanitizer');
const filter = require('content-filter')  
require('dotenv/config');

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
     cookie: { maxAge: 600000 },
     resave: false,
     saveUninitialized: true
}));

//-- Flash --//
app.use(flash());
var blacklist = ['$','{','&&','||'];
app.use(filter({urlBlackList: blacklist, bodyBlackList: blacklist, bodyMessage: 'A forbidden expression has been found in your data', urlMessage: 'A forbidden expression has been found in your data', dispatchToErrorHandler: true}));

// Mount express-sanitizer middleware here
app.use(expressSanitizer());

// Routes
const pagesRoute = require('./controllers/pages');
const authRoute = require('./controllers/auth');
const blogsRoute = require('./controllers/blogs');
const userRoute = require('./controllers/user');
const contactRoute = require('./controllers/contact');
const galleryRoute = require('./controllers/galleries');

app.use('/', pagesRoute);
app.use('/api/auth', authRoute);
app.use('/api/blog', blogsRoute);
app.use('/api/user', userRoute);
app.use('/api/contact', contactRoute);
app.use('/api/gallery', galleryRoute);

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