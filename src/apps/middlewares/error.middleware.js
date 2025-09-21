const { PrismaClientKnownRequestError, PrismaClientValidationError } = require('@prisma/client');
const ErrorHttp = require('../../libs/http/error.http');
const joi = require('joi');

class ErrorMiddleware {

    constructor() {
        this.createErrorResponse = ErrorMiddleware.createErrorResponse;
        this.expressErrorHandler = this.expressErrorHandler.bind(this);
    }

    expressErrorHandler(err, req, res, next) {

        try {
            if (err instanceof ErrorHttp) {
                return this.createErrorResponse(res, err.statusCode, err.message, err.error);
            }

            if (err instanceof joi.ValidationError) {

                const errorMessage = err.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    type: detail.type
                }))

                return this.createErrorResponse(res, 400, "Validation Error", errorMessage);
            }

            if (err instanceof PrismaClientKnownRequestError) {
                const detailMessage = {
                    code: err.code,
                    meta: err.meta,
                    message: err.message,
                }

                return this.createErrorResponse(res, 400, "Database Error", detailMessage);
            }

            if (err instanceof PrismaClientValidationError) {
                const errorMessage = typeof err.message === 'string'
                    ? err.message
                    : JSON.stringify(err.message);
                return this.createErrorResponse(res, 400, "Database Validation Error", errorMessage);
            }

            return this.createErrorResponse(res, 500, "Internal Server Error", err.message);

        } catch (error) {
            return this.createErrorResponse(res, 500, "Internal Server Error", error.message);
        }

    }


    static createErrorResponse(res, statusCode, message, error) {
        return res.status(statusCode).json({
            success: false,
            message,
            error
        });
    }
}
module.exports = new ErrorMiddleware();