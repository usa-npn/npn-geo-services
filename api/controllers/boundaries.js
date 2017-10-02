let db = require('../helpers/database.js');

function boundary(req, res) {
    let fwsBoundary = req.swagger.params['fwsBoundary'].value;
    let stateBoundary = req.swagger.params['stateBoundary'].value;
    let format = req.swagger.params['format'].value;
    let useBufferedBoundary = req.swagger.params['useBufferedBoundary'].value;

    let boundaryTable = "";
    let boundary = "";
    let boundaryColumn = "";
    let layer = "";
    if(fwsBoundary) {
        if(useBufferedBoundary) {
            boundaryTable = "fws_boundaries_buff30km";
        } else {
            boundaryTable = "fws_boundaries";
        }
        boundary = fwsBoundary;
        boundaryColumn = "orgname";
        layer = "gdd:fws_boundaries"
    } else if(stateBoundary) {
        boundaryTable = "state_boundaries";
        boundary = stateBoundary;
        boundaryColumn = "NAME";
        layer = "gdd:states";
    } else {
        res.status(500).json({"message": "Invalid Boundary"});
    }

    let outputFormat = "";
    if(format === 'geojson') {
        outputFormat = "application/json"
    } else if(format === 'shapefile') {
        outputFormat = 'SHAPE-ZIP';
    } else {
        res.status(500).json({"message": "Invalid Format"});
    }

    let boundaryPath = `http://geoserver-dev.usanpn.org/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${layer}&CQL_FILTER=${boundaryColumn}='${boundary}'&outputFormat=${outputFormat}`;
    res.status(200).send({'boundary' : boundaryPath});
}

async function boundaryNames(req, res) {
    try {
        let boundaryType = req.swagger.params['boundaryType'].value;

        let boundaryTable = '';
        let boundaryColumn = '';
        if(boundaryType === 'FWS') {
            boundaryTable = "fws_boundaries";
            boundaryColumn = 'orgname';
        } else {
            boundaryTable = "state_boundaries";
            boundaryColumn = 'NAME';
        }

        const query = {
            text: `SELECT ${boundaryColumn} FROM ${boundaryTable} ORDER BY ${boundaryColumn}`
        };
        console.log(query);
        const result = await db.pgPool.query(query);
        res.status(200).send({'boundaryNames' : result});
    } catch(error) {
        res.status(500).json({"message": error.message});
    }
}

module.exports.boundary = boundary;
module.exports.boundaryNames = boundaryNames;
