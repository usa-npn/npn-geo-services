# Installing

This project depends on the following environment variables being set:
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
```
In the root directory run 
`npm install`

# Running

To run tests:
`npm test` which runs (`swagger project test`)

To start server:
`npm start`

To open the swagger editor (on the fly swagger.yaml feedback in the browser):
`swagger project edit`
