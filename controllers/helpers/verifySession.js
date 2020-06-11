const Order = require("../../models/Order");
const utils = require("../helpers/utils");
const User = require("../../models/User");

const ROLE = {
  ADMIN: 'admin',
  BASIC: 'basic'
}

/*
function verifySession(req, res, next) {
  if (req.session._id) {
    const user = {
      _id: req.session._id,
      name: req.session.name,
      level: req.session.level,
      role: ROLE.ADMIN
    };
    req.user = user;
  }

  /*
  req.user = {
    _id: "5d810b9365761c0840e0de25",
    name: "ADMIN",
    level: 3,
    role: ROLE.ADMIN
  };

  return next();
};*/

async function setUser(req, res, next) {
  const userId = req.session._id;

  if (userId) {
    var [err, user] = await utils.to(User.findById(userId));
    if (err || user == null) {
      req.flash("warning", "Invalid User");
      return res.status(401).redirect("/Account");
    }
    req.user = user;
    req.user.password = undefined;
  }

  next();
}

function authUser(req, res, next) {
  if (req.user == null) {
    req.flash("warning", "You need to be logged in");
    return res.status(403).redirect("/Account");
  }

  next ();
}

function authRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      req.flash("warning", "Unauthorized. Contact your administrator if you think this is a mistake");
      return res.status(401).redirect('back');
    }

    next();
  }
}

async function setOrder(req, res, next) {
  const orderId = req.params.id

  var [err, order] = await utils.to(Order.findById(orderId));
  if (err || order == null) {
       //req flash
       return res.status(404).redirect("/User");
  }

  req.orderx = order;

  console.log(req.orderx, orderId)
  next();
}

function canViewOrder(user, order) {
  return (
    user.role == ROLE.ADMIN ||
    order._userId == user._id
  )
}

function authGetOrder(req, res, next) {
  if (!canViewOrder(req.user, req.orderx)) {
    req.flash("warning", "Unauthorized. Contact your administrator if you think this is a mistake");
    return res.status(401).redirect("/User");
  }

  next();
}

module.exports = {
  ROLE,
  setUser,
  authUser,
  authRole,
  setOrder,
  canViewOrder,
  authGetOrder
}