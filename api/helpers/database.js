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
    let query = `SELECT p.orgname,
    ST_Count(ST_Clip(ST_Union(r.rast), ST_Union(p.geom), true)) AS pixel_count_excluding_nodata, 
    ST_Count(ST_Clip(ST_Union(r.rast), ST_Union(p.geom), true), false) AS pixel_count_including_nodata, 
    (ST_SummaryStats(ST_Clip(ST_Union(r.rast), ST_Union(p.geom), true), true)).*,
    ST_AsTIFF(ST_Union(r.rast)) AS tiffyrast,
    ST_AsTIFF(ST_AsRaster(ST_Union(p.geom), ST_Union(r.rast), '2BUI')) AS tiffyborder,
    ST_AsTIFF(ST_Clip(ST_Union(r.rast), ST_Union(p.geom), true)) AS tiffy
FROM ${rastTable} r, fws_boundaries p
WHERE p.orgname = '${boundary}' AND ST_Intersects(r.rast, p.geom) AND r.rast_date = '${dateString}' AND r.plant='${plant}' AND r.phenophase='${phenophase}'
GROUP BY p.orgname;`;

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

    let d = new Date();

    // res.rows.forEach(row => {
    //     fs.writeFile(`D:\\tiffs\\${boundary}_${plant}_${phenophase}_${dateString}_${d.getTime()}.tiff`, row.tiffy, function(err) {
    //         if(err) {
    //             return console.log(err);
    //         }
    //
    //         console.log("The file was saved!");
    //     });
    //     fs.writeFile(`D:\\tiffs\\${boundary}_${plant}_${phenophase}_${dateString}_border_${d.getTime()}.tiff`, row.tiffyborder, function(err) {
    //         if(err) {
    //             return console.log(err);
    //         }
    //
    //         console.log("The file was saved!");
    //     });
    //     fs.writeFile(`D:\\tiffs\\${boundary}_${plant}_${phenophase}_${dateString}_rast_${d.getTime()}.tiff`, row.tiffyrast, function(err) {
    //         if(err) {
    //             return console.log(err);
    //         }
    //
    //         console.log("The file was saved!");
    //     });
    // });


    return res;
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

async function getAreaStats(boundary, date, plant, phenophase, climate) {

    let dateString = date.toISOString().split('T')[0];
    let now = new Date();

    // choose table via selected data and boundary tile intersection (for ncep alaska)
    let rastTable = '';
    if (climate === 'PRISM') {
        rastTable = 'prism_spring_index';
    } else if (climate === 'NCEP') {
        if (date.getYear() < now.getYear()) {
            rastTable = 'ncep_spring_index_historic';
        } else {
            rastTable = 'ncep_spring_index';
            let rasterCellsInBoundary = await boundaryRasterIntersections(rastTable, boundary, dateString, plant, phenophase);
            if(rasterCellsInBoundary < 1) {
                rastTable = 'ncep_spring_index_alaska';
            }

        }
    } else if (climate === 'BEST') {
        rastTable = 'best_spring_index';
    }

    let response = await getTiff(rastTable, boundary, dateString, plant, phenophase);
    return response;

    /*
    let query = `SELECT gid, CAST(AVG(((foo.geomval).val)) AS decimal(9,1)) as avgimr
    FROM (SELECT p.gid, ST_Intersection(r.rast, p.geom) AS geomval
    FROM ${rastTable} r, fws_boundaries p
    WHERE ST_Intersects(p.geom, r.rast) AND p.orgname = '${boundary}' AND r.rast_date = '${dateString}' AND r.plant='${plant}' AND r.phenophase='${phenophase}') AS foo
    WHERE (foo.geomval).val >=0
    GROUP BY gid ORDER BY gid;`;
    const res = await pgPool.query(query);
    //await pgPool.end();

    console.log(res);

    return res;
    */
}

module.exports.usanpnPool = usanpnPool;
module.exports.usanpnPromisePool = usanpnPromisePool;
module.exports.drupalPool = drupalPool;
module.exports.getAreaStats = getAreaStats;
module.exports.pgPool = pgPool;