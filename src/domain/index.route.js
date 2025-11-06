const express = require('express')
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');
const logger = require('../shared/configs/logger.config');

class IndexRoute {
    #app
    constructor() {
        this.#app = express.Router()
        this.setUp()
        this.wellcome()
    }

    setUp() {
        this.#app.use("/api", require("./auth/auth.route"))
        this.#app.use("/api", require("./faq/faq.route"))
        this.#app.use("/api", require("./role-permission/rolePermission.route"))
        this.#app.use("/api", require("./faculty/faculty.route"))
        this.#app.use("/api", require("./major/major.route"))
        this.#app.use("/api", require("./admin/admin.route"))
        this.#app.use("/api", require("./response/response.route"))
        this.#app.use("/api", require("./email/email.route"))
        this.#app.use("/api", require("./survey/survey.route"))
    }

    getRouter() {
        return this.#app
    }

    wellcome() {
        this.#app.get("/", (req, res) => {
            res.status(200).json(
                {
                    "success": true,
                    "message": "API is Ready",
                    "documentation": "/api-docs",
                    "swagger": "/api-docs"
                }
            )
        })
    }

    static setupSwagger(app) {
        try {
            const possiblePaths = [
                path.join(process.cwd(), 'swagger.json'), 
                path.join(__dirname, '../../../swagger.json'), 
                path.resolve(process.cwd(), 'swagger.json')
            ];
            
            let swaggerJsonPath = null;
            for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                    swaggerJsonPath = possiblePath;
                    break;
                }
            }
            
            if (!swaggerJsonPath) {
                throw new Error(`Swagger file not found. Tried paths: ${possiblePaths.join(', ')}`);
            }
            
            logger.info(`Loading Swagger from: ${swaggerJsonPath}`);
            
            const swaggerContent = fs.readFileSync(swaggerJsonPath, 'utf8');
            const swaggerDocument = JSON.parse(swaggerContent);
            logger.info('Swagger JSON parsed successfully');
            
            const swaggerServe = swaggerUi.serve;
            const swaggerSetup = swaggerUi.setup(swaggerDocument, {
                customCss: '.swagger-ui .topbar { display: none }',
                customSiteTitle: 'Tracer Study API Documentation',
                customfavIcon: '/favicon.ico'
            });
            
            app.use('/api-docs', ...swaggerServe, swaggerSetup);
            
            app.get('/api-docs/swagger.json', (req, res) => {
                res.setHeader('Content-Type', 'application/json');
                res.send(swaggerDocument);
            });
            
            logger.info('Swagger UI route registered at /api-docs');
            logger.info('Swagger JSON route registered at /api-docs/swagger.json');
        } catch (error) {
            logger.error('Failed to load Swagger documentation:', error.message);
            logger.error('Error details:', error.stack);
            app.get('/api-docs', (req, res) => {
                res.status(500).json({
                    success: false,
                    message: 'Swagger documentation failed to load',
                    error: {
                        message: error.message,
                        type: 'swagger_error'
                    }
                });
            });
        }
    }
}

module.exports = IndexRoute