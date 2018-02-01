let db = require('./database.js');
let log = require('../../logger.js');
const moment = require('moment');
let helpers = require('./general');
var fs = require('fs');

const imagePath = '/var/www/data-site/files/npn-geo-services/clipped_images/';
const pestImagePath = imagePath + 'pest_maps/';

// to pick up all pixels inside boundary we need to buffer around the shapefile before doing a clip,
// the size of this buffer depends on the dataset resolution. This function returns the correct buffer size.
function getBufferSizeForTable(rastTable) {
    let buffer = .01;
    if (rastTable === 'agdd_prism') {
        buffer = .02;
    }
    return buffer;
}

// returns the number of tiles the boundary intersects
async function boundaryRasterIntersections(rastTable, boundary, boundaryTable, boundaryColumn, date, base) {
    const query = {
        text: `
        SELECT COUNT(*) AS intersections
        FROM ${rastTable} r, ${boundaryTable} p 
        WHERE p.${boundaryColumn} = $1 AND ST_Intersects(r.rast, p.geom) AND r.rast_date = $2 AND r.base = $3`,
        values: [boundary, date.format('YYYY-MM-DD'), base]
    };
    const res = await db.pgPool.query(query);
    return parseInt(res.rows[0].intersections);
}

// choose table via selected data and boundary tile intersection (for ncep alaska)
async function getAppropriateAgddTable(date, climate, boundary, boundaryTable, boundaryColumn, base, anomaly) {
    if (anomaly) {
        return `agdd_anomaly_${date.year()}`;
    }
    let rasterCellsInBoundary = await boundaryRasterIntersections(`agdd_alaska_${date.year()}`, boundary, boundaryTable, boundaryColumn, date, base);
    if (rasterCellsInBoundary > 0) {
        return `agdd_alaska_${date.year()}`;
    } else {
        return `agdd_${date.year()}`;
    }
}


// gets si-x stats for functions params, if saveToCache is true, also saves result to the cache table
async function getPostgisClippedRasterAgddStats(climate, rastTable, boundary, boundaryTable, boundaryColumn, date, base, saveToCache, useConvexHullBoundary) {
    let buffer = getBufferSizeForTable(rastTable);

    const query = {
        text: `
        SELECT (ST_SummaryStats(ST_Union(ST_Clip(r.rast, ${useConvexHullBoundary ? 'foo.convex_hull_boundary' : 'foo.boundary'}, -9999, true)), true)).*
        FROM (
            SELECT ST_Buffer(ST_Union(p.geom), $1) AS boundary,
            ST_ConvexHull(ST_Union(p.geom)) AS convex_hull_boundary
            FROM ${boundaryTable} p
            WHERE p.${boundaryColumn} = $2
        ) as foo
        INNER JOIN ${rastTable} r ON ST_Intersects(r.rast, foo.convex_hull_boundary)
        AND r.rast_date = $3
        AND r.base = $4`,
        values: [buffer, boundary, date.format('YYYY-MM-DD'), base]
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

        // save the results to the caching table
        // if (saveToCache) {
        //     await saveAgddAreaStatsToCache(boundary, plant, phenophase, climate, date, response.count, response.mean, response.stddev, response.min, response.max, response.percentComplete);
        // }
    }
    return response;
}


