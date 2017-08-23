# USA-NPN Geo Services Nodejs Server

This repository contains the nodejs server for the USA-NPN geo services. This services main purpose is to complement NPN's geoserver by delivering geospatial statistics and do various raster geometry slicing.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisities

To run the pop server the following need to be installed:

* [nodejs](https://nodejs.org/en/) - it is recommended to use [nvm](https://github.com/creationix/nvm) to manage multiple versions of nodejs

All additional dependancies are managed through [npm](https://www.npmjs.com/), the node package manager which is included with node.

### Installing

After cloning the project you will need to take the following steps.

cd into the main directory and install all dependancies through npm. 

```
cd npn-geo-services
npm install
```
The command installs all dependencies listed in the package.json file into a folder called node_modules.

Configuration is managed through environment variables. The following need to be set:

```
NODE_ENV=development
DEV_USANPN_HOST=localhost
DEV_USANPN_USER=your_usanpn2_db_user
DEV_USANPN_PASSWORD=your_usanpn2_db_password
DEV_USANPN_DATABASE=usanpn2
DEV_DRUPAL_HOST=localhost
DEV_DRUPAL_USER=your_drupal_db_user
DEV_DRUPAL_PASSWORD=your_drupal_db_password
DEV_DRUPAL_DATABASE=drupal5
SERVICES_HOST=localhost
PORT=port_for_services_to_listen_on
PGPORT=postgres_port
PGUSER=postgres_user
PGPASSWORD=postgres_password
PGDATABASE=postgres_database
PGHOST=postgres_host
```

Currently this project is pure js, no transpiling is required.

To run tests:
`npm test` which runs (`swagger project test`)

To start server:
`npm start`

To open the swagger editor (on the fly swagger.yaml feedback in the browser):
`swagger project edit`

## Deployment

This server is deployed with teamcity and started using ubuntu upstart which autostarts the server on boot and provides the following commands.

```
sudo service npn-geo-service stop
sudo service npn-geo-service start
sudo service npn-geo-service restart
sudo service npn-geo-service status
```

The service is located in /etc/init/npn-geo-service.conf

## Authors

* **Jeff Switzer** - [NPN](https://github.com/usa-npn)
* **Lee Marsh** - [NPN](https://github.com/usa-npn)

See also the list of [contributors](https://www.usanpn.org/about/staff) who participated in this project.
