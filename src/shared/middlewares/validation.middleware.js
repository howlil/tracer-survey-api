const ErrorFactory = require("../factories/error-factory.http")

class ValidationMiddleware {

    #validate(type, schema, validation) {
        return (req, res, next) => {
            try {

                if (!schema || typeof schema !== 'function') {
                    throw new ErrorFactory.validationError("Schema is not a function or is undefined")
                }

                const result = schema.validate(req[type])
                if (result.error) {
                    const error = result?.error

                    if (error) {
                        const errors = error.details.map(detail => ({
                            field: detail.path.join("."),
                            message: detail.message.replace(/\\"/g, '"'),
                            type: detail.type
                        }))

                        throw new ErrorFactory.validationError(errors)
                    }

                }

                req[validation] = result.value;

                next()

            } catch (error) {
                next(error)
            }
        }
    }

    validateBody(schema) {
        return this.#validate("body", schema, "validatedBody")
    }

    validateQuery(schema) {
        return this.#validate("query", schema, "validatedQuery")
    }

    validateParams(schema) {
        return this.#validate("params", schema, "validatedParams")
    }

}

module.exports = ValidationMiddleware;