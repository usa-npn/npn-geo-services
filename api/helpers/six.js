let db = require('./database.js');
let log = require('../../logger.js');
const moment = require('moment');
let helpers = require('./general');
var fs = require('fs');
const http = require('http');
const { exec } = require('child_process');

const imagePath = '/var/www/data-site/files/npn-geo-services/clipped_images/';


// returns the number of tiles the boundary intersects
async function boundaryRasterIntersections(rastTable, boundary, boundaryTable, boundaryColumn, date, plant, phenophase) {
    const query = {
        text: `
        SELECT COUNT(*) AS intersections
        FROM ${rastTable} r, ${boundaryTable} p 
        WHERE p.${boundaryColumn} = $1 AND ST_Intersects(r.rast, p.geom) AND r.rast_date = $2 AND r.plant = $3 AND r.phenophase = $4`,
        values: [boundary, date.format('YYYY-MM-DD'), plant, phenophase]
    };
    const res = await db.pgPool.query(query);
    return parseInt(res.rows[0].intersections);
}

// calls wps to apply sld style to input raster, returns promise to the path of the stylized tiff
function stylizeFile(filename, rasterpath, fileFormat, layerName){
    return new Promise((resolve, reject) =>
    {
        log.info(`styling ${rasterpath}${filename}`);
        var postData = `
<wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/2.0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">
	<ows:Identifier>ras:StyleCoverage</ows:Identifier>
	<wps:DataInputs>
		<wps:Input>
			<ows:Identifier>coverage</ows:Identifier>
			<wps:Reference mimeType="image/${fileFormat}" xlink:href="http://data-dev.usanpn.org:3006/${filename}" method="GET"/>
		</wps:Input>
		<wps:Input>
			<ows:Identifier>style</ows:Identifier>
            <wps:Reference mimeType="text/xml; subtype=sld/1.1.1" xlink:href="http://geoserver-dev.usanpn.org/geoserver/wms?request=GetStyles&amp;layers=${layerName}&amp;service=wms&amp;version=1.1.1" method="GET"/>
		</wps:Input>
	</wps:DataInputs>
	<wps:ResponseForm>
		<wps:RawDataOutput mimeType="image/${fileFormat}">
			<ows:Identifier>result</ows:Identifier>
		</wps:RawDataOutput>
	</wps:ResponseForm>
</wps:Execute>
            `;

        var username = 'twellman';
        var password = 'M0EV5xI1dN';
        var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');

        var options = {
            hostname: 'geoserver-dev.usanpn.org',
            port: 80,
            path: '/geoserver/ows?service=WPS&version=1.0.0&request=execute',
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': auth
            }
        };

        let styledFileName = filename.replace(`.${fileFormat}`, `_styled.${fileFormat}`);
        let styledFilePath = rasterpath + styledFileName;
        var writeStream = fs.createWriteStream(styledFilePath);

        var req = http.request(options, (res) => {
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

                    resolve(`data-dev.usanpn.org:${process.env.PORT}/` + styledFileName.replace('.tiff', '.png'));
                } else {
                    resolve(`data-dev.usanpn.org:${process.env.PORT}/` + styledFileName);
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

// to pick up all pixels inside boundary we need to buffer around the shapefile before doing a clip,
// the size of this buffer depends on the dataset resolution. This function returns the correct buffer size.
function getBufferSizeForTable(rastTable) {
    let buffer = .01;
    if (rastTable === 'prism_spring_index') {
        buffer = .02;
    }
    if (rastTable === 'best_spring_index') {
        buffer = 1;
    }
    return buffer;
}

// choose table via selected data and boundary tile intersection (for ncep alaska)
async function getAppropriateSixTable(date, climate, boundary, boundaryTable, boundaryColumn, plant, phenophase) {

    if (climate === 'PRISM') {
        return 'prism_spring_index';
    } else if (climate === 'BEST') {
        return 'best_spring_index';
    } else if (climate === 'NCEP') {
        let now = moment();
        if (date.year() < now.year()) {
            return 'ncep_spring_index_historic';
        } else {
            let rasterCellsInBoundary = await boundaryRasterIntersections('ncep_spring_index_alaska', boundary, boundaryTable, boundaryColumn, date, plant, phenophase);
            if (rasterCellsInBoundary > 0) {
                return 'ncep_spring_index_alaska';
            } else {
                return 'ncep_spring_index';
            }

        }
    }
}

// creates the cache table if it doesn't exist
async function createSixAreaStatsCacheTable() {
    let query = `CREATE TABLE IF NOT EXISTS cached_six_area_stats (
                    id serial not null primary key,
                    boundary text,
                    plant text,
                    phenophase text,
                    climate text,
                    date date,
                    count integer,
                    mean real,
                    stddev real,
                    min integer,
                    max integer,
                    percent_complete real);`;
    const res = await db.pgPool.query(query);
}

// inserts a new row in the cache table
async function saveSixAreaStatsToCache(boundary, plant, phenophase, climate, date, count, mean, stddev, min, max, percent_complete) {
    // make sure the cache table exists
    await createSixAreaStatsCacheTable();
    const query = {
        text: `INSERT INTO cached_six_area_stats (boundary, plant, phenophase, climate, date, count, mean, stddev, min, max, percent_complete)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        values: [boundary, plant, phenophase, climate, date.format('YYYY-MM-DD'), count, mean, stddev, min, max, percent_complete]
    };
    const res = await db.pgPool.query(query);
    return res;
}

// selects and returns row from the cache table matching function params
async function checkSixAreaStatsCache(boundary, date, plant, phenophase, climate) {
    // make sure the table exists
    await createSixAreaStatsCacheTable();

    const query = {
        text: `SELECT * FROM cached_six_area_stats
                WHERE boundary = $1
                AND date = $2
                AND plant = $3
                AND phenophase = $4
                AND climate = $5`,
        values: [boundary, date.format('YYYY-MM-DD'), plant, phenophase, climate]
    };
    console.log(query);
    const res = await db.pgPool.query(query);
    return res;
}

// saves to disk and returns path to styled tiff for six clipping
async function getClippedSixImage(boundary, boundaryTable, boundaryColumn, date, plant, phenophase, climate, fileFormat, useBufferedBoundry, useConvexHullBoundary) {
    let rastTable = await getAppropriateSixTable(date, climate, boundary, boundaryTable, boundaryColumn, plant, phenophase);
    let layerName = `si-x:${plant}_${phenophase}_${climate.toLowerCase()}`;
    if (rastTable.includes('alaska')) {
        layerName += '_alaska';
    }

    let buffer = getBufferSizeForTable(rastTable);

    let query = {};

    query = {text: `
SELECT
ST_AsTIFF(ST_SetBandNoDataValue(ST_Union(bar.clipped_raster), 1, null)) AS tiff,
ST_Extent(ST_Envelope(bar.clipped_raster)) AS extent
FROM (
    ST_Clip(ST_Union(r.rast), ST_Buffer(ST_MakeValid(ST_Union(${useConvexHullBoundary ? 'foo.convex_hull_boundary' : 'foo.boundary'})), $1), -9999, true) AS clipped_raster
    FROM
    (
        SELECT ST_Union(p.geom) AS boundary,
        ST_ConvexHull(ST_Union(p.geom)) AS convex_hull_boundary
        FROM ${boundaryTable} p
        WHERE p.${boundaryColumn} = $2
    ) AS foo
    INNER JOIN ${rastTable} r
    ON ST_Intersects(r.rast, foo.convex_hull_boundary)
    AND r.rast_date = $3
    AND r.plant = $4
    AND r.phenophase = $5
) AS bar
    `, values: [buffer, boundary, date.format('YYYY-MM-DD'), plant, phenophase]
    };

//     if(useConvexHullBoundary) {
//         query = {
//             text: `
// SELECT
// ST_AsTIFF(ST_SetBandNoDataValue(ST_Union(bar.clipped_raster), 1, null)) AS tiff,
// ST_Extent(ST_Envelope(bar.clipped_raster)) AS extent
// FROM (
//     SELECT ST_Union(ST_Clip(r.rast, ST_Buffer(ST_ConvexHull(ST_Union(foo.boundary)), $1), -9999, true)) AS clipped_raster
//     FROM
//     (
//         SELECT p.geom AS boundary
//         FROM ${boundaryTable} p
//         WHERE p.${boundaryColumn} = $2
//     ) AS foo
//     INNER JOIN ${rastTable} r
//     ON ST_Intersects(r.rast, ST_ConvexHull(foo.boundary))
//     AND r.rast_date = $3
//     AND r.plant = $4
//     AND r.phenophase = $5
// ) AS bar
// `,
//             values: [buffer, boundary, date.format('YYYY-MM-DD'), plant, phenophase]
//         };
//     } else {
//         query = {
//             text: `
// SELECT
// ST_AsTIFF(ST_SetBandNoDataValue(ST_Union(bar.clipped_raster), 1, null)) AS tiff,
// ST_Extent(ST_Envelope(bar.clipped_raster)) AS extent
// FROM (
//     SELECT ST_Union(ST_Clip(r.rast, ST_Buffer(ST_MakeValid(foo.boundary), $1), -9999, true)) AS clipped_raster
//     FROM
//     (
//         SELECT p.gid as gid, p.geom AS boundary
//         FROM ${boundaryTable} p
//         WHERE p.${boundaryColumn} = $2
//     ) AS foo
//     INNER JOIN ${rastTable} r
//     ON ST_Intersects(r.rast, ST_ConvexHull(foo.boundary))
//     AND r.rast_date = $3
//     AND r.plant = $4
//     AND r.phenophase = $5
// ) AS bar
// `,
//             values: [buffer, boundary, date.format('YYYY-MM-DD'), plant, phenophase]
//         };
//     }



    console.log(query);
    log.info(query);
    const res = await db.pgPool.query(query);
    log.info('query complete');

    let response = {date: date.format('YYYY-MM-DD'), layerClippedFrom: layerName};
    if (res.rows.length > 0) {
        let d = new Date();
        let filename = `${boundary.replace(/ /g, '_')}_six_${plant}_${phenophase}_${date.format('YYYY-MM-DD')}_${d.getTime()}.${fileFormat}`;
        await helpers.WriteFile(imagePath + filename, res.rows[0].tiff);
        response.clippedImage = await stylizeFile(filename, imagePath, fileFormat, layerName);
        response.bbox = helpers.extractFloatsFromString(res.rows[0].extent);
        return response;
    } else {
        return response;
    }
}

// saves to disk and returns path to unstyled tiff for six clipping
async function getClippedSixRaster(boundary, boundaryTable, boundaryColumn, date, plant, phenophase, climate, fileFormat, useBufferedBoundary, useConvexHullBoundary) {
    let rastTable = await getAppropriateSixTable(date, climate, boundary, boundaryTable, boundaryColumn, plant, phenophase);
    let layerName = `si-x:${plant}_${phenophase}_${climate.toLowerCase()}`;
    if (rastTable.includes('alaska')) {
        layerName += '_alaska';
    }

    let buffer = getBufferSizeForTable(rastTable);

    const query = {
        text: `
SELECT 
ST_AsTIFF(ST_Union(bar.clipped_raster)) AS tiff,
ST_Extent(ST_Envelope(bar.clipped_raster)) AS extent
FROM (
    SELECT ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, $1), -9999, true)) AS clipped_raster
    FROM
    (
        SELECT p.gid as gid, ST_MakeValid(p.geom) AS boundary 
        FROM ${boundaryTable} p
        WHERE p.${boundaryColumn} = $2
    ) AS foo
    INNER JOIN ${rastTable} r
    ON ST_Intersects(r.rast, foo.boundary)
    AND r.rast_date = $3
    AND r.plant = $4
    AND r.phenophase = $5
) AS bar
`,
        values: [buffer, boundary, date.format('YYYY-MM-DD'), plant, phenophase]
    };

    console.log(query);
    const res = await db.pgPool.query(query);

    let response = {date: date.format('YYYY-MM-DD'), layerClippedFrom: layerName};
    if (res.rows.length > 0) {
        let d = new Date();
        let filename = `${boundary.replace(/ /g, '_')}_six_${plant}_${phenophase}_${date.format('YYYY-MM-DD')}_${d.getTime()}.${fileFormat}`;
        await helpers.WriteFile(imagePath + filename, res.rows[0].tiff);

        if (fileFormat === 'png') {
            exec(`convert ${imagePath + filename} -transparent white ${imagePath + filename.replace('.tiff', '.png')}`, (err, stdout, stderr) => {
                if (err) {
                    // node couldn't execute the command
                    return;
                }

                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            });

            response.clippedImage = `data-dev.usanpn.org:${process.env.PORT}/` + filename.replace('.tiff', '.png');
            response.bbox = helpers.extractFloatsFromString(res.rows[0].extent);
            return response;
        } else {
            response.clippedImage = `data-dev.usanpn.org:${process.env.PORT}/` + filename;
            response.bbox = helpers.extractFloatsFromString(res.rows[0].extent);
            response.bbox = bbox;
            return response;
        }


    } else {
        return response;
    }
}

// gets si-x stats for functions params, if saveToCache is true, also saves result to the cache table
async function getPostgisClippedRasterSixStats(climate, rastTable, boundary, boundaryTable, boundaryColumn, date, plant, phenophase, saveToCache) {
    let buffer = getBufferSizeForTable(rastTable);

    const query = {
        text: `
        SELECT (ST_SummaryStats(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, $1), -9999, true)), true)).*,
        ST_Count(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, $1), -9999, true)), true) AS data_in_boundary,
        ST_ValueCount(ST_Union(ST_Clip(ST_Reclass(r.rast, '[-9999-0):8888,[0-500]:[0-500]', '16BUI'), ST_Buffer(foo.boundary, $1), -9999, true)), 1, false, 8888) AS nodata_in_boundary,
        ST_Count(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, $1), -9999, true)), false) AS total_pixels_in_and_out_of_boundary
        FROM (SELECT p.gid as gid, ST_MakeValid(p.geom) AS boundary FROM ${boundaryTable} p WHERE p.${boundaryColumn} = $2) as foo
        INNER JOIN ${rastTable} r ON ST_Intersects(r.rast, foo.boundary)
        AND r.rast_date = $3
        AND r.plant = $4
        AND r.phenophase = $5`,
        values: [buffer, boundary, date.format('YYYY-MM-DD'), plant, phenophase]
    };
    console.log(query.text);

    const res = await db.pgPool.query(query);

    let response = {date: date.format('YYYY-MM-DD')};
    if (res.rows.length > 0) {
        response.count = Number(res.rows[0].count);
        response.sum = res.rows[0].sum;
        response.mean = res.rows[0].mean;
        response.stddev = res.rows[0].stddev;
        response.min = res.rows[0].min;
        response.max = res.rows[0].max;
        // response.data_in_boundary = Number(res.rows[0].data_in_boundary);
        // response.nodata_in_boundary = Number(res.rows[0].nodata_in_boundary);
        // response.total_pixels_in_and_out_of_boundary = Number(res.rows[0].total_pixels_in_and_out_of_boundary);
        response.percentComplete = Number(res.rows[0].count) / (Number(res.rows[0].nodata_in_boundary) + Number(res.rows[0].data_in_boundary)) * 100;

        // save the results to the caching table
        if (saveToCache) {
            await saveSixAreaStatsToCache(boundary, plant, phenophase, climate, date, response.count, response.mean, response.stddev, response.min, response.max, response.percentComplete);
        }
    }
    return response;
}

async function getSixAreaStats(boundary, boundaryTable, boundaryColumn, date, plant, phenophase, climate) {
    let rastTable = await getAppropriateSixTable(date, climate, boundary, boundaryTable, boundaryColumn, plant, phenophase);
    let response = await getPostgisClippedRasterSixStats(climate, rastTable, boundary, boundaryTable, boundaryColumn, date, plant, phenophase, false);
    return response;
}

async function getSixAreaStatsWithCaching(boundary, boundaryTable, boundaryColumn, date, plant, phenophase, climate) {

    let res = await checkSixAreaStatsCache(boundary, date, plant, phenophase, climate);
    let response = {};
    if (res.rows.length > 0) {
        response.date = date.format('YYYY-MM-DD');
        response.count = res.rows[0].count;
        response.sum = res.rows[0].sum;
        response.mean = res.rows[0].mean;
        response.stddev = res.rows[0].stddev;
        response.min = res.rows[0].min;
        response.max = res.rows[0].max;
        response.percentComplete = res.rows[0].percent_complete;
    } else {
        let rastTable = await getAppropriateSixTable(date, climate, boundary, boundaryTable, boundaryColumn, plant, phenophase);
        response = await getPostgisClippedRasterSixStats(climate, rastTable, boundary, boundaryTable, boundaryColumn, date, plant, phenophase, true);
    }
    return response;
}

// async function getPostgisClippedRasterSixStats(climate, rastTable, boundary, date, plant, phenophase, saveToCache) {
//     let buffer = getBufferSizeForTable(rastTable);
//     let query = `SELECT
//     ST_AsGeoJSON(ST_Union(foo.boundary)) as geojson,
//     (ST_SummaryStats(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, ${buffer}), true)), true)).*,
//     ST_AsTIFF(ST_SetBandNoDataValue(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, ${buffer}), true)), 1, -9999)) AS tiffy,
//     ST_Union(foo.boundary) AS shapefile
//     FROM (SELECT p.gid as gid, p.geom AS boundary FROM fws_boundaries p WHERE p.orgname = '${boundary}') as foo
//     INNER JOIN ${rastTable} r ON ST_Intersects(r.rast, foo.boundary)
//     AND r.rast_date = '${date.format('YYYY-MM-DD')}'
//     AND r.plant='${plant}'
//     AND r.phenophase='${phenophase}';`;
//
//     console.log(query);
//     const res = await db.pgPool.query(query);
//
//     let response = {date: date.format('YYYY-MM-DD')};
//     if (res.rows.length > 0) {
//         response.count = res.rows[0].count;
//         response.sum = res.rows[0].sum;
//         response.mean = res.rows[0].mean;
//         response.stddev = res.rows[0].stddev;
//         response.min = res.rows[0].min;
//         response.max = res.rows[0].max;
//
//         // save the results to the caching table
//         if (saveToCache) {
//             await saveSixAreaStatsToCache(boundary, plant, phenophase, climate, date, response.count, response.mean, response.stddev, response.min, response.max, null);
//         }
//
//         // todo: maybe possible to view in openlayers but not always zooming right so commenting out for now
//         // response.viewboundary = `http://geoserver-dev.usanpn.org/geoserver/gdd/wms?service=WMS&version=1.1.0&request=GetMap&layers=gdd:fws_boundaries&CQL_FILTER=orgname='${boundary}'&styles=&bbox=-180.944702148438,17.4382019042969,181.569763183594,65.4184417724609&width=1400&height=700&srs=EPSG:4269&format=application/openlayers`;
//         response.zippedShapeFile = `http://geoserver-dev.usanpn.org/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:fws_boundaries&CQL_FILTER=orgname='${boundary}'&maxFeatures=50&outputFormat=SHAPE-ZIP`;
//
//         let d = new Date();
//         let rasterpath = 'static/rasters/';
//         let filename = `${boundary.replace(/ /g, '_')}_six_${plant}_${phenophase}_${date.format('YYYY-MM-DD')}_${d.getTime()}.tiff`;
//         response.rasterFile = `data-dev.usanpn.org:${process.env.PORT}/` + filename;
//         await WriteFile(rasterpath + filename, res.rows[0].tiffy);
//         //todo: below line can use this with geoserver wps to obtain styled clipped raster, initial testing shows boundary rules aren't correct though
//         response.geojson = res.rows[0].geojson;
//     }
//     return response;
// }

module.exports.getClippedSixImage = getClippedSixImage;
module.exports.getClippedSixRaster = getClippedSixRaster;
module.exports.getSixAreaStats = getSixAreaStats;
module.exports.getSixAreaStatsWithCaching = getSixAreaStatsWithCaching;
module.exports.getPostgisClippedRasterSixStats = getPostgisClippedRasterSixStats;
module.exports.getAppropriateSixTable = getAppropriateSixTable;
module.exports.createSixAreaStatsCacheTable = createSixAreaStatsCacheTable;
