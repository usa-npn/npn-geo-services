const moment = require('moment');
const https = require('https');
const fs = require('fs');
const os = require('os');
let log = require('./logger.js');

// hits the geo services pestMap endpoint to generate image
function doRequest(path) {
    let options = {
        hostname: (os.hostname() == 'npnweb-dev.npn.edu' || os.hostname() == 'jeff-work') ? 'data-dev.usanpn.org' : 'data.usanpn.org',
        port: 3006,
        path: encodeURI(path),
        method: 'GET',
        rejectUnauthorized: false
    };
    return new Promise ((resolve, reject) => {
        // 'https://data-dev.usanpn.org:3006/v0/agdd/pestMap?species=Emerald%20Ash%20Borer&date=2017-01-05'
        console.log(options.hostname);
        https.get(options, (response) => {
            console.log('resolved');
            resolve(response);
        }).on('error', (e) => {
            console.log('rejected' + e);
            reject(e);
        });
    });
}

// deletes all pest images for species from past 5 days through next 6 days
async function deleteForecastDays(species) {
    let start = moment.utc().subtract(5,'days');
    let end = moment.utc().add(6,'days');
    let pestImagePath = '/var/www/data-site/files/npn-geo-services/clipped_images/pest_maps/';
    while(start <= end) {
        let dateString = start.format('YYYY-MM-DD');
        let fileName = `${species.replace(/\s/g, '_')}_${dateString}_styled.png`;
        if (fs.existsSync(pestImagePath + fileName)) {
            console.log(`deleting file for regineration: ${pestImagePath + fileName}`);
            fs.unlinkSync(pestImagePath + fileName);
        }
        start.add(1, 'days');
    }
}

async function update() {
    try {
        log.info("updating cached pest images.");
        let speciesArr = ['Emerald Ash Borer', 'Apple Maggot', 'Hemlock Woolly Adelgid', 'Lilac Borer', 'Winter Moth'];
        for(var species of speciesArr) {
            //await deleteForecastDays(species);
            let start = moment.utc("2017-01-01");
            let end = moment.utc().add(6,'days');
            while(start <= end){
                let dateString = start.format('YYYY-MM-DD');
                try {
                    console.log(`generating pest map: ${species} ${dateString}`);
                    await doRequest(`/v0/agdd/pestMap?species=${species}&date=${dateString}`);
                } catch(error) {
                    console.log(error);
                }
                start.add(1, 'days');
            }
        }
        log.info("finished updating cached pest images.");
    } catch (error) {
        log.error("could not update pest cached images: " + error);
    }
}

update();