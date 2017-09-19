let log = require('../../logger.js');
const moment = require('moment');
let sixController = require('../helpers/six.js');

/**
 * @param {{swagger}} req
 */
function clippedImage(req, res) {
    let boundary = req.swagger.params['boundary'].value;
    let phenophase = req.swagger.params['phenophase'].value;
    let date = req.swagger.params['date'].value;
    let plant = req.swagger.params['plant'].value;
    let climate = req.swagger.params['climate'].value;

    return sixController.getClippedSixImage(boundary, moment(date), plant, phenophase, climate)
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
        return sixController.getSixAreaStatsWithCaching(boundary, moment(date), plant, phenophase, climate)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    } else {
        return sixController.getSixAreaStats(boundary, moment(date), plant, phenophase, climate)
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
                resultForYear = await sixController.getSixAreaStatsWithCaching(boundary, moment(new Date(year, 0, 1)), plant, phenophase, climate);
            } else {
                resultForYear = await sixController.getSixAreaStats(boundary, moment(new Date(year, 0, 1)), plant, phenophase, climate);
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
module.exports.areaStatsTimeSeries = areaStatsTimeSeries;