// async function getPostgisClippedRasterAgddStats(rastTable, boundary, date, base) {
//     let buffer = getBufferSizeForTable(rastTable);
//
//     const query = {
//         text: `
//         SELECT
//     (ST_SummaryStats(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, $1), true)), true)).*,
//     ST_Union(foo.boundary) AS shapefile
//     FROM (SELECT p.gid as gid, p.geom AS boundary FROM fws_boundaries p WHERE p.orgname = $2) as foo
//     INNER JOIN ${rastTable} r ON ST_Intersects(r.rast, foo.boundary)
//     AND r.rast_date = $3
//     AND r.base = $4
//     AND r.scale='fahrenheit';`,
//         values: [buffer, boundary, date.format('YYYY-MM-DD'), base]
//     };
//
//     // let query = `SELECT
//     // ST_AsGeoJSON(ST_Union(foo.boundary)) as geojson,
//     // (ST_SummaryStats(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, ${buffer}), true)), true)).*,
//     // ST_AsTIFF(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, ${buffer}), true))) AS tiffy,
//     // ST_Union(foo.boundary) AS shapefile
//     // FROM (SELECT p.gid as gid, p.geom AS boundary FROM fws_boundaries p WHERE p.orgname = '${boundary}') as foo
//     // INNER JOIN ${rastTable} r ON ST_Intersects(r.rast, foo.boundary)
//     // AND r.rast_date = '${date.format('YYYY-MM-DD')}'
//     // AND r.base='${base}'
//     // AND r.scale='fahrenheit';`;
//
//     console.log(query);
//     const res = await pgPool.query(query);
//
//     let response = {date: date.format('YYYY-MM-DD')};
//     if (res.rows.length > 0) {
//         response.count = res.rows[0].count;
//         response.sum = res.rows[0].sum;
//         response.mean = res.rows[0].mean;
//         response.stddev = res.rows[0].stddev;
//         response.min = res.rows[0].min;
//         response.max = res.rows[0].max;
//         response.zippedShapeFile = `http://geoserver-dev.usanpn.org/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:fws_boundaries&CQL_FILTER=orgname='${boundary}'&maxFeatures=50&outputFormat=SHAPE-ZIP`;
//     }
//     return response;
// }

// async function getAgddAreaStats(boundary, date, base, climate) {
//     let dateString = date.toISOString().split('T')[0];
//     let rastTable = await getAppropriateAgddTable(date, climate, boundary, dateString, base);
//     let response = await getPostgisClippedRasterAgddStats(rastTable, boundary, dateString, base);
//     return response;
// }


async function getAgddAreaStats(boundary, boundaryTable, boundaryColumn, date, base, climate, useConvexHullBoundary, anomaly) {
    let rastTable = await getAppropriateAgddTable(date, climate, boundary, boundaryTable, boundaryColumn, base, anomaly);
    let response = await getPostgisClippedRasterAgddStats(climate, rastTable, boundary, boundaryTable, boundaryColumn, date, base, false, useConvexHullBoundary);
    return response;
}

async function getAgddAreaStatsWithCaching(boundary, boundaryTable, boundaryColumn, date, base, climate, useConvexHullBoundary, anomaly) {

    let res = await checkAgddAreaStatsCache(boundary, date, base, climate);
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
        let rastTable = await getAppropriateAgddTable(date, climate, boundary, boundaryTable, boundaryColumn, base, anomaly);
        response = await getPostgisClippedRasterAgddStats(climate, rastTable, boundary, boundaryTable, boundaryColumn, date, base, true, useConvexHullBoundary);
    }
    return response;
}


