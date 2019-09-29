const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
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


// Routes
const pagesRoute = require('./routes/pages');
const authRoute = require('./routes/auth');
const blogsRoute = require('./routes/blogs');
const userRoute = require('./routes/user');
const contactRoute = require('./routes/contact');
const galleryRoute = require('./routes/gallery');

app.use('/', pagesRoute);
app.use('/api/auth', authRoute);
app.use('/api/blog', blogsRoute);
app.use('/api/user', userRoute);
app.use('/api/contact', contactRoute);
app.use('/api/gallery', galleryRoute);

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