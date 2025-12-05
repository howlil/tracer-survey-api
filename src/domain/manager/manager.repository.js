const BaseRepository = require("../../shared/base/base.repository")
const ResponseRepository = require("../response/response.repository")
const { generatePin } = require("../../shared/utils/pin.util")
const ErrorHttp = require("../../shared/http/error.http")

class ManagerRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.manager, logger)
        this.prismaClient = prisma
        this.responseRepository = new ResponseRepository(prisma, logger)
    }

    /**
     * Generate unique PIN for manager (user survey)
     * PIN harus unik secara global karena pin adalah @id di schema
     */
    async generateUniquePin(tx, maxAttempts = 100) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const pin = generatePin(6)
            const existingPin = await tx.pinAlumni.findUnique({
                where: { pin },
            })
            if (!existingPin) {
                this.logger.debug(`Generated unique PIN for manager: ${pin} (attempt ${attempt + 1})`)
                return pin
            }
        }
        throw new ErrorHttp(500, `Gagal menghasilkan PIN unik setelah ${maxAttempts} percobaan. Silakan coba lagi.`)
    }

    async findManyWithPagination(options = {}) {
        try {
            const { page = 1, limit = 10, search, company, position, accessibleFacultyIds } = options

            const where = {}
            if (search) {
                where.OR = [
                    { respondent: { fullName: { contains: search, mode: 'insensitive' } } },
                    { respondent: { email: { contains: search, mode: 'insensitive' } } }
                ]
            }
            if (company) {
                where.company = { contains: company, mode: 'insensitive' }
            }
            if (position) {
                where.position = { contains: position, mode: 'insensitive' }
            }
            if (accessibleFacultyIds && accessibleFacultyIds.length > 0) {
                where.PinAlumni = {
                    some: {
                        alumni: {
                            major: {
                                facultyId: { in: accessibleFacultyIds }
                            }
                        }
                    }
                }
            }

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
                    PinAlumni: {
                        select: {
                            pin: true,
                            pinType: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            // Get stats
            const [totalManagers, companiesGroup, positionsGroup] = await Promise.all([
                this.prisma.count(),
                this.prisma.groupBy({
                    by: ['company'],
                    _count: { company: true }
                }),
                this.prisma.groupBy({
                    by: ['position'],
                    _count: { position: true }
                })
            ])

            const totalCompanies = companiesGroup.length
            const totalPositions = positionsGroup.length

            const formattedManagers = result.data.map(manager => {
                // Filter PinAlumni to get only MANAGER type PINs, then get the first one
                const managerPins = manager.PinAlumni 
                    ? manager.PinAlumni.filter(pin => pin.pinType === 'MANAGER')
                    : []
                const pin = managerPins.length > 0 ? managerPins[0].pin : null
                
                return {
                    id: manager.id,
                    company: manager.company,
                    position: manager.position,
                    phoneNumber: manager.phoneNumber,
                    respondentId: manager.respondentId,
                    respondent: manager.respondent,
                    pin: pin
                }
            })

            return {
                managers: formattedManagers,
                meta: result.meta,
                stats: {
                    totalManagers,
                    totalCompanies,
                    totalPositions,
                    filteredCount: result.meta.total
                }
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getUniqueCompanies() {
        try {
            const companies = await this.prisma.findMany({
                select: { company: true },
                distinct: ['company'],
                orderBy: { company: 'asc' }
            })
            return companies.map(c => c.company)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getUniquePositions() {
        try {
            const positions = await this.prisma.findMany({
                select: { position: true },
                distinct: ['position'],
                orderBy: { position: 'asc' }
            })
            return positions.map(p => p.position)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async findByIdWithAlumni(managerId) {
        try {
            this.logger.info('[findByIdWithAlumni] Called with managerId:', managerId)
            this.logger.info('[findByIdWithAlumni] managerId type:', typeof managerId)
            
            const manager = await this.prismaClient.manager.findUnique({
                where: { id: managerId },
                include: {
                    respondent: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    },
                    PinAlumni: {
                        where: {
                            pinType: 'MANAGER'
                        },
                        select: {
                            pin: true,
                            alumni: {
                                select: {
                                    id: true,
                                    nim: true,
                                    graduatedYear: true,
                                    graduatePeriode: true,
                                    degree: true,
                                    respondent: {
                                        select: {
                                            id: true,
                                            fullName: true,
                                            email: true
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
                                    }
                                }
                            }
                        }
                    }
                }
            })

            this.logger.info('[findByIdWithAlumni] Manager found:', manager ? 'Yes' : 'No')
            
            if (!manager) {
                this.logger.warn('[findByIdWithAlumni] Manager not found with ID:', managerId)
                return null
            }

            this.logger.info('[findByIdWithAlumni] Manager has', manager.PinAlumni?.length || 0, 'PIN records')
            
            // Format response
            const alumniList = manager.PinAlumni.map(pinRecord => ({
                id: pinRecord.alumni.id,
                nim: pinRecord.alumni.nim,
                fullName: pinRecord.alumni.respondent.fullName,
                email: pinRecord.alumni.respondent.email,
                major: pinRecord.alumni.major.majorName,
                faculty: pinRecord.alumni.major.faculty.facultyName,
                degree: pinRecord.alumni.degree,
                graduatedYear: pinRecord.alumni.graduatedYear,
                graduatePeriode: pinRecord.alumni.graduatePeriode,
                pin: pinRecord.pin // PIN untuk user survey (kombinasi alumni + manager)
            }))

            const result = {
                id: manager.id,
                company: manager.company,
                position: manager.position,
                phoneNumber: manager.phoneNumber,
                respondent: manager.respondent,
                createdAt: manager.createdAt,
                updatedAt: manager.updatedAt,
                alumni: alumniList
            }
            
            this.logger.info('[findByIdWithAlumni] Returning result with', alumniList.length, 'alumni')
            return result
        } catch (error) {
            this.logger.error('[findByIdWithAlumni] Error:', error)
            this.logger.error('[findByIdWithAlumni] Error message:', error.message)
            this.logger.error('[findByIdWithAlumni] Error stack:', error.stack)
            throw error
        }
    }

    async findPinsWithAlumni(pins = []) {
        return this.prismaClient.pinAlumni.findMany({
            where: {
                pin: { in: pins },
            },
            include: {
                alumni: {
                    include: {
                        major: {
                            include: {
                                faculty: true,
                            },
                        },
                        respondent: {
                            select: {
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        })
    }

    /**
     * Create manager with alumni PINs
     * Generate PIN baru untuk setiap kombinasi alumni + manager (bukan menggunakan PIN alumni yang sudah ada)
     */
    async createManagerWithPins(options = {}) {
        const {
            fullName,
            email,
            company,
            position,
            phoneNumber,
            pins = [],
        } = options

        return this.prismaClient.$transaction(async (tx) => {
            const existingEmail = await tx.respondent.findUnique({
                where: { email },
            })
            if (existingEmail) {
                throw new Error(`Email ${email} sudah digunakan`)
            }

            const respondent = await tx.respondent.create({
                data: {
                    fullName,
                    email,
                    role: 'MANAGER',
                },
            })

            const manager = await tx.manager.create({
                data: {
                    company,
                    position,
                    phoneNumber: phoneNumber || null,
                    respondentId: respondent.id,
                },
                include: {
                    respondent: true,
                },
            })

            // Get alumni records from PINs
            const pinRecords = await tx.pinAlumni.findMany({
                where: {
                    pin: { in: pins },
                    pinType: 'ALUMNI', // Only get alumni PINs
                },
                include: {
                    alumni: true,
                },
            })

            if (pinRecords.length !== pins.length) {
                throw new Error('Beberapa PIN alumni tidak ditemukan')
            }

            // Generate PIN baru untuk setiap kombinasi alumni + manager
            const generatedPins = []
            for (const pinRecord of pinRecords) {
                // Check if PIN already exists for this alumni + manager combination
                const existingManagerPin = await tx.pinAlumni.findFirst({
                    where: {
                        alumniId: pinRecord.alumniId,
                        managerId: manager.id,
                        pinType: 'MANAGER',
                    },
                })

                if (existingManagerPin) {
                    // PIN already exists for this combination, skip
                    this.logger.warn(`PIN already exists for alumni ${pinRecord.alumniId} and manager ${manager.id}`)
                    continue
                }

                // Generate new PIN for this alumni + manager combination
                const newPin = await this.generateUniquePin(tx)

                // Create new PIN record for manager (user survey)
                await tx.pinAlumni.create({
                    data: {
                        pin: newPin,
                        alumniId: pinRecord.alumniId,
                        managerId: manager.id,
                        pinType: 'MANAGER',
                    },
                })

                generatedPins.push({
                    pin: newPin,
                    alumniId: pinRecord.alumniId,
                    alumniName: pinRecord.alumni?.respondent?.fullName || 'Unknown',
                })

                this.logger.info(`Generated new PIN ${newPin} for manager ${manager.id} and alumni ${pinRecord.alumniId}`)
            }

            return {
                ...manager,
                generatedPins, // Include generated PINs in response
            }
        })
    }

    /**
     * Get tracer study responses that are eligible for manager generation
     * Criteria:
     * - Status bekerja = "sudah bekerja" (Bekerja Full Time, Part Time, atau Wiraswasta)
     * - Completion = 100%
     * - Belum punya manager record
     * - Submitted (submittedAt is not null)
     */
    async getEligibleResponsesForManager() {
        try {
            // Find tracer study survey (targetRole: ALUMNI)
            const survey = await this.prismaClient.survey.findFirst({
                where: {
                    targetRole: 'ALUMNI',
                    status: 'PUBLISHED',
                },
                include: {
                    CodeQuestion: {
                        include: {
                            Question: {
                                where: { parentId: null }, // Only parent questions
                                include: {
                                    answerQuestion: true,
                                },
                            },
                        },
                    },
                },
            })

            if (!survey) {
                return []
            }

            // Find question about working status (usually contains "status pekerjaan" or "status bekerja")
            const statusQuestion = await this.prismaClient.question.findFirst({
                where: {
                    codeId: { in: survey.CodeQuestion.map(cq => cq.code) },
                    OR: [
                        { questionText: { contains: 'status' } },
                        { questionText: { contains: 'pekerjaan' } },
                    ],
                },
                include: {
                    answerQuestion: true, // Get all options first
                },
            })

            if (!statusQuestion || statusQuestion.answerQuestion.length === 0) {
                this.logger.warn('Question status pekerjaan tidak ditemukan')
                return []
            }

            // Filter options that indicate working status
            // Look for options containing "Bekerja", "Full Time", "Part Time", or "Wiraswasta"
            const workingStatusOptions = statusQuestion.answerQuestion.filter(opt => {
                const answerText = opt.answerText.toLowerCase()
                return answerText.includes('bekerja') || 
                       answerText.includes('full time') || 
                       answerText.includes('part time') || 
                       answerText.includes('wiraswasta')
            })

            if (workingStatusOptions.length === 0) {
                this.logger.warn('Opsi status bekerja tidak ditemukan')
                return []
            }

            const workingStatusOptionIds = workingStatusOptions.map(opt => opt.id)

            // Get all responses with working status
            const allResponses = await this.prismaClient.responseRespondent.findMany({
                where: {
                    surveyId: survey.id,
                    submittedAt: { not: null }, // Only submitted responses
                    answerMultipleChoice: {
                        some: {
                            questionId: statusQuestion.id,
                            answerOptionQuestionId: {
                                in: workingStatusOptionIds,
                            },
                        },
                    },
                    respondent: {
                        role: 'ALUMNI',
                    },
                },
                include: {
                    respondent: {
                        include: {
                            alumni: {
                                include: {
                                    major: {
                                        include: {
                                            faculty: true,
                                        },
                                    },
                                },
                            },
                            manager: true, // Check if already has manager
                        },
                    },
                },
            })

            // Filter responses that:
            // 1. Don't have manager yet
            // 2. Have 100% completion
            const eligibleResponses = []
            for (const response of allResponses) {
                // Skip if already has manager
                if (response.respondent.manager) {
                    continue
                }

                // Calculate completion percentage
                const allQuestions = survey.CodeQuestion.flatMap(cq => cq.Question || [])
                const totalRequiredQuestions = allQuestions.filter(q => q.isRequired === true).length
                
                if (totalRequiredQuestions === 0) {
                    continue
                }

                // Get answered required questions count using response repository
                const answeredRequiredQuestions = await this.responseRepository.getAnsweredQuestionsCount(response.id, true)
                const completionPercentage = Math.round((answeredRequiredQuestions / totalRequiredQuestions) * 100)

                // Only include if 100% complete
                if (completionPercentage === 100) {
                    eligibleResponses.push(response)
                }
            }

            return eligibleResponses
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }


    /**
     * Extract manager data from response answers
     * Looks for questions containing keywords: company, position, phone, etc.
     */
    async extractManagerDataFromResponse(responseId) {
        try {
            const response = await this.prismaClient.responseRespondent.findUnique({
                where: { id: responseId },
                include: {
                    survey: {
                        include: {
                            CodeQuestion: {
                                include: {
                                    Question: {
                                        include: {
                                            answerQuestion: true,
                                            children: {
                                                include: {
                                                    answerQuestion: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            })

            if (!response) {
                return null
            }

            // Get all answers
            const [answers, answerMultipleChoices] = await Promise.all([
                this.prismaClient.answer.findMany({
                    where: { responseRespondentId: responseId },
                    include: {
                        answerOptionQuestion: true,
                    },
                }),
                this.prismaClient.answerMultipleChoice.findMany({
                    where: { responseRespondentId: responseId },
                    include: {
                        answerOption: true,
                    },
                }),
            ])

            let company = null
            let position = null
            let phoneNumber = null
            let managerName = null
            let managerEmail = null

            // Find questions by keywords (including children for rating questions)
            const allQuestions = response.survey.CodeQuestion.flatMap(cq => {
                const parents = cq.Question || []
                const children = parents.flatMap(p => p.children || [])
                return [...parents, ...children]
            })

            for (const question of allQuestions) {
                const questionText = question.questionText.toLowerCase()
                
                // Find company (prioritize "Nama Perusahaan/Instansi" - C3)
                if (!company && (questionText.includes('perusahaan') || questionText.includes('company') || questionText.includes('nama perusahaan') || questionText.includes('tempat kerja') || questionText.includes('instansi'))) {
                    const answer = answers.find(a => a.questionId === question.id)
                    const answerMC = answerMultipleChoices.find(a => a.questionId === question.id)
                    
                    if (answer) {
                        if (answer.textAnswer) {
                            company = answer.textAnswer.trim()
                        } else if (answer.answerOptionQuestion) {
                            company = answer.answerOptionQuestion.answerText.trim()
                        }
                    } else if (answerMC && answerMC.answerOption) {
                        company = answerMC.answerOption.answerText.trim()
                    }
                }

                // Find position (prioritize "Jabatan/Posisi" - C4)
                if (!position && (questionText.includes('posisi') || questionText.includes('jabatan') || questionText.includes('position') || questionText.includes('pekerjaan'))) {
                    const answer = answers.find(a => a.questionId === question.id)
                    const answerMC = answerMultipleChoices.find(a => a.questionId === question.id)
                    
                    if (answer) {
                        if (answer.textAnswer) {
                            position = answer.textAnswer.trim()
                        } else if (answer.answerOptionQuestion) {
                            position = answer.answerOptionQuestion.answerText.trim()
                        }
                    } else if (answerMC && answerMC.answerOption) {
                        position = answerMC.answerOption.answerText.trim()
                    }
                }

                // Find manager name (C5: Nama Atasan/Manager)
                if (!managerName && (questionText.includes('nama atasan') || questionText.includes('nama manager') || (questionText.includes('atasan') && questionText.includes('nama')))) {
                    const answer = answers.find(a => a.questionId === question.id)
                    
                    if (answer && answer.textAnswer) {
                        managerName = answer.textAnswer.trim()
                    }
                }

                // Find manager email (C6: Email Atasan/Manager)
                if (!managerEmail && (questionText.includes('email atasan') || questionText.includes('email manager') || (questionText.includes('atasan') && questionText.includes('email')))) {
                    const answer = answers.find(a => a.questionId === question.id)
                    
                    if (answer && answer.textAnswer) {
                        managerEmail = answer.textAnswer.trim()
                    }
                }

                // Find phone number (prioritize "Nomor Telepon Atasan/Manager" - C7, then "Nomor Telepon/WhatsApp" - B2)
                if (!phoneNumber && (questionText.includes('telepon') || questionText.includes('phone') || questionText.includes('hp') || questionText.includes('no. telp') || questionText.includes('nomor telepon'))) {
                    const answer = answers.find(a => a.questionId === question.id)
                    
                    if (answer && answer.textAnswer) {
                        // Prioritize manager phone (C7) over alumni phone (B2)
                        if (questionText.includes('atasan') || questionText.includes('manager')) {
                            phoneNumber = answer.textAnswer.trim()
                        } else if (!phoneNumber) {
                            // Fallback to alumni phone if manager phone not found
                            phoneNumber = answer.textAnswer.trim()
                        }
                    }
                }
            }

            return {
                company: company || '',
                position: position || '',
                phoneNumber: phoneNumber || null,
                managerName: managerName || '', // From C5: Nama Atasan/Manager
                managerEmail: managerEmail || '', // From C6: Email Atasan/Manager
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    /**
     * Create manager from tracer study response
     * Generate PIN baru untuk user survey (bukan menggunakan PIN alumni)
     * PIN unik untuk kombinasi alumni + manager
     * Uses manager data from response (C5: Nama Atasan, C6: Email Atasan, C7: Telepon Atasan)
     */
    async createManagerFromResponse(response, managerData) {
        try {
            const { company, position, phoneNumber, managerName, managerEmail } = managerData
            const respondent = response.respondent
            const alumni = respondent.alumni

            if (!alumni) {
                throw new Error('Alumni tidak ditemukan untuk response ini')
            }

            // Validate required manager data
            if (!managerName || !managerEmail) {
                throw new Error('Data nama dan email atasan/manager tidak lengkap')
            }

            if (!company || !position) {
                throw new Error('Data perusahaan dan posisi tidak lengkap')
            }

            // Check if manager already exists with this email
            const existingManagerRespondent = await this.prismaClient.respondent.findUnique({
                where: { email: managerEmail },
            })

            // Check if this manager already has PIN for this alumni
            if (existingManagerRespondent && existingManagerRespondent.role === 'MANAGER') {
                const existingPin = await this.prismaClient.pinAlumni.findFirst({
                    where: {
                        alumniId: alumni.id,
                        managerId: existingManagerRespondent.manager?.id,
                        pinType: 'MANAGER',
                    },
                })

                if (existingPin) {
                    throw new Error(`Manager untuk alumni ini sudah memiliki PIN`)
                }
            }

            return this.prismaClient.$transaction(async (tx) => {
                // Create or get manager respondent (using manager email from C6)
                let managerRespondent = existingManagerRespondent
                
                if (!managerRespondent || managerRespondent.role !== 'MANAGER') {
                    // Create new manager respondent with data from C5 and C6
                    managerRespondent = await tx.respondent.create({
                        data: {
                            fullName: managerName, // From C5: Nama Atasan/Manager
                            email: managerEmail, // From C6: Email Atasan/Manager
                            role: 'MANAGER',
                        },
                    })
                } else {
                    // Update manager name if different
                    if (managerRespondent.fullName !== managerName) {
                        managerRespondent = await tx.respondent.update({
                            where: { id: managerRespondent.id },
                            data: { fullName: managerName },
                        })
                    }
                }

                // Get or create manager
                let manager = await tx.manager.findUnique({
                    where: { respondentId: managerRespondent.id },
                })

                if (!manager) {
                    // Create manager with data from C3, C4, C7
                    manager = await tx.manager.create({
                        data: {
                            company, // From C3: Nama Perusahaan/Instansi
                            position, // From C4: Jabatan/Posisi
                            phoneNumber: phoneNumber || null, // From C7: Nomor Telepon Atasan/Manager
                            respondentId: managerRespondent.id,
                        },
                        include: {
                            respondent: true,
                        },
                    })
                } else {
                    // Update manager data if needed
                    manager = await tx.manager.update({
                        where: { id: manager.id },
                        data: {
                            company: company || manager.company,
                            position: position || manager.position,
                            phoneNumber: phoneNumber || manager.phoneNumber,
                        },
                        include: {
                            respondent: true,
                        },
                    })
                }

                // Generate PIN baru untuk user survey (bukan menggunakan PIN alumni)
                const newPin = await this.generateUniquePin(tx)

                // Create new PIN record untuk manager (user survey)
                await tx.pinAlumni.create({
                    data: {
                        pin: newPin,
                        alumniId: alumni.id,
                        managerId: manager.id,
                        pinType: 'MANAGER',
                    },
                })

                this.logger.info(`Created new PIN ${newPin} for manager ${manager.id} and alumni ${alumni.id}`)

                return {
                    ...manager,
                    generatedPin: newPin, // Include generated PIN in response
                }
            })
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = ManagerRepository