'use strict';

var SwaggerExpress = require('swagger-express-mw');
var express = require('express');
var fs = require('fs');
var path = require("path");
var morgan = require('morgan');
let log = require('./logger.js');
let generateSwagger = require('./generateSwagger.js');
let http = require("http");
let https = require("https");

generateSwagger.generate().then(() => {


    function getServer() {
        if (process.env.PROTOCOL === "https" ) {
            let certificate = fs.readFileSync(process.env.SSL_CERT);
            let privateKey = fs.readFileSync(process.env.SSL_KEY);
            log.info("creating https server");
            let server = https.createServer({key: privateKey, cert: certificate}, app);
            server.setTimeout(0);
            return server;
        }
        else {
            log.info("creating http server");
            let server = http.createServer(app);
            server.setTimeout(0);
            return server;
        }
    }

    var app = express();
    var app_v1 = express();
    var app_v0 = express();

    var config_v1 = {
        appRoot: __dirname,
        swaggerFile: "./api/swagger/swagger.yaml"
    };
    
    var config_v0 = {
        appRoot: __dirname,
        swaggerFile: "./api/swagger/swagger_v0.yaml"
    };
    
    SwaggerExpress.create(config_v1, function(err, swaggerExpress) {
        if (err) { throw err; }
        swaggerExpress.register(app_v1);
    });
    
    SwaggerExpress.create(config_v0, function(err, swaggerExpress) {
        if (err) { throw err; }
        swaggerExpress.register(app_v0);
    });
    
    app.use('/', app_v0);
    app.use('/', app_v1);

    // create a write stream (in append mode) and set up a log to record requests
    let accessLogStream = fs.createWriteStream(path.join("./logs", "access.log"), {flags: "a"});
    app.use(morgan("combined", {stream: accessLogStream}));

    module.exports = app; // for testing
    const util = require('util');

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

    const imagePath = '/var/www/data-site/files/npn-geo-services/clipped_images';
    app.use(express.static(imagePath));

    const dynamicAgddPath = '/var/www/data-site/files/npn-geo-services/agdd_maps';
    app.use(express.static(dynamicAgddPath));

    const zeroMapsPath = '/var/www/data-site/files/npn-geo-services/zero_maps';
    app.use(express.static(zeroMapsPath));

    let server = getServer();

    server.listen(process.env.PORT || 3006, () => {
        log.info("Server listening on port " + (process.env.PORT || 3006));
    });

    // setInterval(function() {
    //     console.log('HeapUsed in MB: ' + process.memoryUsage().heapUsed / 1048576);
    //     //console.log(util.inspect(process.memoryUsage()));
    // },1000);


}).catch(err => {
    log.error(err, 'could not generate swagger.yaml, haulting server');
    process.exit(1);
});


