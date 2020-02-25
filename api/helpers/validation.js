const moment = require('moment');


module.exports = {
    ncepStart: moment().utc().startOf('year'),
    ncepEnd: moment().utc().add(6, "days"),
    ncepHistStart: moment().utc().startOf('year'),
    ncepHistEnd: moment().utc().add(6, "days"),
    prismStart: moment('1981-01-01', 'YYYY-MM-DD').utc(),
    prismEnd: moment().utc().subtract(1, "days"),
    bestStart: moment('1880-01-01', 'YYYY-MM-DD').utc(),
    bestEnd: moment('2013-01-01', 'YYYY-MM-DD').utc()
}