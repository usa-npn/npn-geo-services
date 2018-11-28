let log = require('../../logger.js');
const moment = require('moment');
let climateController = require('../helpers/climate.js');
let general = require('../helpers/general.js');

/**
 * @param {{swagger}} req
 */
function pointTimeSeries(req, res) {
    let climateProvider = getParam(req.swagger.params['climateProvider']);
    let climateVariable = getParam(req.swagger.params['climateVariable']);
    let startDate = getParam(req.swagger.params['startDate']);
    let endDate = getParam(req.swagger.params['endDate']);
    let lat = getParam(req.swagger.params['latitude']);
    let long = getParam(req.swagger.params['longitude']);

    return climateController.getClimatePointTimeSeries(
        climateProvider, 
        climateVariable,
        moment.utc(startDate), 
        moment.utc(endDate), 
        lat, 
        long)
        .then((pointTimeSeriesJson) => res.status(200).send(pointTimeSeriesJson))
        .catch((error) => res.status(500).json({"message": error.message}));
}

module.exports.pointTimeSeries = pointTimeSeries;
