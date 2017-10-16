var fs = require('fs');
var os = require('os');
const { spawnSync } = require('child_process');

// helper function to allow awaiting on writeFile
function WriteFile(fileName, data)
{
    return new Promise((resolve, reject) =>
    {
        fs.writeFile(fileName, data, (err) =>
        {
            if (err)
            {
                reject(err);
            }
            else
            {
                // if we are on linux, chown to teamcity so that teamcity has permissions to mv / overwrite these files
                if (os.platform() !== 'win32') {
                    spawnSync('chown', ['teamcity:developers', fileName]);
                }
                resolve();
            }
        });
    });
}


/*
Provide moment.js dates as values for startDate, endDate parameters
interval parameter is optional and defaults to 'days'. Use intervals suported by .add() method (moment.js).
total parameter is useful when specifying intervals in minutes. It defaults to 1.
*/
var getDatesRangeArray = function (startDate, endDate, interval, total) {
    var config = {
            interval: interval || 'days',
            total: total || 1
        },
        dateArray = [],
        currentDate = startDate.clone();

    while (currentDate < endDate) {
        dateArray.push(currentDate);
        currentDate = currentDate.clone().add(config.total, config.interval);
    }

    return dateArray;
};

// takes a string and extracts the floating point numbers into an array
var extractFloatsFromString = function (inputString) {
    try {
        let regex = /[+-]?\d+(\.\d+)?/g;
        return inputString.match(regex).map(n => parseFloat(n));
    } catch (error) {
        // if there was no returned extent, then there was no data within the boundary
        throw 'no data found'
    }

};

module.exports.WriteFile = WriteFile;
module.exports.getDatesRangeArray = getDatesRangeArray;
module.exports.extractFloatsFromString = extractFloatsFromString;
