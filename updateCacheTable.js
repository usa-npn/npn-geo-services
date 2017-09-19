const moment = require('moment');
let db = require('./api/helpers/database.js');
let helpers = require('./api/helpers/general');
let sixController = require('./api/helpers/six.js');

const climateProviders = ['NCEP', 'PRISM', 'BEST'];
const phenophases = ['leaf'];
const plants = ['average'];

// const phenophases = ['leaf', 'bloom'];
// const plants = ['lilac', 'arnoldred', 'zabelli', 'average'];

async function getFwsBoundaryNames() {
    let query = `
    SELECT DISTINCT orgname 
    FROM fws_boundaries
    ORDER BY orgname;
    `;
    const res = await db.pgPool.query(query);
    return res.rows.map(row => row.orgname);
}

async function populateCache() {

    await sixController.createSixAreaStatsCacheTable();

    let fwsBoundaries = await getFwsBoundaryNames();

    for (let climateProvider of climateProviders) {
        let dates =[];
        if (climateProvider === 'BEST') {
            // fill with dates 1880 - 2013
            let startDate = moment('1880-01-01');
            let endDate = moment('2013-01-01');
            dates = helpers.getDatesRangeArray(startDate, endDate, 'years', 1);
        } else if(climateProvider === 'PRISM') {
            // fill with dates 1981 - previous year
            let startDate = moment('1981-01-01');
            let endDate = moment().startOf('year').subtract(1, 'year');
            dates = helpers.getDatesRangeArray(startDate, endDate, 'years', 1);
        } else if(climateProvider === 'NCEP') {
            // fill with dates beginning of current year through today
            let startDate = moment().startOf('year');
            let endDate = moment();
            dates = helpers.getDatesRangeArray(startDate, endDate, 'days', 1);
        }

        // debugging, view dates
        // console.log(climateProvider);
        // dates.forEach(date => console.log(date.format('YYYY-MM-DD')));

        for(let date of dates.reverse()) {
            for (let boundary of fwsBoundaries) {

                // ERROR: GEOSUnaryUnion: TopologyException: Input geom 0 is invalid: Hole lies outside shell at or near point -147.46456189399996 66.508847564000064 at -147.46456189399996 66.508847564000064
                // SQL state: XX000

                // takes a long time
                // "ALASKA PENINSULA NATIONAL WILDLIFE REFUGE"
                // "SELAWIK NATIONAL WILDLIFE REFUGE"
                // ARCTIC NATIONAL WILDLIFE REFUGE"

                // unkown if query will finish
                // "ALASKA MARITIME NATIONAL WILDLIFE REFUGE"

                // broken
                // invalid intersection
                // "MAXWELL NATIONAL WILDLIFE REFUGE"
                // "KODIAK NATIONAL WILDLIFE REFUGE"

                // hole lies outside shell
                // "YUKON FLATS NATIONAL WILDLIFE REFUGE"
                // "YUKON DELTA NATIONAL WILDLIFE REFUGE"
                // "CHASSAHOWITZKA NATIONAL WILDLIFE REFUGE"

                if (boundary === "MAXWELL NATIONAL WILDLIFE REFUGE"
                        || boundary === "KODIAK NATIONAL WILDLIFE REFUGE"
                        || boundary === "YUKON FLATS NATIONAL WILDLIFE REFUGE"
                        || boundary === "YUKON DELTA NATIONAL WILDLIFE REFUGE"
                        || boundary === "CHASSAHOWITZKA NATIONAL WILDLIFE REFUGE"
                        || boundary === "ALASKA MARITIME NATIONAL WILDLIFE REFUGE"
                )
                    continue;

                for (let plant of plants) {
                    for (let phenophase of phenophases) {
                        console.log(`populating cache table for ${date.format('YYYY-MM-DD')} : ${climateProvider} : ${boundary} : ${plant} : ${phenophase}`);
                        let rastTable = await sixController.getAppropriateSixTable(date, climateProvider, boundary, plant, phenophase);
                        await sixController.getPostgisClippedRasterSixStats(climateProvider, rastTable, boundary, date, plant, phenophase, true);
                    }
                }
            }
        }


    }

}

populateCache();
