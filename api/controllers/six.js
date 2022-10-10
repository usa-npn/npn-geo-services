let log = require('../../logger.js');
const moment = require('moment');
let sixController = require('../helpers/six.js');
let general = require('../helpers/general.js');

function getPlantFromLayerName(layerName) {
    if (layerName.includes('lilac')) {
        return 'lilac';
    } else if (layerName.includes('zabelli')) {
        return 'zabelli';
    } else if (layerName.includes('arnoldred')) {
        return 'arnoldred';
    } else {
        return 'average';
    }
}

function getPhenophaseFromLayerName(layerName) {
    if (layerName.includes('leaf')) {
        return 'leaf';
    } else if (layerName.includes('bloom')) {
        return 'bloom';
    } else {
        return null;
    }
}

function getClimateProviderFromLayerName(layerName) {
    if (layerName.includes('ncep')) {
        return 'NCEP';
    } else if (layerName.includes('prism')) {
        return 'PRISM';
    } else if (layerName.includes('best')) {
        return 'BEST';
    } else {
        return null;
    }
}

function getParam(param) {
    if (param != null) {
        return param.value
    } else {
        return null;
    }
}

function validateDateWithLayerName(layerName, date) {
    let y = date.year();
    let m = date.month();
    let d = date.date();
    let beginningOfYear = moment().utc().startOf('year');
    let forecastEnd = moment().utc().add(6, "days");
    let prismStart = moment('1981-01-01', 'YYYY-MM-DD').utc();
    let prismEnd = moment().utc().subtract(1, "days");
    let bestStart = moment('1880-01-01', 'YYYY-MM-DD').utc();
    let bestEnd = moment('2013-01-01', 'YYYY-MM-DD').utc();
    if(layerName.includes("ncep_historic")) {
        let lastAvailableYear = moment().utc().year() - 1;
        if(m != 0 || d != 1 || y > lastAvailableYear || y < 2016) {
            throw(`Historic NCEP si-x are available yearly from 2016-01-01 through ${lastAvailableYear}-01-01. Check that your date falls in that range having format YYYY-01-01.`);
        }
    }
    else if(layerName.includes("ncep")) {
        if(date < beginningOfYear || date > forecastEnd) {
            throw(`NCEP si-x is a daily layer available for the current year through ${forecastEnd.format("YYYY-MM-DD")}. Check that your date has format YYYY-MM-DD.`);
        }
    }
    else if(layerName.includes("prism")) {
        if(date < prismStart || date > prismEnd) {
            throw(`Prism si-x layers are available from 1981-01-01 through ${prismEnd.format("YYYY-MM-DD")}. Check that your date falls in that range having format YYYY-MM-DD.`);
        }
    }
    else if(layerName.includes("best")) {
        if(date < bestStart || date > bestEnd) {
            throw(`BEST si-x layers are available yearly from 1880-01-01 through 2013-01-01. Check that your date falls in that range having format YYYY-01-01.`);
        }
    }
}


/**
 * @param {{swagger}} req
 */
function clippedImageInternal(req, res, anomaly) {

    let fwsBoundary = getParam(req.swagger.params['fwsBoundary']);
    let stateBoundary = getParam(req.swagger.params['stateBoundary']);
    let layerName = getParam(req.swagger.params['layerName']);
    let phenophase = getParam(req.swagger.params['phenophase']);
    let date = getParam(req.swagger.params['date']);
    let plant = anomaly ? 'average' : getParam(req.swagger.params['plant']);
    let climate = anomaly ? null : getParam(req.swagger.params['climate']);
    let style = getParam(req.swagger.params['style']);
    let fileFormat = getParam(req.swagger.params['fileFormat']);
    let useBufferedBoundary = getParam(req.swagger.params['useBufferedBoundary']) || false;
    let useConvexHullBoundary = getParam(req.swagger.params['useConvexHullBoundary']) || false;

    if (layerName) {
        phenophase = getPhenophaseFromLayerName(layerName);
        try {
            validateDateWithLayerName(layerName, moment.utc(date));
        } catch(error) {
            res.status(500).json({"message": error});
        }
        
        if(!anomaly) {
            plant = getPlantFromLayerName(layerName);
            climate = getClimateProviderFromLayerName(layerName);
        }
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
        return sixController.getClippedSixImage(boundary, boundaryTable, boundaryColumn, moment.utc(date), plant, phenophase, climate, fileFormat, useBufferedBoundary, useConvexHullBoundary, anomaly)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    } else {
        return sixController.getClippedSixRaster(boundary, boundaryTable, boundaryColumn, moment.utc(date), plant, phenophase, climate, fileFormat, useBufferedBoundary, useConvexHullBoundary, anomaly)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    }


}


