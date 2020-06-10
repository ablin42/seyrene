const Order = require("../../models/Order");
const utils = require("../helpers/utils");

const ROLE = {
  ADMIN: 'admin',
  BASIC: 'basic'
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

function verifySession(req, res, next) {
  if (req.session._id) {
    const user = {
      _id: req.session._id,
      name: req.session.name,
      level: req.session.level
    };
    req.user = user;
  }

  req.user = {
    _id: "5d810b9365761c0840e0de25",
    name: "ADMIN",
    level: 3,
    role: "basic"
  };

  return next();
};

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
  verifySession,
  authUser,
  authRole,
  setOrder,
  canViewOrder,
  authGetOrder
}