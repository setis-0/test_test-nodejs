import * as express from 'express';
import {DATE, Instance, INTEGER, NOW, Op} from "sequelize";
// import {sequelize} from '../app';
import Sequelize = require('sequelize');


// import {DATE, Instance, INTEGER, NOW, Op, * as sequelize} from "sequelize";
export const sequelize = new Sequelize('postgres://postgres:example@localhost:5432/test', {
    logging: true,
    operatorsAliases: false
});
sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

export let router = express.Router();

export interface ExclusionIntervalDateAttributes {
    id?: number;
    start: Date;
    end: Date;
}

export interface ExclusionIntervalDateInstance extends Instance<ExclusionIntervalDateAttributes> {
    dataValues: ExclusionIntervalDateAttributes;
}

const ExclusionIntervalDate = sequelize.define<ExclusionIntervalDateInstance, ExclusionIntervalDateAttributes>('ExclusionIntervalDate', {
        id: {
            type: INTEGER,
            primaryKey: true,
            autoIncrement: true

        },
        start: {
            type: DATE,
            defaultValue: NOW,
            allowNull: false
        },
        end: {
            type: DATE,
            allowNull: false
        }
    },
    {
        tableName: 'exclusion_interval_date',
        version: true,
        timestamps: false,
    });
ExclusionIntervalDate.sync();
router.get('/', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let {limit = 1e3, offset = 0, active, start, end} = req.query;
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
    let find = {
        offset: offset,
        limit: limit,
        ...(active) ? {
            end: {
                [Op.gte]: new Date()
            },

        } : {},
        ...(start) ? {
            start: {
                [Op.gte]: new Date(start)
            },

        } : {},
        ...(end) ? {
            end: {
                [Op.lte]: new Date(end)
            },

        } : {},

    };
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
router.get('/interval/:date/:detailed(detailed)?', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let {date, detailed} = req.params;
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
                    [Op.gte]: date
                },
                start: {
                    [Op.lte]: date,
                }

            }
        })
        .then(value => {
            let answer: any = {
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
router.post('/create', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let {start, end} = req.body;
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
                    [Op.gte]: end
                },
                start: {
                    [Op.lte]: start,
                }

            }
        })
        .then(value => {
            if (value.count === 0) {
                return ExclusionIntervalDate
                    .create({start: start, end: end})
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
router.delete('/:id', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let id: number = req.params.id;
    ExclusionIntervalDate
        .destroy({where: {id: id}})
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

