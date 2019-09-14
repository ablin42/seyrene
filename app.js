// Load Modules
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(express.static(__dirname + '/public'));

// set the view engine to ejs
app.set('view engine', 'ejs');

// Body Parser Middleware
// Parse app/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// Parse app/json
app.use(bodyParser.json());

app.get('/', (req, res) => {
 //   res.status(200).send('Hello world')
    res.render('home', {
        root: path.join(__dirname, '/pages/')
    })
    res.status(200);
})

app.get('/Galerie', (req, res) => {
    res.render('galerie', {
        root: path.join(__dirname, '/pages/')
    })
    res.status(200);
})

app.get('/Login', (req, res) => {
    res.render('login', {
        root: path.join(__dirname, '/pages/')
    })
    res.status(200);
})

app.get('/Register', (req, res) => {
    res.render('register', {
        root: path.join(__dirname, '/pages/')
    })
    res.status(200);
})

app.get('/Blog', (req, res) => {
    res.render('blog', {
        root: path.join(__dirname, '/pages/')
    })
    res.status(200);
})

const port = process.env.PORT || 8089;
app.listen(port, () => console.log(`Listening on port ${port}...`));