/**
 * @param {{swagger}} req
 */
function sixClippedImage(req, res) {
    let anomaly = false;
    return clippedImageInternal(req, res, anomaly);
}

/**
 * @param {{swagger}} req
 */
function sixAnomalyClippedImage(req, res) {
    let anomaly = true;
    return clippedImageInternal(req, res, anomaly);
}

/**
 * @param {{swagger}} req
 */
function sixAreaStats(req, res) {
    let anomaly = false;
    return areaStatsInternal(req, res, anomaly);
}

/**
 * @param {{swagger}} req
 */
function sixAnomalyAreaStats(req, res) {
    let anomaly = true;
    return areaStatsInternal(req, res, anomaly);
}

function areaStatsInternal(req, res, anomaly) {
    let fwsBoundary = getParam(req.swagger.params['fwsBoundary']);
    let stateBoundary = getParam(req.swagger.params['stateBoundary']);
    let layerName = getParam(req.swagger.params['layerName']);
    let phenophase = getParam(req.swagger.params['phenophase']);
    let date = getParam(req.swagger.params['date']);
    let plant = anomaly ? 'average' : getParam(req.swagger.params['plant']);
    let climate = anomaly ? null : getParam(req.swagger.params['climate']);
    let useBufferedBoundary = getParam(req.swagger.params['useBufferedBoundary']) || false;
    let useConvexHullBoundary = getParam(req.swagger.params['useConvexHullBoundary']) || false;
    let useCache = getParam(req.swagger.params['useCache']);

    if (layerName) {
        phenophase = getPhenophaseFromLayerName(layerName);
        if (!anomaly) {
            plant = getPlantFromLayerName(layerName);
            climate = getClimateProviderFromLayerName(layerName);
        }
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

    if (useCache) {
        return sixController.getSixAreaStatsWithCaching(boundary, boundaryTable, boundaryColumn, moment.utc(date), plant, phenophase, climate, useConvexHullBoundary, anomaly)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    } else {
        return sixController.getSixAreaStats(boundary, boundaryTable, boundaryColumn, moment.utc(date), plant, phenophase, climate, useConvexHullBoundary, anomaly)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    }
}

async function areaStatsTimeSeries(req, res) {
    let fwsBoundary = getParam(req.swagger.params['fwsBoundary']);
    let stateBoundary = getParam(req.swagger.params['stateBoundary']);
    let layerName = getParam(req.swagger.params['layerName']);
    let phenophase = getParam(req.swagger.params['phenophase']);
    let plant = getParam(req.swagger.params['plant']);
    let climate = getParam(req.swagger.params['climate']);
    let useBufferedBoundary = getParam(req.swagger.params['useBufferedBoundary']) || false;
    let useConvexHullBoundary = getParam(req.swagger.params['useConvexHullBoundary']) || false;
    let useCache = getParam(req.swagger.params['useCache']);
    let startYear = getParam(req.swagger.params['yearStart']);
    let endYear = getParam(req.swagger.params['yearEnd']);
    let anomaly = false;

    if (layerName) {
        plant = getPlantFromLayerName(layerName);
        phenophase = getPhenophaseFromLayerName(layerName);
        climate = getClimateProviderFromLayerName(layerName);
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

    let yearRange = [...Array(endYear - startYear + 1).keys()].map(i => startYear + i);

    try {
        let promiseResults = await Promise.all(yearRange.map(async (year) => {
            let resultForYear;
            if (useCache) {
                resultForYear = await sixController.getSixAreaStatsWithCaching(boundary, boundaryTable, boundaryColumn, moment.utc(new Date(year, 0, 1)), plant, phenophase, climate, anomaly);
            } else {
                resultForYear = await sixController.getSixAreaStats(boundary, boundaryTable, boundaryColumn, moment.utc(new Date(year, 0, 1)), plant, phenophase, climate, useConvexHullBoundary, anomaly);
            }
            resultForYear.year = year;
            return resultForYear;
        }));
        return res.status(200).send({timeSeries: promiseResults});
    } catch(error) {
        res.status(500).json({"message": error.message});
    }
}

module.exports.sixClippedImage = sixClippedImage;
module.exports.sixAnomalyClippedImage = sixAnomalyClippedImage;
module.exports.sixAreaStats = sixAreaStats;
module.exports.sixAnomalyAreaStats = sixAnomalyAreaStats;
module.exports.areaStatsTimeSeries = areaStatsTimeSeries;
