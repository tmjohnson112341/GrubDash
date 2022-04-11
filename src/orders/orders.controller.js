const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// Implement the /orders handlers 

function dishesArrayHasDishQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  const index = dishes.findIndex((dish) => !dish.quantity);
  index != -1
    ? next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      })
    : next();
}

function dishAmountIsGreaterThanZero(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  const index = dishes.findIndex((dish) => dish.quantity <= 0);
  index != -1
    ? next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      })
    : next();
}

function dishAmountIsAnInteger(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  const index = dishes.findIndex((dish) => !Number.isInteger(dish.quantity));
  index != -1
    ? next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      })
    : next();
}

function hasDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!dishes) {
    return next({
      status: 400,
      message: `Order must include a dish`,
    });
  } else if (dishes.length === 0 || !Array.isArray(dishes)) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }
  next();
}

function statusIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const acceptableStatuses = [
    "pending",
    "preparing",
    "out-for-delivery",
    "delivered",
  ];
  if (!acceptableStatuses.includes(status)) {
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  next();
}

function checkIfCanDelete(req, res, next) {
  const order = res.locals.order;
  if (!(order.status !== "pending")) {
    return next();
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending`,
  });
}

function idRouteMatch(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;

  if (id && orderId !== id) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  next();
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Must include a ${propertyName}`,
    });
  };
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order not found with id: ${orderId}`,
  });
}

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(), //increment last id the assign as the current ID
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const order = res.locals.order;
  const updatedOrder = {
    id: order.id,
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  res.json({ data: updatedOrder });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  // `splice()` returns an array of the deleted elements, even if it is one element
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    hasDishes,
    dishesArrayHasDishQuantity,
    dishAmountIsGreaterThanZero,
    dishAmountIsAnInteger,
    create,
  ],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    idRouteMatch,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    hasDishes,
    dishesArrayHasDishQuantity,
    dishAmountIsGreaterThanZero,
    dishAmountIsAnInteger,
    statusIsValid,
    update,
  ],
  delete: [orderExists, checkIfCanDelete, destroy],
};
