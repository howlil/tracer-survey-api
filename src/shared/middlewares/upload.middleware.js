const multer = require('multer')
const ErrorHttp = require('../http/error.http')

const storage = multer.memoryStorage()

const allowedMimeTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new ErrorHttp(400, 'Format file tidak didukung. Gunakan CSV atau Excel'))
        }
    },
})

module.exports = upload

