const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//Check each property has data
function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]) {
            return next();
        }
        next({ 
            status: 400, 
            message: `Dish must include a ${propertyName}.` 
        });
    };
}

//Validate price data
function validatePrice(req, res, next) {
    const { data: { price } = {} } = req.body;

    if (typeof price === "number" && price > 0) {
        next();
    }
    next({
        status: 400,
        message: "Dish must have a price that is an integer greater than 0."
    });
};

//validate route id match
function validateRouteIdMatch(req, res, next) {
    const { data: {id} = {}} = req.body;
    const {dishId} = req.params;
    if (!id || id === dishId) {
        next()
    } else if (id !== dishId)
    next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
    })
}

function dishExists(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
      res.locals.dish = foundDish;
      next();
    }
    next({
      status: 404,
      message: `Dish does not exist: ${dishId}.`
    });
  }

function list(req, res) {
    res.json({ data: dishes })
};

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
      id: nextId(),
      name: name,
      description: description,
      price: price,
      image_url: image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
  }
  
  function read(req, res) {
   const foundDish = res.locals.dish;
   if (foundDish) {
    res.json({ data: foundDish });
   }
   next({
    status: 404,
    message: "Dish not found."
   })
  }
  
  function update(req, res) {
    const { name, description, price, image_url } = req.body.data;

    res.locals.dish.name = name,
    res.locals.dish.description = description,
    res.locals.dish.price = price,
    res.locals.dish.image_url = image_url

    return res.json({ data: res.locals.dish })
  }

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        validatePrice,
        create
    ],
    list,
    read: [dishExists, read],
    update: [
        dishExists, 
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        validatePrice, 
        validateRouteIdMatch,
        update
    ],
    dishExists
};