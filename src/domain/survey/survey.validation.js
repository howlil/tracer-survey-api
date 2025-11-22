const joi = require('joi')

class SurveyValidation {
    static createSchema() {
        const greetingOpeningSchema = joi.object({
            title: joi.string().min(5).max(200).required(),
            greeting: joi.object({
                islamic: joi.string().min(5).max(200).required(),
                general: joi.string().min(5).max(200).required()
            }).required(),
            addressee: joi.string().min(10).max(500).required(),
            introduction: joi.string().min(20).max(2000).required(),
            ikuList: joi.object({
                title: joi.string().min(5).max(200).required(),
                items: joi.array().items(joi.string().min(5).max(200)).min(1).required()
            }).required(),
            purpose: joi.string().min(20).max(2000).required(),
            expectation: joi.string().min(20).max(2000).required(),
            signOff: joi.object({
                department: joi.string().min(5).max(200).required(),
                university: joi.string().min(5).max(200).required()
            }).required()
        })

        const greetingClosingSchema = joi.object({
            title: joi.string().min(5).max(200).required(),
            greeting: joi.object({
                islamic: joi.string().min(5).max(200).required(),
                general: joi.string().min(5).max(200).required()
            }).required(),
            addressee: joi.string().min(10).max(500).required(),
            introduction: joi.string().min(20).max(2000).required(),
            expectation: joi.string().min(20).max(2000).required(),
            signOff: joi.object({
                department: joi.string().min(5).max(200).required(),
                university: joi.string().min(5).max(200).required()
            }).required(),
            contact: joi.object({
                phone: joi.string().max(50).allow('').optional(),
                email: joi.string().email().allow('').optional(),
                website: joi.string().uri().allow('').optional()
            }).optional()
        })

        return joi.object({
            name: joi.string()
                .min(5)
                .max(200)
                .trim()
                .required()
                .messages({
                    'string.min': 'Name minimal 5 karakter',
                    'string.max': 'Name maksimal 200 karakter',
                    'any.required': 'Name wajib diisi'
                }),
            type: joi.string()
                .valid('TRACER_STUDY', 'USER_SURVEY')
                .required()
                .messages({
                    'any.only': 'Type harus TRACER_STUDY atau USER_SURVEY',
                    'any.required': 'Type wajib diisi'
                }),
            description: joi.string()
                .min(10)
                .max(1000)
                .trim()
                .required()
                .messages({
                    'string.min': 'Description minimal 10 karakter',
                    'string.max': 'Description maksimal 1000 karakter',
                    'any.required': 'Description wajib diisi'
                })
        })
    }

    static updateSchema() {
        const greetingOpeningSchema = joi.object({
            title: joi.string().min(5).max(200).optional(),
            greeting: joi.object({
                islamic: joi.string().min(5).max(200).optional(),
                general: joi.string().min(5).max(200).optional()
            }).optional(),
            addressee: joi.string().min(10).max(500).optional(),
            introduction: joi.string().min(20).max(2000).optional(),
            ikuList: joi.object({
                title: joi.string().min(5).max(200).optional(),
                items: joi.array().items(joi.string().min(5).max(200)).optional()
            }).optional(),
            purpose: joi.string().min(20).max(2000).optional(),
            expectation: joi.string().min(20).max(2000).optional(),
            signOff: joi.object({
                department: joi.string().min(5).max(200).optional(),
                university: joi.string().min(5).max(200).optional()
            }).optional()
        })

        const greetingClosingSchema = joi.object({
            title: joi.string().min(5).max(200).optional(),
            greeting: joi.object({
                islamic: joi.string().min(5).max(200).optional(),
                general: joi.string().min(5).max(200).optional()
            }).optional(),
            addressee: joi.string().min(10).max(500).optional(),
            introduction: joi.string().min(20).max(2000).optional(),
            expectation: joi.string().min(20).max(2000).optional(),
            signOff: joi.object({
                department: joi.string().min(5).max(200).optional(),
                university: joi.string().min(5).max(200).optional()
            }).optional(),
            contact: joi.object({
                phone: joi.string().max(50).allow('').optional(),
                email: joi.string().email().allow('').optional(),
                website: joi.string().uri().allow('').optional()
            }).optional()
        })

        return joi.object({
            name: joi.string().min(5).max(200).trim().optional(),
            targetRole: joi.string().valid('ALUMNI', 'MANAGER').optional(),
            status: joi.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED', 'CLOSED').optional(),
            description: joi.string().max(1000).trim().optional(),
            documentUrl: joi.string().uri().allow('').optional(),
            greetingOpening: greetingOpeningSchema.optional(),
            greatingOpening: greetingOpeningSchema.optional(),
            greetingClosing: greetingClosingSchema.optional()
        }).min(1).messages({
            'object.min': 'Minimal satu field harus diisi untuk update'
        })
    }

    static createRuleSchema() {
        return joi.object({
            facultyId: joi.string()
                .uuid()
                .required()
                .messages({
                    'string.guid': 'Faculty ID harus berupa UUID yang valid',
                    'any.required': 'Faculty ID wajib diisi'
                }),
            majorId: joi.string()
                .uuid()
                .allow(null)
                .optional()
                .messages({
                    'string.guid': 'Major ID harus berupa UUID yang valid'
                }),
            degree: joi.string()
                .valid('S1', 'PASCA', 'PROFESI', 'VOKASI')
                .required()
                .messages({
                    'any.only': 'Degree harus salah satu dari: S1, PASCA, PROFESI, VOKASI',
                    'any.required': 'Degree wajib diisi'
                })
        })
    }

