const joi = require('joi')

class EmailValidation {
    static createTemplateSchema() {
        return joi.object({
            code: joi.string()
                .min(3)
                .max(50)
                .pattern(/^[A-Z_]+$/)
                .required()
                .messages({
                    'string.min': 'Code minimal 3 karakter',
                    'string.max': 'Code maksimal 50 karakter',
                    'string.pattern.base': 'Code harus uppercase dengan underscore (e.g., WELCOME_EMAIL)',
                    'any.required': 'Code wajib diisi'
                }),
            
            templateName: joi.string()
                .min(2)
                .max(100)
                .trim()
                .required()
                .messages({
                    'string.min': 'Template name minimal 2 karakter',
                    'string.max': 'Template name maksimal 100 karakter',
                    'any.required': 'Template name wajib diisi'
                }),
            
            subject: joi.string()
                .min(5)
                .max(200)
                .trim()
                .required()
                .messages({
                    'string.min': 'Subject minimal 5 karakter',
                    'string.max': 'Subject maksimal 200 karakter',
                    'any.required': 'Subject wajib diisi'
                }),
            
            bodyText: joi.string()
                .min(10)
                .required()
                .messages({
                    'string.min': 'Body text minimal 10 karakter',
                    'any.required': 'Body text wajib diisi'
                }),
            
            bodyHtml: joi.string()
                .min(10)
                .required()
                .messages({
                    'string.min': 'Body HTML minimal 10 karakter',
                    'any.required': 'Body HTML wajib diisi'
                })
        })
    }

    static updateTemplateSchema() {
        return joi.object({
            code: joi.string()
                .min(3)
                .max(50)
                .pattern(/^[A-Z_]+$/)
                .optional()
                .messages({
                    'string.min': 'Code minimal 3 karakter',
                    'string.max': 'Code maksimal 50 karakter',
                    'string.pattern.base': 'Code harus uppercase dengan underscore (e.g., WELCOME_EMAIL)'
                }),
            
            templateName: joi.string()
                .min(2)
                .max(100)
                .trim()
                .optional()
                .messages({
                    'string.min': 'Template name minimal 2 karakter',
                    'string.max': 'Template name maksimal 100 karakter'
                }),
            
            subject: joi.string()
                .min(5)
                .max(200)
                .trim()
                .optional()
                .messages({
                    'string.min': 'Subject minimal 5 karakter',
                    'string.max': 'Subject maksimal 200 karakter'
                }),
            
            bodyText: joi.string()
                .min(10)
                .optional()
                .messages({
                    'string.min': 'Body text minimal 10 karakter'
                }),
            
            bodyHtml: joi.string()
                .min(10)
                .optional()
                .messages({
                    'string.min': 'Body HTML minimal 10 karakter'
                })
        }).min(1).messages({
            'object.min': 'Minimal satu field harus diisi untuk update'
        })
    }

    static createBlastEmailSchema() {
        const currentYear = new Date().getFullYear()
        return joi.object({
            surveyId: joi.string()
                .uuid()
                .required()
                .messages({
                    'string.guid': 'Survey ID harus berupa UUID yang valid',
                    'any.required': 'Survey ID wajib diisi'
                }),
            
            emailTemplateId: joi.string()
                .uuid()
                .required()
                .messages({
                    'string.guid': 'Email Template ID harus berupa UUID yang valid',
                    'any.required': 'Email Template ID wajib diisi'
                }),
            
            emailType: joi.string()
                .valid('INVITATION', 'REMINDER', 'CUSTOM')
                .required()
                .messages({
                    'any.only': 'Email type harus salah satu dari: INVITATION, REMINDER, CUSTOM',
                    'any.required': 'Email type wajib diisi'
                }),
            
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
            
            dateToSend: joi.date()
                .iso()
                .greater('now')
                .required()
                .messages({
                    'date.base': 'Date to send harus berupa tanggal yang valid (ISO 8601)',
                    'date.greater': 'Date to send harus di masa depan',
                    'any.required': 'Date to send wajib diisi'
                }),
            
            recipientType: joi.string()
                .valid('ALUMNI', 'MANAGER', 'ALL', 'CUSTOM')
                .required()
                .messages({
                    'any.only': 'Recipient type harus salah satu dari: ALUMNI, MANAGER, ALL, CUSTOM',
                    'any.required': 'Recipient type wajib diisi'
                }),
            
            recipientFilters: joi.object({
                facultyId: joi.string()
                    .uuid()
                    .allow(null)
                    .optional(),
                majorId: joi.string()
                    .uuid()
                    .allow(null)
                    .optional(),
                graduatedYear: joi.number()
                    .integer()
                    .min(2000)
                    .max(currentYear)
                    .allow(null)
                    .optional(),
                graduatePeriode: joi.string()
                    .valid('WISUDA_I', 'WISUDA_II', 'WISUDA_III', 'WISUDA_IV', 'WISUDA_V', 'WISUDA_VI')
                    .allow(null)
                    .optional(),
                customRecipients: joi.array()
                    .items(joi.string().email())
                    .allow(null)
                    .optional()
            }).optional(),
            
            message: joi.string()
                .max(1000)
                .allow('')
                .optional()
                .messages({
                    'string.max': 'Message maksimal 1000 karakter'
                })
        })
    }

