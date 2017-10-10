let log = require('../../logger.js');
const moment = require('moment');
let sixController = require('../helpers/six.js');

/**
 * @param {{swagger}} req
 */
function clippedImage(req, res) {
    let fwsBoundary = req.swagger.params['fwsBoundary'].value;
    let stateBoundary = req.swagger.params['stateBoundary'].value;
    let phenophase = req.swagger.params['phenophase'].value;
    let date = req.swagger.params['date'].value;
    let plant = req.swagger.params['plant'].value;
    let climate = req.swagger.params['climate'].value;
    let style = req.swagger.params['style'].value;
    let fileFormat = req.swagger.params['fileFormat'].value;
    let useBufferedBoundary = req.swagger.params['useBufferedBoundary'].value;
    let useConvexHullBoundary = req.swagger.params['useConvexHullBoundary'].value;

    let boundaryTable = "";
    let boundary = "";
    let boundaryColumn = "";
    if(fwsBoundary) {
        if(useBufferedBoundary) {
            boundaryTable = "fws_boundaries_buff30km";
        } else {
            boundaryTable = "fws_boundaries";
        }
        boundary = fwsBoundary;
        boundaryColumn = "orgname";
    } else if(stateBoundary) {
        boundaryTable = "state_boundaries";
        boundary = stateBoundary;
        boundaryColumn = "name";
    } else {
        res.status(500).json({"message": "Invalid Boundary"});
    }

    if (style) {
        return sixController.getClippedSixImage(boundary, boundaryTable, boundaryColumn, moment.utc(date), plant, phenophase, climate, fileFormat, useBufferedBoundary, useConvexHullBoundary)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    } else {
        return sixController.getClippedSixRaster(boundary, boundaryTable, boundaryColumn, moment.utc(date), plant, phenophase, climate, fileFormat, useBufferedBoundary, useConvexHullBoundary)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    }


}

function areaStats(req, res) {
    let fwsBoundary = req.swagger.params['fwsBoundary'].value;
    let stateBoundary = req.swagger.params['stateBoundary'].value;
    let phenophase = req.swagger.params['phenophase'].value;
    let date = req.swagger.params['date'].value;
    let plant = req.swagger.params['plant'].value;
    let climate = req.swagger.params['climate'].value;
    let useCache = req.swagger.params['useCache'].value;
    let useBufferedBoundary = req.swagger.params['useBufferedBoundary'].value;
    let useConvexHullBoundary = req.swagger.params['useConvexHullBoundary'].value;

    let boundaryTable = "";
    let boundary = "";
    let boundaryColumn = "";
    if(fwsBoundary) {
        if(useBufferedBoundary) {
            boundaryTable = "fws_boundaries_buff30km";
        } else {
            boundaryTable = "fws_boundaries";
        }
        boundary = fwsBoundary;
        boundaryColumn = "orgname";
    } else if(stateBoundary) {
        boundaryTable = "state_boundaries";
        boundary = stateBoundary;
        boundaryColumn = "name";
    } else {
        res.status(500).json({"message": "Invalid Boundary"});
    }

    if (useCache) {
        return sixController.getSixAreaStatsWithCaching(boundary, boundaryTable, boundaryColumn, moment.utc(date), plant, phenophase, climate)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    } else {
        return sixController.getSixAreaStats(boundary, boundaryTable, boundaryColumn, moment.utc(date), plant, phenophase, climate)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    }
}

async function areaStatsTimeSeries(req, res) {
    let fwsBoundary = req.swagger.params['fwsBoundary'].value;
    let stateBoundary = req.swagger.params['stateBoundary'].value;
    let phenophase = req.swagger.params['phenophase'].value;
    let startYear = req.swagger.params['yearStart'].value;
    let endYear = req.swagger.params['yearEnd'].value;
    let plant = req.swagger.params['plant'].value;
    let climate = req.swagger.params['climate'].value;
    let useCache = req.swagger.params['useCache'].value;
    let useBufferedBoundary = req.swagger.params['useBufferedBoundary'].value;
    let useConvexHullBoundary = req.swagger.params['useConvexHullBoundary'].value;

    let boundaryTable = "";
    let boundary = "";
    let boundaryColumn = "";
    if(fwsBoundary) {
        if(useBufferedBoundary) {
            boundaryTable = "fws_boundaries_buff30km";
        } else {
            boundaryTable = "fws_boundaries";
        }
        boundary = fwsBoundary;
        boundaryColumn = "orgname";
    } else if(stateBoundary) {
        boundaryTable = "state_boundaries";
        boundary = stateBoundary;
        boundaryColumn = "name";
    } else {
        res.status(500).json({"message": "Invalid Boundary"});
    }

    let yearRange = [...Array(endYear - startYear + 1).keys()].map(i => startYear + i);

    try {
        let promiseResults = await Promise.all(yearRange.map(async (year) => {
            let resultForYear;
            if (useCache) {
                resultForYear = await sixController.getSixAreaStatsWithCaching(boundary, boundaryTable, boundaryColumn, moment.utc(new Date(year, 0, 1)), plant, phenophase, climate);
            } else {
                resultForYear = await sixController.getSixAreaStats(boundary, boundaryTable, boundaryColumn, moment.utc(new Date(year, 0, 1)), plant, phenophase, climate);
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
