let log = require('../../logger.js');
const moment = require('moment');
let agddController = require('../helpers/agdd.js');
let general = require('../helpers/general.js');
let pests = require('../helpers/pests.js');

function getBaseFromLayerName(layerName) {
    if (layerName.includes('50')) {
        return 50;
    } else {
        return 32;
    }
}

function getParam(param) {
    if (param != null) {
        return param.value
    } else {
        return null;
    }
}


/**
 * @param {{swagger}} req
 */
function areaStats(req, res) {
    let anomaly = false;
    return areaStatsInternal(req, res, anomaly);
}

/**
 * @param {{swagger}} req
 */
function anomalyAreaStats(req, res) {
    let anomaly = true;
    return areaStatsInternal(req, res, anomaly);
}

function areaStatsInternal(req, res, anomaly) {
    let fwsBoundary = getParam(req.swagger.params['fwsBoundary']);
    let stateBoundary = getParam(req.swagger.params['stateBoundary']);
    let layerName = getParam(req.swagger.params['layerName']);
    let base = getParam(req.swagger.params['base']);
    let date = getParam(req.swagger.params['date']);
    let climate = anomaly ? null : 'NCEP';
    let useBufferedBoundary = getParam(req.swagger.params['useBufferedBoundary']) || false;
    let useConvexHullBoundary = getParam(req.swagger.params['useConvexHullBoundary']) || false;
    let useCache = getParam(req.swagger.params['useCache']);

    if (layerName) {
        base = getBaseFromLayerName(layerName);
    }

    let boundaryTable = "";
    let boundary = "";
    let boundaryColumn = "";
    if(fwsBoundary) {
        if(useBufferedBoundary) {
            useConvexHullBoundary = false;
            boundaryTable = "fws_boundaries_buff30km";
        } else {
            boundaryTable = "fws_boundaries";
            if(general.mustUseConvexHull.includes(fwsBoundary)) {
                useConvexHullBoundary = true;
            }
        }
        boundary = fwsBoundary;
        boundaryColumn = "orgname";
    } else if(stateBoundary) {
        useConvexHullBoundary = false;
        boundaryTable = "state_boundaries";
        boundary = stateBoundary;
        boundaryColumn = "name";
    } else {
        res.status(500).json({"message": "Invalid Boundary"});
    }

    if (useCache) {
        return agddController.getAgddAreaStatsWithCaching(boundary, boundaryTable, boundaryColumn, moment.utc(date), base, climate, useConvexHullBoundary, anomaly)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    } else {
        return agddController.getAgddAreaStats(boundary, boundaryTable, boundaryColumn, moment.utc(date), base, climate, useConvexHullBoundary, anomaly)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    }
}

// async function areaStatsTimeSeries(req, res) {
//     let boundary = req.swagger.params['boundary'].value;
//     let startYear = req.swagger.params['yearStart'].value;
//     let endYear = req.swagger.params['yearEnd'].value;
//     let base = req.swagger.params['base'].value;
//     let climate = req.swagger.params['climate'].value;
//
//     let yearRange = [...Array(endYear - startYear + 1).keys()].map(i => startYear + i);
//
//     try {
//         let promiseResults = await Promise.all(yearRange.map(async (year) => {
//             let resultForYear = await agddController.getAgddAreaStats(boundary, moment.utc(new Date(year, 0, 1)), base, climate);
//             resultForYear.year = year;
//             return resultForYear;
//         }));
//         return res.status(200).send({timeSeries: promiseResults});
//     } catch(error) {
//         res.status(500).json({"message": error.message});
//     }
// }


/**
 * @param {{swagger}} req
 */
function pestDescriptions(req, res) {
    // omit rangeShpFilePath keys before sending result
    let filteredConfig = pests.pests.map(data => {
        const { rangeShpFilePath, ...newData } = data;
        return newData;
    })
    return res.status(200).send(filteredConfig);
}

/**
 * @param {{swagger}} req
 */
