const moment = require('moment');
const https = require('https');

function doRequest(path) {
    let options = {
        "rejectUnauthorized": false,
        "hostname": "data-dev.usanpn.org",
        "path": path,
        "method": "GET",
        "port": 3006
    };
    return new Promise ((resolve, reject) => {
        let req = https.request(options);

        req.on('response', res => {
            resolve(res);
        });

        req.on('error', err => {
            reject(err);
        });
    });
}

async function update() {

    let species = 'Emerald Ash Borer';
    let aprilStartDate = false;

    var start = moment.utc("2017-01-01");
    var end = moment.utc("2017-01-31");

    while(start <= end){

        let dateString = start.format('YYYY-MM-DD');

        try {
            console.log(`generating pest map: ${species} ${dateString}`);
            await doRequest(`/v0/agdd/pestMap?species=${species}&date=${dateString}&aprilStartDate=${aprilStartDate}`);
            //await agddController.getPestMap(species, start, aprilStartDate);
        } catch(error) {
            console.log(error);
        }

        start.add(1, 'days');
    }
}

update();