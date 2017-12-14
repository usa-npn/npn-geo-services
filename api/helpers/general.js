var fs = require('fs');
var os = require('os');
let log = require('../../logger.js');
const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const { spawnSync } = require('child_process');

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
        let unstyledFileRef = `${process.env.PROTOCOL}://${process.env.SERVICES_HOST}:${process.env.PORT}/${filename}`;
        // if (process.env.PROTOCOL === 'https') {
        //     unstyledFileRef = `http://www.usanpn.org/files/gridded/cliped_images/${filename}`;
        // } else {
        //     unstyledFileRef = `http://${process.env.SERVICES_HOST}:${process.env.PORT}/${filename}`;
        // }

        var postData = `
<wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/2.0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">
	<ows:Identifier>ras:StyleCoverage</ows:Identifier>
	<wps:DataInputs>
		<wps:Input>
			<ows:Identifier>coverage</ows:Identifier>
			<wps:Reference mimeType="image/${fileFormat}" xlink:href="${unstyledFileRef}" method="GET"/>
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

        log.info(postData);
        log.info(JSON.stringify(options));

        let styledFileName = filename.replace(`.${fileFormat}`, `_styled.${fileFormat}`);
        let styledFilePath = rasterpath + styledFileName;
        var writeStream = fs.createWriteStream(styledFilePath);

        let req = https.request(options, (res) => {
            res.pipe(writeStream);

            res.on('data', (d) => {
                console.log('recieving data from geoserver');
                log.info('recieving data from geoserver');
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
                    });

                    resolve(`${process.env.PROTOCOL}://${process.env.SERVICES_HOST}:${process.env.PORT}/` + styledFileName.replace('.tiff', '.png'));
                } else {
                    resolve(`${process.env.PROTOCOL}://${process.env.SERVICES_HOST}:${process.env.PORT}/` + styledFileName);
                }

                //resolve(`data-dev.usanpn.org:${process.env.PORT}/` + styledFileName);
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

module.exports.stylizeFile = stylizeFile;
module.exports.WriteFile = WriteFile;
module.exports.getDatesRangeArray = getDatesRangeArray;
module.exports.extractFloatsFromString = extractFloatsFromString;
