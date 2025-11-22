const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")
const ErrorHttp = require("../../shared/http/error.http")
const { bufferToJson, rowsToCsv } = require("../../shared/utils/excel.util")

class AlumniController extends BaseController {
    constructor(alumniService, logger) {
        super(alumniService, logger)
        this.alumniService = alumniService
        this.logger = logger
    }

    async findMany(req, res, next) {
        try {
            const { page, limit, search, facultyId, majorId, degree, graduatedYear, graduatePeriode } = req.extract.getQuery([
                "page", "limit", "search", "facultyId", "majorId", "degree", "graduatedYear", "graduatePeriode"
            ])

            const result = await this.alumniService.findMany({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search,
                facultyId,
                majorId,
                degree,
                graduatedYear: graduatedYear ? parseInt(graduatedYear) : undefined,
                graduatePeriode
            }, { req })

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async createManual(req, res, next) {
        try {
            const data = req.validatedBody
                ? req.validatedBody
                : req.extract?.getBody?.()

            const result = await this.alumniService.createAlumni(data, { req })
            return ResponseFactory.created(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async downloadTemplate(req, res, next) {
        try {
            const headers = [
                'nim',
                'full_name',
                'email',
                'faculty_id',
                'major_id',
                'degree',
                'graduated_year',
                'graduate_periode',
            ]
            const csv = rowsToCsv(headers, [
                {
                    nim: '2018123456',
                    full_name: 'Nama Alumni',
                    email: 'alumni@example.com',
                    faculty_id: 'uuid-fakultas',
                    major_id: 'uuid-prodi',
                    degree: 'S1',
                    graduated_year: '2024',
                    graduate_periode: 'WISUDA_I',
                },
            ])

            res.setHeader('Content-Type', 'text/csv')
            res.setHeader('Content-Disposition', 'attachment; filename="template-import-alumni.csv"')
            return res.status(200).send(csv)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async importExcel(req, res, next) {
        try {
            if (!req.file) {
                throw new ErrorHttp(400, 'File tidak ditemukan')
            }

            const rows = bufferToJson(req.file.buffer)
            const result = await this.alumniService.importAlumni(rows, { req })
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }
}

module.exports = AlumniController