// Load Modules
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Body Parser Middleware
// Parse app/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// Parse app/json
app.use(bodyParser.json());

app.get('/', (res, req) => {
    res.status(200).send('Hello world')
})

const port = process.env.PORT || 8089;
app.listen(port, () => console.log(`Listening on port ${port}...`));