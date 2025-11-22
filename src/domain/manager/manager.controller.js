const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")
const ErrorHttp = require("../../shared/http/error.http")
const { bufferToJson, rowsToCsv } = require("../../shared/utils/excel.util")

class ManagerController extends BaseController {
    constructor(managerService, logger) {
        super(managerService, logger)
        this.managerService = managerService
        this.logger = logger
    }

    async findMany(req, res, next) {
        try {
            const { page, limit, search, company, position } = req.extract.getQuery([
                "page", "limit", "search", "company", "position"
            ])

            const result = await this.managerService.findMany({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search,
                company,
                position
            }, { req })

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async getCompanies(req, res, next) {
        try {
            const result = await this.managerService.getCompanies()
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async getPositions(req, res, next) {
        try {
            const result = await this.managerService.getPositions()
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

            const result = await this.managerService.createManager(data, { req })
            return ResponseFactory.created(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async downloadTemplate(req, res, next) {
        try {
            const headers = [
                'full_name',
                'email',
                'company',
                'position',
                'phone_number',
                'alumni_pins',
            ]
            const csv = rowsToCsv(headers, [
                {
                    full_name: 'Nama Manager',
                    email: 'manager@example.com',
                    company: 'Nama Perusahaan',
                    position: 'HR Manager',
                    phone_number: '08123456789',
                    alumni_pins: 'PIN123|PIN456',
                },
            ])

            res.setHeader('Content-Type', 'text/csv')
            res.setHeader('Content-Disposition', 'attachment; filename="template-import-manager.csv"')
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
            const result = await this.managerService.importManagers(rows, { req })
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }
}

module.exports = ManagerController