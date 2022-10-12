var fs = require('fs');
var os = require('os');
let log = require('../../logger.js');
const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const { spawnSync } = require('child_process');
var request = require('request');

const mustUseConvexHull = [
    "YUKON DELTA NATIONAL WILDLIFE REFUGE",
    "YUKON FLATS NATIONAL WILDLIFE REFUGE",
    "ALASKA MARITIME NATIONAL WILDLIFE REFUGE",
    "CHASSAHOWITZKA NATIONAL WILDLIFE REFUGE"
];

// helper function to allow awaiting on writeFile
function WriteFile(fileName, data)
{
    return new Promise((resolve, reject) =>
    {
        fs.writeFile(fileName, data, (err) =>
        {
            if (err)
            {
                reject(err);
            }
            else
            {
                // if we are on linux, chown to teamcity so that teamcity has permissions to mv / overwrite these files
                if (os.platform() !== 'win32') {
                    spawnSync('chown', ['teamcity:developers', fileName]);
                }
                resolve();
            }
        });
    });
}


/*
Provide moment.js dates as values for startDate, endDate parameters
interval parameter is optional and defaults to 'days'. Use intervals suported by .add() method (moment.js).
total parameter is useful when specifying intervals in minutes. It defaults to 1.
*/
var getDatesRangeArray = function (startDate, endDate, interval, total) {
    var config = {
            interval: interval || 'days',
            total: total || 1
        },
        dateArray = [],
        currentDate = startDate.clone();

    while (currentDate < endDate) {
        dateArray.push(currentDate);
        currentDate = currentDate.clone().add(config.total, config.interval);
    }

    return dateArray;
};

// takes a string and extracts the floating point numbers into an array
var extractFloatsFromString = function (inputString) {
    try {
        let regex = /[+-]?\d+(\.\d+)?/g;
        return inputString.match(regex).map(n => parseFloat(n));
    } catch (error) {
        return null;
    }

};

// calls wps to apply sld style to input raster, returns promise to the path of the stylized tiff
function stylizeFile(filename, rasterpath, fileFormat, layerName){
    return new Promise((resolve, reject) =>
    {
        log.info(`styling ${rasterpath}${filename}`);
        let unstyledFileRef = `${process.env.PROTOCOL}://${process.env.SERVICES_HOST}/geo-services/${filename}`;
        // if (process.env.PROTOCOL === 'https') {
        //     unstyledFileRef = `http://www.usanpn.org/files/gridded/cliped_images/${filename}`;
        // } else {
        //     unstyledFileRef = `http://${process.env.SERVICES_HOST}:${process.env.GEO_SERVICES_PORT}/${filename}`;
        // }

        var postData = `
<wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/2.0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">
	<ows:Identifier>ras:StyleCoverage</ows:Identifier>
	<wps:DataInputs>
		<wps:Input>
			<ows:Identifier>coverage</ows:Identifier>
			<wps:Reference mimeType="image/tiff" xlink:href="${unstyledFileRef}" method="GET"/>
		</wps:Input>
		<wps:Input>
			<ows:Identifier>style</ows:Identifier>
            <wps:Reference mimeType="text/xml; subtype=sld/1.1.1" xlink:href="http://${process.env.GEOSERVER_HOST}/geoserver/wms?request=GetStyles&amp;layers=${layerName}&amp;service=wms&amp;version=1.1.1" method="GET"/>
		</wps:Input>
	</wps:DataInputs>
	<wps:ResponseForm>
		<wps:RawDataOutput mimeType="image/${fileFormat}">
			<ows:Identifier>result</ows:Identifier>
		</wps:RawDataOutput>
	</wps:ResponseForm>
</wps:Execute>
            `;

        var username = `${process.env.GEOSERVER_USER}`;
        var password = `${process.env.GEOSERVER_PASSWORD}`;
        var auth = 'Basic ' + new Buffer.from(username + ':' + password).toString('base64');

        var options = {
            hostname: `${process.env.GEOSERVER_HOST}`,
            port: `${process.env.GEOSERVER_PORT}`,
            path: '/geoserver/ows?service=WPS&version=1.0.0&request=execute',
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': auth
            }
        };

        log.info(postData);
        log.info(JSON.stringify(options));

        let styledFileName = filename.replace(`.${fileFormat}`, `_styled.${fileFormat}`).replace('(', '').replace(')', '');
        let styledFilePath = rasterpath + styledFileName;
        var writeStream = fs.createWriteStream(styledFilePath);

        let req = https.request(options, (res) => {
            res.pipe(writeStream);

            res.on('data', (d) => {
                // console.log('recieving data from geoserver');
                // log.info('recieving data from geoserver');
                // log.info(d.toString());
            });

            res.on('end', () => {
                log.info('finished writing styled raster.');

                if (fileFormat === 'png') {
                    exec(`convert ${rasterpath + styledFileName} -transparent white ${rasterpath + styledFileName.replace('.tiff', '.png')}`, (err, stdout, stderr) => {
                        if (err) {
                            // node couldn't execute the command
                            reject(err);
                        }

                        // the *entire* stdout and stderr (buffered)
                        console.log(`stdout: ${stdout}`);
                        console.log(`stderr: ${stderr}`);

                        resolve(`${process.env.PROTOCOL}://${process.env.SERVICES_HOST}/geo-services/` + styledFileName.replace('.tiff', '.png'));
                    });

                } else {
                    resolve(`${process.env.PROTOCOL}://${process.env.SERVICES_HOST}/geo-services/` + styledFileName);
                }

                //resolve(`data-dev.usanpn.org:${process.env.GEO_SERVICES_PORT}/` + styledFileName);
            });
        });

            req.on('error', (e) => {
                log.error("there was an error with the geoserver request");
                log.error(e);
                console.error(e);
                reject(e);
            });

            req.write(postData);
            req.end();

    });
}


