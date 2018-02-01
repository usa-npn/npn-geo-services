let agddController = require('../helpers/agdd.js');

async function update() {

    let species = 'Emerald Ash Borer';
    let aprilStartDate = false;

    var start = new Date("2017-01-01");
    var end = new Date("2017-12-31");

    while(start <= end){

        let dateString = start.toISOString().substring(0,10);

        try {
            console.log(`generating pest map: ${species} ${dateString}`);
            await agddController.getPestMap(species, dateString, aprilStartDate);
        } catch(error) {
            console.log(error);
        }

        start = new Date(start.setDate(start.getDate() + 1)); //date increase by 1
    }
}

update();