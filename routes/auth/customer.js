/**
 * created on 7 Jul 2023
 * Auth for customer
 *
 */

const _ = require("lodash");
const router = require("express").Router();
const fs = require("node:fs");
const  { promisify } = require('node:util');
const path = require("node:path");

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

router.get("/reset-password", async (req, res) => {

  const filePath = path.join(__dirname, "/../../views/recoveryPassword.html");

  const htmlTemplate = await promisify(fs.readFile)(filePath, "utf-8");

  res.send(htmlTemplate);
});


router.post("/forgot-password", async (req, res) => {

    console.log('Custom data: ', req.body  );
    
    res.send("<h2> Here forgot password </h2>")
});

module.exports = router;
