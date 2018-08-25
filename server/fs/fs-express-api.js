/**
 * This file is to be used by node. There is no file system access at the client.
 * To be called from our webpack devServer.setup config
 * See: http://expressjs.com/en/guide/using-middleware.html
 * const fsExpressAPI = require('./scripts/fs/fs-express-api');
 * devServer: {
 * .
 * .
 * setup: fsExpressAPI,
 * },
 **/
const bodyParser = require('body-parser');
const multer = require('multer');
const fsAPI = require('./fs-service');
const commonResponse = require('../utils/common-response');

/* Express allows for app object setup to handle paths (our api routes) */
module.exports = function (app) {
    const upload = multer(); // for parsing multipart/form-data
    const uploadLimit = '50mb'; // express has a default of ~20Kb
    app.use(bodyParser.json({limit: uploadLimit})); // for parsing application/json
    app.use(bodyParser.urlencoded({limit: uploadLimit, extended: true, parameterLimit: 50000})); // for parsing application/x-www-form-urlencoded

    // We will look at every route to bypass any /api route from the react app
    app.use('/:path', function (req, res, next) {
        // if the path is api, skip to the next route
        if (req.params.path === 'api') {
            next('route');
        }
        // otherwise pass the control out of this middleware to the next middleware function in this stack (back to regular)
        else next();
    });

    app.use('/api', function (req, res, next) {
        const response = {route: '/api', url: req.originalUrl};
        if (req.originalUrl === "/api" || req.originalUrl === "/api/") {
            // if the requested url is the root, , respond Error!
            response.status = 500;
            response.error = 'This is the root of the API';
            res.status(response.status).json(response);
        } else {
            // continue to the next sub-route ('/api/:path')
            next('route');
        }
    });

    /* Define custom handlers for api paths: */
    app.use('/api/:path', function (req, res, next) {
        const response = {route: '/api/:path', path: req.params.path, params: req.params};
        if (req.params.path && req.params.path in fsAPI) {
            // all good, route exists in the api
            next('route');
        } else {
            // sub-route was not found in the api, respond Error!
            response.status = 500;
            response.error = `Invalid path ${ req.params.path }`;
            res.status(response.status).json(response);
        }
    });

    /* Files */

    /* Return all the files in the starting path */
    app.get('/api/files', function (req, res, next) {
        fsAPI.files('./').then((fileList) => {
            res.json(fileList);
        }).catch((err) => {
            const response = commonResponse.get500ErrorResponse({
                route: '/api/files',
                internalError: err,
                error: `Could not get files - code [${ err.code }]`
            });
            res.status(response.status).send(response);
        });
    });

    /* Return all the files in the passed path */
    app.get('/api/files/:path', function (req, res, next) {
        fsAPI.files(req.params.path).then((fileList) => {
            res.json(fileList);
        }).catch((err) => {
            const response = commonResponse.get500ErrorResponse({
                route: '/api/files/:path',
                params: req.params,
                path: req.params.path,
                internalError: err,
                error: `Could not get files for ${ req.params.path } - code [${ err.code }]`
            });
            res.status(response.status).send(response);
        });
    });
    /* Capture Unknown extras and handle path (ignore?) */
    app.get('/api/files/:path/**', function (req, res, next) {
        const filesPath = req.originalUrl.substring(11, req.originalUrl.split('?', 1)[0].length);
        fsAPI.files(filesPath).then((fileList) => {
            res.json(fileList);
        }).catch((err) => {
            const response = commonResponse.get500ErrorResponse({
                route: '/api/files/:path/**', params: req.params, path: req.params.path,
                internalError: err,
                error: `Could not get files for ${ filesPath } - code [${ err.code }]`
            });
            res.status(response.status).send(response);
        });
    });

    /* File */

    app.get('/api/file', function (req, res, next) {
        const response = {error: 'Id cannot be empty for file', status: 500, path: res.path};
        res.status(response.status).send(response);
    });

    app.get('/api/file/:category/:fileName', function (req, res, next) {
        fsAPI.file(req.params.category, req.params.fileName).read().then((content) => {
            res.json(content);
        }, () => {
            const response = commonResponse.get500ErrorResponse({
                route: '/api/file/:category/:fileName',
                id: 'get-content',
                error: `Could not read file ${ req.params.category }/${ req.params.fileName }`
            });
            res.status(response.status).send(response);
        });

    });

    app.post('/api/file/:category/:fileName', upload.array(), function (req, res, next) {
        const {category, fileName} = req.params;
        fsAPI.file(category, fileName).create(req.body).then((content) => {
            res.json(content);
        }, (err) => {
            const response = commonResponse.get500ErrorResponse({
                route: '/api/file/:category/:fileName',
                id: 'create-content',
                method: req.method,
                error: `Invalid path for File ${ category } / ${ fileName }`
            });
            res.status(response.status).send(response);

        });
    });
    /* Update file, error on path exists */
    app.put('/api/file/:category/:fileName', upload.array(), function (req, res, next) {
        const {category, fileName} = req.params;
        fsAPI.file(category, fileName).update(req.body).then((content) => {
            res.json(content);
        }, (err) => {
            const response = commonResponse.get500ErrorResponse({
                route: '/api/file/:category/:fileName',
                id: 'update-content',
                method: req.method,
                error: `Could not update file ${ category } / ${ fileName }`
            });
            res.status(response.status).send(response);

        });
    });
    app.put('/api/file/assets/:category/:fileName', upload.array(), function (req, res, next) {
        const {category, fileName} = req.params;
        fsAPI.file('assets/'+category, fileName).update(req.body).then((content) => {
            res.json(content);
        }, (err) => {
            const response = commonResponse.get500ErrorResponse({
                route: '/api/file/:category/:fileName',
                id: 'update-content',
                method: req.method,
                error: `Could not update file ${ category } / ${ fileName }`
            });
            res.status(response.status).send(response);

        });
    });
    /* Delete file, error if no file */
    app.delete('/api/file/:category/:fileName', function (req, res, next) {
        const {category, fileName} = req.params;
        fsAPI.file(category, fileName).del().then((content) => {
            res.json(content);
        }, (err) => {
            const response = commonResponse.get500ErrorResponse({
                route: '/api/file/:category/:fileName',
                id: 'delete-content',
                method: req.method,
                error: `Could not delete file ${ category } / ${ fileName }`
            });
            res.status(response.status).send(response);

        });
    });
};
