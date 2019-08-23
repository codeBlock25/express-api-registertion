const express = require('express');
const customRoute = express();
const signin = require('./routes/signin');
const signup = require('./routes/signup');


customRoute.use("/signup", signup);
customRoute.use("/signin", signin);

module.exports = customRoute;
