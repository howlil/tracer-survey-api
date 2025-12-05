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

        this.logger.info(`Processing ${rows.length} rows for import`)

        for (const [index, row] of rows.entries()) {
            try {
                this.logger.debug(`Processing row ${index + 1}:`, JSON.stringify(row))
                
                // Handle both ID and name for faculty and major
                // Try multiple key variations
                let facultyId = String(
                    row.faculty_id || 
                    row.facultyId || 
                    row.faculty_name || 
                    row['faculty_id'] || 
                    row['facultyId'] || 
                    row['faculty_name'] || 
                    ''
                ).trim()
                
                let majorId = String(
                    row.major_id || 
                    row.majorId || 
                    row.major_name || 
                    row['major_id'] || 
                    row['majorId'] || 
                    row['major_name'] || 
                    ''
                ).trim()
                
                this.logger.debug(`Row ${index + 1} - facultyId: "${facultyId}", majorId: "${majorId}"`)

                // If faculty_name is provided, find faculty by name
                if (facultyId && !facultyId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                    const faculty = await this.alumniRepository.findFacultyByName(facultyId)
                    if (!faculty) {
                        throw new Error(`Fakultas "${facultyId}" tidak ditemukan`)
                    }
                    facultyId = faculty.id
                }

                // If major_name is provided, find major by name
                if (majorId && !majorId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                    const major = await this.alumniRepository.findMajorByName(majorId)
                    if (!major) {
                        throw new Error(`Program studi "${majorId}" tidak ditemukan`)
                    }
                    majorId = major.id
                    
                    // Verify major belongs to selected faculty
                    if (facultyId && major.facultyId !== facultyId) {
                        throw new Error(`Program studi "${row.major_name || row.major_id || row.majorId}" tidak sesuai dengan fakultas yang dipilih`)
                    }
                }

                const payload = {
                    nim: String(row.nim || row.NIM || row['nim'] || row['NIM'] || '').trim(),
                    fullName: String(row.full_name || row.fullName || row['full_name'] || row['fullName'] || '').trim(),
                    email: String(row.email || row['email'] || '').trim(),
                    facultyId: facultyId,
                    majorId: majorId,
                    degree: String(row.degree || row['degree'] || '').trim(),
                    graduatedYear: parseInt(row.graduated_year || row.graduatedYear || row['graduated_year'] || row['graduatedYear'] || 0, 10),
                    graduatePeriode: String(row.graduate_periode || row.graduatePeriode || row['graduate_periode'] || row['graduatePeriode'] || '').trim(),
                }

                // Validasi field wajib dengan pesan yang lebih jelas
                if (!payload.nim) throw new Error('NIM wajib diisi. Pastikan kolom "nim" terisi dengan benar.')
                if (!payload.fullName) throw new Error('Nama lengkap wajib diisi. Pastikan kolom "full_name" terisi dengan benar.')
                if (!payload.email) throw new Error('Email wajib diisi. Pastikan kolom "email" terisi dengan benar.')
                if (!payload.facultyId) throw new Error('Fakultas wajib diisi. Pastikan kolom "faculty_name" terisi dengan benar.')
                if (!payload.majorId) throw new Error('Program studi wajib diisi. Pastikan kolom "major_name" terisi dengan benar.')
                if (!payload.degree) throw new Error('Jenjang wajib diisi. Pastikan kolom "degree" terisi dengan benar.')
                if (!payload.graduatedYear || isNaN(payload.graduatedYear) || payload.graduatedYear < 1900 || payload.graduatedYear > 2100) {
                    throw new Error('Tahun lulus wajib diisi dan harus valid (1900-2100). Pastikan kolom "graduated_year" terisi dengan benar.')
                }
                if (!payload.graduatePeriode) throw new Error('Periode wisuda wajib diisi. Pastikan kolom "graduate_periode" terisi dengan benar.')

                if (allowedFacultyIds && !allowedFacultyIds.includes(payload.facultyId)) {
                    throw new Error('Anda tidak memiliki akses ke fakultas ini')
                }

                this.logger.debug(`Row ${index + 1} - Creating alumni with payload:`, JSON.stringify(payload))
                await this.createAlumni(payload, context)
                summary.success += 1
                this.logger.info(`Row ${index + 1} - Successfully imported`)
            } catch (error) {
                summary.failed += 1
                const errorMessage = error.message || 'Gagal memproses data'
                this.logger.error(`Row ${index + 1} - Error: ${errorMessage}`, error)
                summary.errors.push({
                    row: index + 2, // header row offset
                    message: errorMessage,
                })
            }
        }
        
        this.logger.info(`Import completed: ${summary.success} success, ${summary.failed} failed out of ${summary.total} total`)

        return summary
    }

    async updateAlumni(alumniId, payload, context) {
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

            // Get existing alumni to check access
            const existingAlumni = await this.alumniRepository.findUnique({
                where: { id: alumniId },
                include: {
                    major: {
                        include: {
                            faculty: true
                        }
                    }
                }
            })

            if (!existingAlumni) {
                throw new ErrorHttp(404, 'Alumni tidak ditemukan')
            }

            // Check faculty access
            const targetFacultyId = facultyId || existingAlumni.major.facultyId
            assertFacultyAccess(context.req, targetFacultyId, 'alumni')

            // Normalize degree if provided
            let normalizedDegree = degree
            if (degree) {
                normalizedDegree = normalizeDegree(degree)
                if (!normalizedDegree) {
                    throw new ErrorHttp(400, 'Jenjang tidak dikenal')
                }
            }

            // Validate major and faculty relationship if both are being updated
            if (majorId && facultyId) {
                const major = await this.alumniRepository.findMajorWithFaculty(majorId)
                if (!major) {
                    throw new ErrorHttp(404, 'Program studi tidak ditemukan')
                }
                if (major.facultyId !== facultyId) {
                    throw new ErrorHttp(400, 'Program studi tidak sesuai dengan fakultas yang dipilih')
                }
            } else if (majorId) {
                // If only majorId is provided, validate it exists
                const major = await this.alumniRepository.findMajorWithFaculty(majorId)
                if (!major) {
                    throw new ErrorHttp(404, 'Program studi tidak ditemukan')
                }
            }

            const updateData = {}
            if (nim) updateData.nim = nim
            if (fullName) updateData.fullName = fullName
            if (email) updateData.email = email
            if (majorId) updateData.majorId = majorId
            if (normalizedDegree) updateData.degree = normalizedDegree
            if (graduatedYear !== undefined) updateData.graduatedYear = graduatedYear
            if (graduatePeriode) updateData.graduatePeriode = graduatePeriode

            const alumni = await this.alumniRepository.updateAlumniWithRespondent(alumniId, updateData)

            return alumni
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getCurrentAlumniProfile(respondentId) {
        try {
            const alumni = await this.alumniRepository.findAlumniByRespondentId(respondentId)
            if (!alumni) {
                throw new ErrorHttp(404, 'Data alumni tidak ditemukan')
            }
            return alumni
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = AlumniService