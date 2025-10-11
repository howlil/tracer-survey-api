const joi = require('joi')

class FaqValidation {
    static createSchema() {
        return joi.object({
            title: joi.string()
                .min(5)
                .max(200)
                .trim()
                .required()
                .messages({
                    'string.min': 'Title minimal 5 karakter',
                    'string.max': 'Title maksimal 200 karakter',
                    'any.required': 'Title wajib diisi'
                }),
            
            link: joi.string()
                .uri({
                    scheme: ['http', 'https']
                })
                .min(10)
                .max(500)
                .required()
                .messages({
                    'string.uri': 'Link harus berupa URL yang valid (http/https)',
                    'string.min': 'Link minimal 10 karakter',
                    'string.max': 'Link maksimal 500 karakter',
                    'any.required': 'Link wajib diisi'
                })
        })
    }

    static updateSchema() {
        return joi.object({
            title: joi.string()
                .min(5)
                .max(200)
                .trim()
                .optional()
                .messages({
                    'string.min': 'Title minimal 5 karakter',
                    'string.max': 'Title maksimal 200 karakter'
                }),
            
            link: joi.string()
                .uri({
                    scheme: ['http', 'https']
                })
                .min(10)
                .max(500)
                .optional()
                .messages({
                    'string.uri': 'Link harus berupa URL yang valid (http/https)',
                    'string.min': 'Link minimal 10 karakter',
                    'string.max': 'Link maksimal 500 karakter'
                })
        })
    }
}

module.exports = FaqValidation