/**
 * created on 7 Jul 2023
 * Auth for customer
 *
 */

const fs = require("node:fs");
const path = require("node:path");
const { promisify } = require("node:util");
const Joi = require("joi");
const _ = require("lodash");
const config = require("config");

const router = require("express").Router();

const helpers = require("../../lib/helpers");
const { Customer, validateCustomerLogins } = require("../../models/cutomer");


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

router.get("/forgot-password", async (req, res) => {


  res.render('recoveryPassword');


});

router.post("/forgot-password", async (req, res) => {

  const email = helpers.validateEmail(req.body.email);

  console.log(req.body);

  if (!email) return res.status(400).send({ error: "Invalid email" });

  const customer = await Customer.findOne({ email });

  if (!customer)
    return res
      .status(404)
      .send({ msg: "No registered customer with this email." });

  const secret = config.get("jwtPrivateKey") + customer.password;

  const token = customer.genAuthToken(secret, "5m");

  // this link will be sent to customer email
  // for password reset
  // the url is valid for only 5 minutes
  const uniqueUrl = `http://localhost:3000/customers/reset-password/${customer._id}/${token}`;

  /**
   * @TODO you need to send the uniqueURL to customer's email
   *
   */

  // after sending
  // you can reply to the customer with a template
  // telling them that you've sent the link to their email
  res.send({msg: "We've sent a link to your email."});

  console.log(`Link: `, uniqueUrl);
});

router.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;

  const customer = await Customer.findOne({ _id: id });

  if (!customer)
    return res
      .status(404)
      .send({ msg: "No registered customer with this email." });

  const secret = config.get("jwtPrivateKey") + customer.password;

  const decoded = helpers.verifyJwt(token, secret);

  if (!decoded)
    return res.status(400).send({
      error: "Invalid or expired token, please try again with a new link !!",
    });

  res.render("resetPassword");
});

router.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;

  const customer = await Customer.findOne({ _id: id });

  if (!customer)
    return res
      .status(404)
      .send({ msg: "No registered customer with this email." });

  const secret = config.get("jwtPrivateKey") + customer.password;

  const decoded = helpers.verifyJwt(token, secret);

  if (!decoded)
    return res.status(400).send({
      error: "Invalid or expired token, please try again with a new link !!",
    });

  const { errors, data } = validatePasswords(req.body);

  if (!_.isEmpty(errors)) return res.status(400).send(errors);

  const hashedPassword = await helpers.hashPassword(data.newPassword);
  if (!hashedPassword)
    return res
      .status(500)
      .send({ error: "Error occured in hashing password " });

  await Customer.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        password: hashedPassword,
      },
    }
  );

  // you can send a customer a successfully updated view
  res.send("password updated successfully");
});

module.exports = router;

const validatePasswords = (passwords) => {
  const passwordRegExp = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

  const schema = Joi.object({
    newPassword: Joi.string()
      .regex(passwordRegExp)
      .required()
      .label("New Password")
      .messages({
        "string.pattern.base":
          "{{#label}} must have at least 6 char(s) madeup of char(s), digits",
      }),
    confirmPassword: Joi.any()
      .valid(Joi.ref("newPassword"))
      .required()
      .label("Confirm password")
      .messages({
        "any.only": "{{#label}} does not match",
      }),
  });

  return helpers.validateReq(passwords, schema);
};
