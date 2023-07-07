/**
 * created on 7 jul 2023
 * Customer Router - Contains logic endpoint for customers
 *
 */

const _ = require("lodash");
const router = require("express").Router();

const {
  Customer,
  validateCustomer,
  validateCustomerLogins,
} = require("../models/cutomer");
const helpers = require("../lib/helpers");

router.post("/login", async (req, res) => {
  const { errors, data } = validateCustomerLogins(req.body);
  if (!_.isEmpty(errors)) return res.status(400).send(errors);

  const customer = await Customer.findOne({ email: data.email });

  if (!customer)
    return res
      .status(404)
      .send({ error: "Couldn't find customer with this email" });

  const isLoggedIn = await helpers.verifyPassword(
    data.password,
    customer.password
  );

  if (!isLoggedIn) return res.status(400).send({ error: "Invalid password" });

  res.send({ success: "loggedin" });
});

// creating an account
router.post("/create", async (req, res) => {
  const { errors, data } = validateCustomer(req.body);

  if (!_.isEmpty(errors)) return res.status(400).send(errors);

  const customerFound = await Customer.findOne({ email: data.email });

  if (customerFound)
    return res
      .status(400)
      .send({ error: "Customer with this email already exists" });

  const hashedPassword = await helpers.hashPassword(data.password);
  if (!hashedPassword)
    return res
      .status(500)
      .send({ error: "Error occured in hashing password " });

  const _customer = new Customer({
    fullname: data.fullname,
    email: data.email,
    password: hashedPassword,
    phone: data?.phone ? data.phone : null,
  });

  await _customer.save();

  const customerResponse = {
    ..._.pick(_customer, [
      "fullname",
      "email",
      "_id",
      _customer.phone ? "phhone" : "",
    ]),
  };

  res.send(customerResponse);
});

module.exports = router;
