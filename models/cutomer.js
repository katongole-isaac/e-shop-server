/**
 * created on 7 ju1 2023
 * Customer model - it comprises the schema for customer
 *
 */

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");
const Joi = require("joi");

const helpers = require("../lib/helpers");

const customerSchema = new mongoose.Schema({
  fullname: { type: String, minLength: 5, maxLength: 255, required: true },
  email: {
    type: String,
    validate: {
      validator: helpers.validateEmail,
      message: "Invalid email",
    },
    required: true,
  },
  phone: {
    type: String,
    validate: {
      validator: helpers.validatePhone,
      message: "User phone is invalid",
    },
  },
  password: { type: String, required: true },
});

// embedding user data & generating jwt
customerSchema.methods.genAuthToken = function (secret = "", expiresIn = "") {
  const payload = {
    id: this._id,
    email: this.email,
  };

  
  return jwt.sign(payload, secret || config.get("jwtPrivateKey"), {
    expiresIn,
  });

};

const Customer = mongoose.model("customer", customerSchema);

module.exports = { Customer, validateCustomer, validateCustomerLogins };

//this is used in routes
function validateCustomer(customer) {
  const emailRegExp = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

  const passwordRegExp = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

  const schema = Joi.object({
    fullname: Joi.string().min(3).max(255).required(),
    password: Joi.string().regex(passwordRegExp).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().regex(emailRegExp),
  });

  return helpers.validateReq(customer, schema);
}

function validateCustomerLogins(customer) {
  const schema = Joi.object({
    password: Joi.string().required(),
    email: Joi.string().email().required(),
  });

  return helpers.validateReq(customer, schema);
}
