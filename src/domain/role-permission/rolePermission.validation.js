const joi = require('joi')

class RolePermissionValidation {
    static createSchema() {
        return joi.object({
            roleName: joi.string()
                .min(2)
                .max(100)
                .trim()
                .required()
                .messages({
                    'string.min': 'Role name minimal 2 karakter',
                    'string.max': 'Role name maksimal 100 karakter',
                    'string.empty': 'Role name tidak boleh kosong',
                    'any.required': 'Role name wajib diisi'
                }),

            description: joi.string()
                .min(5)
                .max(500)
                .trim()
                .optional()
                .messages({
                    'string.min': 'Description minimal 5 karakter',
                    'string.max': 'Description maksimal 500 karakter',
                    'string.empty': 'Description tidak boleh kosong'
                }),

            rolePermission: joi.object({
                create: joi.array()
                    .items(
                        joi.object({
                            permissionId: joi.string()
                                .uuid()
                                .required()
                                .messages({
                                    'string.uuid': 'Permission ID harus berupa UUID yang valid',
                                    'any.required': 'Permission ID wajib diisi'
                                })
                        })
                    )
                    .min(1)
                    .required()
                    .messages({
                        'array.min': 'Minimal satu permission harus dipilih',
                        'any.required': 'Role permission wajib diisi'
                    })
            })
                .required()
                .messages({
                    'any.required': 'Role permission wajib diisi'
                })
        })
    }

    static updateSchema() {
        return joi.object({
            roleName: joi.string()
                .min(2)
                .max(100)
                .trim()
                .optional()
                .messages({
                    'string.min': 'Role name minimal 2 karakter',
                    'string.max': 'Role name maksimal 100 karakter',
                    'string.empty': 'Role name tidak boleh kosong'
                }),

            description: joi.string()
                .min(5)
                .max(500)
                .trim()
                .optional()
                .messages({
                    'string.min': 'Description minimal 5 karakter',
                    'string.max': 'Description maksimal 500 karakter',
                    'string.empty': 'Description tidak boleh kosong'
                }),

            rolePermission: joi.object({
                create: joi.array()
                    .items(
                        joi.object({
                            permissionId: joi.string()
                                .uuid()
                                .required()
                                .messages({
                                    'string.uuid': 'Permission ID harus berupa UUID yang valid',
                                    'any.required': 'Permission ID wajib diisi'
                                })
                        })
                    )
                    .min(1)
                    .optional()
                    .messages({
                        'array.min': 'Minimal satu permission harus dipilih'
                    }),

                delete: joi.array()
                    .items(
                        joi.object({
                            permissionId: joi.string()
                                .uuid()
                                .required()
                                .messages({
                                    'string.uuid': 'Permission ID harus berupa UUID yang valid',
                                    'any.required': 'Permission ID wajib diisi'
                                })
                        })
                    )
                    .min(1)
                    .optional()
                    .messages({
                        'array.min': 'Minimal satu permission harus dipilih'
                    })
            })
                .optional()
        })
            .min(1)
            .messages({
                'object.min': 'Minimal satu field harus diisi untuk update'
            })

    }

}

module.exports = RolePermissionValidation