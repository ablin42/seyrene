module.exports = function(req, res, next){
    if (req.session._id) {
        console.log("logged state")
        const user = {
            "_id": req.session._id,
            "name": req.session.name,
            "level": req.session.level
        }
        req.user = user;
    }
    else 
        console.log("not logged state")
    
    
    
    return next();
}