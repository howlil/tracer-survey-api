const joi = require('joi')

const validResources = ['admin', 'role', 'survey', 'question', 'respondent', 'email', 'response', 'faculty', 'major', 'faq']
const validActions = {
    admin: ['create', 'read', 'update', 'delete'],
    role: ['create', 'read', 'update', 'delete'],
    survey: ['create', 'read', 'update', 'delete', 'publish', 'archive'],
    question: ['create', 'read', 'update', 'delete'],
    respondent: ['create', 'read', 'update', 'delete', 'import'],
    email: ['create', 'read', 'update', 'delete', 'send'],
    response: ['read', 'export', 'delete'],
    faculty: ['manage'],
    major: ['manage'],
    faq: ['manage']
}

class RolePermissionValidation {
    static createSchema() {
        return joi.object({
            name: joi.string()
                .min(2)
                .max(100)
                .trim()
                .required()
                .messages({
                    'string.min': 'Nama role minimal 2 karakter',
                    'string.max': 'Nama role maksimal 100 karakter',
                    'string.empty': 'Nama role tidak boleh kosong',
                    'any.required': 'Nama role wajib diisi'
                }),

            description: joi.string()
                .max(500)
                .trim()
                .optional()
                .allow('')
                .messages({
                    'string.max': 'Description maksimal 500 karakter'
                }),

            permissions: joi.array()
                .items(
                    joi.object({
                        resource: joi.string()
                            .valid(...validResources)
                            .required()
                            .messages({
                                'any.only': 'Resource tidak valid',
                                'any.required': 'Resource wajib diisi'
                            }),
                        actions: joi.array()
                            .items(joi.string())
                            .min(1)
                            .required()
                            .messages({
                                'array.min': 'Minimal satu action harus dipilih',
                                'any.required': 'Actions wajib diisi'
                            })
                    }).custom((value, helpers) => {
                        const { resource, actions } = value
                        const validActionsForResource = validActions[resource] || []
                        const invalidActions = actions.filter(action => !validActionsForResource.includes(action))
                        
                        if (invalidActions.length > 0) {
                            return helpers.error('any.invalid', {
                                message: `Action tidak valid untuk resource ${resource}. Actions yang valid: ${validActionsForResource.join(', ')}`
                            })
                        }
                        return value
                    })
                )
                .min(1)
                .required()
                .messages({
                    'array.min': 'Minimal satu permission harus dipilih',
                    'any.required': 'Permissions wajib diisi'
                })
        })
    }

    static updateSchema() {
        return joi.object({
            name: joi.string()
                .min(2)
                .max(100)
                .trim()
                .optional()
                .messages({
                    'string.min': 'Nama role minimal 2 karakter',
                    'string.max': 'Nama role maksimal 100 karakter',
                    'string.empty': 'Nama role tidak boleh kosong'
                }),

            description: joi.string()
                .max(500)
                .trim()
                .optional()
                .allow('')
                .messages({
                    'string.max': 'Description maksimal 500 karakter'
                }),

            permissions: joi.array()
                .items(
                    joi.object({
                        resource: joi.string()
                            .valid(...validResources)
                            .required()
                            .messages({
                                'any.only': 'Resource tidak valid',
                                'any.required': 'Resource wajib diisi'
                            }),
                        actions: joi.array()
                            .items(joi.string())
                            .min(1)
                            .required()
                            .messages({
                                'array.min': 'Minimal satu action harus dipilih',
                                'any.required': 'Actions wajib diisi'
                            })
                    }).custom((value, helpers) => {
                        const { resource, actions } = value
                        const validActionsForResource = validActions[resource] || []
                        const invalidActions = actions.filter(action => !validActionsForResource.includes(action))
                        
                        if (invalidActions.length > 0) {
                            return helpers.error('any.invalid', {
                                message: `Action tidak valid untuk resource ${resource}. Actions yang valid: ${validActionsForResource.join(', ')}`
                            })
                        }
                        return value
                    })
                )
                .min(1)
                .optional()
                .messages({
                    'array.min': 'Minimal satu permission harus dipilih'
                })
        })
            .min(1)
            .messages({
                'object.min': 'Minimal satu field harus diisi untuk update'
            })
    }
}

module.exports = RolePermissionValidation