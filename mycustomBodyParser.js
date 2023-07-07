const StringDecoder = require("node:string_decoder").StringDecoder;
const queryString = require("node:querystring");

const parser = (req, res, next) => {
  
  const decoder = new StringDecoder("utf-8");

  let data = "";

  req.on("data", (buffer) => {
    data += decoder.write(buffer);
  });

  req.on("close", () => {
    data += decoder.end();
    let parsedParsed = queryString.parse(data);
    req.data = parsedParsed;
    next();
  });
};

module.exports = parser;
