const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")
const ErrorHttp = require("../../shared/http/error.http")
const { bufferToJson, rowsToExcel } = require("../../shared/utils/excel.util")
const prisma = require("../../shared/configs/prisma.config")

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
            // Get faculties and majors from database
            const [faculties, majors] = await Promise.all([
                prisma.faculty.findMany({
                    select: {
                        id: true,
                        facultyName: true,
                    },
                    orderBy: { facultyName: 'asc' }
                }),
                prisma.major.findMany({
                    include: {
                        faculty: {
                            select: {
                                id: true,
                                facultyName: true,
                            }
                        }
                    },
                    orderBy: { majorName: 'asc' }
                })
            ])

            // Format data untuk dropdown
            const formattedFaculties = faculties.map(f => ({
                id: f.id,
                name: f.facultyName
            }))

            const formattedMajors = majors.map(m => ({
                id: m.id,
                name: m.majorName,
                faculty: {
                    id: m.faculty.id,
                    name: m.faculty.facultyName
                }
            }))

            const headers = [
                'nim',
                'full_name',
                'email',
                'faculty_name',
                'major_name',
                'degree',
                'graduated_year',
                'graduate_periode',
            ]

            // Define graduate periods
            const graduatePeriods = [
                'WISUDA_I',
                'WISUDA_II',
                'WISUDA_III',
                'WISUDA_IV',
                'WISUDA_V',
                'WISUDA_VI',
            ]
            
            this.logger.info(`Creating Excel template with ${formattedFaculties.length} faculties and ${formattedMajors.length} majors`)
            
            const excelBuffer = await rowsToExcel(headers, [
                {
                    nim: '2018123456',
                    full_name: 'Nama Alumni',
                    email: 'alumni@example.com',
                    faculty_name: '',
                    major_name: '',
                    degree: 'S1',
                    graduated_year: '2024',
                    graduate_periode: '',
                },
            ], {
                faculties: formattedFaculties,
                majors: formattedMajors,
                graduatePeriods: graduatePeriods
            })

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader('Content-Disposition', 'attachment; filename="template-import-alumni.xlsx"')
            return res.status(200).send(excelBuffer)
        } catch (error) {
            this.logger.error('Error creating Excel template:', error)
            this.logger.error('Error stack:', error.stack)
            next(error)
        }
    }

    async importExcel(req, res, next) {
        try {
            if (!req.file) {
                throw new ErrorHttp(400, 'File tidak ditemukan')
            }

            this.logger.info(`Importing Excel file: ${req.file.originalname}, size: ${req.file.size} bytes`)
            const rows = bufferToJson(req.file.buffer)
            this.logger.info(`Parsed ${rows.length} rows from Excel file`)
            
            if (rows.length === 0) {
                throw new ErrorHttp(400, 'Tidak ada data yang ditemukan di file Excel. Pastikan data diisi di sheet "Template" dan bukan baris contoh.')
            }
            
            const result = await this.alumniService.importAlumni(rows, { req })
            this.logger.info(`Import result: ${result.success} success, ${result.failed} failed out of ${result.total} total`)
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error('Error importing Excel:', error)
            next(error)
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            const data = req.validatedBody
                ? req.validatedBody
                : req.extract?.getBody?.()

            const result = await this.alumniService.updateAlumni(id, data, { req })
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error('Error in update controller:', error)
            next(error)
        }
    }

    async getCurrentProfile(req, res, next) {
        try {
            const respondentId = req.userId // Get from authenticated user (set by PermissionMiddleware.authenticate)

            if (!respondentId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    error: { message: "User tidak terautentikasi" }
                })
            }

            const result = await this.alumniService.getCurrentAlumniProfile(respondentId)
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error('Error in getCurrentProfile controller:', error)
            next(error)
        }
    }
}

module.exports = AlumniController