const BaseService = require("../../shared/base/base.service")
const ErrorHttp = require("../../shared/http/error.http")
const { assertFacultyAccess, getAccessibleFacultyIds } = require("../../shared/utils/faculty-access.util")

class ManagerService extends BaseService {
    constructor(managerRepository, logger) {
        super(managerRepository, logger)
        this.managerRepository = managerRepository
    }

    async findMany(options = {}, context = {}) {
        try {
            const { page = 1, limit = 10, search, company, position } = options
            const accessibleFacultyIds = getAccessibleFacultyIds(context.req || {})

            const result = await this.managerRepository.findManyWithPagination({
                page,
                limit,
                search,
                company,
                position,
                accessibleFacultyIds
            })

            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getCompanies() {
        try {
            return await this.managerRepository.getUniqueCompanies()
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getPositions() {
        try {
            return await this.managerRepository.getUniquePositions()
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getById(managerId, context = {}) {
        try {
            this.logger.info('[getById] Called with managerId:', managerId)
            this.logger.info('[getById] managerId type:', typeof managerId)
            
            const manager = await this.managerRepository.findByIdWithAlumni(managerId)
            
            this.logger.info('[getById] Repository returned:', manager ? 'Found' : 'Not found')
            
            if (!manager) {
                throw new ErrorHttp(404, 'Manager tidak ditemukan')
            }

            return manager
        } catch (error) {
            this.logger.error('[getById] Error:', error)
            this.logger.error('[getById] Error message:', error.message)
            this.logger.error('[getById] Error stack:', error.stack)
            throw error
        }
    }

    async createManager(payload, context) {
        try {
            const {
                fullName,
                email,
                company,
                position,
                phoneNumber,
                alumniPins = [],
            } = payload

            if (!Array.isArray(alumniPins) || alumniPins.length === 0) {
                throw new ErrorHttp(400, 'Minimal satu PIN alumni diperlukan')
            }

            const normalizedPins = alumniPins.map((pin) => String(pin).trim()).filter(Boolean)
            const uniquePins = Array.from(new Set(normalizedPins))
            if (uniquePins.length === 0) {
                throw new ErrorHttp(400, 'PIN alumni tidak valid')
            }

            // Validate that PINs exist and are alumni PINs
            const pinRecords = await this.managerRepository.findPinsWithAlumni(uniquePins)
            if (pinRecords.length !== uniquePins.length) {
                throw new ErrorHttp(400, 'Beberapa PIN alumni tidak ditemukan')
            }

            // Check if PINs are valid alumni PINs (pinType = 'ALUMNI')
            const invalidPins = pinRecords.filter((record) => record.pinType !== 'ALUMNI')
            if (invalidPins.length > 0) {
                throw new ErrorHttp(400, `Beberapa PIN bukan PIN alumni: ${invalidPins.map(p => p.pin).join(', ')}`)
            }

            // Note: We no longer check if PIN is already used by manager
            // because we will generate new PINs for manager (user survey)

            for (const record of pinRecords) {
                const facultyId = record.alumni?.major?.facultyId
                assertFacultyAccess(context.req, facultyId, 'alumni')
            }

            const result = await this.managerRepository.createManagerWithPins({
                fullName,
                email,
                company,
                position,
                phoneNumber,
                pins: uniquePins,
            })

            return {
                manager: result,
                generatedPins: result.generatedPins || [], // PIN baru yang di-generate untuk user survey
                alumniPins: pinRecords.map((record) => ({
                    pin: record.pin,
                    alumniId: record.alumniId,
                    alumniName: record.alumni?.respondent?.fullName,
                })),
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async importManagers(rows = [], context) {
        const summary = {
            total: rows.length,
            success: 0,
            failed: 0,
            errors: [],
        }

        for (const [index, row] of rows.entries()) {
            try {
                const pinsRaw =
                    row.alumni_pins ||
                    row.alumniPins ||
                    row.pins ||
                    ''

                const pins = String(pinsRaw)
                    .split(/[|,;\n]/)
                    .map((pin) => pin.trim())
                    .filter(Boolean)

                if (pins.length === 0) {
                    throw new Error('Kolom PIN alumni wajib diisi')
                }

                const payload = {
                    fullName: String(row.full_name || row.fullName || '').trim(),
                    email: String(row.email || '').trim(),
                    company: String(row.company || '').trim(),
                    position: String(row.position || '').trim(),
                    phoneNumber: String(row.phone_number || row.phoneNumber || '').trim(),
                    alumniPins: pins,
                }

                if (!payload.fullName) throw new Error('Nama manager kosong')
                if (!payload.email) throw new Error('Email manager kosong')

                await this.createManager(payload, context)
                summary.success += 1
            } catch (error) {
                summary.failed += 1
                summary.errors.push({
                    row: index + 2,
                    message: error.message || 'Gagal memproses data manager',
                })
            }
        }

        return summary
    }

    /**
     * Generate managers from tracer study responses
     * Criteria:
     * - Status bekerja = "sudah bekerja"
     * - Completion = 100%
     * - Belum punya manager record
     */
    async generateManagersFromTracerStudy(context) {
        try {
            const eligibleResponses = await this.managerRepository.getEligibleResponsesForManager()

            const summary = {
                total: eligibleResponses.length,
                success: 0,
                failed: 0,
                errors: [],
            }

            for (const response of eligibleResponses) {
                try {
                    // Extract manager data from response
                    const managerData = await this.managerRepository.extractManagerDataFromResponse(response.id)

                    if (!managerData) {
                        throw new Error('Gagal mengekstrak data manager dari response')
                    }

                    if (!managerData.company || !managerData.position) {
                        throw new Error('Data perusahaan atau posisi tidak lengkap')
                    }

                    if (!managerData.managerName || !managerData.managerEmail) {
                        throw new Error('Data nama dan email atasan/manager tidak lengkap')
                    }

                    // Create manager
                    await this.managerRepository.createManagerFromResponse(response, managerData)
                    summary.success += 1
                } catch (error) {
                    summary.failed += 1
                    summary.errors.push({
                        responseId: response.id,
                        respondentName: response.respondent.fullName,
                        message: error.message || 'Gagal memproses response',
                    })
                }
            }

            return summary
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = ManagerService