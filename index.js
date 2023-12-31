/**
 * created on 7 Jul 2023
 * Primary file for the server
 *
 */

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require("config");

require("express-async-errors");

const customerRouter = require("./routes/customer");
const customerAuthRouter = require('./routes/auth/customer');

const app = express();
const PORT = config.get('port') || 8001;


// mounting middlewares
// the specific headers will be available to the
// client via headers
app.use(cors({exposedHeaders: ['x-auth-token']}));

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true }));

app.use((req, res, next) => {
  console.log(` ${req.method} ${req.url} `);
  next();
});



app.use("/customers", [customerRouter, customerAuthRouter]);

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send({error: err.message});
});

// template engine
app.set("view engine", "ejs");




// connect to DB
const initDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/ecommerce");
    console.log(`\x1b[1;33m%s\x1b[0m`, "[MongoDB] Connected to DB");
  } catch (error) {
    console.log(
      `\x1b[1;31m%s%s\x1b[0m`,
      "[MongoDB] Failed to DB",
      error.message
    );
    process.exit(1);
  }
};

app.init = function () {
  initDB();

  app.listen(PORT, () => {
    console.log(`\x1b[1;32m%s%d\x1b[0m`, "[Server] Running on port ", PORT);
  });

  if (!config.get("jwtPrivateKey")) {
    console.log(
      `\x1b[1;31m %s \x1b[0m`,
      "[ERROR] Need to set jwtPrivateKey env variable"
    );
    return process.exit(1);
  }

};

app.init();
