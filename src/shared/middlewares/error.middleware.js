const { PrismaClientKnownRequestError, PrismaClientValidationError, PrismaClientInitializationError, PrismaClientRustPanicError } = require('@prisma/client');
const ErrorHttp = require('../http/error.http');

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

            if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
                return this.createErrorResponse(res, 400, "Invalid JSON", {
                    message: "Request body contains invalid JSON",
                    details: err.message,
                    position: err.message.match(/position (\d+)/)?.[1] || 'unknown'
                });
            }

            if (err instanceof PrismaClientKnownRequestError) {
                const detailMessage = {
                    code: err.code,
                    meta: err.meta,
                    message: this.cleanErrorMessage(err.message)
                }
                return this.createErrorResponse(res, 400, "Database Error", detailMessage);
            }

            if (err instanceof PrismaClientValidationError) {
                const errorMessage = this.parsePrismaValidationError(err.message);
                return this.createErrorResponse(res, 422, "Validation Error", errorMessage);
            }

            if (err instanceof PrismaClientInitializationError) {
                return this.createErrorResponse(res, 500, "Database Connection Error", this.cleanErrorMessage(err.message));
            }

            if (err instanceof PrismaClientRustPanicError) {
                return this.createErrorResponse(res, 500, "Database Internal Error", "Internal database error occurred");
            }

            return this.createErrorResponse(res, 500, "Internal Server Error", this.cleanErrorMessage(err.message));

        } catch (error) {
            return this.createErrorResponse(res, 500, "Internal Server Error", error.message);
        }
    }

    cleanErrorMessage(message) {
        if (typeof message !== 'string') return message;
        
        return message
            .replace(/\u001b\[[0-9;]*m/g, '') 
            .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '') 
            .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '') 
            .trim();
    }

    parsePrismaValidationError(message) {
        const cleanMessage = this.cleanErrorMessage(message);
        
        const fieldMatch = cleanMessage.match(/Argument `([^`]+)`/);
        const errorMatch = cleanMessage.match(/Expected ([^,]+), provided ([^.]+)/);
        const missingFieldMatch = cleanMessage.match(/Argument `([^`]+)` is missing/);
        
        if (missingFieldMatch) {
            return {
                field: missingFieldMatch[1],
                message: `Field '${missingFieldMatch[1]}' is required but missing`,
                type: 'missing_field'
            };
        }
        
        if (fieldMatch && errorMatch) {
            return {
                field: fieldMatch[1],
                message: `Invalid value for '${fieldMatch[1]}'. Expected ${errorMatch[1]}, but got ${errorMatch[2]}`,
                expected: errorMatch[1],
                provided: errorMatch[2],
                type: 'invalid_type'
            };
        }
        
        return {
            message: cleanMessage,
            type: 'validation_error'
        };
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