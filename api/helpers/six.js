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
async function getAppropriateSixTable(date, climate, boundary, boundaryTable, boundaryColumn, plant, phenophase, anomaly) {

    let now = moment();

    if (anomaly) {
        if (date.year() < now.year())
            return 'six_anomaly_historic';
        else
            return 'six_anomaly'
    } else if (climate === 'PRISM') {
        return 'prism_spring_index';
    } else if (climate === 'BEST') {
        return 'best_spring_index';
    } else if (climate === 'NCEP') {
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
async function getClippedSixImage(boundary, boundaryTable, boundaryColumn, date, plant, phenophase, climate, fileFormat, useBufferedBoundry, useConvexHullBoundary, anomaly) {
    let rastTable = await getAppropriateSixTable(date, climate, boundary, boundaryTable, boundaryColumn, plant, phenophase, anomaly);
    let layerName = anomaly ? `si-x:${phenophase}_anomaly` : `si-x:${plant}_${phenophase}_${climate.toLowerCase()}`;
    if (rastTable.includes('alaska')) {
        layerName += '_alaska';
    }

    let buffer = getBufferSizeForTable(rastTable);

    let query = {};

    if(useConvexHullBoundary) {
        query = {text: `
SELECT
ST_AsTIFF(ST_SetBandNoDataValue(ST_Union(bar.clipped_raster), 1, null)) AS tiff,
ST_Extent(ST_Envelope(bar.clipped_raster)) AS extent
FROM (
    SELECT ST_Union(ST_Clip(r.rast, foo.convex_hull_boundary, -9999, true)) AS clipped_raster
    FROM
    (
        SELECT ST_Union(p.geom) AS convex_hull_boundary
        FROM ${boundaryTable}_convexhull p
        WHERE p.${boundaryColumn} = $1
    ) AS foo
    INNER JOIN ${rastTable} r
    ON ST_Intersects(r.rast, foo.convex_hull_boundary)
    AND r.rast_date = $2
    AND r.plant = $3
    AND r.phenophase = $4
) AS bar
    `, values: [boundary, date.format('YYYY-MM-DD'), plant, phenophase]
        };
    } else {
        query = {text: `
SELECT
ST_AsTIFF(ST_SetBandNoDataValue(ST_Union(bar.clipped_raster), 1, null)) AS tiff,
ST_Extent(ST_Envelope(bar.clipped_raster)) AS extent
FROM (
    SELECT ST_Union(ST_Clip(r.rast, foo.boundary, -9999, true)) AS clipped_raster
    FROM
    (
        SELECT ST_Buffer(ST_Union(p.geom), $1) AS boundary,
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
    }
    console.log(query);
    log.info(query);
    const res = await db.pgPool.query(query);
    log.info('query complete');

    let response = {date: date.format('YYYY-MM-DD'), layerClippedFrom: layerName};
    if (res.rows.length > 0) {
        let d = new Date();
        let filename = anomaly
            ? `${boundary.replace(/ /g, '_')}_six_anomaly_${phenophase}_${date.format('YYYY-MM-DD')}_${d.getTime()}.${fileFormat}`
            : `${boundary.replace(/ /g, '_')}_six_${plant}_${phenophase}_${date.format('YYYY-MM-DD')}_${d.getTime()}.${fileFormat}`;
        await helpers.WriteFile(imagePath + filename, res.rows[0].tiff);
        response.clippedImage = await helpers.stylizeFile(filename, imagePath, fileFormat, layerName);
        response.bbox = helpers.extractFloatsFromString(res.rows[0].extent);
        return response;
    } else {
        return response;
    }
}

// saves to disk and returns path to unstyled tiff for six clipping
async function getClippedSixRaster(boundary, boundaryTable, boundaryColumn, date, plant, phenophase, climate, fileFormat, useBufferedBoundary, useConvexHullBoundary, anomaly) {
    let rastTable = await getAppropriateSixTable(date, climate, boundary, boundaryTable, boundaryColumn, plant, phenophase, anomaly);
    let layerName = anomaly ? `si-x:${phenophase}_anomaly` : `si-x:${plant}_${phenophase}_${climate.toLowerCase()}`;
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

            response.clippedImage = `${process.env.PROTOCOL}://${process.env.SERVICES_HOST}:${process.env.PORT}/` + filename.replace('.tiff', '.png');
            response.bbox = helpers.extractFloatsFromString(res.rows[0].extent);
            return response;
        } else {
            response.clippedImage = `${process.env.PROTOCOL}://${process.env.SERVICES_HOST}:${process.env.PORT}/` + filename;
            response.bbox = helpers.extractFloatsFromString(res.rows[0].extent);
            response.bbox = bbox;
            return response;
        }


    } else {
        return response;
    }
}

// gets si-x stats for functions params, if saveToCache is true, also saves result to the cache table
async function getPostgisClippedRasterSixStats(climate, rastTable, boundary, boundaryTable, boundaryColumn, date, plant, phenophase, saveToCache, useConvexHullBoundary, anomaly) {
    let buffer = getBufferSizeForTable(rastTable);

    let query = {};
    if(useConvexHullBoundary) {
        query = {
            text: `
        SELECT (ST_SummaryStats(ST_Union(ST_Clip(r.rast, foo.convex_hull_boundary, -9999, true)), true)).*,
        ST_Count(ST_Union(ST_Clip(r.rast, foo.convex_hull_boundary, -9999, true)), true) AS data_in_boundary,
        ST_ValueCount(ST_Union(ST_Clip(ST_Reclass(r.rast, '${anomaly ? '-9999:8888' : '[-9999-0):8888'},[0-500]:[0-500]', '16BUI'), ${useConvexHullBoundary ? 'foo.convex_hull_boundary' : 'foo.boundary'}, -9999, true)), 1, false, 8888) AS nodata_in_boundary,
        ST_Count(ST_Union(ST_Clip(r.rast, foo.convex_hull_boundary, -9999, true)), false) AS total_pixels_in_and_out_of_boundary
        FROM (
            SELECT ST_Union(p.geom) AS convex_hull_boundary
            FROM ${boundaryTable}_convexhull p
            WHERE p.${boundaryColumn} = $1
        ) as foo
        INNER JOIN ${rastTable} r ON ST_Intersects(r.rast, foo.convex_hull_boundary)
        AND r.rast_date = $2
        AND r.plant = $3
        AND r.phenophase = $4`,
            values: [boundary, date.format('YYYY-MM-DD'), plant, phenophase]
        };
    } else {
        query = {
            text: `
        SELECT (ST_SummaryStats(ST_Union(ST_Clip(r.rast, ${useConvexHullBoundary ? 'foo.convex_hull_boundary' : 'foo.boundary'}, -9999, true)), true)).*,
        ST_Count(ST_Union(ST_Clip(r.rast, ${useConvexHullBoundary ? 'foo.convex_hull_boundary' : 'foo.boundary'}, -9999, true)), true) AS data_in_boundary,
        ST_ValueCount(ST_Union(ST_Clip(ST_Reclass(r.rast, '${anomaly ? '-9999:8888' : '[-9999-0):8888'},[0-500]:[0-500]', '16BUI'), ${useConvexHullBoundary ? 'foo.convex_hull_boundary' : 'foo.boundary'}, -9999, true)), 1, false, 8888) AS nodata_in_boundary,
        ST_Count(ST_Union(ST_Clip(r.rast, ${useConvexHullBoundary ? 'foo.convex_hull_boundary' : 'foo.boundary'}, -9999, true)), false) AS total_pixels_in_and_out_of_boundary
        FROM (
            SELECT ST_Buffer(ST_Union(p.geom), $1) AS boundary,
            ST_ConvexHull(ST_Union(p.geom)) AS convex_hull_boundary
            FROM ${boundaryTable} p
            WHERE p.${boundaryColumn} = $2
        ) as foo
        INNER JOIN ${rastTable} r ON ST_Intersects(r.rast, foo.convex_hull_boundary)
        AND r.rast_date = $3
        AND r.plant = $4
        AND r.phenophase = $5`,
            values: [buffer, boundary, date.format('YYYY-MM-DD'), plant, phenophase]
        };
    }
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

async function getSixAreaStats(boundary, boundaryTable, boundaryColumn, date, plant, phenophase, climate, useConvexHullBoundary, anomaly) {
    let rastTable = await getAppropriateSixTable(date, climate, boundary, boundaryTable, boundaryColumn, plant, phenophase, anomaly);
    let response = await getPostgisClippedRasterSixStats(climate, rastTable, boundary, boundaryTable, boundaryColumn, date, plant, phenophase, false, useConvexHullBoundary, anomaly);
    return response;
}

async function getSixAreaStatsWithCaching(boundary, boundaryTable, boundaryColumn, date, plant, phenophase, climate, useConvexHullBoundary, anomaly) {

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
        let rastTable = await getAppropriateSixTable(date, climate, boundary, boundaryTable, boundaryColumn, plant, phenophase, anomaly);
        response = await getPostgisClippedRasterSixStats(climate, rastTable, boundary, boundaryTable, boundaryColumn, date, plant, phenophase, true, useConvexHullBoundary, anomaly);
    }
    return response;
}


module.exports.getClippedSixImage = getClippedSixImage;
module.exports.getClippedSixRaster = getClippedSixRaster;
module.exports.getSixAreaStats = getSixAreaStats;
module.exports.getSixAreaStatsWithCaching = getSixAreaStatsWithCaching;
module.exports.getPostgisClippedRasterSixStats = getPostgisClippedRasterSixStats;
module.exports.getAppropriateSixTable = getAppropriateSixTable;
module.exports.createSixAreaStatsCacheTable = createSixAreaStatsCacheTable;
