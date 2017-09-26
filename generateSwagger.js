// todo: dynamically generate the swagger.yaml file based on database results and environment variables
let db = require('./api/helpers/database.js');

async function getStateBoundaryNames() {
    let query = `SELECT name FROM state_boundaries ORDER BY name;`;
    const res = await db.pgPool.query(query);
    return res;
}

async function generate() {
    let stateBoundaries = await getStateBoundaryNames();
}