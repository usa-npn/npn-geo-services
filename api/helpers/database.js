// postgres pool
const { Pool, Client } = require('pg');
const pgPool = new Pool({
	host: process.env.PGHOST,
	user: process.env.PGUSER,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT,
	database: process.env.PGDATABASE,
});
// mysql ppols
// var mysql = require('mysql2');
// var mysqlPromise = require('mysql2/promise');
//
// let usanpnHost = '';
// let usanpnUser = '';
// let usanpnPassword = '';
// let usanpnDatabase = '';
//
// let drupalHost = '';
// let drupalUser = '';
// let drupalPassword = '';
// let drupalDatabase = '';

// if (process.env.NODE_ENV === 'production') {
//     usanpnHost = process.env.OPS_USANPN_HOST;
//     usanpnUser = process.env.OPS_USANPN_USER;
//     usanpnPassword = process.env.OPS_USANPN_PASSWORD;
//     usanpnDatabase = process.env.OPS_USANPN_DATABASE;
//
//     drupalHost = process.env.OPS_DRUPAL_HOST;
//     drupalUser = process.env.OPS_DRUPAL_USER;
//     drupalPassword = process.env.OPS_DRUPAL_PASSWORD;
//     drupalDatabase = process.env.OPS_DRUPAL_DATABASE;
// } else if (process.env.NODE_ENV === 'development') {
//     usanpnHost = process.env.DEV_USANPN_HOST;
//     usanpnUser = process.env.DEV_USANPN_USER;
//     usanpnPassword = process.env.DEV_USANPN_PASSWORD;
//     usanpnDatabase = process.env.DEV_USANPN_DATABASE;
//
//     drupalHost = process.env.DEV_DRUPAL_HOST;
//     drupalUser = process.env.DEV_DRUPAL_USER;
//     drupalPassword = process.env.DEV_DRUPAL_PASSWORD;
//     drupalDatabase = process.env.DEV_DRUPAL_DATABASE;
// } else {
//     usanpnHost = process.env.LOCAL_USANPN_HOST;
//     usanpnUser = process.env.LOCAL_USANPN_USER;
//     usanpnPassword = process.env.LOCAL_USANPN_PASSWORD;
//     usanpnDatabase = process.env.LOCAL_USANPN_DATABASE;
//
//     drupalHost = process.env.LOCAL_DRUPAL_HOST;
//     drupalUser = process.env.LOCAL_DRUPAL_USER;
//     drupalPassword = process.env.LOCAL_DRUPAL_PASSWORD;
//     drupalDatabase = process.env.LOCAL_DRUPAL_DATABASE;
// }
//
// var usanpnPool = mysql.createPool({
//     connectionLimit : 20,
//     host     : usanpnHost,
//     user     : usanpnUser,
//     password : usanpnPassword,
//     database : usanpnDatabase,
//     debug    :  false
// });
// var usanpnPromisePool = mysqlPromise.createPool({
//     connectionLimit : 20,
//     host     : usanpnHost,
//     user     : usanpnUser,
//     password : usanpnPassword,
//     database : usanpnDatabase,
//     debug    :  false
// });
// var drupalPool = mysql.createPool({
//     connectionLimit : 20,
//     host     : drupalHost,
//     user     : drupalUser,
//     password : drupalPassword,
//     database : drupalDatabase,
//     debug    :  false
// });

// module.exports.usanpnPool = usanpnPool;
// module.exports.usanpnPromisePool = usanpnPromisePool;
// module.exports.drupalPool = drupalPool;
module.exports.pgPool = pgPool;
