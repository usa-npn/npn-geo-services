var fs = require('fs');

// postgres pool
const { Pool, Client } = require('pg');
const pgPool = new Pool();

// mysql ppols
var mysql = require('mysql2');
var mysqlPromise = require('mysql2/promise');

let usanpnHost = '';
let usanpnUser = '';
let usanpnPassword = '';
let usanpnDatabase = '';

let drupalHost = '';
let drupalUser = '';
let drupalPassword = '';
let drupalDatabase = '';

if (process.env.NODE_ENV === 'production') {
    usanpnHost = process.env.OPS_USANPN_HOST;
    usanpnUser = process.env.OPS_USANPN_USER;
    usanpnPassword = process.env.OPS_USANPN_PASSWORD;
    usanpnDatabase = process.env.OPS_USANPN_DATABASE;

    drupalHost = process.env.OPS_DRUPAL_HOST;
    drupalUser = process.env.OPS_DRUPAL_USER;
    drupalPassword = process.env.OPS_DRUPAL_PASSWORD;
    drupalDatabase = process.env.OPS_DRUPAL_DATABASE;
} else if (process.env.NODE_ENV === 'development') {
    usanpnHost = process.env.DEV_USANPN_HOST;
    usanpnUser = process.env.DEV_USANPN_USER;
    usanpnPassword = process.env.DEV_USANPN_PASSWORD;
    usanpnDatabase = process.env.DEV_USANPN_DATABASE;

    drupalHost = process.env.DEV_DRUPAL_HOST;
    drupalUser = process.env.DEV_DRUPAL_USER;
    drupalPassword = process.env.DEV_DRUPAL_PASSWORD;
    drupalDatabase = process.env.DEV_DRUPAL_DATABASE;
} else {
    usanpnHost = process.env.LOCAL_USANPN_HOST;
    usanpnUser = process.env.LOCAL_USANPN_USER;
    usanpnPassword = process.env.LOCAL_USANPN_PASSWORD;
    usanpnDatabase = process.env.LOCAL_USANPN_DATABASE;

    drupalHost = process.env.LOCAL_DRUPAL_HOST;
    drupalUser = process.env.LOCAL_DRUPAL_USER;
    drupalPassword = process.env.LOCAL_DRUPAL_PASSWORD;
    drupalDatabase = process.env.LOCAL_DRUPAL_DATABASE;
}

var usanpnPool = mysql.createPool({
    connectionLimit : 20,
    host     : usanpnHost,
    user     : usanpnUser,
    password : usanpnPassword,
    database : usanpnDatabase,
    debug    :  false
});
var usanpnPromisePool = mysqlPromise.createPool({
    connectionLimit : 20,
    host     : usanpnHost,
    user     : usanpnUser,
    password : usanpnPassword,
    database : usanpnDatabase,
    debug    :  false
});
var drupalPool = mysql.createPool({
    connectionLimit : 20,
    host     : drupalHost,
    user     : drupalUser,
    password : drupalPassword,
    database : drupalDatabase,
    debug    :  false
});



/*
SELECT p.gid, p.orgname, ST_Count(ST_Clip(ST_Union(r.rast), p.geom, true)) AS pixel_count_excluding_nodata, ST_Count(ST_Clip(ST_Union(r.rast), p.geom, true), false) AS pixel_count_including_nodata, (ST_SummaryStats(ST_Clip(ST_Union(r.rast), p.geom, true), true)).*
FROM ncep_spring_index r, fws_boundaries p
WHERE p.orgname = 'CABEZA PRIETA NATIONAL WILDLIFE REFUGE' AND ST_Intersects(r.rast, p.geom) AND r.rast_date = '2017-04-21' AND r.plant='lilac' AND r.phenophase='leaf'
GROUP BY p.gid;
*/

