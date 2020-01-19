module.exports = function(req, res, next) {
  if (req.session._id) {
    console.log("logged state");
    const user = {
      _id: req.session._id,
      name: req.session.name,
      level: req.session.level
    };
    req.user = user;
  } else console.log("not logged state");

  req.user = {
    _id: "5d810b9365761c0840e0de25",
    name: "ADMIN",
    level: 3
  };

  return next();
};