function pestMap(req, res) {
    let species = getParam(req.swagger.params['species']);
    let date = getParam(req.swagger.params['date']);
    let preserveExtent = getParam(req.swagger.params['preserveExtent']);

    return agddController.getPestMap(species, moment.utc(date), preserveExtent)
        .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
        .catch((error) => res.status(500).send({"message": error}));
}

/**
 * @param {{swagger}} req
 */
function clippedImage(req, res) {
    let anomaly = false;
    return clippedImageInternal(req, res, anomaly);
}

/**
 * @param {{swagger}} req
 */
function anomalyClippedImage(req, res) {
    let anomaly = true;
    return clippedImageInternal(req, res, anomaly);
}

/**
 * @param {{swagger}} req
 */
function clippedImageInternal(req, res, anomaly) {
    let fwsBoundary = getParam(req.swagger.params['fwsBoundary']);
    let stateBoundary = getParam(req.swagger.params['stateBoundary']);
    let layerName = getParam(req.swagger.params['layerName']);
    let base = getParam(req.swagger.params['base']);
    let date = getParam(req.swagger.params['date']);
    let climate = anomaly ? null : 'NCEP';
    let style = getParam(req.swagger.params['style']);
    let fileFormat = getParam(req.swagger.params['fileFormat']);
    let useBufferedBoundary = getParam(req.swagger.params['useBufferedBoundary']) || false;
    let useConvexHullBoundary = getParam(req.swagger.params['useConvexHullBoundary']) || false;

    if (layerName) {
        base = getBaseFromLayerName(layerName);
    }

    let boundaryTable = "";
    let boundary = "";
    let boundaryColumn = "";
    if(fwsBoundary) {
        if(useBufferedBoundary) {
            boundaryTable = "fws_boundaries_buff30km";
            useConvexHullBoundary = false;
        } else {
            boundaryTable = "fws_boundaries";
            if(general.mustUseConvexHull.includes(fwsBoundary)) {
                useConvexHullBoundary = true;
            }
        }
        boundary = fwsBoundary;
        boundaryColumn = "orgname";
    } else if(stateBoundary) {
        useConvexHullBoundary = false;
        boundaryTable = "state_boundaries";
        boundary = stateBoundary;
        boundaryColumn = "name";
    } else {
        res.status(500).json({"message": "Invalid Boundary"});
    }

    if (style) {
        return agddController.getClippedAgddImage(boundary, boundaryTable, boundaryColumn, moment.utc(date), base, climate, fileFormat, useBufferedBoundary, useConvexHullBoundary, anomaly)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    } else {
        return agddController.getClippedAgddRaster(boundary, boundaryTable, boundaryColumn, moment.utc(date), base, climate, fileFormat, useBufferedBoundary, useConvexHullBoundary, anomaly)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    }
}

/**
 * @param {{swagger}} req
 */
function simpleAgddMap(req, res) {
    let climateProvider = getParam(req.swagger.params['climateProvider']);
    let temperatureUnit = getParam(req.swagger.params['temperatureUnit']);
    let startDate = getParam(req.swagger.params['startDate']);
    let endDate = getParam(req.swagger.params['endDate']);
    let base = getParam(req.swagger.params['base']);

    return agddController.getDynamicAgdd('simple', climateProvider, temperatureUnit, moment.utc(startDate), moment.utc(endDate), base, null)
        .then((agddMapJson) => res.status(200).send(agddMapJson))
        .catch((error) => res.status(500).json({"message": error.message}));
}

/**
 * @param {{swagger}} req
 */
function doubleSineAgddMap(req, res) {
    let climateProvider = getParam(req.swagger.params['climateProvider']);
    let temperatureUnit = getParam(req.swagger.params['temperatureUnit']);
    let startDate = getParam(req.swagger.params['startDate']);
    let endDate = getParam(req.swagger.params['endDate']);
    let lowerThreshold = getParam(req.swagger.params['lowerThreshold']);
    let upperThreshold = getParam(req.swagger.params['upperThreshold']);

    return agddController.getDynamicAgdd('double-sine', climateProvider, temperatureUnit, moment.utc(startDate), moment.utc(endDate), lowerThreshold, upperThreshold)
        .then((agddMapJson) => res.status(200).send(agddMapJson))
        .catch((error) => res.status(500).json({"message": error.message}));
}