    static updateRuleSchema() {
        return joi.object({
            facultyId: joi.string()
                .uuid()
                .optional()
                .messages({
                    'string.guid': 'Faculty ID harus berupa UUID yang valid'
                }),
            majorId: joi.string()
                .uuid()
                .allow(null)
                .optional()
                .messages({
                    'string.guid': 'Major ID harus berupa UUID yang valid'
                }),
            degree: joi.string()
                .valid('S1', 'PASCA', 'PROFESI', 'VOKASI')
                .optional()
                .messages({
                    'any.only': 'Degree harus salah satu dari: S1, PASCA, PROFESI, VOKASI'
                })
        }).min(1).messages({
            'object.min': 'Minimal satu field harus diisi untuk update'
        })
    }

    static createCodeQuestionSchema() {
        const answerOptionSchema = joi.object({
            answerText: joi.string().min(1).max(200).required(),
            sortOrder: joi.number().integer().min(0).required(),
            otherOptionPlaceholder: joi.string().max(200).allow('').optional(),
            isTriggered: joi.boolean().optional()
        })

        const questionSchema = joi.object({
            parentId: joi.string().uuid().allow(null).optional(),
            groupQuestionId: joi.string().uuid().required(),
            questionText: joi.string().min(5).max(500).required(),
            questionType: joi.string().valid('ESSAY', 'LONG_TEST', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'MATRIX_SINGLE_CHOICE', 'COMBO_BOX').required(),
            isRequired: joi.boolean().optional(),
            sortOrder: joi.number().integer().min(0).required(),
            placeholder: joi.string().max(200).allow('').optional(),
            searchplaceholder: joi.string().max(200).allow('').optional(),
            answerQuestion: joi.array().items(answerOptionSchema).optional()
        })

        return joi.object({
            code: joi.string()
                .min(1)
                .max(50)
                .pattern(/^[A-Z0-9_]+$/)
                .required()
                .messages({
                    'string.min': 'Code minimal 1 karakter',
                    'string.max': 'Code maksimal 50 karakter',
                    'string.pattern.base': 'Code harus uppercase dengan angka dan underscore (e.g., Q1, Q2_1)',
                    'any.required': 'Code wajib diisi'
                }),
            questions: joi.array().items(questionSchema).min(1).required()
        })
    }

    static updateQuestionSchema() {
        const answerOptionSchema = joi.object({
            id: joi.string().uuid().optional(),
            answerText: joi.string().min(1).max(200).required(),
            sortOrder: joi.number().integer().min(0).required(),
            otherOptionPlaceholder: joi.string().max(200).allow('').optional(),
            isTriggered: joi.boolean().optional()
        })

        return joi.object({
            questionText: joi.string().min(5).max(500).optional(),
            questionType: joi.string().valid('ESSAY', 'LONG_TEST', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'MATRIX_SINGLE_CHOICE', 'COMBO_BOX').optional(),
            isRequired: joi.boolean().optional(),
            sortOrder: joi.number().integer().min(0).optional(),
            placeholder: joi.string().max(200).allow('').optional(),
            searchplaceholder: joi.string().max(200).allow('').optional(),
            parentId: joi.string().uuid().allow(null).optional(),
            groupQuestionId: joi.string().uuid().optional(),
            answerQuestion: joi.array().items(answerOptionSchema).optional()
        }).min(1).messages({
            'object.min': 'Minimal satu field harus diisi untuk update'
        })
    }

    static reorderQuestionsSchema() {
        return joi.object({
            questionOrders: joi.array()
                .items(joi.object({
                    questionId: joi.string().uuid().required(),
                    sortOrder: joi.number().integer().min(0).required()
                }))
                .min(1)
                .required()
                .messages({
                    'array.min': 'Minimal satu question order harus diisi',
                    'any.required': 'Question orders wajib diisi'
                })
        })
    }

    static saveBuilderSchema() {
        const pageSchema = joi.object({
            id: joi.string().uuid().required(),
            title: joi.string().min(1).max(200).required(),
            description: joi.string().max(500).allow('').optional(),
            codeIds: joi.array().items(joi.string()).min(1).required()
        })

        const answerOptionSchema = joi.object({
            id: joi.string().uuid().optional(),
            answerText: joi.string().min(1).max(200).required(),
            sortOrder: joi.number().integer().min(0).required(),
            otherOptionPlaceholder: joi.string().max(200).allow('').optional(),
            isTriggered: joi.boolean().optional()
        })

        const questionTreeSchema = joi.object({
            answerQuestionTriggerId: joi.string().required(),
            questionPointerToId: joi.string().uuid().required(),
            _tempAnswerText: joi.string().optional(),
            _tempSortOrder: joi.number().integer().optional()
        })

        const questionSchema = joi.object({
            id: joi.string().uuid().optional(),
            codeId: joi.string().required(),
            parentId: joi.string().uuid().allow(null).optional(),
            groupQuestionId: joi.string().uuid().required(),
            questionText: joi.string().min(5).max(500).required(),
            questionType: joi.string().valid('ESSAY', 'LONG_TEST', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'MATRIX_SINGLE_CHOICE', 'COMBO_BOX').required(),
            isRequired: joi.boolean().optional(),
            sortOrder: joi.number().integer().min(0).required(),
            placeholder: joi.string().max(200).allow('').optional(),
            searchplaceholder: joi.string().max(200).allow('').optional(),
            version: joi.string().optional(),
            questionCode: joi.string().optional(),
            answerQuestion: joi.array().items(answerOptionSchema).optional(),
            questionTree: joi.array().items(questionTreeSchema).optional()
        })

        return joi.object({
            pages: joi.array().items(pageSchema).min(1).optional(),
            questions: joi.array().items(questionSchema).min(1).required()
        })
    }
}

module.exports = SurveyValidation

