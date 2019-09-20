const jwt = require('jsonwebtoken');

module.exports = function(req, res, next){
    if (req.session) {
        const user = {
            "_id": req.session._id,
            "name": req.session.name
        }
        req.user = user;
    }
    next();
}