async function getTiff(rastTable, boundary, dateString, plant, phenophase) {
//     let query = `SELECT p.orgname,
//     ST_Count(ST_Clip(ST_Union(r.rast), ST_Union(p.geom), true)) AS pixel_count_excluding_nodata,
//     ST_Count(ST_Clip(ST_Union(r.rast), ST_Union(p.geom), true), false) AS pixel_count_including_nodata,
//     (ST_SummaryStats(ST_Clip(ST_Union(r.rast), ST_Union(p.geom), true), true)).*,
//     ST_AsTIFF(ST_Union(r.rast)) AS tiffyrast,
//     ST_AsTIFF(ST_AsRaster(ST_Union(p.geom), ST_Union(r.rast), '2BUI')) AS tiffyborder,
//     ST_AsTIFF(ST_Clip(ST_Union(r.rast), ST_Union(p.geom), true)) AS tiffy
// FROM ${rastTable} r, fws_boundaries p
// WHERE p.orgname = '${boundary}' AND ST_Intersects(r.rast, p.geom) AND r.rast_date = '${dateString}' AND r.plant='${plant}' AND r.phenophase='${phenophase}'
// GROUP BY p.orgname;`;


    // //     ST_AsTIFF(ST_Union(ST_Clip(r.rast, ST_Union(foo.boundary, ST_Boundary(foo.boundary)), true))) AS tiffy
    // let query = `SELECT
    // (ST_SummaryStats(ST_Union(ST_Clip(r.rast, ST_Union(foo.boundary, ST_Boundary(foo.boundary)), true)), true)).*,
    // ST_AsTIFF(ST_Union(ST_Clip(r.rast, foo.boundary, true), ST_Clip(r.rast, ST_Boundary(foo.boundary), true))) AS tiffy
    // FROM (SELECT p.geom AS boundary FROM fws_boundaries p WHERE p.orgname = '${boundary}') as foo
    // INNER JOIN ${rastTable} r ON ST_Intersects(r.rast, foo.boundary)
    // AND r.rast_date = '${dateString}'
    // AND r.plant='${plant}'
    // AND r.phenophase='${phenophase}';`;

    //keep this!
    let query = `SELECT
    ST_AsGeoJSON(ST_Union(foo.boundary)) as geojson,
    (ST_SummaryStats(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, .01), true)), true)).*,
    ST_AsTIFF(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, .01), true))) AS tiffy,
    ST_Union(foo.boundary) AS shapefile
    FROM (SELECT p.gid as gid, p.geom AS boundary FROM fws_boundaries p WHERE p.orgname = '${boundary}') as foo
    INNER JOIN ${rastTable} r ON ST_Intersects(r.rast, foo.boundary)
    AND r.rast_date = '${dateString}'
    AND r.plant='${plant}'
    AND r.phenophase='${phenophase}';`;

    //keep this!
    // let query = `SELECT
    // ST_AsTIFF(ST_Union(ST_Clip(r.rast, ST_Boundary(foo.boundary), true))) AS tiffy
    // FROM (SELECT p.geom AS boundary FROM fws_boundaries p WHERE p.orgname = '${boundary}') as foo
    // INNER JOIN ${rastTable} r ON ST_Intersects(r.rast, foo.boundary)
    // AND r.rast_date = '${dateString}'
    // AND r.plant='${plant}'
    // AND r.phenophase='${phenophase}';`;

    /* KEEP THIS ONE, ONLY ISSUE IS THAT IT DOESNT INCLUDE EVERY PIXEL INSIDE THE BOARDER */
//     let query = `SELECT p.orgname,
//     ST_AsTIFF(ST_Union(r.rast)) AS tiffyrast,
//     ST_AsTIFF(ST_AsRaster(ST_Union(p.geom), ST_Union(r.rast), '2BUI')) AS tiffyborder,
//     ST_AsTIFF(ST_Clip(ST_Union(r.rast), ST_Union(p.geom), true)) AS tiffy, ST_Count(ST_Clip(ST_Union(r.rast), ST_Union(p.geom), true)) AS pixel_count_excluding_nodata, ST_Count(ST_Clip(ST_Union(r.rast), ST_Union(p.geom), true), false) AS pixel_count_including_nodata, (ST_SummaryStats(ST_Clip(ST_Union(r.rast), ST_Union(p.geom), true), true)).*
// FROM ${rastTable} r, fws_boundaries p
// WHERE p.orgname = '${boundary}' AND ST_Intersects(r.rast, p.geom) AND r.rast_date = '${dateString}' AND r.plant='${plant}' AND r.phenophase='${phenophase}'
// GROUP BY p.orgname;`;

    // grouped by gid
//     let query = `SELECT p.gid AS gid, p.orgname, ST_AsTIFF(ST_Clip(ST_Union(r.rast), p.geom, true)) AS tiffy, ST_Count(ST_Clip(ST_Union(r.rast), p.geom, true)) AS pixel_count_excluding_nodata, ST_Count(ST_Clip(ST_Union(r.rast), p.geom, true), false) AS pixel_count_including_nodata, (ST_SummaryStats(ST_Clip(ST_Union(r.rast), p.geom, true), true)).*
// FROM ${rastTable} r, fws_boundaries p
// WHERE p.orgname = '${boundary}' AND ST_Intersects(r.rast, p.geom) AND r.rast_date = '${dateString}' AND r.plant='${plant}' AND r.phenophase='${phenophase}'
// GROUP BY p.gid;`;

    console.log(query);
    const res = await pgPool.query(query);

    let response = {};
    if (res.rows.length > 0) {
        response.count = res.rows[0].count;
        response.sum = res.rows[0].sum;
        response.mean = res.rows[0].mean;
        response.stddev = res.rows[0].stddev;
        response.min = res.rows[0].min;
        response.max = res.rows[0].max;
        // todo: maybe possible to view in openlayers but not always zooming right so commenting out for now
        // response.viewboundary = `http://geoserver-dev.usanpn.org/geoserver/gdd/wms?service=WMS&version=1.1.0&request=GetMap&layers=gdd:fws_boundaries&CQL_FILTER=orgname='${boundary}'&styles=&bbox=-180.944702148438,17.4382019042969,181.569763183594,65.4184417724609&width=1400&height=700&srs=EPSG:4269&format=application/openlayers`;
        response.zippedShapeFile = `http://geoserver-dev.usanpn.org/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:fws_boundaries&CQL_FILTER=orgname='${boundary}'&maxFeatures=50&outputFormat=SHAPE-ZIP`;

        let d = new Date();
        let rasterpath = 'static/rasters/';
        let filename = `${boundary.replace(/ /g, '_')}_${plant}_${phenophase}_${dateString}_${d.getTime()}.tiff`;
        response.rasterFile = filename;
        fs.writeFile(rasterpath + filename, res.rows[0].tiffy, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });

        response.geojson = res.rows[0].geojson;
    }


    // res.rows.forEach(row => {
    //     let filepath = `D:\\tiffs\\${boundary}_${plant}_${phenophase}_${dateString}_${d.getTime()}.tiff`;
    //     res.rasterpath = filepath;
    //     fs.writeFile(filepath, row.tiffy, function(err) {
    //         if(err) {
    //             return console.log(err);
    //         }
    //
    //         console.log("The file was saved!");
    //     });
        // fs.writeFile(`D:\\tiffs\\${boundary}_${plant}_${phenophase}_${dateString}_border_${d.getTime()}.tiff`, row.tiffyborder, function(err) {
        //     if(err) {
        //         return console.log(err);
        //     }
        //
        //     console.log("The file was saved!");
        // });
        // fs.writeFile(`D:\\tiffs\\${boundary}_${plant}_${phenophase}_${dateString}_rast_${d.getTime()}.tiff`, row.tiffyrast, function(err) {
        //     if(err) {
        //         return console.log(err);
        //     }
        //
        //     console.log("The file was saved!");
        // });
    // });


    return response;
}



