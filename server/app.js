const express = require('express');
const FsServer = require('./fs/fs-express-api');

var app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.static('app'));
app.use(express.static('./server/contents'));

FsServer(app);

app.listen(8080, function(){
    console.log('netlify cms is running on port 8080');
}, '127.0.0.1');