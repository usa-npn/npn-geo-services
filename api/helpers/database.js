var fs = require('fs');
let log = require('../../logger.js');
const http = require('http');
const moment = require('moment');

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


module.exports.usanpnPool = usanpnPool;
module.exports.usanpnPromisePool = usanpnPromisePool;
module.exports.drupalPool = drupalPool;
module.exports.pgPool = pgPool;