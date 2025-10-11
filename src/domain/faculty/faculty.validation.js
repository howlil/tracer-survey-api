const joi = require('joi')

class FacultyValidation {
    static createSchema() {
        return joi.object({
            facultyName: joi.string()
                .min(2)
                .max(100)
                .required()
                .messages({
                    'string.min': 'Nama minimal 2 karakter',
                    'string.max': 'Nama maksimal 100 karakter',
                    'any.required': 'Nama wajib diisi'
                })
        })
    }

    static updateSchema() {
        return joi.object({
            facultyName: joi.string()
                .min(2)
                .max(100)
                .optional()
                .messages({
                    'string.min': 'Nama minimal 2 karakter',
                    'string.max': 'Nama maksimal 100 karakter'
                })
        })
    }
}

module.exports = FacultyValidation