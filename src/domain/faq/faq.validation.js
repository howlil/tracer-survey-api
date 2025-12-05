const joi = require('joi')

class FaqValidation {
    static createSchema() {
        return joi.object({
            question: joi.string()
                .min(5)
                .max(500)
                .trim()
                .required()
                .messages({
                    'string.min': 'Pertanyaan minimal 5 karakter',
                    'string.max': 'Pertanyaan maksimal 500 karakter',
                    'any.required': 'Pertanyaan wajib diisi'
                }),
            
            answer: joi.string()
                .min(10)
                .max(2000)
                .trim()
                .required()
                .messages({
                    'string.min': 'Jawaban minimal 10 karakter',
                    'string.max': 'Jawaban maksimal 2000 karakter',
                    'any.required': 'Jawaban wajib diisi'
                })
        })
    }

    static updateSchema() {
        return joi.object({
            question: joi.string()
                .min(5)
                .max(500)
                .trim()
                .optional()
                .messages({
                    'string.min': 'Pertanyaan minimal 5 karakter',
                    'string.max': 'Pertanyaan maksimal 500 karakter'
                }),
            
            answer: joi.string()
                .min(10)
                .max(2000)
                .trim()
                .optional()
                .messages({
                    'string.min': 'Jawaban minimal 10 karakter',
                    'string.max': 'Jawaban maksimal 2000 karakter'
                })
        })
    }
}

module.exports = FaqValidation