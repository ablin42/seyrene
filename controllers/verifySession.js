const jwt = require('jsonwebtoken');

module.exports = function(req, res, next){
    if (req.session) {
        const user = {
            "_id": req.session._id,
            "name": req.session.name,
            "level": req.session.level
        }
        req.user = user;
    }
    next();
}