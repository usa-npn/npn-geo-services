let db = require('../helpers/database.js');
let log = require('../../logger.js');

function areaStats(req, res) {
    let boundary = req.swagger.params['boundary'].value;
    let date = req.swagger.params['date'].value;
    let base = req.swagger.params['base'].value;
    let climate = req.swagger.params['climate'].value;

    return db.getAgddAreaStats(boundary, date, base, climate)
        .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
        .catch((error) => res.status(500).json({"message": error.message}));
}

async function areaStatsTimeSeries(req, res) {
    let boundary = req.swagger.params['boundary'].value;
    let startYear = req.swagger.params['yearStart'].value;
    let endYear = req.swagger.params['yearEnd'].value;
    let base = req.swagger.params['base'].value;
    let climate = req.swagger.params['climate'].value;

    let yearRange = [...Array(endYear - startYear + 1).keys()].map(i => startYear + i);

    try {
        let promiseResults = await Promise.all(yearRange.map(async (year) => {
            let resultForYear = await db.getAgddAreaStats(boundary, new Date(year, 0, 1), base, climate);
            resultForYear.year = year;
            return resultForYear;
        }));
        return res.status(200).send({timeSeries: promiseResults});
    } catch(error) {
        res.status(500).json({"message": error.message});
    }
}

module.exports.areaStats = areaStats;
module.exports.areaStatsTimeSeries = areaStatsTimeSeries;
