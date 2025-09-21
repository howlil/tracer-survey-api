const express = require('express');
require('dotenv').config();
const errorMiddleware = require('./apps/middlewares/error.middleware');
const logger = require('./libs/configs/logger.config');


class Main {
    #app

    constructor() {
        this.#app = express();
        this.plugin();
        this.startUp();
    }

    plugin() {
        this.#app.use(errorMiddleware.expressErrorHandler);
        this.#app.use(express.json({ limit: '20mb', type: 'application/json' }));
        this.#app.use(express.urlencoded({ extended: true }));

    }
    

}

module.exports = new Main();