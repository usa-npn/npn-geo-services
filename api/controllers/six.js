let db = require('../helpers/database.js');

function areaStats(req, res) {
    let boundary = req.swagger.params['boundary'].value;
    let phenophase = req.swagger.params['phenophase'].value;
    let date = req.swagger.params['date'].value;
    let plant = req.swagger.params['plant'].value;
    let climate = req.swagger.params['climate'].value;

    return db.getAreaStats(boundary, date, plant, phenophase, climate)
        .then((tableCount) => res.status(200).send(tableCount))
        .catch((error) => res.status(500).json({"message": error.message}));
}

module.exports.areaStats = areaStats;