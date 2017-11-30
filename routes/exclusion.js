"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const sequelize_1 = require("sequelize");
// import {sequelize} from '../app';
const Sequelize = require("sequelize");
// import {DATE, Instance, INTEGER, NOW, Op, * as sequelize} from "sequelize";
exports.sequelize = new Sequelize('postgres://postgres:example@localhost:5432/test', {
    logging: true,
    operatorsAliases: false
});
exports.sequelize
    .authenticate()
    .then(() => {
    console.log('Connection has been established successfully.');
})
    .catch(err => {
    console.error('Unable to connect to the database:', err);
});
exports.router = express.Router();
const ExclusionIntervalDate = exports.sequelize.define('ExclusionIntervalDate', {
    id: {
        type: sequelize_1.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    start: {
        type: sequelize_1.DATE,
        defaultValue: sequelize_1.NOW,
        allowNull: false
    },
    end: {
        type: sequelize_1.DATE,
        allowNull: false
    }
}, {
    tableName: 'exclusion_interval_date',
    version: true,
    timestamps: false,
});
ExclusionIntervalDate.sync();
exports.router.get('/', (req, res, next) => {
    let { limit = 1e3, offset = 0, active, start, end } = req.query;
    /**
     * актуальный список
     * @type {boolean}
     */
    active = (active && parseInt(active) === 1);
    start = (start) ? parseInt(start) : false;
    end = (end) ? parseInt(end) : false;
    if ((start && end) && start > end) {
        res
            .json({
            status: "success",
            error: "начальная точка времени большее конечной"
        })
            .status(400)
            .end();
        return;
    }
    let find = Object.assign({ offset: offset, limit: limit }, (active) ? {
        end: {
            [sequelize_1.Op.gte]: new Date()
        },
    } : {}, (start) ? {
        start: {
            [sequelize_1.Op.gte]: new Date(start)
        },
    } : {}, (end) ? {
        end: {
            [sequelize_1.Op.lte]: new Date(end)
        },
    } : {});
    ExclusionIntervalDate
        .findAll(find)
        .then(value => {
        res
            .json({
            status: "success",
            result: value,
            page: {
                limit: limit,
                offset: offset
            }
        })
            .status(200)
            .end();
    })
        .catch(error => {
        res
            .json({
            status: "error",
            error: error || " неизвестная ошибка"
        })
            .status(400)
            .end();
    });
});
exports.router.get('/interval/:date/:detailed(detailed)?', (req, res, next) => {
    let { date, detailed } = req.params;
    date = (date) ? parseInt(date) : false;
    if (!date) {
        res
            .json({
            status: "error",
            error: "не коректна введена дата"
        })
            .status(400)
            .end();
        return;
    }
    // if (new Date().getTime() > date) {
    //     res
    //         .json({
    //             status: "error",
    //             error: "текущия дата большее введенной"
    //         })
    //         .status(400)
    //         .end();
    //     return;
    // }
    date = new Date(date);
    detailed = (detailed && detailed.trim().toLowerCase() === 'detailed');
    ExclusionIntervalDate
        .findAndCountAll({
        where: {
            end: {
                [sequelize_1.Op.gte]: date
            },
            start: {
                [sequelize_1.Op.lte]: date,
            }
        }
    })
        .then(value => {
        let answer = {
            status: "success",
            result: (value.count === 0)
        };
        if (detailed) {
            answer.detailed = value.rows;
        }
        res
            .json(answer)
            .status(200)
            .end();
    })
        .catch(error => {
        res
            .json({
            status: "error",
            error: error || " неизвестная ошибка"
        })
            .status(400)
            .end();
    });
});
exports.router.post('/create', (req, res, next) => {
    let { start, end } = req.body;
    let time = new Date().getTime();
    start = (start) ? parseInt(start) : false;
    end = (end) ? parseInt(end) : false;
    if (start && time > start || end && time > end) {
        res
            .json({
            status: "success",
            error: "текущие время большее устанавливаемого"
        })
            .status(400)
            .end();
        return;
    }
    if (start > end) {
        res
            .json({
            status: "success",
            error: "начальная точка времени большее конечной"
        })
            .status(400)
            .end();
        return;
    }
    start = new Date(start);
    end = new Date(end);
    ExclusionIntervalDate
        .findAndCountAll({
        where: {
            end: {
                [sequelize_1.Op.gte]: end
            },
            start: {
                [sequelize_1.Op.lte]: start,
            }
        }
    })
        .then(value => {
        if (value.count === 0) {
            return ExclusionIntervalDate
                .create({ start: start, end: end })
                .then(() => {
                res
                    .json({
                    status: "success",
                    result: null
                })
                    .status(200)
                    .end();
            });
        }
        res
            .json({
            status: "error",
            error: "этот переод задействан",
            info: value
        })
            .status(400)
            .end();
    })
        .catch(error => {
        res
            .json({
            status: "error",
            error: error || " неизвестная ошибка"
        })
            .status(400)
            .end();
    });
});
exports.router.delete('/:id', (req, res, next) => {
    let id = req.params.id;
    ExclusionIntervalDate
        .destroy({ where: { id: id } })
        .then(value => {
        res
            .json({
            status: "success",
            result: value || null
        })
            .status(200)
            .end();
    })
        .catch(error => {
        res
            .json({
            status: "error",
            error: error || " неизвестная ошибка"
        })
            .status(400)
            .end();
    });
});
