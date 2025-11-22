const joi = require('joi')

class ManagerValidation {
    static createSchema() {
        return joi.object({
            fullName: joi.string().trim().min(3).max(150).required().messages({
                'string.min': 'Nama minimal 3 karakter',
                'string.max': 'Nama maksimal 150 karakter',
                'any.required': 'Nama wajib diisi',
            }),
            email: joi.string().email().required().messages({
                'string.email': 'Email harus valid',
                'any.required': 'Email wajib diisi',
            }),
            company: joi.string().trim().min(2).max(150).required().messages({
                'string.min': 'Perusahaan minimal 2 karakter',
                'string.max': 'Perusahaan maksimal 150 karakter',
                'any.required': 'Perusahaan wajib diisi',
            }),
            position: joi.string().trim().min(2).max(150).required().messages({
                'string.min': 'Posisi minimal 2 karakter',
                'string.max': 'Posisi maksimal 150 karakter',
                'any.required': 'Posisi wajib diisi',
            }),
            phoneNumber: joi
                .string()
                .trim()
                .allow(null, '')
                .max(30)
                .messages({
                    'string.max': 'Nomor telepon maksimal 30 karakter',
                }),
            alumniPins: joi
                .array()
                .items(joi.string().trim().required())
                .min(1)
                .required()
                .messages({
                    'array.min': 'Minimal satu PIN alumni diperlukan',
                    'any.required': 'PIN alumni wajib diisi',
                }),
        })
    }
}

module.exports = ManagerValidation
