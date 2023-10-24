const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
const { stat } = require("fs");

// TODO: Implement the /orders handlers needed to make the tests pass

//Check eash property has data
function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]) {
            return next();
        }
        next({ 
            status: 400, 
            message: `Order must include a ${propertyName === "dishes" ? "dish" : propertyName}.` 
        })
    };
};

//validation functions
function validateOrderStatus(req, res, next) {
    const { data: {status} = {}} = req.body;
    const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
    if (validStatus.includes(status)) {
        return next();
    }
    next({
        status: 400,
        message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    })
};

function validateStatusForDeletion(req, res, next) {
    const status = res.locals.order.status;
    if (status === "pending") {
        return next()
    }
    next({
            status: 400,
            message: "An order cannot be deleted unless it is pending."
        })
};

function validateDishesProperty(req, res, next) {
    const { data: {dishes} = {} } = req.body;
    if (!Array.isArray(dishes) || dishes.length < 1) {
        next({
            status: 400,
            message: "Order must include at least one dish"
        })
    }
    next()
};

function validateDishQuantity(req, res, next) {
    const { data: {dishes} = {} } = req.body;
    if (Array.isArray(dishes) && dishes.length > 0) {
        dishes.forEach((dish, index) => {
            if (dish.quantity < 1 || typeof dish.quantity !== "number") {
                next({
                    status: 400,
                    message: `Dish ${index} must have a quantity that is an integer greater than 0`
                })
            }
        })
    }
    next()
};

function validateId(req, res, next) {
    const { orderId } = req.params;
    const { data: {id} = {} } = req.body;
    
    if (!id || id === orderId) {
        next()
    } else if (id !== orderId)
    next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
    });  
}

function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
      res.locals.order = foundOrder;
      next();
    }
    next({
      status: 404,
      message: `Order does not exist: ${orderId}.`
    });
};


//GET FULL LIST
function list(req, res) {
    res.json({ data: orders })
};

//POST
function create(req, res) {
    const { deliverTo, mobileNumber, status, dishes } = req.body.data;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
  }

//GET
function read(req, res) {
    const foundOrder = res.locals.order;
    if (foundOrder) {
        res.json({ data: foundOrder });
    }
    next({
        status: 404,
        message: "Order not found."
    })
};

//PUT
function update(req, res) {
    const orderId = req.params.orderId;
    const { deliverTo, mobileNumber, status, dishes } = req.body.data;
    const updateOrder = {
        id: orderId,
        deliverTo,
        mobileNumber,
        status,
        dishes
    };
    return res.json({ data: updateOrder })
};

//DELETE
function destroy(req, res) {
    const orderId = req.params.orderId;
    const index = orders.findIndex((order) => order.id === orderId);
    if (index !== -1) {
        orders.splice(index, 1)
    }
    res.sendStatus(204);
}


module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        validateDishesProperty,
        validateDishQuantity,
        create,
    ],
    list,
    read: [orderExists, read],
    update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        validateId,
        validateOrderStatus,
        validateDishesProperty,
        validateDishQuantity,
        update,
    ],
    delete: [
        orderExists,
        validateStatusForDeletion,
        destroy,
    ],
}