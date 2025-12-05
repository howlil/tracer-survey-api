const joi = require('joi')

class ResponseValidation {
    static submitResponseSchema() {
        return joi.object({
            surveyId: joi.string().uuid().required()
                .messages({
                    'string.guid': 'Survey ID harus berupa UUID yang valid',
                    'any.required': 'Survey ID wajib diisi'
                }),
            answers: joi.array().items(
                joi.object({
                    questionId: joi.string().uuid().required()
                        .messages({
                            'string.guid': 'Question ID harus berupa UUID yang valid',
                            'any.required': 'Question ID wajib diisi'
                        }),
                    answerText: joi.string().allow('').optional(),
                    answerOptionIds: joi.array().items(joi.string().uuid()).optional()
                })
            ).min(1).required()
                .messages({
                    'array.min': 'Minimal harus ada satu jawaban',
                    'any.required': 'Answers wajib diisi'
                })
        })
    }

    static saveDraftSchema() {
        return joi.object({
            surveyId: joi.string().uuid().required()
                .messages({
                    'string.guid': 'Survey ID harus berupa UUID yang valid',
                    'any.required': 'Survey ID wajib diisi'
                }),
            answers: joi.array().items(
                joi.object({
                    questionId: joi.string().uuid().required()
                        .messages({
                            'string.guid': 'Question ID harus berupa UUID yang valid',
                            'any.required': 'Question ID wajib diisi'
                        }),
                    answerText: joi.string().allow('', null).optional(),
                    answerOptionIds: joi.array().items(joi.string().uuid()).allow(null).optional()
                })
            ).allow(null).optional().default([]).min(0)
                .messages({
                    'array.base': 'Answers harus berupa array'
                })
        })
    }
}

module.exports = ResponseValidation

