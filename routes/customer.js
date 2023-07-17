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
} = require("../models/cutomer");
const helpers = require("../lib/helpers");


// creating an account
router.post("/create", async (req, res) => {
  const { errors, data } = validateCustomer(req.body);

  if (!_.isEmpty(errors)) return res.status(400).send(errors);

  const customerFound = await Customer.findOne({ email: data.email });

  const customerPhoneFound = await Customer.findOne({phone: data.phone});

   if (customerFound)
     return res
       .status(400)
       .send({ error: "Customer with this email already exists" });

  if (customerPhoneFound)
    return res
      .status(400)
      .send({ error: "There exists a customer with this phone number" });
 

  const hashedPassword = await helpers.hashPassword(data.password);
  if (!hashedPassword)
    return res
      .status(500)
      .send({ error: "Error occured in hashing password " });

  const _customer = new Customer({
    fullname: data.fullname,
    email: data.email,
    password: hashedPassword,
    phone: data.phone,
  });

  await _customer.save();

  const token = _customer.genAuthToken();

  res.setHeader("x-auth-token", token);
  res.send(_.pick(_customer, ["fullname", "email", "_id", "phone"]));
});

module.exports = router;
