let db = require('./database.js');
let log = require('../../logger.js');
const moment = require('moment');
let helpers = require('./general');
let climate = require('./climate');
var fs = require('fs');
const https = require('https');
const { exec } = require('child_process');
let pests = require('./pests');

let node_ssh = require('node-ssh');
let ssh = new node_ssh();
let client = require('scp2');

const imagePath = '/var/www/data-site/files/npn-geo-services/clipped_images/';
const pestImagePath = imagePath + 'pest_maps/';
const dynamicAgddPath = '/var/www/data-site/files/npn-geo-services/agdd_maps/';

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

async function downloadFile(url, dest) {
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

// preserveExtent is true only for prettymaps and get _nocache.png appended to the output file
// it keeps the large extent rather than shrinking it down to the clipping boundary 
// this is so the image will line up of the base image in the php script correctly
async function getPestMap(species, date, preserveExtent) {
    log.info('in getPestMap');
    let climateProvider = "ncep";
    let pest = pests.pests.find(item => item.species === species);
    let startDate = moment.utc(`${date.year()}-${pest.startMonthDay}`);

    let response = {
        date: date.format('YYYY-MM-DD'),
        layerClippedFrom: pest.layerName
    };

    // get the png from disk if already exists
    let styledFileName = `${pest.species.replace(/ /g, '_')}_${date.format('YYYY-MM-DD')}_styled.png`;
    if(preserveExtent) {
        styledFileName = `${pest.species.replace(/ /g, '_')}_${date.format('YYYY-MM-DD')}_styled_conus_extent.png`;
    }
    if (fs.existsSync(pestImagePath + styledFileName)) {
        log.info('styled png already exists');
        response.clippedImage = `${process.env.PROTOCOL}://${process.env.SERVICES_HOST}:${process.env.PORT}/pest_maps/` + styledFileName;
        response.bbox = pest.bounds;
        return response;
    }


    // get the tif agdd file into the pestImagePath directory
    // new Date().getTime() is to keep filename unique to prevent two requests from clobbering each other
    let tiffFileName = `${new Date().getTime()}_${pest.species.replace(/ /g, '_').toLowerCase()}_${date.format('YYYY-MM-DD')}.tif`;
    if(pest.layerName != 'custom') {
        // get the tiff from geoserver if it's simple base 32 or 50
        try {
            await downloadFile(
                `https://geoserver-dev.usanpn.org/geoserver/wcs?service=WCS&version=2.0.1&request=GetCoverage&coverageId=${pest.layerName}&SUBSET=time("${date.format('YYYY-MM-DD')}T00:00:00.000Z")&format=geotiff`,
                `${pestImagePath}${tiffFileName}`
                );
        } catch(err) {
            log.error('could not get the base agdd map from geoserver: ' + err);
            return {msg: 'could not get the base agdd map from geoserver: ' + err};
        } 
    } else if(startDate.valueOf() > moment().valueOf()) {
        //if start date is after today there will be no heat accumulation so use the zeroes tif
        try {
            await copyFilePromise(
                '/var/www/data-site/files/npn-geo-services/zero_maps/zeros_conus_ncep.tif',
                 `${pestImagePath}${tiffFileName}`
                 );
        } catch(err) {
            log.error('could not get the zeros base agdd map: ' + err);
            return {msg: 'could not get the zeros base agdd map: ' + err};
        } 
    } else {
        // otherwise generate tiff via custom agdd endpoint
        try {
            log.info(`getting dynamicAgdd for ${climateProvider} ${startDate.format('YYYY-MM-DD')} ${date.format('YYYY-MM-DD')} ${pest.base}`);
            let result = await getDynamicAgdd(pest.agddMethod, climateProvider, 'fahrenheit', startDate, date, pest.lowerThreshold, pest.upperThreshold);
            let tiffFileUrl = result.mapUrl;
            let agddPath = `/var/www/data-site/files/npn-geo-services/agdd_maps/`;
            tiffFileName = tiffFileUrl.split('/').pop();
            await renameFilePromise(`${agddPath}${tiffFileName}`, `${pestImagePath}${tiffFileName}`);
        } catch(err) {
            log.error('could not get the dynamically generated agdd map: ' + err);
            return {msg: 'could not get the dynamically generated agdd map: ' + err};
        } 
    }
    
    // clip the tif to shapefile
    try {
        //can talk about getting the shape file dynamically from geoserver, but extra processing
        //https://geoserver-dev.usanpn.org/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME IN ('Arizona', 'Texas')&outputFormat=SHAPE-ZIP
        //let shpQuery = `https://geoserver-dev.usanpn.org/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME IN (${stateNames.join()})&outputFormat=SHAPE-ZIP`;
        //https://geoserver-dev.usanpn.org/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME IN ('Maine','Vermont','Colorado','Nebraska','Kansas','Oklahoma','Texas','Minnesota','Iowa','Missouri','Arkansas','Louisiana','Wisconsin','Illinois','Kentucky','Tennessee','Mississippi','Michigan','Indiana','Alabama','Ohio','Alabama','Georgia','South Carolina','North Carolina','Virginia','West Virginia','District of Columbia','Maryland','Delaware','New Jersey','Pennsylvania','New York','Connecticut','Rhode Island','Massachusetts','New Hampshire','Florida')&outputFormat=SHAPE-ZIP
        let shapefile = `/var/www/data-site/files/npn-geo-services/shape_files/${pest.species.replace(/ /g, '_').toLowerCase()}_range/states.shp`;
        let croppedPngFilename = `${pest.species.replace(/ /g, '_')}_${date.format('YYYY-MM-DD')}.png`;
        // when not preserving extent, use -te to set bounds to the shapefile bounding box
        let clipCommand = `gdalwarp -srcnodata -9999 -dstnodata -9999 -te ${pest.bounds.join(' ')} -overwrite -cutline ${shapefile} ${pestImagePath}${tiffFileName} ${pestImagePath}${croppedPngFilename}`;
        if(preserveExtent) {
            clipCommand = `gdalwarp -srcnodata -9999 -dstnodata -9999 -t_srs EPSG:3857 -overwrite -cutline ${shapefile} ${pestImagePath}${tiffFileName} ${pestImagePath}${croppedPngFilename}`;
        }
        await execPromise(clipCommand);
    } catch(err) {
        log.error('could not slice pestmap to boundary: ' + err);
    }

    // remove the uncropped tiff
    await unlinkPromise(pestImagePath + tiffFileName);
    
    // style the tiff into png
    try {
        let styledClippedImagePath = await helpers.stylizePestMap(croppedPngFilename, pestImagePath, 'png', pest.sldName, 'black', preserveExtent);
        
        response.clippedImage = styledClippedImagePath;
        response.bbox = pest.bounds;
    
        log.info(`getPestMap response: ${response}`);
        return response;
    } catch(err) {
        log.error('could not style pestmap: ' + err);
        return {msg: 'could not style pestmap' + err};
    }
}

// // saves to disk and returns path to styled tiff for six clipping
// async function getPestMap(species, date, preserveExtent) {

//     // preserveExtent is true only for prettymaps and get _nocache.png appended to the output file
//     // it keeps the large extent rather than shrinking it down to the clipping boundary 
//     // this is so the image will line up of the base image in the php script correctly

//     let pest = pests.pests.find(item => item.species === species);

//     let response = {
//         date: date.format('YYYY-MM-DD'),
//         layerClippedFrom: pest.layerName
//     };

//     // get the png from disk if already exists
//     let styledFileName = `${pest.species.replace(/ /g, '_')}_${date.format('YYYY-MM-DD')}_styled.png`;
//     if(preserveExtent) {
//         styledFileName = `${pest.species.replace(/ /g, '_')}_${date.format('YYYY-MM-DD')}_styled_conus_extent.png`;
//     }
//     if (fs.existsSync(pestImagePath + styledFileName)) {
//         log.info('styled png already exists');
//         response.clippedImage = `${process.env.PROTOCOL}://${process.env.SERVICES_HOST}:${process.env.PORT}/pest_maps/` + styledFileName;
//         response.bbox = pest.bounds;
//         return response;
//     }

//     // any pest that's not using the simple 32 or 50 agdd with Jan 1 start date
//     if(pest.species === 'Eastern Tent Caterpillar' 
//         || pest.species === 'Asian Longhorned Beetle'
//         || pest.species === 'Bagworm'
//         || pest.species === 'Pine Needle Scale'
//         || pest.species === 'Gypsy Moth') {
//         return await getCustomAgddPestMap(pest, date, preserveExtent);
//     }

//     /* todo can be much faster if we refactor this to
//     1. get agdd50 or agdd35 geotiff styled from geoserver
//     2. clip using gdalwarp -srcnodata -9999 -dstnodata -9999  -cutline eastern_tent_caterpillar_range/states.shp gdd-agdd_50f-4.tif test_cropped.png
//     3. create transparent png with convert test_cropped.png -transparent white test_cropped_transparent.png

//     seems like cutting in postgis takes a long time
//     */

//     let rastTable = `agdd_${date.year()}`;
//     let boundaryTable = "state_boundaries";
//     let boundaryColumn = "name";

//     let query = {};
//     //if stateNames is left empty, no clipping will occur
//     if(preserveExtent && pest.stateNames.length < 1) {
//         query = {text: `
// SELECT
// ST_AsTIFF(ST_Transform(ST_SetBandNoDataValue(ST_Union(bar.conus_raster), 1, null), 3857)) AS tiff,
// ST_Extent(ST_Envelope(ST_Transform(bar.conus_raster, 3857))) AS extent
// FROM (
//     SELECT ST_Union(r.rast) AS conus_raster
//     FROM ${rastTable} r
//     WHERE r.rast_date = $1
//     AND r.base = $2
//     AND r.scale = $3
// ) AS bar
//     `, values: [date.format('YYYY-MM-DD'), pest.base, 'fahrenheit']
//         };
//     } 

//     else if(preserveExtent) {
//         query = {text: `
// WITH boundary AS (
// SELECT ST_Buffer(ST_Union(p.geom), .01) AS states
// FROM ${boundaryTable} p
// WHERE p.${boundaryColumn} IN (${pest.stateNames.map(d => `'${d}'`).join(', ')})
// )
// SELECT ST_AsTIFF(ST_Transform(ST_SetBandNoDataValue(ST_Clip(ST_Union(r.rast), (SELECT states FROM boundary), -9999, false), 1, null), 3857)) AS tiff
// FROM ${rastTable} r
// WHERE r.rast_date = $1
// AND r.base = $2
// AND r.scale = $3
// `, values: [date.format('YYYY-MM-DD'), pest.base, 'fahrenheit']
//         };
//     } 

//     else if(pest.stateNames.length < 1) {
//         query = {text: `
// SELECT
// ST_AsTIFF(ST_SetBandNoDataValue(ST_Union(bar.conus_raster), 1, null)) AS tiff,
// ST_Extent(ST_Envelope(bar.conus_raster)) AS extent
// FROM (
//     SELECT ST_Union(r.rast) AS conus_raster
//     FROM ${rastTable} r
//     WHERE r.rast_date = $1
//     AND r.base = $2
//     AND r.scale = $3
// ) AS bar
//     `, values: [date.format('YYYY-MM-DD'), pest.base, 'fahrenheit']
//         };
//     } 

//     else {
//         query = {text: `
// SELECT
// ST_AsTIFF(ST_SetBandNoDataValue(ST_Union(bar.clipped_raster), 1, null)) AS tiff,
// ST_Extent(ST_Envelope(bar.clipped_raster)) AS extent
// FROM (
//     SELECT ST_Union(ST_Clip(r.rast, foo.boundary, -9999, true)) AS clipped_raster
//     FROM
//     (
//         SELECT ST_Buffer(ST_Union(p.geom), .01) AS boundary,
//         ST_ConvexHull(ST_Union(p.geom)) AS convex_hull_boundary
//         FROM ${boundaryTable} p
//         WHERE p.${boundaryColumn} IN (${pest.stateNames.map(d => `'${d}'`).join(', ')})
//     ) AS foo
//     INNER JOIN ${rastTable} r
//     ON ST_Intersects(r.rast, foo.convex_hull_boundary)
//     AND r.rast_date = $1
//     AND r.base = $2
//     AND r.scale = $3
// ) AS bar
//     `, values: [date.format('YYYY-MM-DD'), pest.base, 'fahrenheit']
//         };
//     }

//     console.log(query);
//     log.info(query);
//     const res = await db.pgPool.query(query);
//     log.info('query complete');

//     if (res.rows.length > 0) {
//         let pngFilename = `${species.replace(/ /g, '_')}_${date.format('YYYY-MM-DD')}.png`;
//         // if (preserveExtent) {
//         //     pngFilename = `${species.replace(/ /g, '_')}_${date.format('YYYY-MM-DD')}_nocache.png`;
//         // }
//         await helpers.WriteFile(pestImagePath + pngFilename, res.rows[0].tiff);
//         response.clippedImage = await helpers.stylizePestMap(pngFilename, pestImagePath, 'png', pest.sldName, 'white', preserveExtent);
//         response.bbox = helpers.extractFloatsFromString(res.rows[0].extent);
//         return response;
//     } else {
//         return response;
//     }
// }

function doubleSine(tmin1,tmin2,tmax,lct,uct) {
    let taveam = (tmax + tmin1) / 2;
    let tavepm = (tmax + tmin2) / 2;
    let alphaam = (tmax - tmin1) / 2;
    let thetaam = Math.asin((lct - taveam) / alphaam);
    let alphapm = (tmax - tmin2) / 2;
    let thetapm = Math.asin((lct - tavepm) / alphapm);
    let theta2am = Math.asin((uct - taveam) / alphaam);
    let theta2pm = Math.asin((uct - tavepm) / alphapm);
    let hddam, hddpm, hdd = null;

    // Case 1 and Case 2, both minimum and maximum temperatures above or below upper or lower critical temperature thresholds, respectively.
    if (tmin1 >= uct) { // If the lower temperature exceeds the upper critical temperature then there is development
        hddam = 0.5*(uct-lct); // maximum development when tmin1 above uct
        if (tmin2 >=uct)
            hddpm = 0.5*(uct-lct); // maximum development when tmin2 above uct
        else if (tmin2<uct && tmin2 >= lct) // Case 5 development for tmin2 between thresholds and tmax above uct
            hddpm = (1 / (2 * Math.PI)) * ((tavepm - lct) * (theta2pm + (Math.PI / 2)) + (uct-lct) * ((Math.PI / 2) - theta2pm) - (alphapm * Math.cos(theta2pm)));
        else if (tmin2<lct) // case 6 development for tmin2 below lct and tmax above uct
            hddpm = (1 / (2 * Math.PI)) * ((tavepm - lct) * (theta2pm - thetapm) + alphapm * (Math.cos(thetapm) - Math.cos(theta2pm)) + (uct - lct) * ((Math.PI / 2) - theta2pm));
        hdd = hddam + hddpm;
    }

    else if (tmax <= lct) {// If the upper temperature exceeds the lower critical temperature then there is no development
        hdd = 0; // no need to evaluate hddpm seperately
    }


    // Case 3, tmin1 and maximum temperature both between upper and lower critical threshold temperatures.
    else if (tmin1 >= lct 
            && tmin1 <= uct 
            && tmax >= lct 
            && tmax <= uct) {
        hddam = 0.5 * (taveam - lct);
        if (tmin2 >= lct && tmin2<= uct) // case 3, tmin2 and tmax between thresholds
            hddpm = 0.5 * (tavepm - lct);
        else if (tmin2 <lct) // case 4, tmin2 below lct, tmax between thresholds
            hddpm = (1 / (2 * Math.PI)) * ((tavepm - lct) * ((Math.PI / 2) - thetapm) + (alphapm * Math.cos(thetapm)));
        hdd = hddam + hddpm;
    }

    // Case 4, minimum temperature is below minimum critical threshold temperature, but maximum temperature is above minimum critical threshold temperature, and below maximum critical threshold temperature.
    else if (tmin1 <= lct && tmax >= lct && tmax <= uct) {
        hddam = (1 / (2 * Math.PI)) * ((taveam - lct) * ((Math.PI / 2) - thetaam) + (alphaam * Math.cos(thetaam)));
        if (tmin2<lct) // case 4, tmin2 below lct, tmax between thresholds
            hddpm = (1 / (2 * Math.PI)) * ((tavepm - lct) * ((Math.PI / 2) - thetapm) + (alphapm * Math.cos(thetapm)));
        else if (tmin2 >= lct) // case 3, tmin2 between thresholds, tmax between thresholds
            hddpm = 0.5 * (tavepm - lct);
        hdd = hddam + hddpm;
    }

    // Case 5, minimum temperature is between the minimum and maximum critical temperature thresholds, but the maximum temperature is above the maximum critical temperature threshold.
    else if (tmin1 >= lct && tmin1 <= uct && tmax >= uct) {
        hddam = (1 / (2 * Math.PI)) * (((taveam - lct) * (theta2am + (Math.PI / 2)) + (uct - lct) * ((Math.PI / 2) - theta2am) - (alphaam * Math.cos(theta2am))));
        if (tmin2 >=lct && tmin2 <=uct) //case 5, tmin2 between thresholds, tmax above uct
            hddpm = (1 / (2 * Math.PI)) * ((tavepm - lct) * (theta2pm + (Math.PI / 2)) + (uct-lct) * ((Math.PI / 2) - theta2pm) - (alphapm * Math.cos(theta2pm)));
        else if (tmin2 < lct) // case 6, tmin2 below lct, tmax above uct
            hddpm = (1 / (2 * Math.PI)) * ((tavepm - lct) * (theta2pm - thetapm) + alphapm * (Math.cos(thetapm) - Math.cos(theta2pm)) + (uct - lct) * ((Math.PI / 2) - theta2pm));
        else if (tmin2 > uct) // case 1, tmin2 and tmax above uct
            hddpm = 0.5 * (uct-lct);
        hdd = hddam + hddpm;
    }
            

    // Case 6, minimum temperature is below the minimum critical threshold temperature, and maximum temperature is above the maximum critical threshold temperature.
    else if (tmin1 <= lct) {
        if (tmax >= uct)
            hddam = (1 / (2 * Math.PI)) * ((taveam - lct) * (theta2am - thetaam) + alphaam * (Math.cos(thetaam) - Math.cos(theta2am)) + (uct - lct) * ((Math.PI / 2) - theta2am));
            if (tmin2<lct) // case 6, tmin2 below lct, tmax above uct
                hddpm = (1 / (2 * Math.PI)) * ((tavepm - lct) * (theta2pm - thetapm) + alphapm * (Math.cos(thetapm) - Math.cos(theta2pm)) + (uct - lct) * ((Math.PI / 2) - theta2pm));
            if (tmin2<uct)
                if (tmin2 >= lct) // case 5, tmin2 between thresholds, tmax abov uct
                    hddpm = (1 / (2 * Math.PI)) * ((tavepm - lct) * (theta2pm + (Math.PI / 2)) + (uct - lct) * ((Math.PI / 2) - theta2pm) - (alphapm * Math.cos(theta2pm)));   
            if (tmin2 >=uct) // case 1, tmin2 and tmax above uct
                hddpm = 0.5 * (uct - lct);
            hdd = hddam + hddpm;
    }

    if(hdd == null) {
        console.log('what');
    }

    return hdd;

}

async function getDoubleSineAgddTimeSeries(climateProvider, temperatureUnit, startDate, endDate, lowerThreshold, upperThreshold, lat, long, threshold) {
    // get tmins and tmaxs
    let tmins = await climate.getClimatePointTimeSeries(climateProvider, 'tmin', startDate, endDate,lat, long);
    let tmaxs = await climate.getClimatePointTimeSeries(climateProvider, 'tmax', startDate, endDate,lat, long);
    let gdds = tmaxs["timeSeries"].reduce(function (accum, item, i) { 
        let tminYesterday = (i > 0) ? tmins["timeSeries"][i-1].tmin : 0;
        let tminToday = tmins["timeSeries"][i].tmin;
        let tmaxToday = item.tmax;
        if(temperatureUnit === 'fahrenheit') {
            tminYesterday = tminYesterday * (9/5) + 32;
            tminToday = tminToday * (9/5) + 32;
            tmaxToday = tmaxToday * (9/5) + 32;
        }
        let doubleSineGdd = doubleSine(tminYesterday, tminToday, tmaxToday, lowerThreshold, upperThreshold)
        accum.push({
            'date': item.date,
            'doy': item.doy,
            'gdd': doubleSineGdd,
            'agdd': accum.length > 0 ? accum[accum.length-1].agdd + doubleSineGdd : doubleSineGdd
        });
        return accum;
    }, []);

    response = {
        "climateProvider": climateProvider,
        "temperatureUnit": temperatureUnit,
        "startDate": startDate.format('YYYY-MM-DD'),
        "endDate": endDate.format('YYYY-MM-DD'),
        "lowerThreshold": lowerThreshold,
        "upperThreshold": upperThreshold,
        "latitude": lat,
        "longitude": long
    };
    if (threshold) {
        response["threshold"] = threshold;
        //response["dateAgddThresholdMet"] = dateAgddThresholdMet;
    }
    response["timeSeries"] = gdds;
    return response;
}

// selects and returns row from the cache table matching function params
async function getSimpleAgddTimeSeries(climateProvider, temperatureUnit, startDate, endDate, base, lat, long, threshold) {
    const query = {
        text: `SELECT rast_date, st_value(rast,ST_SetSRID(ST_Point($1, $2),4269)) FROM ${climateProvider.toLowerCase()}_tavg
                WHERE rast_date >= $3
                AND rast_date <= $4
                AND ST_Intersects(rast, ST_SetSRID(ST_MakePoint($5, $6),4269))
                ORDER BY rast_date`,
        values: [long, lat, startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'), long, lat]
    };
    console.log(query);
    const res = await db.pgPool.query(query);

    let dateAgddThresholdMet = null;

    let timeSeries = res['rows'].map(row => {
        let tavg = row['st_value'];
        let dateString = row['rast_date'].toISOString().split("T")[0];
        if(temperatureUnit === 'celsius') {
            tavg = (tavg - 32) * (5/9);
        }
        return { 
            "date": dateString, 
            "doy": moment(dateString).dayOfYear(),
            "gdd": tavg - base > 0 ? tavg - base : 0 
        }
    }).reduce(function (accum, item) {
        if (accum.length > 0)
            item.agdd = item.gdd + accum[accum.length-1].agdd;
        else
            item.agdd = item.gdd;
        accum.push(item);
        if(dateAgddThresholdMet == null && threshold && item.agdd >= threshold) {
            dateAgddThresholdMet = item.date;
        }
        return accum;
    }, []);

    response = {
        "climateProvider": climateProvider,
        "temperatureUnit": temperatureUnit,
        "startDate": startDate.format('YYYY-MM-DD'),
        "endDate": endDate.format('YYYY-MM-DD'),
        "base": base,
        "latitude": lat,
        "longitude": long
    };
    if (threshold) {
        response["threshold"] = threshold;
        response["dateAgddThresholdMet"] = dateAgddThresholdMet;
    }
    response["timeSeries"] = timeSeries;
    return response;
}

// selects and returns row from the cache table matching function params
async function getSimpleAgddTimeSeries30YearAvg(temperatureUnit, base, lat, long, threshold) {
    let climateProvider = 'PRISM';
    const query = {
        text: `SELECT rast_date, st_value(rast,ST_SetSRID(ST_Point($1, $2),4269)) FROM prism_tavg
                WHERE rast_date >= '1981-01-01'
                AND rast_date <= '2010-01-01'
                AND ST_Intersects(rast, ST_SetSRID(ST_MakePoint($3, $4),4269))
                ORDER BY rast_date`,
        values: [long, lat, long, lat]
    };
    console.log(query);
    const res = await db.pgPool.query(query);

    let dateAgddThresholdMet = null;

    let timeSeries = res['rows'].map(row => {
        let tavg = row['st_value'];
        if(temperatureUnit === 'celsius') {
            tavg = (tavg - 32) * (5/9);
        }
        return { 
            "date": row['rast_date'].toISOString().split("T")[0], 
            "gdd": tavg - base > 0 ? tavg - base : 0 
        }
    }).reduce(function (accum, item) {
        if (accum.length > 0)
            item.agdd = item.gdd + accum[accum.length-1].agdd;
        else
            item.agdd = item.gdd;
        accum.push(item);
        if(dateAgddThresholdMet == null && threshold && item.agdd >= threshold) {
            dateAgddThresholdMet = item.date;
        }
        return accum;
    }, []);

    response = {
        "climateProvider": climateProvider,
        "temperatureUnit": temperatureUnit,
        "base": base,
        "latitude": lat,
        "longitude": long
    };
    if (threshold) {
        response["threshold"] = threshold;
        response["dateAgddThresholdMet"] = dateAgddThresholdMet;
    }
    response["timeSeries"] = timeSeries;
    return response;
}

async function getDynamicAgdd(agddMethod, climateProvider, temperatureUnit, startDate, endDate, lowerThreshold, upperThreshold) {
    return new Promise((resolve, reject) =>
    {
        let response = {
            climateProvider: climateProvider,
            temperatureUnit: temperatureUnit,
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD')
        };

        let tifFile, pythonCommand = null;
        if (agddMethod == 'simple') {
            tifFile = `${climateProvider.toLowerCase()}_${temperatureUnit.toLowerCase()}_simple_${startDate.format('YYYY-MM-DD')}_through_${endDate.format('YYYY-MM-DD')}_base${lowerThreshold}.tif`; 
            response.base = lowerThreshold;
            pythonCommand = `sudo /usr/bin/python3 compute_dynamic_agdd.py simple ${climateProvider.toLowerCase()} ${temperatureUnit.toLowerCase()} ${startDate.format('YYYY-MM-DD')} ${endDate.format('YYYY-MM-DD')} ${lowerThreshold}`
        } else {
            tifFile = `${climateProvider.toLowerCase()}_${temperatureUnit.toLowerCase()}_double_sine_${startDate.format('YYYY-MM-DD')}_through_${endDate.format('YYYY-MM-DD')}_lthr${lowerThreshold}_uthr${upperThreshold}.tif`; 
            response.lowerThreshold = lowerThreshold;
            response.upperThreshold = upperThreshold;
            pythonCommand = `sudo /usr/bin/python3 compute_dynamic_agdd.py double-sine ${climateProvider.toLowerCase()} ${temperatureUnit.toLowerCase()} ${startDate.format('YYYY-MM-DD')} ${endDate.format('YYYY-MM-DD')} ${lowerThreshold} ${upperThreshold}`
        }
        let tifUrl = `${process.env.PROTOCOL}://${process.env.SERVICES_HOST}:${process.env.PORT}/${tifFile}`;
        response.mapUrl = tifUrl;

        //if start date is after today there will be no heat accumulation so return the zeroes tif
        if(startDate.valueOf() > moment().valueOf()) {
            response.mapUrl = `${process.env.PROTOCOL}://${process.env.SERVICES_HOST}:${process.env.PORT}/zeros_conus_${climateProvider.toLowerCase()}.tif`;
            resolve(response);
        }
        
        //for local testing
        //tifUrl = "https://data-dev.usanpn.org:3006/agdd_1994-02-02_through_1994-02-20_base13.tif";

        //check if file already exists, if so don't do all the work
        helpers.urlExists(tifUrl, (err, exists) => {
            if(!err && exists) {
                resolve(response);
            } else {
                // file didn't exist so do work: call python script on geoserver to compute agdd
                ssh.connect({
                    host: 'geoserver-dev.usanpn.org',
                    username: process.env.GEOSERVER_SSH_USER,
                    password: process.env.GEOSERVER_SSH_PASSWORD
                })
                .then(function() {
                    ssh.execCommand(pythonCommand,
                        { options: { pty: true }, cwd:'/usr/local/scripts/gridded_models', stdin: `${process.env.GEOSERVER_SSH_PASSWORD}\n` })
                        .then(function(result) {
                        console.log('STDOUT: ' + result.stdout)
                        console.log('STDERR: ' + result.stderr)

                        let geoserverDynamicAgddPath = `/geo-data/gridded_models/agdd_dynamic/`;

                        client.scp({
                            host: 'geoserver-dev.usanpn.org',
                            username: process.env.GEOSERVER_SSH_USER,
                            password: process.env.GEOSERVER_SSH_PASSWORD,
                            path: `${geoserverDynamicAgddPath}${tifFile}`
                        }, `${dynamicAgddPath}${tifFile}`, function(err) {
                            if(!err) {
                                // deletions are now done daily in the gridded product nightly update script pest map cache generation
                                // //delete the raster from geoserver
                                // ssh.execCommand(`sudo rm ${geoserverDynamicAgddPath}${tifFile}`,
                                // { options: { pty: true }, cwd:'/usr/local/scripts/gridded_models', stdin: `${process.env.GEOSERVER_SSH_PASSWORD}\n` })
                                // .then(function(result) {
                                    resolve(response);
                                // });
                            } else {
                                reject(err);
                            }
                        });
                    });
                });
            }
        });
    });
}

module.exports.getDynamicAgdd = getDynamicAgdd;
module.exports.getSimpleAgddTimeSeries = getSimpleAgddTimeSeries;
module.exports.getSimpleAgddTimeSeries30YearAvg = getSimpleAgddTimeSeries30YearAvg;
module.exports.getDoubleSineAgddTimeSeries = getDoubleSineAgddTimeSeries;
module.exports.getPestMap = getPestMap;
module.exports.getClippedAgddImage = getClippedAgddImage;
module.exports.getClippedAgddRaster = getClippedAgddRaster;
module.exports.getAgddAreaStats = getAgddAreaStats;
module.exports.getAgddAreaStatsWithCaching = getAgddAreaStatsWithCaching;
