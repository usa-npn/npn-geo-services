let agddController = require('./api/helpers/agdd.js');
const moment = require('moment');


async function update() {

    let species = 'Emerald Ash Borer';
    let aprilStartDate = false;

    var start = moment.utc("2017-01-01");
    var end = moment.utc("2017-12-31");

    while(start <= end){

        let dateString = start.format('YYYY-MM-DD');

        try {
            console.log(`generating pest map: ${species} ${dateString}`);
            await agddController.getPestMap(species, start, aprilStartDate);
        } catch(error) {
            console.log(error);
        }

        start.add(1, 'days');
    }
}

update();