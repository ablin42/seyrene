const jwt = require('jsonwebtoken');

module.exports = function(req, res, next){
    const token = req.header('authToken') || req.body.authToken || req.query.authToken || req.session.token;
    if (!token) return res.status(401).send('Access Denied');
    try {
        if (token) {
            const verified = jwt.verify(token, process.env.TOKEN_SECRET);
            req.user = verified;
            console.log(verified)
        }
        next();
    } catch (err) {res.status(400).send("Invalid Token")}
}