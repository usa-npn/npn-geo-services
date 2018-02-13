const moment = require('moment');
const https = require('https');
var fs = require('fs');

function doRequest(path) {
    // let options = {
    //     "strictSSL": false,
    //     "rejectUnauthorized": false,
    //     "hostname": "data-dev.usanpn.org",
    //     "path": encodeURI(path),
    //     "method": "GET",
    //     "port": 3006
    // };
    let options = {
        hostname: 'data-dev.usanpn.org',
        port: 3006,
        path: encodeURI(path),
        method: 'GET',
        rejectUnauthorized: false
    };
    return new Promise ((resolve, reject) => {
        // 'https://data-dev.usanpn.org:3006/v0/agdd/pestMap?species=Emerald%20Ash%20Borer&date=2017-01-05&aprilStartDate=false'
        https.get(options, (response) => {
            resolve(response);
        }).on('error', (e) => {
            reject(e);
        });

        // req.on('response', res => {
        //     resolve(res);
        // });
        //
        // req.on('error', err => {
        //     reject(err);
        // });
    });
}

async function deleteForecastDays(species) {
    var start = moment.utc().subtract(2,'days');
    var end = moment.utc().add(5,'days');

    let pestImagePath = '/var/www/data-site/files/npn-geo-services/clipped_images/pest_maps/';
    while(start <= end) {
        let dateString = start.format('YYYY-MM-DD');
        let fileName = `${species.replace(/\s/g, '_').replace('-', '_')}_${dateString}_styled.png`;

        if (fs.existsSync(pestImagePath + fileName)) {
            console.log(`deleting file for regineration: ${pestImagePath + fileName}`);
            fs.unlinkSync(pestImagePath + fileName);
        }

        start.add(1, 'days');
    }
}

async function update() {

    let speciesArr = ['Emerald Ash Borer', 'Apple Maggot', 'Hemlock Woolly Adelgid', 'Lilac-Ash Borer', 'Winter Moth'];
    let aprilStartDate = false;

    for(var species of speciesArr) {

        await deleteForecastDays(species);

        var start = moment.utc("2017-01-01");
        var end = moment.utc().add(5,'days');

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

}

update();