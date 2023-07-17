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

// url for password recovery
const passwordRecoveryUrlToBeMailed = `http://localhost:${config.get(
  "port"
)}/customers/reset-password`;

// this url refers to a frontend page for password recovery
const urlToBeRedirectedToForPasswordRecovery =
  "http://localhost:3000/auth/password-update";

// check whether the customer email exists.
// This is used on login / signin
router.post("/checkemail", async (req, res) => {
  const email = helpers.validateEmail(req.body.email);

  if (!email)
    return res
      .status(400)
      .send({ error: "Please provide a valid", checked: false });

  const customer = await Customer.findOne({ email });

  if (!customer)
    return res.status(404).send({
      error: "Couldn't find customer with this email",
      checked: false,
    });

  res.send({ error: null, checked: true });
});

router.post("/signin", async (req, res) => {
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

  const token = customer.genAuthToken();

  res.setHeader("x-auth-token", token);

  res.send(_.pick(customer, ["_id", "fullname", "email", "phone"]));
});

/**
 * @todo you can remove this route
 * its use is implemented on the frontend
 * Also remove the view associated with it
 */
router.get("/forgot-password", async (req, res) => {
  res.render("recoveryPassword");
});

router.post("/forgot-password", async (req, res) => {
  const email = helpers.validateEmail(req.body.email);

  if (!email) return res.status(400).send({ error: "Invalid email" });

  const customer = await Customer.findOne({ email });

  if (!customer)
    return res.status(404).send({
      error: "Email not registered. Make sure you've registered with you",
    });

  const secret = config.get("jwtPrivateKey") + customer.password;

  const token = customer.genAuthToken(secret, "5m");

  // this link will be sent to customer email
  // for password reset
  // the url is valid for only 5 minutes
  const uniqueUrl = `${passwordRecoveryUrlToBeMailed}/${customer._id}/${token}`;

  /**
   * Mail the UniqeUrl
   * @TODO you need to send the uniqueURL to customer's email
   *
   */

  // after sending
  // this is used on frontend to give more info to customers
  // to further steps
  res.send({ message: "We've sent a link to your email." });

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

  const { id: _id } = decoded;

  // here we're redirect the customer
  // to with some data, the data is
  // passed to url as query strings, u need to encoded them properly
  // use encodedURIComponent

  // the token is also sent along and it will
  // be used in the reset-password route
  const urlToBeSent = `${urlToBeRedirectedToForPasswordRecovery}/?id=${encodeURIComponent(
    _id
  )}&token=${encodeURIComponent(token)}`;

  res.redirect(urlToBeSent);
});

router.put("/reset-password", async (req, res) => {
  const { token, id } = req.body;

  const customer = await Customer.findOne({ _id: id });
  if (!customer)
    return res
      .status(404)
      .send({ error: "Invalid customers credentials, Can't perform this operation. " });

  const secret = config.get("jwtPrivateKey") + customer.password;
  const decoded = helpers.verifyJwt(token, secret);

  if (!decoded)
    return res.status(400).send({
      error: "Invalid or expired link, The link is only valid within 5 minutes",
    });

  const { errors, data } = validatePasswords(
    _.pick(req.body, ["newPassword", "confirmPassword"])
  );

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

  // this is used on the client side
  res.send({ message: "password updated successfully" });
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
