'use strict';

var SwaggerExpress = require('swagger-express-mw');
var express = require('express');
var fs = require('fs');
var path = require("path");
var morgan = require('morgan');
let log = require('./logger.js');

var app = express();

// create a write stream (in append mode) and set up a log to record requests
let accessLogStream = fs.createWriteStream(path.join("./logs", "access.log"), {flags: "a"});
app.use(morgan("combined", {stream: accessLogStream}));



module.exports = app; // for testing
const util = require('util');

var config = {
  appRoot: __dirname, // required config
  swaggerSecurityHandlers: {
    api_key: function (req, authOrSecDef, scopesOrApiKey, cb) {
      // your security code
      if ('1234' === scopesOrApiKey) {
        cb(null);
      } else {
        cb(new Error('access denied!'));
      }
    }
  }
};

process.on("uncaughtException", (err) => {
    log.error(err, "Something Broke!.");
    console.error(err.stack);
});

app.use((req,res,next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.static('api/swagger'));

app.use(express.static('static/rasters'));

SwaggerExpress.create(config, (err, swaggerExpress) => {
  if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);

  //todo 3006 is here because 'swagger project test' doesn't pick up the env port
  app.listen(process.env.PORT || 3006);

  log.info('listening on port 3006');
  log.error('this is a test error!');

  setInterval(function() {
    console.log('HeapUsed in MB: ' + process.memoryUsage().heapUsed / 1048576);
    //console.log(util.inspect(process.memoryUsage()));
  },1000);
});
