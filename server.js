// importing dependences
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

// initiating express
const server = express();

// importing route
const customRoute = require('./routes');

// mongodb address ...this is for locally hosted database 
const _url_ = 'mongodb://localhost:27017/project';

// setting local port
const port = 1070;

// cors option
const corsOptions = {
    // change this to your url or use * for any url
    "origin": "http://localhost:5500/",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
};


// setting up bodyparser which we use to convert requset to json formated data
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));

  // initiating cors
server.use(cors(corsOptions))

// connecting to mongodb 
mongoose
.connect(
    _url_,
    {useNewUrlParser: true}
).then(() => {
    console.log('monogdb connect well, we can now make queries to the database')
}).catch((err) => {
    console.log(err);
});

// initiating routes 
server.use("/api",customRoute);

// starting server
server.listen(port,()=>{
    console.log(`server started and running on http://localhost:${port} or http://127.0.0.1:${port}`)
})