// calls wps to apply sld style to input raster, returns promise to the path of the stylized png
// background color will be made transparent
function stylizePestMap(filename, rasterpath, fileFormat, sldName, backgroundColor, preserveExent){
    return new Promise((resolve, reject) =>
    {
        log.info(`styling ${rasterpath}${filename}`);
        let unstyledFileRef = `${process.env.PROTOCOL}://${process.env.SERVICES_HOST}/geo-services/pest_maps/${filename}`;

        var postData = `
<wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/2.0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">
	<ows:Identifier>ras:StyleCoverage</ows:Identifier>
	<wps:DataInputs>
		<wps:Input>
			<ows:Identifier>coverage</ows:Identifier>
			<wps:Reference mimeType="image/tiff" xlink:href="${unstyledFileRef}" method="GET"/>
		</wps:Input>
		<wps:Input>
			<ows:Identifier>style</ows:Identifier>
            <wps:Reference mimeType="text/xml; subtype=sld/1.1.1" xlink:href="http://${process.env.GEOSERVER_HOST}/geoserver/rest/workspaces/gdd/styles/${sldName}" method="GET"/>
		</wps:Input>
	</wps:DataInputs>
	<wps:ResponseForm>
		<wps:RawDataOutput mimeType="image/${fileFormat}">
			<ows:Identifier>result</ows:Identifier>
		</wps:RawDataOutput>
	</wps:ResponseForm>
</wps:Execute>
            `;

        var username = `${process.env.GEOSERVER_USER}`;
        var password = `${process.env.GEOSERVER_PASSWORD}`;
        var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');

        var options = {
            hostname: `${process.env.GEOSERVER_HOST}`,
            port: `${process.env.GEOSERVER_PORT}`,
            path: '/geoserver/ows?service=WPS&version=1.0.0&request=execute',
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': auth
            }
        };

        //log.info(postData);
        //log.info(JSON.stringify(options));

        let styledFileName = filename.replace(`.${fileFormat}`, `_styled.${fileFormat}`);
        if(preserveExent) {
            styledFileName = filename.replace(`.${fileFormat}`, `_styled_conus_extent.${fileFormat}`);
        }
        let styledFilePath = rasterpath + styledFileName;
        var writeStream = fs.createWriteStream(styledFilePath);

        let req = https.request(options, (res) => {
            res.pipe(writeStream);

            res.on('data', (d) => {
                // console.log('recieving data from geoserver');
                // log.info('recieving data from geoserver');
                // log.info(d.toString());
            });

            res.on('end', async () => {
                log.info('finished writing styled raster.');
                try {
                    await execPromise(`convert ${rasterpath + styledFileName} -transparent ${backgroundColor} ${rasterpath + styledFileName}`);
                } catch(err) {
                    log.error(`error converting ${backgroundColor} to transparent: ` + err);
                    reject(err);
                }
                try {
                    await unlinkPromise(rasterpath + filename);
                } catch(err) {
                    log.error('could not delete unstyled file: ' + err);
                    reject(err);
                }
                resolve(`${process.env.PROTOCOL}://${process.env.SERVICES_HOST}/geo-services/pest_maps/` + styledFileName.replace('.tiff', '.png'));
            });
        });

        req.on('error', (e) => {
            log.error("there was an error with the geoserver request");
            log.error(e);
            console.error(e);
            reject(e);
        });

        req.write(postData);
        req.end();

    });
}

function urlExists(url, cb) {
    request({ url: url, method: 'HEAD', "rejectUnauthorized": false }, function(err, res) {
        if (err) return cb(null, false);
        cb(null, /4\d\d/.test(res.statusCode) === false);
    });
}

function getParam(param) {
    if (param != null) {
        return param.value
    } else {
        return null;
    }
}

//promisified functions

async function downloadFilePromise(url, dest) {
    return new Promise((resolve, reject) =>
    {
        let file = fs.createWriteStream(dest);
        let request = https.get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                resolve();
            });
        }).on('error', function(err) { // Handle errors
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            reject(err.message);
        });
    });
};

async function copyFilePromise(src, dest) {
    return new Promise((resolve, reject) =>
    {
        fs.copyFile(src, dest, (err) => {
            if(err) {
                reject(err);
            }
            resolve();
        });
    });
};

async function renameFilePromise(src, dest) {
    return new Promise((resolve, reject) =>
    {
        fs.rename(src, dest, (err) => {
            if(err) {
                reject(err);
            }
            resolve();
        });
    });
};

async function execPromise(command) {
    return new Promise((resolve, reject) =>
    {
        exec(command, async (err, stdout, stderr) => {
            if (err) {
                reject(err);
            }
            resolve();
        })
    });
};

async function unlinkPromise(fileToRemove) {
    return new Promise((resolve, reject) =>
    {
        fs.unlink(fileToRemove, async (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        })
    });
};

module.exports.stylizeFile = stylizeFile;
module.exports.stylizePestMap = stylizePestMap;
module.exports.WriteFile = WriteFile;
module.exports.getDatesRangeArray = getDatesRangeArray;
module.exports.extractFloatsFromString = extractFloatsFromString;
module.exports.mustUseConvexHull = mustUseConvexHull;
module.exports.urlExists = urlExists;
module.exports.getParam = getParam;
module.exports.downloadFilePromise = downloadFilePromise;
module.exports.copyFilePromise = copyFilePromise;
module.exports.renameFilePromise = renameFilePromise;
module.exports.execPromise = execPromise;
module.exports.unlinkPromise = unlinkPromise;