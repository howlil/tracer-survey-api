const express = require('express');
require('dotenv').config({ override: false });
const errorMiddleware = require('./shared/middlewares/error.middleware');
const httpMiddleware = require("./shared/middlewares/http.middleware")
const securityMiddleware = require("./shared/middlewares/security.middleware")
const logger = require('./shared/configs/logger.config');
const awilixConfig = require('./shared/configs/awililx.config');
const IndexRoute = require('./domain/index.route');


class Main {
    #app

    constructor() {
        this.#app = express();
        this.plugin();
        this.startUp();
    }

    plugin() {
        this.#app.use(securityMiddleware)
        this.#app.use(httpMiddleware)
        this.#app.use(express.json({ limit: '10mb', type: 'application/json', verify: (req, res, buf, encoding) => { req.rawBody = buf.toString(); } }));
        this.#app.use(express.urlencoded({ extended: true }));

        IndexRoute.setupSwagger(this.#app);

        this.#app.use((req, res, next) => { req.container = awilixConfig.scope; next() })
        this.#app.use(new IndexRoute().getRouter())
        this.#app.use(require("./shared/middlewares/not-found.middleware"));
        this.#app.use(errorMiddleware.expressErrorHandler);

    }

    startUp() {
        const PORT = process.env.PORT
        this.#app.listen(PORT, () => {
            logger.info(`server Running in ${PORT}`)
        })
    }
}

module.exports = new Main();