async function getPostgisClippedRasterSixStats(climate, rastTable, boundary, dateString, plant, phenophase, saveToCache) {
    let buffer = .01;
    if (rastTable === 'prism_spring_index') {
        buffer = .02;
    }
    if (rastTable === 'best_spring_index') {
        buffer = 1;
    }
    let query = `SELECT
    ST_AsGeoJSON(ST_Union(foo.boundary)) as geojson,
    (ST_SummaryStats(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, ${buffer}), true)), true)).*,
    ST_AsTIFF(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, ${buffer}), true))) AS tiffy,
    ST_Union(foo.boundary) AS shapefile
    FROM (SELECT p.gid as gid, p.geom AS boundary FROM fws_boundaries p WHERE p.orgname = '${boundary}') as foo
    INNER JOIN ${rastTable} r ON ST_Intersects(r.rast, foo.boundary)
    AND r.rast_date = '${dateString}'
    AND r.plant='${plant}'
    AND r.phenophase='${phenophase}';`;

    console.log(query);
    const res = await pgPool.query(query);

    let response = {date: dateString};
    if (res.rows.length > 0) {
        response.count = res.rows[0].count;
        response.sum = res.rows[0].sum;
        response.mean = res.rows[0].mean;
        response.stddev = res.rows[0].stddev;
        response.min = res.rows[0].min;
        response.max = res.rows[0].max;

        // save the results to the caching table
        if (saveToCache) {
            await saveSixAreaStatsToCache(boundary, plant, phenophase, climate, dateString, response.count, response.mean, response.stddev, response.min, response.max, null);
        }

        // todo: maybe possible to view in openlayers but not always zooming right so commenting out for now
        // response.viewboundary = `http://geoserver-dev.usanpn.org/geoserver/gdd/wms?service=WMS&version=1.1.0&request=GetMap&layers=gdd:fws_boundaries&CQL_FILTER=orgname='${boundary}'&styles=&bbox=-180.944702148438,17.4382019042969,181.569763183594,65.4184417724609&width=1400&height=700&srs=EPSG:4269&format=application/openlayers`;
        response.zippedShapeFile = `http://geoserver-dev.usanpn.org/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:fws_boundaries&CQL_FILTER=orgname='${boundary}'&maxFeatures=50&outputFormat=SHAPE-ZIP`;

        let d = new Date();
        let rasterpath = 'static/rasters/';
        let filename = `${boundary.replace(/ /g, '_')}_six_${plant}_${phenophase}_${dateString}_${d.getTime()}.tiff`;
        response.rasterFile = `data-dev.usanpn.org:${process.env.PORT}/` + filename;
        fs.writeFile(rasterpath + filename, res.rows[0].tiffy, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });

        //todo: below line can use this with geoserver wps to obtain styled clipped raster, initial testing shows boundary rules aren't correct though
        response.geojson = res.rows[0].geojson;
    }
    return response;
}

