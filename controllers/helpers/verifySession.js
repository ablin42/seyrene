const utils = require("../helpers/utils");
const Order = require("../../models/Order");
const User = require("../../models/User");
const DeliveryInfo = require("../../models/DeliveryInfo");

const ROLE = {
  ADMIN: 'admin',
  BASIC: 'basic'
};

async function setUser(req, res, next) {
  const userId = req.session._id;

  if (userId) {
    let [err, user] = await utils.to(User.findById(userId));
    if (err || user == null) {
      req.flash("warning", "Invalid User");
      return res.status(401).redirect("/Account");
    }
    req.user = user;
    req.user.password = undefined;
  }

  /*req.user = { 
    role: 'admin',
    isVerified: true,
    _id: "5d810b9365761c0840e0de25",
    name: 'harbinger',
    email: 'ablin42@byom.de',
    date: "2019-09-17T16:36:35.586Z",
    __v: 0,
    createdAt: "2019-09-28T20:27:37.382Z",
    updatedAt: "2020-06-10T23:25:09.803Z"
  };*/

  next();
}

function authUser(req, res, next) {
  if (req.user == null) {
    req.flash("warning", "You need to be logged in");
    return res.status(403).redirect("/Account");
  }

  next ();
}

function notLoggedUser(req, res, next) {
  if (req.user != null) {
    req.flash("warning", "You're already logged in");
    return res.status(403).redirect("/");
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
  };
}

async function setDelivery(req, res, next) {
  const userId = req.session._id;

  if (userId) {
    let [err, result] = await utils.to(DeliveryInfo.findOne({ _userId: userId }));
    if (err) {
      req.flash("warning", "An error occured looking for your delivery address");
      return res.status(401).redirect("/User");
    }
    req.delivery = result;
  }

  next();
}

function isDelivery(req, res, next) {
  if (req.delivery == null) {
    req.flash("warning", "You need to set your delivery address");
    return res.status(403).redirect("/User");
  }

  next ();
}

async function setOrder(req, res, next) {
  const orderId = req.params.id;

  let [err, order] = await utils.to(Order.findById(orderId));
  if (err || order == null) {
    req.flash("warning", "Invalid Order");
    return res.status(404).redirect("/User");
  }
  req.order = order; 

  next();
}

function canViewOrder(user, order) {
  return (
    user.role == ROLE.ADMIN ||
    order._userId == user._id
  );
}

function authGetOrder(req, res, next) {
  if (!canViewOrder(req.user, req.order)) {
    req.flash("warning", "Unauthorized. Contact your administrator if you think this is a mistake");
    return res.status(401).redirect("/User");
  }

  next();
}

module.exports = {
  ROLE,
  setUser,
  notLoggedUser,
  authUser,
  authRole,
  setDelivery,
  isDelivery,
  setOrder,
  canViewOrder,
  authGetOrder
};