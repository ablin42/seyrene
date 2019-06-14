// Load Modules
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Body Parser Middleware
// Parse app/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// Parse app/json
app.use(bodyParser.json());



const port = process.env.PORT || 8089;
app.listen(port, () => console.log(`Listening on port ${port}...`));