async function getPostgisClippedRasterAgddStats(rastTable, boundary, dateString, base) {
    let buffer = .01;
    let query = `SELECT
    ST_AsGeoJSON(ST_Union(foo.boundary)) as geojson,
    (ST_SummaryStats(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, ${buffer}), true)), true)).*,
    ST_AsTIFF(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, ${buffer}), true))) AS tiffy,
    ST_Union(foo.boundary) AS shapefile
    FROM (SELECT p.gid as gid, p.geom AS boundary FROM fws_boundaries p WHERE p.orgname = '${boundary}') as foo
    INNER JOIN ${rastTable} r ON ST_Intersects(r.rast, foo.boundary)
    AND r.rast_date = '${dateString}'
    AND r.base='${base}'
    AND r.scale='fahrenheit';`;

    console.log(query);
    const res = await pgPool.query(query);

    let response = {date: dateString};
    if (res.rows.length > 0) {
        response.count = res.rows[0].count;
        response.sum = res.rows[0].sum;
        response.mean = res.rows[0].mean;
        response.stddev = res.rows[0].stddev;
        response.min = res.rows[0].min;
        response.max = res.rows[0].max;
        // todo: maybe possible to view in openlayers but not always zooming right so commenting out for now
        // response.viewboundary = `http://geoserver-dev.usanpn.org/geoserver/gdd/wms?service=WMS&version=1.1.0&request=GetMap&layers=gdd:fws_boundaries&CQL_FILTER=orgname='${boundary}'&styles=&bbox=-180.944702148438,17.4382019042969,181.569763183594,65.4184417724609&width=1400&height=700&srs=EPSG:4269&format=application/openlayers`;
        response.zippedShapeFile = `http://geoserver-dev.usanpn.org/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:fws_boundaries&CQL_FILTER=orgname='${boundary}'&maxFeatures=50&outputFormat=SHAPE-ZIP`;

        let d = new Date();
        let rasterpath = 'static/rasters/';
        let filename = `${boundary.replace(/ /g, '_')}_agdd_${base}f_${dateString}_${d.getTime()}.tiff`;
        response.rasterFile = `data-dev.usanpn.org:${process.env.PORT}/` + filename;
        fs.writeFile(rasterpath + filename, res.rows[0].tiffy, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });

        //todo: below line can use this with geoserver wps to obtain styled clipped raster, initial testing shows boundary rules aren't correct though
        response.geojson = res.rows[0].geojson;
    }
    return response;
}

// returns the number of tiles the boundary intersects
async function boundaryRasterIntersections(rastTable, boundary, dateString, plant, phenophase) {
    let query = `
    SELECT COUNT(*) AS intersections
    FROM ${rastTable} r, fws_boundaries p
    WHERE p.orgname = '${boundary}' AND ST_Intersects(r.rast, p.geom) AND r.rast_date = '${dateString}' AND r.plant='${plant}' AND r.phenophase='${phenophase}';
    `;
    console.log(query);
    const res = await pgPool.query(query);
    return parseInt(res.rows[0].intersections);
}

