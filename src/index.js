const express = require('express');
require('dotenv').config();
const errorMiddleware = require('./shared/middlewares/error.middleware');
const httpMiddleware = require("./shared/middlewares/http.middleware")
const logger = require('./shared/configs/logger.config');


class Main {
    #app

    constructor() {
        this.#app = express();
        this.plugin();
        this.startUp();
    }

    plugin() {
        this.#app.use(errorMiddleware.expressErrorHandler);
        this.#app.use(httpMiddleware)
        this.#app.use(express.json({ limit: '20mb', type: 'application/json' }));
        this.#app.use(express.urlencoded({ extended: true }));

    }
    

}

module.exports = new Main();