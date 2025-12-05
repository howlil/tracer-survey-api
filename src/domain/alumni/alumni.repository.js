const BaseRepository = require("../../shared/base/base.repository")
const { generatePin } = require("../../shared/utils/pin.util")
const ErrorHttp = require("../../shared/http/error.http")

class AlumniRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.alumni, logger)
        this.prismaClient = prisma
    }

    async findManyWithPagination(options = {}) {
        try {
            const { page = 1, limit = 10, search, facultyId, majorId, degree, graduatedYear, graduatePeriode, accessibleFacultyIds } = options

            const filters = []
            if (search) {
                filters.push({
                    OR: [
                        { respondent: { fullName: { contains: search } } },
                        { nim: { contains: search } },
                        { respondent: { email: { contains: search } } }
                    ]
                })
            }
            if (majorId) {
                filters.push({ majorId })
            }
            if (degree) {
                filters.push({ degree })
            }
            if (graduatedYear) {
                filters.push({ graduatedYear })
            }
            if (graduatePeriode) {
                filters.push({ graduatePeriode })
            }

            const majorFilter = {}
            if (facultyId) {
                majorFilter.facultyId = facultyId
            } else if (accessibleFacultyIds && accessibleFacultyIds.length > 0) {
                majorFilter.facultyId = { in: accessibleFacultyIds }
            }

            if (Object.keys(majorFilter).length > 0) {
                filters.push({
                    major: majorFilter
                })
            }

            const where = filters.length > 0 ? { AND: filters } : {}

            // Use getAll from base repository
            const result = await this.getAll({
                page,
                limit,
                where,
                include: {
                    respondent: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true
                        }
                    },
                    major: {
                        select: {
                            id: true,
                            majorName: true,
                            faculty: {
                                select: {
                                    id: true,
                                    facultyName: true
                                }
                            }
                        }
                    },
                    PinAlumni: {
                        where: {
                            pinType: 'ALUMNI',
                            managerId: null
                        },
                        select: {
                            pin: true
                        },
                        take: 1
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            // Get stats
            const [totalAlumni, alumniThisYear, majorsGroup, facultiesGroup] = await Promise.all([
                this.prisma.count(),
                this.prisma.count({
                    where: {
                        graduatedYear: new Date().getFullYear()
                    }
                }),
                this.prisma.groupBy({
                    by: ['majorId'],
                    _count: { majorId: true }
                }),
                this.prismaClient.major.groupBy({
                    by: ['facultyId'],
                    _count: { facultyId: true }
                })
            ])

            const totalMajors = majorsGroup.length
            const totalFaculties = facultiesGroup.length

            const formattedAlumni = result.data.map(alum => ({
                id: alum.id,
                nim: alum.nim,
                graduatedYear: alum.graduatedYear,
                graduatePeriode: alum.graduatePeriode,
                degree: alum.degree,
                pin: alum.PinAlumni && alum.PinAlumni.length > 0 ? alum.PinAlumni[0].pin : null,
                respondent: alum.respondent,
                major: {
                    id: alum.major.id,
                    name: alum.major.majorName,
                    faculty: {
                        id: alum.major.faculty.id,
                        name: alum.major.faculty.facultyName
                    }
                }
            }))

            return {
                alumni: formattedAlumni,
                meta: result.meta,
                stats: {
                    totalAlumni,
                    alumniThisYear,
                    totalMajors,
                    totalFaculties,
                    filteredCount: result.meta.total
                }
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async findMajorWithFaculty(majorId) {
        return this.prismaClient.major.findUnique({
            where: { id: majorId },
            include: {
                faculty: {
                    select: {
                        id: true,
                        facultyName: true,
                    },
                },
            },
        })
    }

    /**
     * Generate unique PIN untuk alumni
     * PIN di-generate otomatis dan dijamin unik (tidak akan ada duplikat)
     * Format: 6 karakter alphanumeric (huruf dan angka)
     * Menggunakan karakter yang mudah dibaca (menghindari 0, O, 1, I, l)
     * 
     * @param {PrismaTransaction} tx - Prisma transaction instance
     * @param {number} maxAttempts - Maximum attempts untuk generate PIN (default: 100)
     * @returns {Promise<string>} Unique PIN
     */
    async generateUniquePin(tx, maxAttempts = 100) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const pin = generatePin(6)
            const existingPin = await tx.pinAlumni.findUnique({
                where: { pin },
            })
            if (!existingPin) {
                this.logger.debug(`Generated unique PIN: ${pin} (attempt ${attempt + 1})`)
                return pin
            }
        }
        // Jika masih gagal setelah maxAttempts, throw ErrorHttp untuk memastikan transaction rollback
        throw new ErrorHttp(500, `Gagal menghasilkan PIN unik setelah ${maxAttempts} percobaan. Silakan coba lagi.`)
    }

    /**
     * Membuat alumni baru dengan respondent dan PIN
     * PIN di-generate otomatis dan dijamin unik (tidak akan ada duplikat)
     * 
     * Catatan: Data alumni seharusnya diambil dari tracer study responses
     * yang status bekerjanya "sudah bekerja" (Bekerja Full Time, Part Time, atau Wiraswasta)
     * 
     * @param {Object} data - Data alumni
     * @param {string} data.nim - NIM alumni
     * @param {string} data.fullName - Nama lengkap alumni
     * @param {string} data.email - Email alumni
     * @param {string} data.majorId - ID program studi
     * @param {string} data.degree - Jenjang pendidikan
     * @param {number} data.graduatedYear - Tahun lulus
     * @param {string} data.graduatePeriode - Periode wisuda
     * @returns {Promise<Object>} Alumni data dengan PIN yang sudah di-generate
     */
    async createAlumniWithRespondent(data) {
        try {
            const {
                nim,
                fullName,
                email,
                majorId,
                degree,
                graduatedYear,
                graduatePeriode,
            } = data

            const result = await this.prismaClient.$transaction(async (tx) => {
                this.logger.info(`[createAlumniWithRespondent] Starting transaction for NIM: ${nim}, Email: ${email}`)
                
                // Check for duplicate NIM
                const existingNim = await tx.alumni.findUnique({
                    where: { nim },
                })
                if (existingNim) {
                    this.logger.warn(`[createAlumniWithRespondent] Duplicate NIM found: ${nim}`)
                    throw new ErrorHttp(409, `NIM ${nim} sudah terdaftar`)
                }

                // Check for duplicate email
                const existingEmail = await tx.respondent.findUnique({
                    where: { email },
                })
                if (existingEmail) {
                    this.logger.warn(`[createAlumniWithRespondent] Duplicate email found: ${email}`)
                    throw new ErrorHttp(409, `Email ${email} sudah digunakan`)
                }

                // Validate majorId exists
                const major = await tx.major.findUnique({
                    where: { id: majorId },
                })
                if (!major) {
                    this.logger.error(`[createAlumniWithRespondent] Major not found: ${majorId}`)
                    throw new ErrorHttp(404, `Program studi dengan ID ${majorId} tidak ditemukan`)
                }

                // Validate degree is valid enum value
                const validDegrees = ['S1', 'PASCA', 'PROFESI', 'VOKASI']
                if (!validDegrees.includes(degree)) {
                    this.logger.error(`[createAlumniWithRespondent] Invalid degree: ${degree}`)
                    throw new ErrorHttp(400, `Jenjang tidak valid: ${degree}. Harus salah satu dari: ${validDegrees.join(', ')}`)
                }

                // Validate graduatePeriode is valid enum value
                const validPeriodes = ['WISUDA_I', 'WISUDA_II', 'WISUDA_III', 'WISUDA_IV', 'WISUDA_V', 'WISUDA_VI']
                if (!validPeriodes.includes(graduatePeriode)) {
                    this.logger.error(`[createAlumniWithRespondent] Invalid graduatePeriode: ${graduatePeriode}`)
                    throw new ErrorHttp(400, `Periode wisuda tidak valid: ${graduatePeriode}. Harus salah satu dari: ${validPeriodes.join(', ')}`)
                }

                // Validate graduatedYear is valid
                if (!graduatedYear || isNaN(graduatedYear) || graduatedYear < 1900 || graduatedYear > 2100) {
                    this.logger.error(`[createAlumniWithRespondent] Invalid graduatedYear: ${graduatedYear}`)
                    throw new ErrorHttp(400, `Tahun lulus tidak valid: ${graduatedYear}. Harus antara 1900-2100`)
                }

                // Create respondent
                this.logger.info(`[createAlumniWithRespondent] Creating respondent for email: ${email}`)
                const respondent = await tx.respondent.create({
                    data: {
                        fullName,
                        email,
                        role: 'ALUMNI',
                    },
                })
                this.logger.info(`[createAlumniWithRespondent] Respondent created with ID: ${respondent.id}`)

                // Create alumni
                this.logger.info(`[createAlumniWithRespondent] Creating alumni with NIM: ${nim}, majorId: ${majorId}, degree: ${degree}`)
                const alumni = await tx.alumni.create({
                    data: {
                        nim,
                        majorId,
                        degree,
                        graduatedYear,
                        graduatePeriode,
                        respondentId: respondent.id,
                    },
                    include: {
                        respondent: true,
                        major: {
                            include: {
                                faculty: true,
                            },
                        },
                    },
                })
                this.logger.info(`[createAlumniWithRespondent] Alumni created with ID: ${alumni.id}`)

                // Generate unique PIN otomatis (tidak akan ada duplikat)
                this.logger.info(`[createAlumniWithRespondent] Generating unique PIN for alumni: ${alumni.id}`)
                const pin = await this.generateUniquePin(tx)
                this.logger.info(`[createAlumniWithRespondent] Generated PIN: ${pin}`)

                // Create PIN record
                this.logger.info(`[createAlumniWithRespondent] Creating PIN record for alumni: ${alumni.id}`)
                await tx.pinAlumni.create({
                    data: {
                        pin,
                        alumniId: alumni.id,
                        managerId: null,
                        pinType: 'ALUMNI',
                    },
                })
                this.logger.info(`[createAlumniWithRespondent] PIN record created successfully`)

                this.logger.info(`[createAlumniWithRespondent] Transaction completed successfully. Alumni ID: ${alumni.id}, PIN: ${pin}`)

                return {
                    ...alumni,
                    pin // Include PIN in response for reference
                }
            })

            return result
        } catch (error) {
            this.logger.error(`[createAlumniWithRespondent] Error occurred:`, error)
            this.logger.error(`[createAlumniWithRespondent] Error message: ${error.message}`)
            if (error.stack) {
                this.logger.error(`[createAlumniWithRespondent] Error stack: ${error.stack}`)
            }
            
            // If it's already an ErrorHttp, just rethrow it
            if (error.statusCode) {
                throw error
            }
            
            // For Prisma errors, wrap them in ErrorHttp
            if (error.code === 'P2002') {
                // Unique constraint violation
                const field = error.meta?.target?.[0] || 'field'
                throw new ErrorHttp(409, `${field} sudah digunakan`)
            }
            
            if (error.code === 'P2003') {
                // Foreign key constraint violation
                const fieldName = error.meta?.field_name || 'unknown'
                this.logger.error(`[createAlumniWithRespondent] Foreign key violation on field: ${fieldName}`)
                throw new ErrorHttp(400, `Data referensi tidak valid: ${fieldName}`)
            }
            
            // For other errors, wrap in 500
            throw new ErrorHttp(500, error.message || 'Gagal membuat alumni')
        }
    }

    async updateAlumniWithRespondent(alumniId, data) {
        try {
            const {
                nim,
                fullName,
                email,
                majorId,
                degree,
                graduatedYear,
                graduatePeriode,
            } = data

            const result = await this.prismaClient.$transaction(async (tx) => {
                this.logger.info(`[updateAlumniWithRespondent] Starting transaction for Alumni ID: ${alumniId}`)
                
                // Get existing alumni
                const existingAlumni = await tx.alumni.findUnique({
                    where: { id: alumniId },
                    include: { respondent: true }
                })

                if (!existingAlumni) {
                    this.logger.error(`[updateAlumniWithRespondent] Alumni not found: ${alumniId}`)
                    throw new ErrorHttp(404, `Alumni dengan ID ${alumniId} tidak ditemukan`)
                }

                // Check for duplicate NIM if nim is being updated
                if (nim && nim !== existingAlumni.nim) {
                    const existingNim = await tx.alumni.findUnique({
                        where: { nim },
                    })
                    if (existingNim) {
                        this.logger.warn(`[updateAlumniWithRespondent] Duplicate NIM found: ${nim}`)
                        throw new ErrorHttp(409, `NIM ${nim} sudah terdaftar`)
                    }
                }

                // Check for duplicate email if email is being updated
                if (email && email !== existingAlumni.respondent.email) {
                    const existingEmail = await tx.respondent.findUnique({
                        where: { email },
                    })
                    if (existingEmail) {
                        this.logger.warn(`[updateAlumniWithRespondent] Duplicate email found: ${email}`)
                        throw new ErrorHttp(409, `Email ${email} sudah digunakan`)
                    }
                }

                // Validate majorId exists if being updated
                if (majorId) {
                    const major = await tx.major.findUnique({
                        where: { id: majorId },
                    })
                    if (!major) {
                        this.logger.error(`[updateAlumniWithRespondent] Major not found: ${majorId}`)
                        throw new ErrorHttp(404, `Program studi dengan ID ${majorId} tidak ditemukan`)
                    }
                }

                // Validate degree is valid enum value if being updated
                if (degree) {
                    const validDegrees = ['S1', 'PASCA', 'PROFESI', 'VOKASI']
                    if (!validDegrees.includes(degree)) {
                        this.logger.error(`[updateAlumniWithRespondent] Invalid degree: ${degree}`)
                        throw new ErrorHttp(400, `Jenjang tidak valid: ${degree}. Harus salah satu dari: ${validDegrees.join(', ')}`)
                    }
                }

                // Validate graduatePeriode is valid enum value if being updated
                if (graduatePeriode) {
                    const validPeriodes = ['WISUDA_I', 'WISUDA_II', 'WISUDA_III', 'WISUDA_IV', 'WISUDA_V', 'WISUDA_VI']
                    if (!validPeriodes.includes(graduatePeriode)) {
                        this.logger.error(`[updateAlumniWithRespondent] Invalid graduatePeriode: ${graduatePeriode}`)
                        throw new ErrorHttp(400, `Periode wisuda tidak valid: ${graduatePeriode}. Harus salah satu dari: ${validPeriodes.join(', ')}`)
                    }
                }

                // Validate graduatedYear is valid if being updated
                if (graduatedYear !== undefined && (isNaN(graduatedYear) || graduatedYear < 1900 || graduatedYear > 2100)) {
                    this.logger.error(`[updateAlumniWithRespondent] Invalid graduatedYear: ${graduatedYear}`)
                    throw new ErrorHttp(400, `Tahun lulus tidak valid: ${graduatedYear}. Harus antara 1900-2100`)
                }

                // Update respondent if fullName or email is provided
                const respondentUpdateData = {}
                if (fullName) respondentUpdateData.fullName = fullName
                if (email) respondentUpdateData.email = email

                if (Object.keys(respondentUpdateData).length > 0) {
                    this.logger.info(`[updateAlumniWithRespondent] Updating respondent for ID: ${existingAlumni.respondentId}`)
                    await tx.respondent.update({
                        where: { id: existingAlumni.respondentId },
                        data: respondentUpdateData
                    })
                }

                // Update alumni
                const alumniUpdateData = {}
                if (nim) alumniUpdateData.nim = nim
                if (majorId) alumniUpdateData.majorId = majorId
                if (degree) alumniUpdateData.degree = degree
                if (graduatedYear !== undefined) alumniUpdateData.graduatedYear = graduatedYear
                if (graduatePeriode) alumniUpdateData.graduatePeriode = graduatePeriode

                if (Object.keys(alumniUpdateData).length > 0) {
                    this.logger.info(`[updateAlumniWithRespondent] Updating alumni with ID: ${alumniId}`)
                    const updatedAlumni = await tx.alumni.update({
                        where: { id: alumniId },
                        data: alumniUpdateData,
                        include: {
                            respondent: true,
                            major: {
                                include: {
                                    faculty: true,
                                },
                            },
                        },
                    })
                    this.logger.info(`[updateAlumniWithRespondent] Transaction completed successfully. Alumni ID: ${alumniId}`)
                    return updatedAlumni
                }

                // If no alumni fields to update, just return existing with updated respondent
                const alumni = await tx.alumni.findUnique({
                    where: { id: alumniId },
                    include: {
                        respondent: true,
                        major: {
                            include: {
                                faculty: true,
                            },
                        },
                    },
                })
                return alumni
            })

            return result
        } catch (error) {
            this.logger.error(`[updateAlumniWithRespondent] Error occurred:`, error)
            if (error.statusCode) {
                throw error
            }
            if (error.code === 'P2002') {
                const field = error.meta?.target?.[0] || 'field'
                throw new ErrorHttp(409, `${field} sudah digunakan`)
            }
            if (error.code === 'P2003') {
                const fieldName = error.meta?.field_name || 'unknown'
                throw new ErrorHttp(400, `Data referensi tidak valid: ${fieldName}`)
            }
            throw new ErrorHttp(500, error.message || 'Gagal mengupdate alumni')
        }
    }

    async findFacultyByName(facultyName) {
        try {
            // MySQL is case-insensitive by default, so we can use equals directly
            // For case-insensitive search, we'll find all and filter in memory if needed
            const faculty = await this.prismaClient.faculty.findFirst({
                where: {
                    facultyName: {
                        equals: facultyName
                    }
                },
                select: {
                    id: true,
                    facultyName: true
                }
            })
            // If exact match not found, try case-insensitive search
            if (!faculty) {
                const allFaculties = await this.prismaClient.faculty.findMany({
                    select: {
                        id: true,
                        facultyName: true
                    }
                })
                const found = allFaculties.find(f => 
                    f.facultyName.toLowerCase() === facultyName.toLowerCase()
                )
                return found || null
            }
            return faculty
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async findMajorByName(majorName) {
        try {
            // MySQL is case-insensitive by default, so we can use equals directly
            // For case-insensitive search, we'll find all and filter in memory if needed
            const major = await this.prismaClient.major.findFirst({
                where: {
                    majorName: {
                        equals: majorName
                    }
                },
                include: {
                    faculty: {
                        select: {
                            id: true,
                            facultyName: true
                        }
                    }
                }
            })
            // If exact match not found, try case-insensitive search
            if (!major) {
                const allMajors = await this.prismaClient.major.findMany({
                    include: {
                        faculty: {
                            select: {
                                id: true,
                                facultyName: true
                            }
                        }
                    }
                })
                const found = allMajors.find(m => 
                    m.majorName.toLowerCase() === majorName.toLowerCase()
                )
                if (found) {
                    return {
                        id: found.id,
                        majorName: found.majorName,
                        facultyId: found.facultyId,
                        faculty: found.faculty
                    }
                }
                return null
            }
            return {
                id: major.id,
                majorName: major.majorName,
                facultyId: major.facultyId,
                faculty: major.faculty
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    /**
     * Mengambil data alumni dari tracer study responses yang status bekerjanya "sudah bekerja"
     * Status bekerja: "Bekerja (Full Time)", "Bekerja (Part Time)", atau "Wiraswasta"
     * 
     * Catatan: Fungsi ini untuk referensi. Data alumni seharusnya diambil dari responses
     * yang sudah mengisi tracer study dengan status bekerja "sudah bekerja"
     * 
     * @param {Object} options - Options untuk filter
     * @param {string} options.surveyId - ID survey tracer study (optional)
     * @returns {Promise<Array>} Array of responses dengan data alumni yang sudah bekerja
     */
    async findAlumniByRespondentId(respondentId) {
        try {
            const alumni = await this.prismaClient.alumni.findFirst({
                where: {
                    respondentId
                },
                include: {
                    respondent: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true
                        }
                    },
                    major: {
                        include: {
                            faculty: {
                                select: {
                                    id: true,
                                    facultyName: true
                                }
                            }
                        }
                    }
                }
            })

            if (!alumni) {
                return null
            }

            // Format response to include majorName and facultyName explicitly
            return {
                ...alumni,
                major: {
                    id: alumni.major.id,
                    majorName: alumni.major.majorName, // Explicitly include majorName
                    faculty: {
                        id: alumni.major.faculty.id,
                        facultyName: alumni.major.faculty.facultyName // Explicitly include facultyName
                    }
                }
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getAlumniFromTracerStudyResponses(options = {}) {
        try {
            const { surveyId } = options

            // Find tracer study survey (targetRole: ALUMNI)
            const survey = await this.prismaClient.survey.findFirst({
                where: {
                    targetRole: 'ALUMNI',
                    status: 'PUBLISHED',
                    ...(surveyId && { id: surveyId })
                }
            })

            if (!survey) {
                return []
            }

            // Find question A1 (Status Pekerjaan) - question dengan text mengandung "status pekerjaan"
            const statusQuestion = await this.prismaClient.question.findFirst({
                where: {
                    codeId: 'A',
                    questionText: {
                        contains: 'status pekerjaan'
                    }
                },
                include: {
                    answerQuestion: {
                        where: {
                            answerText: {
                                in: ['Bekerja (Full Time)', 'Bekerja (Part Time)', 'Wiraswasta']
                            }
                        }
                    }
                }
            })

            if (!statusQuestion || statusQuestion.answerQuestion.length === 0) {
                this.logger.warn('Question A1 (Status Pekerjaan) atau opsi bekerja tidak ditemukan')
                return []
            }

            // Get working status answer option IDs
            const workingStatusOptionIds = statusQuestion.answerQuestion.map(opt => opt.id)

            // Get responses yang memilih status bekerja
            const responses = await this.prismaClient.responseRespondent.findMany({
                where: {
                    surveyId: survey.id,
                    answerMultipleChoice: {
                        some: {
                            questionId: statusQuestion.id,
                            answerOptionQuestionId: {
                                in: workingStatusOptionIds
                            }
                        }
                    },
                    respondent: {
                        role: 'ALUMNI',
                        alumni: null // Hanya yang belum punya alumni record
                    }
                },
                include: {
                    respondent: true
                }
            })

            return responses
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = AlumniRepository