const joi = require('joi')

const graduatePeriods = [
    'WISUDA_I',
    'WISUDA_II',
    'WISUDA_III',
    'WISUDA_IV',
    'WISUDA_V',
    'WISUDA_VI',
]

const degreeValues = ['S1', 'S2', 'S3', 'D3', 'PASCA', 'VOKASI', 'PROFESI']

class AlumniValidation {
    static createSchema() {
        return joi.object({
            nim: joi.string().trim().required().messages({
                'any.required': 'NIM wajib diisi',
            }),
            fullName: joi.string().trim().min(3).max(150).required().messages({
                'string.min': 'Nama minimal 3 karakter',
                'string.max': 'Nama maksimal 150 karakter',
                'any.required': 'Nama wajib diisi',
            }),
            email: joi.string().email().required().messages({
                'string.email': 'Email harus valid',
                'any.required': 'Email wajib diisi',
            }),
            facultyId: joi.string().trim().required().messages({
                'any.required': 'Fakultas wajib diisi',
            }),
            majorId: joi.string().trim().required().messages({
                'any.required': 'Program studi wajib diisi',
            }),
            degree: joi
                .string()
                .valid(...degreeValues)
                .required()
                .messages({
                    'any.only': 'Jenjang tidak valid',
                    'any.required': 'Jenjang wajib diisi',
                }),
            graduatedYear: joi
                .number()
                .integer()
                .min(1900)
                .max(2100)
                .required()
                .messages({
                    'number.base': 'Tahun lulus tidak valid',
                    'any.required': 'Tahun lulus wajib diisi',
                }),
            graduatePeriode: joi
                .string()
                .valid(...graduatePeriods)
                .required()
                .messages({
                    'any.only': 'Periode wisuda tidak valid',
                    'any.required': 'Periode wisuda wajib diisi',
                }),
        })
    }

    static updateSchema() {
        return joi.object({
            nim: joi.string().trim().optional().messages({
                'string.base': 'NIM harus berupa string',
            }),
            fullName: joi.string().trim().min(3).max(150).optional().messages({
                'string.min': 'Nama minimal 3 karakter',
                'string.max': 'Nama maksimal 150 karakter',
            }),
            email: joi.string().email().optional().messages({
                'string.email': 'Email harus valid',
            }),
            facultyId: joi.string().trim().optional().messages({
                'string.base': 'Fakultas harus berupa string',
            }),
            majorId: joi.string().trim().optional().messages({
                'string.base': 'Program studi harus berupa string',
            }),
            degree: joi
                .string()
                .valid(...degreeValues)
                .optional()
                .messages({
                    'any.only': 'Jenjang tidak valid',
                }),
            graduatedYear: joi
                .number()
                .integer()
                .min(1900)
                .max(2100)
                .optional()
                .messages({
                    'number.base': 'Tahun lulus tidak valid',
                    'number.min': 'Tahun lulus minimal 1900',
                    'number.max': 'Tahun lulus maksimal 2100',
                }),
            graduatePeriode: joi
                .string()
                .valid(...graduatePeriods)
                .optional()
                .messages({
                    'any.only': 'Periode wisuda tidak valid',
                }),
        }).min(1).messages({
            'object.min': 'Minimal satu field harus diisi untuk update'
        })
    }
}

module.exports = AlumniValidation