// choose table via selected data and boundary tile intersection (for ncep alaska)
async function getAppropriateSixTable(date, climate, boundary, dateString, plant, phenophase) {

    if (climate === 'PRISM') {
        return 'prism_spring_index';
    } else if (climate === 'BEST') {
        return 'best_spring_index';
    } else if (climate === 'NCEP') {
        let now = new Date();
        if (date.getYear() < now.getYear()) {
            return 'ncep_spring_index_historic';
        } else {
            let rasterCellsInBoundary = await boundaryRasterIntersections('ncep_spring_index', boundary, dateString, plant, phenophase);
            if (rasterCellsInBoundary < 1) {
                return 'ncep_spring_index_alaska';
            } else {
                return 'ncep_spring_index';
            }

        }
    }
}

// choose table via selected data and boundary tile intersection (for ncep alaska)
async function getAppropriateAgddTable(date, climate, boundary, dateString, base) {
    let year = date.getFullYear();
    if (climate === 'PRISM') {
        return `prism_agdd_${year}`;
    } else if (climate === 'BEST') {
        return 'no_best_agdd';
    } else if (climate === 'NCEP') {
        return `agdd_${year}`;
    }
}

async function getSixAreaStats(boundary, date, plant, phenophase, climate) {
    let dateString = date.toISOString().split('T')[0];
    let rastTable = await getAppropriateSixTable(date, climate, boundary, dateString, plant, phenophase);
    let response = await getPostgisClippedRasterSixStats(climate, rastTable, boundary, dateString, plant, phenophase, false);
    return response;
}

async function getSixAreaStatsWithCaching(boundary, date, plant, phenophase, climate) {
    let dateString = date.toISOString().split('T')[0];

    let res = await checkSixAreaStatsCache(boundary, date, plant, phenophase, climate);
    let response = {};
    if (res.rows.length > 0) {
        response.count = res.rows[0].count;
        response.sum = res.rows[0].sum;
        response.mean = res.rows[0].mean;
        response.stddev = res.rows[0].stddev;
        response.min = res.rows[0].min;
        response.max = res.rows[0].max;
    } else {
        let rastTable = await getAppropriateSixTable(date, climate, boundary, dateString, plant, phenophase);
        response = await getPostgisClippedRasterSixStats(climate, rastTable, boundary, dateString, plant, phenophase, true);
    }
    return response;
}

async function getAgddAreaStats(boundary, date, base, climate) {
    let dateString = date.toISOString().split('T')[0];
    let rastTable = await getAppropriateAgddTable(date, climate, boundary, dateString, base);
    let response = await getPostgisClippedRasterAgddStats(rastTable, boundary, dateString, base);
    return response;
}

async function createSixAreaStatsCacheTable() {
    let query = `CREATE TABLE IF NOT EXISTS cached_six_area_stats (
                    id integer primary key,
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

    console.log(query);
    const res = await pgPool.query(query);
}

async function saveSixAreaStatsToCache(boundary, plant, phenophase, climate, date, count, mean, stddev, min, max, percent_complete) {
    // make sure the table exists
    await createSixAreaStatsCacheTable();

    // possibly delete any old data in the cache before inserting the new row
    // let query1 = `DELETE FROM cached_six_area_stats WHERE boundary = ${boundary}
    //             AND date = ${date}
    //             AND plant = ${plant}
    //             AND phenophase = ${phenophase}
    //             AND climate = ${climate};`;
    // console.log(query1);
    // const res = await pgPool.query(query1);

    let query2 = `INSERT INTO TABLE cached_six_area_stats (boundary, plant, phenophase, climate, date, count, mean, stddev, min, max, percent_complete)
        VALUES (${boundary}, ${plant}, ${phenophase}, ${climate}, ${date}, ${count}, ${mean}, ${stddev}, ${min}, ${max}, ${percent_complete});`;
    console.log(query2);
    const res = await pgPool.query(query2);
    return res;
}

async function checkSixAreaStatsCache(boundary, date, plant, phenophase, climate) {
    // make sure the table exists
    await createSixAreaStatsCacheTable();

    let query = `SELECT * FROM cached_six_area_stats
                WHERE boundary = ${boundary}
                AND date = ${date}
                AND plant = ${plant}
                AND phenophase = ${phenophase}
                AND climate = ${climate};`;

    console.log(query);
    const res = await pgPool.query(query);
    return res;
}

module.exports.usanpnPool = usanpnPool;
module.exports.usanpnPromisePool = usanpnPromisePool;
module.exports.drupalPool = drupalPool;
module.exports.getSixAreaStats = getSixAreaStats;
module.exports.getSixAreaStatsWithCaching = getSixAreaStatsWithCaching;
module.exports.getAgddAreaStats = getAgddAreaStats;
module.exports.pgPool = pgPool;