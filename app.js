// Load Modules
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv/config');

//Connect to DB
mongoose.connect(
    process.env.DB_CONNECTION, { 
    useNewUrlParser: true,
    useUnifiedTopology: true }, () => console.log("Connected to database"));

// Express
const app = express();
app.use(express.static(__dirname + '/public'));

// Middleware
// Body parser
// Parse app/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// Parse app/json
app.use(bodyParser.json());

// Cross origin middleware
app.use(cors());

// Routes
const pagesRoute = require('./routes/pages');
const postsRoute = require('./routes/posts');
const authRoute = require('./routes/auth');

// Route Middlewares
app.use('/api/user', authRoute);

app.use('/', pagesRoute);
app.use('/posts', postsRoute);

// set the view engine to ejs
app.set('view engine', 'ejs');


const port = process.env.PORT || 8089;
app.listen(port, () => console.log(`Listening on port ${port}...`));