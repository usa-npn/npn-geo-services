var fs = require('fs');

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

module.exports.WriteFile = WriteFile;
module.exports.getDatesRangeArray = getDatesRangeArray;
