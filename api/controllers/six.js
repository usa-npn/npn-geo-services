let log = require('../../logger.js');
const moment = require('moment');
let sixController = require('../helpers/six.js');

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


/**
 * @param {{swagger}} req
 */
function clippedImage(req, res) {
    let fwsBoundary = getParam(req.swagger.params['fwsBoundary']);
    let stateBoundary = getParam(req.swagger.params['stateBoundary']);
    let layerName = getParam(req.swagger.params['layerName']);
    let phenophase = getParam(req.swagger.params['phenophase']);
    let date = getParam(req.swagger.params['date']);
    let plant = getParam(req.swagger.params['plant']);
    let climate = getParam(req.swagger.params['climate']);
    let style = getParam(req.swagger.params['style']);
    let fileFormat = getParam(req.swagger.params['fileFormat']);
    let useBufferedBoundary = getParam(req.swagger.params['useBufferedBoundary']) || false;
    let useConvexHullBoundary = getParam(req.swagger.params['useConvexHullBoundary']) || false;

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
    let fwsBoundary = getParam(req.swagger.params['fwsBoundary']);
    let stateBoundary = getParam(req.swagger.params['stateBoundary']);
    let layerName = getParam(req.swagger.params['layerName']);
    let phenophase = getParam(req.swagger.params['phenophase']);
    let date = getParam(req.swagger.params['date']);
    let plant = getParam(req.swagger.params['plant']);
    let climate = getParam(req.swagger.params['climate']);
    let useBufferedBoundary = getParam(req.swagger.params['useBufferedBoundary']) || false;
    let useConvexHullBoundary = getParam(req.swagger.params['useConvexHullBoundary']) || false;
    let useCache = getParam(req.swagger.params['useCache']);

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
        return sixController.getSixAreaStatsWithCaching(boundary, boundaryTable, boundaryColumn, moment.utc(date), plant, phenophase, climate, useConvexHullBoundary)
            .then((areaStatsResponse) => res.status(200).send(areaStatsResponse))
            .catch((error) => res.status(500).json({"message": error.message}));
    } else {
        return sixController.getSixAreaStats(boundary, boundaryTable, boundaryColumn, moment.utc(date), plant, phenophase, climate, useConvexHullBoundary)
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
