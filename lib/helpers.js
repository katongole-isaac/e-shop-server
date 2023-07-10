/**
 * created on 7 jul 2023
 * This module contains a bunch of helper utilitites
 *
 */

//deps
const crypto = require("node:crypto");
const { promisify } = require("node:util");
const jwt = require("jsonwebtoken");
const config  = require("config");

// container
const helpers = {};

helpers.validateEmail = (email) => {
  email = typeof email === "string" && !!email.trim() ? email.trim() : "";
  if (!email) return false;

  const regexp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return regexp.test(email) ? email : false;
};

helpers.validatePhone = (phone) => {
  // in the customer schema
  // phone is optional so
  // if its not defined proceed
  if (typeof phone === "undefined" || phone === null ) return true;

  phone = typeof phone === "string" && !!phone.trim() ? phone.trim() : "";

  if (!phone) return false;

  const regexp = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

  return regexp.test(phone);
};

helpers.validateReq = (body, schema) => {
  body = typeof body === "object" && Object.keys(body).length > 0 ? body : {};
  schema =
    typeof schema === "object" && Object.keys(schema).length > 0 ? schema : {};

  let data = {};
  let errors = {};

  if (!(body && schema)) {
    // setting an error on invalid inputs
    errors = { error: "invalid inputs" };
    return { errors, data };
  }

  const { error, value } = schema.validate(body, { abortEarly: false });
 
  if (!error) data = { ...value };
  else {
    for (let ex of error.details) {
      errors[ex.path[0]] = ex.message;
    }
  }

  return { errors, data };
};

helpers.hashPassword = async (password) => {
  password =
    typeof password === "string" && !!password.trim() ? password.trim() : "";
  if (!password) return false;

  const salt = crypto.randomBytes(32).toString("hex");
  const digest = "sha256";
  const iterations = 100000;
  const keyLength = 128;

  try {
    const hash = (
      await promisify(crypto.pbkdf2)(
        password,
        salt,
        iterations,
        keyLength,
        digest
      )
    ).toString("hex");

    // return both salt and hash
    // salt will be used for verify the new generated hash
    return [salt, hash].join("$");
  } catch (ex) {
    console.log(`[Hashing Password]: `, ex);
    return false;
  }
};

helpers.verifyPassword = async (password, hashedPassword) => {
  password =
    typeof password === "string" && !!password.trim() ? password.trim() : "";
  hashedPassword =
    typeof hashedPassword === "string" && !!hashedPassword.trim()
      ? hashedPassword.trim()
      : "";

  if (!(password && hashedPassword)) return false;

  const digest = "sha256";
  const iterations = 100000;
  const keyLength = 128;

  const [salt, originalHash] = hashedPassword.split("$");

  try {
    const hash = (
      await promisify(crypto.pbkdf2)(
        password,
        salt,
        iterations,
        keyLength,
        digest
      )
    ).toString("hex");

    return hash === originalHash;
  } catch (ex) {
    console.log(`[Verifying Password]: `, ex);
    return false;
  }
};



helpers.verifyJwt = (token, secret = "") => {

  token = typeof token === "string" && !!token ? token : "";

  if (secret) secret = typeof secret === "string" && !!secret ? secret : "";

  if(!token) return false ;

  try {
     const decoded = jwt.verify(token , secret || config.get('jwtPrivateKey'));

    return decoded;

  } catch (ex) {
      return false;
  }

};


module.exports = helpers;