// saves to disk and returns path to styled tiff for six clipping
async function getClippedAgddImage(boundary, boundaryTable, boundaryColumn, date, base, climate, fileFormat, useBufferedBoundry, useConvexHullBoundary, anomaly) {
    let rastTable = await getAppropriateAgddTable(date, climate, boundary, boundaryTable, boundaryColumn, base, anomaly);
    let layerName = anomaly ? `gdd:agdd_anomaly` : `gdd:agdd`;
    if (rastTable.includes('alaska')) {
        layerName += '_alaska';
    }
    if (base === 50) {
        layerName += '_50f';
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
    AND r.base = $3
    AND r.scale = $4
) AS bar
    `, values: [boundary, date.format('YYYY-MM-DD'), base, 'fahrenheit']
        };
    } else {
        query = {text: `
SELECT
ST_AsTIFF(ST_SetBandNoDataValue(ST_Union(bar.clipped_raster), 1, null)) AS tiff,
ST_Extent(ST_Envelope(bar.clipped_raster)) AS extent
FROM (
    SELECT ST_Union(ST_Clip(r.rast, ${useConvexHullBoundary ? 'foo.convex_hull_boundary' : 'foo.boundary'}, -9999, true)) AS clipped_raster
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
    AND r.base = $4
    AND r.scale = $5
) AS bar
    `, values: [buffer, boundary, date.format('YYYY-MM-DD'), base, 'fahrenheit']
        };
    }

//     let query = {text: `
// SELECT
// ST_AsTIFF(ST_SetBandNoDataValue(ST_Union(bar.clipped_raster), 1, null)) AS tiff,
// ST_Extent(ST_Envelope(bar.clipped_raster)) AS extent
// FROM (
//     SELECT ST_Union(ST_Clip(r.rast, ${useConvexHullBoundary ? 'foo.convex_hull_boundary' : 'foo.boundary'}, -9999, true)) AS clipped_raster
//     FROM
//     (
//         SELECT ST_Buffer(ST_Union(p.geom), $1) AS boundary,
//         ST_ConvexHull(ST_Union(p.geom)) AS convex_hull_boundary
//         FROM ${boundaryTable} p
//         WHERE p.${boundaryColumn} = $2
//     ) AS foo
//     INNER JOIN ${rastTable} r
//     ON ST_Intersects(r.rast, foo.convex_hull_boundary)
//     AND r.rast_date = $3
//     AND r.base = $4
//     AND r.scale = $5
// ) AS bar
//     `, values: [buffer, boundary, date.format('YYYY-MM-DD'), base, 'fahrenheit']
//     };



    console.log(query);
    log.info(query);
    const res = await db.pgPool.query(query);
    log.info('query complete');

    let response = {date: date.format('YYYY-MM-DD'), layerClippedFrom: layerName};
    if (res.rows.length > 0) {
        let d = new Date();
        let filename = anomaly
            ? `${boundary.replace(/ /g, '_')}_agdd_anomaly_${base}f_${date.format('YYYY-MM-DD')}_${d.getTime()}.${fileFormat}`
            : `${boundary.replace(/ /g, '_')}_agdd_${base}f_${date.format('YYYY-MM-DD')}_${d.getTime()}.${fileFormat}`;
        await helpers.WriteFile(imagePath + filename, res.rows[0].tiff);
        response.clippedImage = await helpers.stylizeFile(filename, imagePath, fileFormat, layerName);
        response.bbox = helpers.extractFloatsFromString(res.rows[0].extent);
        return response;
    } else {
        return response;
    }
}

async function getClippedAgddRaster() {

}


