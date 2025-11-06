const joi = require('joi')

class AdminValidation {
    static createSchema() {
        return joi.object({
            username: joi.string()
                .min(3)
                .max(50)
                .required()
                .messages({
                    'string.min': 'Username minimal 3 karakter',
                    'string.max': 'Username maksimal 50 karakter',
                    'any.required': 'Username wajib diisi'
                }),
            name: joi.string()
                .min(2)
                .max(100)
                .required()
                .messages({
                    'string.min': 'Nama minimal 2 karakter',
                    'string.max': 'Nama maksimal 100 karakter',
                    'any.required': 'Nama wajib diisi'
                }),
            email: joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Email harus valid',
                    'any.required': 'Email wajib diisi'
                }),
            isActive: joi.boolean()
                .optional()
                .default(true),
            roleIds: joi.array()
                .items(joi.string().uuid())
                .min(1)
                .required()
                .messages({
                    'array.min': 'Minimal satu role harus dipilih',
                    'any.required': 'Role wajib dipilih'
                })
        })
    }

    static updateSchema() {
        return joi.object({
            username: joi.string()
                .min(3)
                .max(50)
                .optional()
                .messages({
                    'string.min': 'Username minimal 3 karakter',
                    'string.max': 'Username maksimal 50 karakter'
                }),
            name: joi.string()
                .min(2)
                .max(100)
                .optional()
                .messages({
                    'string.min': 'Nama minimal 2 karakter',
                    'string.max': 'Nama maksimal 100 karakter'
                }),
            email: joi.string()
                .email()
                .optional()
                .messages({
                    'string.email': 'Email harus valid'
                }),
            isActive: joi.boolean()
                .optional(),
            roleIds: joi.array()
                .items(joi.string().uuid())
                .min(1)
                .optional()
                .messages({
                    'array.min': 'Minimal satu role harus dipilih'
                })
        })
            .min(1)
            .messages({
                'object.min': 'Minimal satu field harus diisi untuk update'
            })
    }
}

module.exports = AdminValidation