/**
 * @param {{swagger}} req
 */
function simplePointTimeSeries(req, res) {
    let climateProvider = getParam(req.swagger.params['climateProvider']);
    let temperatureUnit = getParam(req.swagger.params['temperatureUnit']);
    let startDate = getParam(req.swagger.params['startDate']);
    let endDate = getParam(req.swagger.params['endDate']);
    let base = getParam(req.swagger.params['base']);
    let lat = getParam(req.swagger.params['latitude']);
    let long = getParam(req.swagger.params['longitude']);
    let agddThreshold = getParam(req.swagger.params['agddThreshold']);


    return agddController.getSimpleAgddTimeSeries(
        climateProvider, 
        temperatureUnit,
        moment.utc(startDate), 
        moment.utc(endDate), 
        base, 
        lat, 
        long, 
        agddThreshold
        ).then((agddPointTimeSeriesJson) => res.status(200).send(agddPointTimeSeriesJson))
        .catch((error) => res.status(500).json({"message": error.message}));

    
}

/**
 * @param {{swagger}} req
 */
function simplePointTimeSeries30YearAvg(req, res) {
    let temperatureUnit = getParam(req.swagger.params['temperatureUnit']);
    let startDate = getParam(req.swagger.params['startDate']);
    let endDate = getParam(req.swagger.params['endDate']);
    let base = getParam(req.swagger.params['base']);
    let lat = getParam(req.swagger.params['latitude']);
    let long = getParam(req.swagger.params['longitude']);
    let agddThreshold = getParam(req.swagger.params['agddThreshold']);


    return agddController.getSimpleAgddTimeSeries30YearAvg(
        temperatureUnit,
        base, 
        lat, 
        long, 
        agddThreshold
        ).then((agddPointTimeSeriesJson) => res.status(200).send(agddPointTimeSeriesJson))
        .catch((error) => res.status(500).json({"message": error.message}));

    
}

/**
 * @param {{swagger}} req
 */
function doubleSinePointTimeSeries(req, res) {
    let climateProvider = getParam(req.swagger.params['climateProvider']);
    let temperatureUnit = getParam(req.swagger.params['temperatureUnit']);
    let startDate = getParam(req.swagger.params['startDate']);
    let endDate = getParam(req.swagger.params['endDate']);
    let lowerThreshold = getParam(req.swagger.params['lowerThreshold']);
    let upperThreshold = getParam(req.swagger.params['upperThreshold']);
    let lat = getParam(req.swagger.params['latitude']);
    let long = getParam(req.swagger.params['longitude']);
    let agddThreshold = getParam(req.swagger.params['agddThreshold']);


    return agddController.getDoubleSineAgddTimeSeries(
        climateProvider, 
        temperatureUnit,
        moment.utc(startDate), 
        moment.utc(endDate), 
        lowerThreshold,
        upperThreshold, 
        lat, 
        long, 
        agddThreshold
        ).then((agddPointTimeSeriesJson) => res.status(200).send(agddPointTimeSeriesJson))
        .catch((error) => res.status(500).json({"message": error.message}));

    
}

module.exports.areaStats = areaStats;
module.exports.anomalyAreaStats = anomalyAreaStats;
module.exports.clippedImage = clippedImage;
module.exports.pestDescriptions = pestDescriptions;
module.exports.pestMap = pestMap;
module.exports.anomalyClippedImage = anomalyClippedImage;
module.exports.simpleAgddMap = simpleAgddMap;
module.exports.doubleSineAgddMap = doubleSineAgddMap;
module.exports.simplePointTimeSeries = simplePointTimeSeries;
module.exports.simplePointTimeSeries30YearAvg = simplePointTimeSeries30YearAvg;
module.exports.doubleSinePointTimeSeries = doubleSinePointTimeSeries;

// module.exports.areaStatsTimeSeries = areaStatsTimeSeries;