// saves to disk and returns path to styled tiff for six clipping
async function getPestMap(species, date, aprilStartDate) {

    let layerName = `gdd:agdd_50f`;

    //if file exists don't recompute it
    let styledFileName = `${species.replace(/ /g, '_')}_${date.format('YYYY-MM-DD')}_styled.png`;
    if (fs.existsSync(pestImagePath + styledFileName)) {
        let response = {
            date: date.format('YYYY-MM-DD'),
            layerClippedFrom: layerName,
            clippedImage: `${process.env.PROTOCOL}://${process.env.SERVICES_HOST}:${process.env.PORT}/pest_maps` + styledFileName,
            bbox: [
                -109.0712618165,
                25.8324511400651,
                -69.9386512189563,
                49.389657980456
            ]
        };
        return response;
    }

    let base = 50;
    let rastTable = `agdd_${date.year()}`;
    let buffer = getBufferSizeForTable(rastTable);

    let boundaryTable = "state_boundaries";
    let boundaryColumn = "name";
    let stateNames = ["'Colorado'", "'Nebraska'", "'Kansas'", "'Oklahoma'", "'Texas'", "'Minnesota'",
        "'Iowa'", "'Missouri'", "'Arkansas'", "'Louisiana'", "'Wisconsin'", "'Illinois'",
        "'Kentucky'", "'Tennessee'", "'Mississippi'", "'Michigan'", "'Indiana'", "'Alabama'",
        "'Ohio'", "'Alabama'", "'Georgia'", "'South Carolina'", "'North Carolina'", "'Virginia'",
        "'West Virginia'", "'District of Columbia'", "'Maryland'", "'Delaware'", "'New Jersey'", "'Pennsylvania'",
        "'New York'", "'Connecticut'", "'Rhode Island'", "'Massachusetts'", "'New Hampshire'"];

    let query = {};
    if(aprilStartDate) {
        query = {text: `
SELECT
ST_AsTIFF(ST_SetBandNoDataValue(ST_Union(bar.clipped_raster), 1, null)) AS tiff,
ST_Extent(ST_Envelope(bar.clipped_raster)) AS extent
FROM (
    SELECT ST_Union(ST_Clip(ST_MapAlgebra(r.rast, r2.rast, '([rast1]-[rast2])'), foo.convex_hull_boundary, -9999, true)) AS clipped_raster
    FROM
    (
        SELECT ST_Union(p.geom) AS boundary,
        ST_ConvexHull(ST_Union(p.geom)) AS convex_hull_boundary
        FROM ${boundaryTable} p
        WHERE p.${boundaryColumn} IN (${stateNames})
    ) AS foo
    INNER JOIN ${rastTable} r
    ON ST_Intersects(r.rast, foo.convex_hull_boundary)
    AND r.rast_date = $1
    AND r.base = $2
    AND r.scale = $3
    INNER JOIN ${rastTable} r2
    ON ST_Intersects(r.rast, foo.convex_hull_boundary)
    AND ST_Contains(r.rast, r2.rast)
    AND r2.rast_date = '2017-04-01'
    AND r2.base = $4
    AND r2.scale = $5
) AS bar
    `, values: [date.format('YYYY-MM-DD'), base, 'fahrenheit', base, 'fahrenheit']
        };
    } else {
        query = {text: `
SELECT
ST_AsTIFF(ST_SetBandNoDataValue(ST_Union(bar.clipped_raster), 1, null)) AS tiff,
ST_Extent(ST_Envelope(bar.clipped_raster)) AS extent
FROM (
    SELECT ST_Union(ST_Clip(r.rast, foo.convex_hull_boundary, -9999, true)) AS clipped_raster
    FROM
    (
        SELECT ST_Union(p.geom) AS boundary,
        ST_ConvexHull(ST_Union(p.geom)) AS convex_hull_boundary
        FROM ${boundaryTable} p
        WHERE p.${boundaryColumn} IN (${stateNames})
    ) AS foo
    INNER JOIN ${rastTable} r
    ON ST_Intersects(r.rast, foo.convex_hull_boundary)
    AND r.rast_date = $1
    AND r.base = $2
    AND r.scale = $3
) AS bar
    `, values: [date.format('YYYY-MM-DD'), base, 'fahrenheit']
        };
    }
//     let query = {text: `
// SELECT
// ST_AsTIFF(ST_SetBandNoDataValue(ST_Union(bar.clipped_raster), 1, null)) AS tiff,
// ST_Extent(ST_Envelope(bar.clipped_raster)) AS extent
// FROM (
//     SELECT ST_Union(ST_Clip(r.rast, foo.convex_hull_boundary, -9999, true)) AS clipped_raster
//     FROM
//     (
//         SELECT ST_Union(p.geom) AS boundary,
//         ST_ConvexHull(ST_Union(p.geom)) AS convex_hull_boundary
//         FROM ${boundaryTable} p
//         WHERE p.${boundaryColumn} IN (${stateNames})
//     ) AS foo
//     INNER JOIN ${rastTable} r
//     ON ST_Intersects(r.rast, foo.convex_hull_boundary)
//     AND r.rast_date = $1
//     AND r.base = $2
//     AND r.scale = $3
// ) AS bar
//     `, values: [date.format('YYYY-MM-DD'), base, 'fahrenheit']
//     };



    console.log(query);
    log.info(query);
    const res = await db.pgPool.query(query);
    log.info('query complete');

    let response = {date: date.format('YYYY-MM-DD'), layerClippedFrom: layerName};
    if (res.rows.length > 0) {
        let pngFilename = `${species.replace(/ /g, '_')}_${date.format('YYYY-MM-DD')}.png`;
        await helpers.WriteFile(pestImagePath + pngFilename, res.rows[0].tiff);
        response.clippedImage = await helpers.stylizePestMap(pngFilename, pestImagePath, 'png', layerName);
        response.bbox = helpers.extractFloatsFromString(res.rows[0].extent);
        return response;
    } else {
        return response;
    }
}

module.exports.getPestMap = getPestMap;
module.exports.getClippedAgddImage = getClippedAgddImage;
module.exports.getClippedAgddRaster = getClippedAgddRaster;
module.exports.getAgddAreaStats = getAgddAreaStats;
module.exports.getAgddAreaStatsWithCaching = getAgddAreaStatsWithCaching;
