const BaseService = require("../../shared/base/base.service")
const ErrorHttp = require("../../shared/http/error.http")
const { normalizeDegree } = require("../../shared/utils/degree.util")
const { getAccessibleFacultyIds, assertFacultyAccess } = require("../../shared/utils/faculty-access.util")

class AlumniService extends BaseService {
    constructor(alumniRepository, logger) {
        super(alumniRepository, logger)
        this.alumniRepository = alumniRepository
    }

    async findMany(options = {}, context = {}) {
        try {
            const { page = 1, limit = 10, search, facultyId, majorId, degree, graduatedYear, graduatePeriode } = options
            const accessibleFacultyIds = getAccessibleFacultyIds(context.req || {})

            const result = await this.alumniRepository.findManyWithPagination({
                page,
                limit,
                search,
                facultyId,
                majorId,
                degree,
                graduatedYear,
                graduatePeriode,
                accessibleFacultyIds
            })

            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async createAlumni(payload, context) {
        try {
            const {
                nim,
                fullName,
                email,
                facultyId,
                majorId,
                degree,
                graduatedYear,
                graduatePeriode,
            } = payload

            const normalizedDegree = normalizeDegree(degree)
            if (!normalizedDegree) {
                throw new ErrorHttp(400, 'Jenjang tidak dikenal')
            }

            const major = await this.alumniRepository.findMajorWithFaculty(majorId)
            if (!major) {
                throw new ErrorHttp(404, 'Program studi tidak ditemukan')
            }

            if (major.facultyId !== facultyId) {
                throw new ErrorHttp(400, 'Program studi tidak sesuai dengan fakultas yang dipilih')
            }

            assertFacultyAccess(context.req, major.facultyId, 'alumni')

            const alumni = await this.alumniRepository.createAlumniWithRespondent({
                nim,
                fullName,
                email,
                majorId,
                degree: normalizedDegree,
                graduatedYear,
                graduatePeriode,
            })

            return alumni
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async importAlumni(rows = [], context) {
        const allowedFacultyIds = getAccessibleFacultyIds(context.req)
        const summary = {
            total: rows.length,
            success: 0,
            failed: 0,
            errors: [],
        }

        for (const [index, row] of rows.entries()) {
            try {
                const payload = {
                    nim: String(row.nim || row.NIM || '').trim(),
                    fullName: String(row.full_name || row.fullName || '').trim(),
                    email: String(row.email || '').trim(),
                    facultyId: String(row.faculty_id || row.facultyId || '').trim(),
                    majorId: String(row.major_id || row.majorId || '').trim(),
                    degree: String(row.degree || '').trim(),
                    graduatedYear: parseInt(row.graduated_year || row.graduatedYear, 10),
                    graduatePeriode: String(row.graduate_periode || row.graduatePeriode || '').trim(),
                }

                if (!payload.nim) throw new Error('NIM kosong')
                if (!payload.fullName) throw new Error('Nama kosong')

                if (allowedFacultyIds && !allowedFacultyIds.includes(payload.facultyId)) {
                    throw new Error('Anda tidak memiliki akses ke fakultas ini')
                }

                await this.createAlumni(payload, context)
                summary.success += 1
            } catch (error) {
                summary.failed += 1
                summary.errors.push({
                    row: index + 2, // header row offset
                    message: error.message || 'Gagal memproses data',
                })
            }
        }

        return summary
    }
}

module.exports = AlumniService