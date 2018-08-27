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

const createContent = (req, res, filePath) => {
    const {category, fileName} = req.params;
    fsAPI.file(filePath, fileName).create(req.body).then((content) => {
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
};

const updateContent = (req, res, filePath) => {
    const {category, fileName} = req.params;
    fsAPI.file(filePath, fileName).update(req.body).then((content) => {
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
};

const loadContentList = (req, res, filePath) => {
    fsAPI.files(filePath).then((fileList) => {
        res.json(fileList);
    }).catch((err) => {
        const response = commonResponse.get500ErrorResponse({
            route: '/api/files/:category',
            params: req.params,
            path: req.params.category,
            internalError: err,
            error: `Could not get files for ${ req.params.category } - code [${ err.code }]`
        });
        res.status(response.status).send(response);
    });
};

const readContent = (req, res, filePath) => {
    fsAPI.file(filePath, req.params.fileName).read().then((content) => {
        res.json(content);
    }, () => {
        const response = commonResponse.get500ErrorResponse({
            route: '/api/file/:category/:fileName',
            id: 'get-content',
            error: `Could not read file ${ req.params.category }/${ req.params.fileName }`
        });
        res.status(response.status).send(response);
    });
};

const deleteContent = (req, res, filePath) => {
    const {category, fileName} = req.params;
    fsAPI.file(filePath, fileName).del().then((content) => {
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
};

/* Express allows for app object setup to handle paths (our api routes) */
module.exports = (app) => {
    const upload = multer(); // for parsing multipart/form-data
    const uploadLimit = '50mb'; // express has a default of ~20Kb
    app.use(bodyParser.json({limit: uploadLimit})); // for parsing application/json
    app.use(bodyParser.urlencoded({limit: uploadLimit, extended: true, parameterLimit: 50000})); // for parsing application/x-www-form-urlencoded

    app.get('/api/files/:category', (req, res, next) => {
        loadContentList(req, res, req.params.category);
    });

    app.get('/api/files/:assets/:category', (req, res, next) => {
        const {assets, category} = req.params;
        loadContentList(req, res, `${assets}/${category}`);
    });

    app.get('/api/file/:category/:fileName', (req, res, next) => {
        readContent(req, res, req.params.category);
    });

    app.post('/api/file/:category/:fileName', upload.array(), (req, res, next) => {
        createContent(req, res, req.params.category);
    });

    app.put('/api/file/:category/:fileName', upload.array(), (req, res, next) => {
        const {category} = req.params;
        updateContent(req, res, category);
    });

    app.put('/api/file/:assets/:category/:fileName', upload.array(), (req, res, next) => {
        const {assets, category} = req.params;
        updateContent(req, res, `${assets}/${category}`);
    });

    app.delete('/api/file/:category/:fileName', (req, res, next) => {
        deleteContent(req, res, req.params.category);
    });

    app.delete('/api/file/:assets/:category/:fileName', upload.array(), (req, res, next) => {
        const {assets, category} = req.params;
        deleteContent(req, res, `${assets}/${category}`);
    });
};
