const joi = require('joi')

class AdminValidation {

    static createAdminSchema() {
        return joi.object({
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
                    'string.email': 'Format email tidak valid',
                    'any.required': 'Email wajib diisi'
                }),

            username: joi.string()
                .alphanum()
                .min(3)
                .max(30)
                .required()
                .messages({
                    'string.alphanum': 'Username hanya boleh mengandung huruf dan angka',
                    'string.min': 'Username minimal 3 karakter',
                    'string.max': 'Username maksimal 30 karakter',
                    'any.required': 'Username wajib diisi'
                }),

            role: joi.array()
                .items(
                    joi.string()
                        .uuid()
                        .messages({
                            'string.guid': 'Format role ID tidak valid'
                        })
                )
                .min(1)
                .required()
                .messages({
                    'array.min': 'Minimal satu role harus dipilih',
                    'any.required': 'Role wajib diisi'
                })
        })
    }

    static updateAdminSchema() {
        return joi.object({
            name: joi.string()
                .min(2)
                .max(100)
                .optional()
                .messages({
                    'string.min': 'Nama minimal 2 karakter',
                    'string.max': 'Nama maksimal 100 karakter',
                    'any.required': 'Nama wajib diisi'
                }),

            email: joi.string()
                .email()
                .optional()
                .messages({
                    'string.email': 'Format email tidak valid',
                    'any.required': 'Email wajib diisi'
                }),

            username: joi.string()
                .alphanum()
                .min(3)
                .max(30)
                .optional()
                .messages({
                    'string.alphanum': 'Username hanya boleh mengandung huruf dan angka',
                    'string.min': 'Username minimal 3 karakter',
                    'string.max': 'Username maksimal 30 karakter',
                    'any.required': 'Username wajib diisi'
                }),

            role: joi.array()
                .items(
                    joi.string()
                        .uuid()
                        .messages({
                            'string.guid': 'Format role ID tidak valid'
                        })
                )
                .min(1)
                .optional()
                .messages({
                    'array.min': 'Minimal satu role harus dipilih',
                    'any.required': 'Role wajib diisi'
                })
        })
    }

    static changePasswordSchema() {
        return joi.object({
            currentPassword: joi.string()
                .required()
                .messages({
                    'any.required': 'Password saat ini wajib diisi'
                }),

            newPassword: joi.string()
                .min(6)
                .required()
                .messages({
                    'string.min': 'Password baru minimal 6 karakter',
                    'any.required': 'Password baru wajib diisi'
                }),

            confirmPassword: joi.string()
                .valid(joi.ref('newPassword'))
                .required()
                .messages({
                    'any.only': 'Konfirmasi password tidak sesuai',
                    'any.required': 'Konfirmasi password wajib diisi'
                })
        })
    }

    static adminQuerySchema() {
        return joi.object({
            page: joi.number()
                .integer()
                .min(1)
                .default(1),

            limit: joi.number()
                .integer()
                .min(1)
                .max(100)
                .default(10),

            filter: joi.object({
                searchName: joi.string()
                    .optional()
                    .allow('')
            }).optional()
        })
    }
}

module.exports = AdminValidation