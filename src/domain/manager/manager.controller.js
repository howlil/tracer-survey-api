const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")
const ErrorHttp = require("../../shared/http/error.http")
const { bufferToJson, rowsToExcel } = require("../../shared/utils/excel.util")
const prisma = require("../../shared/configs/prisma.config")

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
            // Get companies and positions from database
            const [companiesData, positionsData] = await Promise.all([
                this.managerService.getCompanies(),
                this.managerService.getPositions()
            ])

            // Format data untuk dropdown - extract company and position strings
            const companies = companiesData
                .map(c => typeof c === 'string' ? c : c.company)
                .filter(Boolean)
                .sort()
            
            const positions = positionsData
                .map(p => typeof p === 'string' ? p : p.position)
                .filter(Boolean)
                .sort()

            const headers = [
                'full_name',
                'email',
                'company',
                'position',
                'phone_number',
                'alumni_pins',
            ]

            this.logger.info(`Creating Excel template with ${companies.length} companies and ${positions.length} positions`)
            
            const excelBuffer = await rowsToExcel(headers, [
                {
                    full_name: 'Nama Manager',
                    email: 'manager@example.com',
                    company: '',
                    position: '',
                    phone_number: '08123456789',
                    alumni_pins: 'PIN123|PIN456',
                },
            ], {
                companies: companies,
                positions: positions
            })

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader('Content-Disposition', 'attachment; filename="template-import-manager.xlsx"')
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

            const rows = bufferToJson(req.file.buffer)
            const result = await this.managerService.importManagers(rows, { req })
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async generateFromTracerStudy(req, res, next) {
        try {
            const result = await this.managerService.generateManagersFromTracerStudy({ req })
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async findById(req, res, next) {
        try {
            // Log all possible sources of the ID
            this.logger.info('[findById] Request received')
            this.logger.info('[findById] req.params:', JSON.stringify(req.params))
            this.logger.info('[findById] req.validatedParams:', JSON.stringify(req.validatedParams))
            this.logger.info('[findById] req.url:', req.url)
            this.logger.info('[findById] req.path:', req.path)
            this.logger.info('[findById] req.originalUrl:', req.originalUrl)
            
            // Try multiple ways to get the ID
            const id = req.params?.id || req.validatedParams?.id || req.extract?.getParams?.(['id'])?.id
            
            this.logger.info('[findById] Extracted ID:', id)
            
            if (!id) {
                this.logger.error('[findById] ID not found in request')
                throw new ErrorHttp(400, 'ID manager tidak ditemukan')
            }

            // Basic UUID format validation
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(id)) {
                this.logger.error('[findById] Invalid UUID format:', id)
                throw new ErrorHttp(400, 'ID manager harus berupa UUID yang valid')
            }

            this.logger.info('[findById] Calling service with ID:', id)
            const result = await this.managerService.getById(id, { req })
            this.logger.info('[findById] Service returned result')
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error('[findById] Error:', error)
            this.logger.error('[findById] Error message:', error.message)
            this.logger.error('[findById] Error stack:', error.stack)
            next(error)
        }
    }
}

module.exports = ManagerController