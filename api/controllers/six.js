let db = require('../helpers/database.js');

function clippedImage(req, res) {
    let boundary = req.swagger.params['boundary'].value;
    let phenophase = req.swagger.params['phenophase'].value;
    let date = req.swagger.params['date'].value;
    let plant = req.swagger.params['plant'].value;
    let climate = req.swagger.params['climate'].value;

    return db.getClippedSixImage(boundary, date, plant, phenophase, climate)
        .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
        .catch((error) => res.status(500).json({"message": error.message}));
}

function areaStats(req, res) {
    let boundary = req.swagger.params['boundary'].value;
    let phenophase = req.swagger.params['phenophase'].value;
    let date = req.swagger.params['date'].value;
    let plant = req.swagger.params['plant'].value;
    let climate = req.swagger.params['climate'].value;
    let useCache = req.swagger.params['useCache'].value;

    if (useCache) {
        return db.getSixAreaStatsWithCaching(boundary, date, plant, phenophase, climate)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    } else {
        return db.getSixAreaStats(boundary, date, plant, phenophase, climate)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    }
}

async function areaStatsTimeSeries(req, res) {
    let boundary = req.swagger.params['boundary'].value;
    let phenophase = req.swagger.params['phenophase'].value;
    let startYear = req.swagger.params['yearStart'].value;
    let endYear = req.swagger.params['yearEnd'].value;
    let plant = req.swagger.params['plant'].value;
    let climate = req.swagger.params['climate'].value;
    let useCache = req.swagger.params['useCache'].value;

    let yearRange = [...Array(endYear - startYear + 1).keys()].map(i => startYear + i);

    try {
        let promiseResults = await Promise.all(yearRange.map(async (year) => {
            let resultForYear;
            if (useCache) {
                resultForYear = await db.getSixAreaStatsWithCaching(boundary, new Date(year, 0, 1), plant, phenophase, climate);
            } else {
                resultForYear = await db.getSixAreaStats(boundary, new Date(year, 0, 1), plant, phenophase, climate);
            }
            resultForYear.year = year;
            return resultForYear;
        }));
        return res.status(200).send({timeSeries: promiseResults});
    } catch(error) {
        res.status(500).json({"message": error.message});
    }
}

module.exports.clippedImage = clippedImage;
module.exports.areaStats = areaStats;
// module.exports.areaStatsWithCaching = areaStatsWithCaching;
module.exports.areaStatsTimeSeries = areaStatsTimeSeries;