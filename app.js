"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const index_1 = require("./routes/index");
const exclusion_1 = require("./routes/exclusion");
exports.app = express();
exports.default = exports.app;
// view engine setup
exports.app.set('views', path.join(__dirname, 'views'));
exports.app.set('view engine', 'pug');
// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
exports.app.use(logger('dev'));
exports.app.use(bodyParser.json());
exports.app.use(bodyParser.urlencoded({ extended: false }));
exports.app.use(cookieParser());
exports.app.use(express.static(path.join(__dirname, 'public')));
exports.app.use('/', index_1.router);
exports.app.use('/exclusion', exclusion_1.router);
// catch 404 and forward to error handler
exports.app.use((req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handlers
// development error handler
// will print stacktrace
if (exports.app.get('env') === 'development') {
    exports.app.use((err, req, res, next) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
exports.app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
