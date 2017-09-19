let db = require('./database.js');
let log = require('../../logger.js');
const moment = require('moment');

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
async function getAppropriateAgddTable(date, climate, boundary, base) {
    if (climate === 'PRISM') {
        return `prism_agdd_${date.year()}`;
    } else if (climate === 'BEST') {
        return 'no_best_agdd';
    } else if (climate === 'NCEP') {
        return `agdd_${date.year()}`;
    }
}

async function getPostgisClippedRasterAgddStats(rastTable, boundary, date, base) {
    let buffer = getBufferSizeForTable(rastTable);

    const query = {
        text: `
        SELECT
    (ST_SummaryStats(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, $1), true)), true)).*,
    ST_Union(foo.boundary) AS shapefile
    FROM (SELECT p.gid as gid, p.geom AS boundary FROM fws_boundaries p WHERE p.orgname = $2) as foo
    INNER JOIN ${rastTable} r ON ST_Intersects(r.rast, foo.boundary)
    AND r.rast_date = $3
    AND r.base = $4
    AND r.scale='fahrenheit';`,
        values: [buffer, boundary, date.format('YYYY-MM-DD'), base]
    };

    // let query = `SELECT
    // ST_AsGeoJSON(ST_Union(foo.boundary)) as geojson,
    // (ST_SummaryStats(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, ${buffer}), true)), true)).*,
    // ST_AsTIFF(ST_Union(ST_Clip(r.rast, ST_Buffer(foo.boundary, ${buffer}), true))) AS tiffy,
    // ST_Union(foo.boundary) AS shapefile
    // FROM (SELECT p.gid as gid, p.geom AS boundary FROM fws_boundaries p WHERE p.orgname = '${boundary}') as foo
    // INNER JOIN ${rastTable} r ON ST_Intersects(r.rast, foo.boundary)
    // AND r.rast_date = '${date.format('YYYY-MM-DD')}'
    // AND r.base='${base}'
    // AND r.scale='fahrenheit';`;

    console.log(query);
    const res = await pgPool.query(query);

    let response = {date: date.format('YYYY-MM-DD')};
    if (res.rows.length > 0) {
        response.count = res.rows[0].count;
        response.sum = res.rows[0].sum;
        response.mean = res.rows[0].mean;
        response.stddev = res.rows[0].stddev;
        response.min = res.rows[0].min;
        response.max = res.rows[0].max;
        response.zippedShapeFile = `http://geoserver-dev.usanpn.org/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:fws_boundaries&CQL_FILTER=orgname='${boundary}'&maxFeatures=50&outputFormat=SHAPE-ZIP`;
    }
    return response;
}

async function getAgddAreaStats(boundary, date, base, climate) {
    let dateString = date.toISOString().split('T')[0];
    let rastTable = await getAppropriateAgddTable(date, climate, boundary, dateString, base);
    let response = await getPostgisClippedRasterAgddStats(rastTable, boundary, dateString, base);
    return response;
}

module.exports.getAgddAreaStats = getAgddAreaStats;