    static updateBlastEmailSchema() {
        const currentYear = new Date().getFullYear()
        return joi.object({
            emailTemplateId: joi.string()
                .uuid()
                .optional()
                .messages({
                    'string.guid': 'Email Template ID harus berupa UUID yang valid'
                }),
            
            emailType: joi.string()
                .valid('INVITATION', 'REMINDER', 'CUSTOM')
                .optional()
                .messages({
                    'any.only': 'Email type harus salah satu dari: INVITATION, REMINDER, CUSTOM'
                }),
            
            title: joi.string()
                .min(5)
                .max(200)
                .trim()
                .optional()
                .messages({
                    'string.min': 'Title minimal 5 karakter',
                    'string.max': 'Title maksimal 200 karakter'
                }),
            
            dateToSend: joi.date()
                .iso()
                .greater('now')
                .optional()
                .messages({
                    'date.base': 'Date to send harus berupa tanggal yang valid (ISO 8601)',
                    'date.greater': 'Date to send harus di masa depan'
                }),
            
            recipientType: joi.string()
                .valid('ALUMNI', 'MANAGER', 'ALL', 'CUSTOM')
                .optional()
                .messages({
                    'any.only': 'Recipient type harus salah satu dari: ALUMNI, MANAGER, ALL, CUSTOM'
                }),
            
            recipientFilters: joi.object({
                facultyId: joi.string()
                    .uuid()
                    .allow(null)
                    .optional(),
                majorId: joi.string()
                    .uuid()
                    .allow(null)
                    .optional(),
                graduatedYear: joi.number()
                    .integer()
                    .min(2000)
                    .max(currentYear)
                    .allow(null)
                    .optional(),
                graduatePeriode: joi.string()
                    .valid('WISUDA_I', 'WISUDA_II', 'WISUDA_III', 'WISUDA_IV', 'WISUDA_V', 'WISUDA_VI')
                    .allow(null)
                    .optional(),
                customRecipients: joi.array()
                    .items(joi.string().email())
                    .allow(null)
                    .optional()
            }).optional(),
            
            message: joi.string()
                .max(1000)
                .allow('')
                .optional()
                .messages({
                    'string.max': 'Message maksimal 1000 karakter'
                })
        }).min(1).messages({
            'object.min': 'Minimal satu field harus diisi untuk update'
        })
    }

    static previewCountSchema() {
        const currentYear = new Date().getFullYear()
        return joi.object({
            recipientType: joi.string()
                .valid('ALUMNI', 'MANAGER', 'ALL', 'CUSTOM')
                .required()
                .messages({
                    'any.only': 'Recipient type harus salah satu dari: ALUMNI, MANAGER, ALL, CUSTOM',
                    'any.required': 'Recipient type wajib diisi'
                }),
            
            recipientFilters: joi.object({
                facultyId: joi.string()
                    .uuid()
                    .allow(null)
                    .optional(),
                majorId: joi.string()
                    .uuid()
                    .allow(null)
                    .optional(),
                graduatedYear: joi.number()
                    .integer()
                    .min(2000)
                    .max(currentYear)
                    .allow(null)
                    .optional(),
                graduatePeriode: joi.string()
                    .valid('WISUDA_I', 'WISUDA_II', 'WISUDA_III', 'WISUDA_IV', 'WISUDA_V', 'WISUDA_VI')
                    .allow(null)
                    .optional(),
                customRecipients: joi.array()
                    .items(joi.string().email())
                    .allow(null)
                    .optional()
            }).optional()
        })
    }
}

module.exports = EmailValidation

