const BaseRepository = require("../../shared/base/base.repository")

class SurveyRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.survey, logger)
        this.prismaClient = prisma
    }

    generateDefaultGreetings(type, name) {
        const isTracerStudy = type === 'TRACER_STUDY'

        const defaultGreetingOpening = {
            title: isTracerStudy ? 'Tracer Study Lulusan Universitas Andalas' : 'Survey Kepuasan Mahasiswa',
            greeting: {
                islamic: "Assalaamu'alaikum warahmatullaahi wabarakatuh",
                general: 'Salam sejahtera untuk kita semua'
            },
            addressee: isTracerStudy
                ? 'Kepada Yth. lulusan Universitas Andalas wisuda tahun 2023 Dimana saja berada.'
                : 'Kepada Yth. Mahasiswa Universitas Andalas',
            introduction: isTracerStudy
                ? 'Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi (Kemendikbudristek) telah meluncurkan program "Merdeka Belajar" yang mencakup beberapa terobosan untuk meningkatkan kualitas pendidikan tinggi.'
                : 'Dalam rangka meningkatkan kualitas layanan dan pendidikan di Universitas Andalas, kami mengundang Anda untuk berpartisipasi dalam survey kepuasan mahasiswa.',
            ikuList: {
                title: isTracerStudy ? 'Indikator Kinerja Utama (IKU) yang diukur:' : 'Aspek yang akan dievaluasi:',
                items: isTracerStudy
                    ? [
                        'Jumlah Lulusan mendapat pekerjaan',
                        'Jumlah Lulusan yang menjadi wirausaha, atau',
                        'Jumlah Lulusan yang melanjutkan studi',
                        'Jumlah lulusan yang belum bekerja/tidak bekerja'
                    ]
                    : [
                        'Kualitas pembelajaran dan dosen',
                        'Fasilitas kampus dan laboratorium',
                        'Layanan administrasi dan kemahasiswaan',
                        'Sarana dan prasarana pendukung'
                    ]
            },
            purpose: isTracerStudy
                ? 'Untuk mengukur kinerja tersebut, Perguruan Tinggi diwajibkan mengumpulkan data dari seluruh alumni yang telah lulus atau diwisuda dalam kurun waktu 1 tahun terakhir.'
                : 'Survey ini bertujuan untuk mengumpulkan feedback dari mahasiswa guna meningkatkan kualitas layanan dan pendidikan di Universitas Andalas.',
            expectation: isTracerStudy
                ? 'Partisipasi seluruh alumni sangat diharapkan untuk mengumpulkan data dan masukan agar Unand menjadi lebih baik.'
                : 'Partisipasi Anda sangat berharga untuk kemajuan kampus tercinta.',
            signOff: {
                department: isTracerStudy ? 'Pusat Karir, Konseling, dan Tracer Study' : 'Biro Kemahasiswaan dan Alumni',
                university: 'Universitas Andalas'
            }
        }

        const defaultGreetingClosing = {
            title: 'Terima Kasih',
            greeting: {
                islamic: "Wassalaamu'alaikum warahmatullaahi wabarakatuh",
                general: 'Salam sejahtera untuk kita semua'
            },
            addressee: isTracerStudy
                ? 'Kepada Yth. lulusan Universitas Andalas yang telah berpartisipasi dalam survey ini.'
                : 'Kepada Yth. Mahasiswa yang telah berpartisipasi',
            introduction: isTracerStudy
                ? 'Terima kasih atas partisipasi Anda dalam mengisi survey Tracer Study ini. Data yang Anda berikan sangat berharga untuk meningkatkan kualitas pendidikan di Universitas Andalas.'
                : 'Terima kasih atas partisipasi Anda dalam survey kepuasan mahasiswa ini.',
            expectation: isTracerStudy
                ? 'Kami berharap informasi yang telah Anda berikan dapat membantu kami dalam mengembangkan program studi dan layanan yang lebih baik untuk mahasiswa dan alumni di masa mendatang.'
                : 'Feedback Anda akan membantu kami meningkatkan kualitas layanan kampus.',
            signOff: {
                department: isTracerStudy ? 'Pusat Karir, Konseling, dan Tracer Study' : 'Biro Kemahasiswaan dan Alumni',
                university: 'Universitas Andalas'
            },
            contact: {
                phone: '(0751) 70537',
                email: isTracerStudy ? 'tracer@unand.ac.id' : 'kemahasiswaan@unand.ac.id',
                website: 'www.unand.ac.id'
            }
        }

        return { defaultGreetingOpening, defaultGreetingClosing }
    }

    async getSurveys(options = {}) {
        try {
            const { page = 1, limit = 10, search, status, targetRole } = options

            const where = {}
            if (status) {
                where.status = status
            }
            if (targetRole) {
                where.targetRole = targetRole
            }
            if (search) {
                where.OR = [
                    { description: { contains: search, mode: 'insensitive' } }
                ]
            }

            const result = await this.getAll({
                page,
                limit,
                where,
                orderBy: { createdAt: 'desc' }
            })

            // Get all counts in parallel for better performance
            const surveyIds = result.data.map(s => s.id)
            
            const [questionCounts, responseCounts, rulesCounts] = await Promise.all([
                // Question counts
                Promise.all(
                    surveyIds.map(async (id) => {
                        const count = await this.getQuestionCount(id)
                        return { id, count }
                    })
                ),
                // Response counts
                this.prismaClient.responseRespondent.groupBy({
                    by: ['surveyId'],
                    where: { surveyId: { in: surveyIds } },
                    _count: { surveyId: true }
                }),
                // Rules counts
                this.prismaClient.surveyRules.groupBy({
                    by: ['surveyId'],
                    where: { surveyId: { in: surveyIds } },
                    _count: { surveyId: true }
                })
            ])

            // Create maps for quick lookup
            const questionCountMap = new Map(questionCounts.map(qc => [qc.id, qc.count]))
            const responseCountMap = new Map(responseCounts.map(rc => [rc.surveyId, rc._count.surveyId]))
            const rulesCountMap = new Map(rulesCounts.map(rc => [rc.surveyId, rc._count.surveyId]))

            // Format surveys with calculated fields
            const formattedSurveys = result.data.map((survey) => {
                // Extract name from greetingOpening.title or use description
                const name = survey.greatingOpening?.title || survey.description || 'Survey'

                return {
                    id: survey.id,
                    name,
                    targetRole: survey.targetRole,
                    status: survey.status,
                    description: survey.description,
                    documentUrl: survey.documentUrl,
                    greatingOpening: survey.greatingOpening,
                    greetingClosing: survey.greetingClosing,
                    questionCount: questionCountMap.get(survey.id) || 0,
                    responseCount: responseCountMap.get(survey.id) || 0,
                    surveyRulesCount: rulesCountMap.get(survey.id) || 0,
                    createdAt: survey.createdAt,
                    updatedAt: survey.updatedAt
                }
            })

            return {
                surveys: formattedSurveys,
                meta: result.meta
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getSurveyById(id) {
        try {
            const survey = await this.prisma.findUnique({
                where: { id },
                include: {
                    surveyRules: {
                        include: {
                            faculty: true
                        }
                    },
                    CodeQuestion: {
                        include: {
                            Question: {
                                include: {
                                    answerQuestion: {
                                        orderBy: { sortOrder: 'asc' }
                                    },
                                    children: true
                                },
                                orderBy: { sortOrder: 'asc' }
                            }
                        }
                    }
                }
            })

            if (!survey) {
                throw new Error("Survey not found")
            }

            const questionCount = await this.prismaClient.question.count({
                where: {
                    codeId: {
                        in: survey.CodeQuestion.map(cq => cq.code)
                    }
                }
            })

            const responseCount = await this.prismaClient.responseRespondent.count({
                where: { surveyId: id }
            })

            const name = survey.greatingOpening?.title || survey.description || 'Survey'

            // Get major data for each rule separately since there's no relation in schema
            const surveyRulesWithMajor = await Promise.all(
                survey.surveyRules.map(async (rule) => {
                    let major = null
                    if (rule.majorId) {
                        const majorData = await this.prismaClient.major.findUnique({
                            where: { id: rule.majorId },
                            include: {
                                faculty: true
                            }
                        })
                        if (majorData) {
                            major = {
                                id: majorData.id,
                                majorName: majorData.majorName,
                                faculty: {
                                    id: majorData.faculty.id,
                                    facultyName: majorData.faculty.facultyName
                                }
                            }
                        }
                    }

                    return {
                        id: rule.id,
                        surveyId: rule.surveyId,
                        facultyId: rule.facultyId,
                        majorId: rule.majorId,
                        degree: rule.degree,
                        major,
                        createdAt: rule.createdAt,
                        updatedAt: rule.updatedAt
                    }
                })
            )

            return {
                id: survey.id,
                name,
                targetRole: survey.targetRole,
                status: survey.status,
                description: survey.description,
                documentUrl: survey.documentUrl,
                greatingOpening: survey.greatingOpening,
                greetingClosing: survey.greetingClosing,
                surveyRules: surveyRulesWithMajor,
                questionCount,
                responseCount,
                createdAt: survey.createdAt,
                updatedAt: survey.updatedAt
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async createSurvey(data) {
        try {
            const { name, type, description } = data

            // Map type to targetRole
            const targetRole = type === 'TRACER_STUDY' ? 'ALUMNI' : 'MANAGER'

            // Generate default greetings
            const { defaultGreetingOpening, defaultGreetingClosing } = this.generateDefaultGreetings(type, name)

            // Update title with survey name
            defaultGreetingOpening.title = name

            // Create survey
            const survey = await this.prisma.create({
                data: {
                    targetRole,
                    description,
                    status: 'DRAFT',
                    greatingOpening: defaultGreetingOpening,
                    greetingClosing: defaultGreetingClosing
                }
            })

            // Get counts
            const questionCount = 0
            const responseCount = 0
            const surveyRulesCount = 0

            return {
                id: survey.id,
                name,
                targetRole: survey.targetRole,
                status: survey.status,
                description: survey.description,
                documentUrl: survey.documentUrl,
                greatingOpening: survey.greatingOpening,
                greetingClosing: survey.greetingClosing,
                questionCount,
                responseCount,
                surveyRulesCount,
                createdAt: survey.createdAt,
                updatedAt: survey.updatedAt
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async updateSurvey(id, data) {
        try {
            // Check if survey exists
            const existingSurvey = await this.prisma.findUnique({
                where: { id }
            })

            if (!existingSurvey) {
                throw new Error("Survey not found")
            }

            // Build update data
            const updateData = {}
            if (data.targetRole) updateData.targetRole = data.targetRole
            if (data.status) updateData.status = data.status
            if (data.description !== undefined) updateData.description = data.description
            if (data.documentUrl !== undefined) updateData.documentUrl = data.documentUrl

            // Handle greeting updates
            if (data.greatingOpening) {
                const currentOpening = existingSurvey.greatingOpening || {}
                updateData.greatingOpening = {
                    ...currentOpening,
                    ...data.greatingOpening,
                    greeting: data.greatingOpening.greeting
                        ? { ...currentOpening.greeting, ...data.greatingOpening.greeting }
                        : currentOpening.greeting,
                    ikuList: data.greatingOpening.ikuList
                        ? { ...currentOpening.ikuList, ...data.greatingOpening.ikuList }
                        : currentOpening.ikuList,
                    signOff: data.greatingOpening.signOff
                        ? { ...currentOpening.signOff, ...data.greatingOpening.signOff }
                        : currentOpening.signOff
                }
            }

            if (data.greetingClosing) {
                const currentClosing = existingSurvey.greetingClosing || {}
                updateData.greetingClosing = {
                    ...currentClosing,
                    ...data.greetingClosing,
                    greeting: data.greetingClosing.greeting
                        ? { ...currentClosing.greeting, ...data.greetingClosing.greeting }
                        : currentClosing.greeting,
                    signOff: data.greetingClosing.signOff
                        ? { ...currentClosing.signOff, ...data.greetingClosing.signOff }
                        : currentClosing.signOff,
                    contact: data.greetingClosing.contact
                        ? { ...currentClosing.contact, ...data.greetingClosing.contact }
                        : currentClosing.contact
                }
            }

            // Update name if provided (update in greetingOpening.title)
            if (data.name) {
                const currentOpening = existingSurvey.greatingOpening || {}
                updateData.greatingOpening = {
                    ...currentOpening,
                    title: data.name,
                    ...(updateData.greatingOpening || {})
                }
            }

            // Update survey
            const updatedSurvey = await this.prisma.update({
                where: { id },
                data: updateData
            })

            // Get counts
            const questionCount = await this.getQuestionCount(id)
            const responseCount = await this.prismaClient.responseRespondent.count({
                where: { surveyId: id }
            })
            const surveyRulesCount = await this.prismaClient.surveyRules.count({
                where: { surveyId: id }
            })

            const name = updatedSurvey.greatingOpening?.title || updatedSurvey.description || 'Survey'

            return {
                id: updatedSurvey.id,
                name,
                targetRole: updatedSurvey.targetRole,
                status: updatedSurvey.status,
                description: updatedSurvey.description,
                documentUrl: updatedSurvey.documentUrl,
                greatingOpening: updatedSurvey.greatingOpening,
                greetingClosing: updatedSurvey.greetingClosing,
                questionCount,
                responseCount,
                surveyRulesCount,
                createdAt: updatedSurvey.createdAt,
                updatedAt: updatedSurvey.updatedAt
            }
        } catch (error) {
            this.logger.error(error)
            if (error.code === 'P2025') {
                throw new Error("Survey not found")
            }
            throw error
        }
    }

    async deleteSurvey(id) {
        try {
            // Check if survey has responses
            const responseCount = await this.prismaClient.responseRespondent.count({
                where: { surveyId: id }
            })

            if (responseCount > 0) {
                throw new Error("Cannot delete survey that has responses")
            }

            await this.prisma.delete({
                where: { id }
            })

            return true
        } catch (error) {
            this.logger.error(error)
            if (error.code === 'P2025') {
                throw new Error("Survey not found")
            }
            throw error
        }
    }

    async getSurveyRules(surveyId) {
        try {
            const rules = await this.prismaClient.surveyRules.findMany({
                where: { surveyId },
                include: {
                    faculty: true
                },
                orderBy: { createdAt: 'desc' }
            })

            // Get major data separately since there's no relation in schema
            const rulesWithMajor = await Promise.all(
                rules.map(async (rule) => {
                    let major = null
                    if (rule.majorId) {
                        const majorData = await this.prismaClient.major.findUnique({
                            where: { id: rule.majorId },
                            include: {
                                faculty: true
                            }
                        })
                        if (majorData) {
                            major = {
                                id: majorData.id,
                                majorName: majorData.majorName,
                                faculty: {
                                    id: majorData.faculty.id,
                                    facultyName: majorData.faculty.facultyName
                                }
                            }
                        }
                    }

                    return {
                        id: rule.id,
                        surveyId: rule.surveyId,
                        facultyId: rule.facultyId,
                        majorId: rule.majorId,
                        degree: rule.degree,
                        major,
                        createdAt: rule.createdAt,
                        updatedAt: rule.updatedAt
                    }
                })
            )

            return rulesWithMajor
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async createSurveyRule(surveyId, data) {
        try {
            // Validate survey exists
            const survey = await this.prisma.findUnique({
                where: { id: surveyId }
            })

            if (!survey) {
                throw new Error("Survey not found")
            }

            // Validate faculty exists
            const faculty = await this.prismaClient.faculty.findUnique({
                where: { id: data.facultyId }
            })

            if (!faculty) {
                throw new Error("Faculty not found")
            }

            // Validate major if provided
            if (data.majorId) {
                const major = await this.prismaClient.major.findUnique({
                    where: { id: data.majorId },
                    include: { faculty: true }
                })

                if (!major) {
                    throw new Error("Major not found")
                }

                if (major.facultyId !== data.facultyId) {
                    throw new Error("Major does not belong to the specified faculty")
                }
            }

            // Create rule
            const rule = await this.prismaClient.surveyRules.create({
                data: {
                    surveyId,
                    facultyId: data.facultyId,
                    majorId: data.majorId || null,
                    degree: data.degree
                }
            })

            // Get major data separately if exists
            let major = null
            if (rule.majorId) {
                const majorData = await this.prismaClient.major.findUnique({
                    where: { id: rule.majorId },
                    include: {
                        faculty: true
                    }
                })
                if (majorData) {
                    major = {
                        id: majorData.id,
                        majorName: majorData.majorName,
                        faculty: {
                            id: majorData.faculty.id,
                            facultyName: majorData.faculty.facultyName
                        }
                    }
                }
            }

            return {
                id: rule.id,
                surveyId: rule.surveyId,
                facultyId: rule.facultyId,
                majorId: rule.majorId,
                degree: rule.degree,
                major,
                createdAt: rule.createdAt,
                updatedAt: rule.updatedAt
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async updateSurveyRule(surveyId, id, data) {
        try {
            // Validate rule exists and belongs to survey
            const rule = await this.prismaClient.surveyRules.findUnique({
                where: { id }
            })

            if (!rule || rule.surveyId !== surveyId) {
                throw new Error("Survey rule not found")
            }

            // Validate faculty if provided
            if (data.facultyId) {
                const faculty = await this.prismaClient.faculty.findUnique({
                    where: { id: data.facultyId }
                })

                if (!faculty) {
                    throw new Error("Faculty not found")
                }
            }

            // Validate major if provided
            if (data.majorId) {
                const major = await this.prismaClient.major.findUnique({
                    where: { id: data.majorId },
                    include: { faculty: true }
                })

                if (!major) {
                    throw new Error("Major not found")
                }

                const facultyId = data.facultyId || rule.facultyId
                if (major.facultyId !== facultyId) {
                    throw new Error("Major does not belong to the specified faculty")
                }
            }

            // Update rule
            const updateData = {}
            if (data.facultyId) updateData.facultyId = data.facultyId
            if (data.majorId !== undefined) updateData.majorId = data.majorId
            if (data.degree) updateData.degree = data.degree

            const updatedRule = await this.prismaClient.surveyRules.update({
                where: { id },
                data: updateData
            })

            // Get major data separately if exists
            let major = null
            if (updatedRule.majorId) {
                const majorData = await this.prismaClient.major.findUnique({
                    where: { id: updatedRule.majorId },
                    include: {
                        faculty: true
                    }
                })
                if (majorData) {
                    major = {
                        id: majorData.id,
                        majorName: majorData.majorName,
                        faculty: {
                            id: majorData.faculty.id,
                            facultyName: majorData.faculty.facultyName
                        }
                    }
                }
            }

            return {
                id: updatedRule.id,
                surveyId: updatedRule.surveyId,
                facultyId: updatedRule.facultyId,
                majorId: updatedRule.majorId,
                degree: updatedRule.degree,
                major,
                createdAt: updatedRule.createdAt,
                updatedAt: updatedRule.updatedAt
            }
        } catch (error) {
            this.logger.error(error)
            if (error.code === 'P2025') {
                throw new Error("Survey rule not found")
            }
            throw error
        }
    }

    async deleteSurveyRule(surveyId, id) {
        try {
            // Validate rule exists and belongs to survey
            const rule = await this.prismaClient.surveyRules.findUnique({
                where: { id }
            })

            if (!rule || rule.surveyId !== surveyId) {
                throw new Error("Survey rule not found")
            }

            await this.prismaClient.surveyRules.delete({
                where: { id }
            })

            return true
        } catch (error) {
            this.logger.error(error)
            if (error.code === 'P2025') {
                throw new Error("Survey rule not found")
            }
            throw error
        }
    }

    async getSurveyQuestions(surveyId, codeId = null) {
        try {
            const where = { surveyId }
            if (codeId) {
                where.code = codeId
            }

            const codeQuestions = await this.prismaClient.codeQuestion.findMany({
                where,
                include: {
                    Question: {
                        include: {
                            answerQuestion: {
                                orderBy: { sortOrder: 'asc' }
                            },
                            children: {
                                include: {
                                    answerQuestion: {
                                        orderBy: { sortOrder: 'asc' }
                                    }
                                },
                                orderBy: { sortOrder: 'asc' }
                            }
                        },
                        orderBy: { sortOrder: 'asc' }
                    }
                }
            })

            // Format response
            const formattedCodeQuestions = codeQuestions.map(cq => ({
                code: cq.code,
                questions: cq.Question.map(q => ({
                    id: q.id,
                    parentId: q.parentId,
                    codeId: q.codeId,
                    groupQuestionId: q.groupQuestionId,
                    questionText: q.questionText,
                    questionType: q.questionType,
                    isRequired: q.isRequired,
                    sortOrder: q.sortOrder,
                    placeholder: q.placeholder,
                    searchplaceholder: q.searchplaceholder,
                    answerQuestion: q.answerQuestion.map(ao => ({
                        id: ao.id,
                        answerText: ao.answerText,
                        sortOrder: ao.sortOrder,
                        otherOptionPlaceholder: ao.otherOptionPlaceholder,
                        isTriggered: ao.isTriggered
                    })),
                    children: q.children.map(child => ({
                        id: child.id,
                        questionText: child.questionText,
                        questionType: child.questionType,
                        sortOrder: child.sortOrder
                    }))
                }))
            }))

            // Note: pages structure is not stored in DB, it's metadata
            // Can be stored as JSON or retrieved from separate table if needed
            return {
                codeQuestions: formattedCodeQuestions,
                pages: [] // Will be populated from builder save if stored
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async createCodeQuestion(surveyId, data) {
        try {
            const survey = await this.prisma.findUnique({
                where: { id: surveyId }
            })

            if (!survey) {
                throw new Error("Survey not found")
            }

            // Check if code already exists
            const existingCode = await this.prismaClient.codeQuestion.findUnique({
                where: { code: data.code }
            })

            if (existingCode) {
                throw new Error("CodeQuestion code already exists")
            }

            // Create CodeQuestion and Questions in transaction
            const result = await this.prismaClient.$transaction(async (tx) => {
                // Create CodeQuestion
                const codeQuestion = await tx.codeQuestion.create({
                    data: {
                        code: data.code,
                        surveyId
                    }
                })

                // Create Questions
                const createdQuestions = []
                for (const questionData of data.questions) {
                    // Create question first
                    const question = await tx.question.create({
                        data: {
                            codeId: data.code,
                            parentId: questionData.parentId || null,
                            groupQuestionId: questionData.groupQuestionId,
                            questionText: questionData.questionText,
                            questionType: questionData.questionType,
                            isRequired: questionData.isRequired || false,
                            sortOrder: questionData.sortOrder,
                            placeholder: questionData.placeholder || '',
                            searchplaceholder: questionData.searchplaceholder || ''
                        }
                    })

                    // Create answer options after question is created
                    if (questionData.answerQuestion && questionData.answerQuestion.length > 0) {
                        for (const optionData of questionData.answerQuestion) {
                            await tx.answerOptionQuestion.create({
                                data: {
                                    questionId: question.id,
                                    answerText: optionData.answerText,
                                    sortOrder: optionData.sortOrder,
                                    otherOptionPlaceholder: optionData.otherOptionPlaceholder || null,
                                    isTriggered: optionData.isTriggered || false
                                }
                            })
                        }
                    }

                    createdQuestions.push(question)
                }

                return { codeQuestion, questions: createdQuestions }
            })

            // Get questions with answer options
            const questionsWithOptions = await Promise.all(
                result.questions.map(async (q) => {
                    const answerOptions = await this.prismaClient.answerOptionQuestion.findMany({
                        where: { questionId: q.id },
                        orderBy: { sortOrder: 'asc' }
                    })

                    return {
                        id: q.id,
                        codeId: q.codeId,
                        parentId: q.parentId,
                        groupQuestionId: q.groupQuestionId,
                        questionText: q.questionText,
                        questionType: q.questionType,
                        isRequired: q.isRequired,
                        sortOrder: q.sortOrder,
                        placeholder: q.placeholder,
                        searchplaceholder: q.searchplaceholder,
                        answerQuestion: answerOptions.map(ao => ({
                            id: ao.id,
                            answerText: ao.answerText,
                            sortOrder: ao.sortOrder,
                            otherOptionPlaceholder: ao.otherOptionPlaceholder,
                            isTriggered: ao.isTriggered
                        }))
                    }
                })
            )

            return {
                code: result.codeQuestion.code,
                surveyId: result.codeQuestion.surveyId,
                questions: questionsWithOptions
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async updateQuestion(surveyId, id, data) {
        try {
            // Validate question exists and belongs to survey
            const question = await this.prismaClient.question.findUnique({
                where: { id },
                include: {
                    codeQuestion: true
                }
            })

            if (!question || question.codeQuestion.surveyId !== surveyId) {
                throw new Error("Question not found")
            }

            // Update question
            const updateData = {}
            if (data.questionText) updateData.questionText = data.questionText
            if (data.questionType) updateData.questionType = data.questionType
            if (data.isRequired !== undefined) updateData.isRequired = data.isRequired
            if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
            if (data.placeholder !== undefined) updateData.placeholder = data.placeholder
            if (data.searchplaceholder !== undefined) updateData.searchplaceholder = data.searchplaceholder
            if (data.parentId !== undefined) updateData.parentId = data.parentId
            if (data.groupQuestionId) updateData.groupQuestionId = data.groupQuestionId

            // Handle answer options update
            if (data.answerQuestion && Array.isArray(data.answerQuestion)) {
                // Delete existing answer options
                await this.prismaClient.answerOptionQuestion.deleteMany({
                    where: { questionId: id }
                })

                // Create new answer options
                for (const optionData of data.answerQuestion) {
                    await this.prismaClient.answerOptionQuestion.create({
                        data: {
                            questionId: id,
                            answerText: optionData.answerText,
                            sortOrder: optionData.sortOrder,
                            otherOptionPlaceholder: optionData.otherOptionPlaceholder || null,
                            isTriggered: optionData.isTriggered || false
                        }
                    })
                }
            }

            const updatedQuestion = await this.prismaClient.question.update({
                where: { id },
                data: updateData,
                include: {
                    answerQuestion: {
                        orderBy: { sortOrder: 'asc' }
                    }
                }
            })

            return {
                id: updatedQuestion.id,
                codeId: updatedQuestion.codeId,
                parentId: updatedQuestion.parentId,
                groupQuestionId: updatedQuestion.groupQuestionId,
                questionText: updatedQuestion.questionText,
                questionType: updatedQuestion.questionType,
                isRequired: updatedQuestion.isRequired,
                sortOrder: updatedQuestion.sortOrder,
                placeholder: updatedQuestion.placeholder,
                searchplaceholder: updatedQuestion.searchplaceholder,
                answerQuestion: updatedQuestion.answerQuestion.map(ao => ({
                    id: ao.id,
                    answerText: ao.answerText,
                    sortOrder: ao.sortOrder,
                    otherOptionPlaceholder: ao.otherOptionPlaceholder,
                    isTriggered: ao.isTriggered
                }))
            }
        } catch (error) {
            this.logger.error(error)
            if (error.code === 'P2025') {
                throw new Error("Question not found")
            }
            throw error
        }
    }

    async deleteQuestion(surveyId, id) {
        try {
            // Validate question exists and belongs to survey
            const question = await this.prismaClient.question.findUnique({
                where: { id },
                include: {
                    codeQuestion: true
                }
            })

            if (!question || question.codeQuestion.surveyId !== surveyId) {
                throw new Error("Question not found")
            }

            // Delete answer options first
            await this.prismaClient.answerOptionQuestion.deleteMany({
                where: { questionId: id }
            })

            // Delete question
            await this.prismaClient.question.delete({
                where: { id }
            })

            return true
        } catch (error) {
            this.logger.error(error)
            if (error.code === 'P2025') {
                throw new Error("Question not found")
            }
            throw error
        }
    }

    async reorderQuestions(surveyId, questionOrders) {
        try {
            // Update sortOrder for each question
            await Promise.all(
                questionOrders.map(order =>
                    this.prismaClient.question.update({
                        where: { id: order.questionId },
                        data: { sortOrder: order.sortOrder }
                    })
                )
            )

            return true
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async saveBuilder(surveyId, data) {
        try {
            // Validate survey exists
            const survey = await this.prisma.findUnique({
                where: { id: surveyId }
            })

            if (!survey) {
                throw new Error("Survey not found")
            }

            // Use transaction to ensure data consistency
            await this.prismaClient.$transaction(async (tx) => {
                // Process questions
                for (const questionData of data.questions) {
                    // Create or update CodeQuestion if needed
                    const codeQuestion = await tx.codeQuestion.upsert({
                        where: { code: questionData.codeId },
                        update: {},
                        create: {
                            code: questionData.codeId,
                            surveyId
                        }
                    })

                    // Create or update Question
                    if (questionData.id) {
                        // Update existing question
                        const updateData = {
                            questionText: questionData.questionText,
                            questionType: questionData.questionType,
                            isRequired: questionData.isRequired || false,
                            sortOrder: questionData.sortOrder,
                            placeholder: questionData.placeholder || '',
                            searchplaceholder: questionData.searchplaceholder || '',
                            parentId: questionData.parentId || null,
                            groupQuestionId: questionData.groupQuestionId
                        }

                        await tx.question.update({
                            where: { id: questionData.id },
                            data: updateData
                        })

                        // Update answer options
                        if (questionData.answerQuestion && questionData.answerQuestion.length > 0) {
                            // Get existing options
                            const existingOptions = await tx.answerOptionQuestion.findMany({
                                where: { questionId: questionData.id }
                            })

                            const existingOptionIds = new Set(existingOptions.map(o => o.id))
                            const incomingOptionIds = new Set(
                                questionData.answerQuestion
                                    .filter(o => o.id)
                                    .map(o => o.id)
                            )

                            // Delete options that are not in incoming data
                            const toDelete = existingOptions.filter(o => !incomingOptionIds.has(o.id))
                            if (toDelete.length > 0) {
                                await tx.answerOptionQuestion.deleteMany({
                                    where: {
                                        id: { in: toDelete.map(o => o.id) }
                                    }
                                })
                            }

                            // Update or create options
                            for (const optionData of questionData.answerQuestion) {
                                if (optionData.id && existingOptionIds.has(optionData.id)) {
                                    // Update existing
                                    await tx.answerOptionQuestion.update({
                                        where: { id: optionData.id },
                                        data: {
                                            answerText: optionData.answerText,
                                            sortOrder: optionData.sortOrder,
                                            otherOptionPlaceholder: optionData.otherOptionPlaceholder || null,
                                            isTriggered: optionData.isTriggered || false
                                        }
                                    })
                                } else {
                                    // Create new
                                    await tx.answerOptionQuestion.create({
                                        data: {
                                            questionId: questionData.id,
                                            answerText: optionData.answerText,
                                            sortOrder: optionData.sortOrder,
                                            otherOptionPlaceholder: optionData.otherOptionPlaceholder || null,
                                            isTriggered: optionData.isTriggered || false
                                        }
                                    })
                                }
                            }
                        } else {
                            // Delete all if no answerQuestion provided
                            await tx.answerOptionQuestion.deleteMany({
                                where: { questionId: questionData.id }
                            })
                        }
                    } else {
                        // Create new question
                        const question = await tx.question.create({
                            data: {
                                codeId: questionData.codeId,
                                parentId: questionData.parentId || null,
                                groupQuestionId: questionData.groupQuestionId,
                                questionText: questionData.questionText,
                                questionType: questionData.questionType,
                                isRequired: questionData.isRequired || false,
                                sortOrder: questionData.sortOrder,
                                placeholder: questionData.placeholder || '',
                                searchplaceholder: questionData.searchplaceholder || ''
                            }
                        })

                        // Create answer options
                        if (questionData.answerQuestion && questionData.answerQuestion.length > 0) {
                            for (const optionData of questionData.answerQuestion) {
                                await tx.answerOptionQuestion.create({
                                    data: {
                                        questionId: question.id,
                                        answerText: optionData.answerText,
                                        sortOrder: optionData.sortOrder,
                                        otherOptionPlaceholder: optionData.otherOptionPlaceholder || null,
                                        isTriggered: optionData.isTriggered || false
                                    }
                                })
                            }
                        }
                    }
                }

                // Note: Pages structure can be stored as JSON in survey or separate table
                // For now, we'll skip storing pages as it's UI metadata
            })

            // Get counts
            const totalQuestions = await this.getQuestionCount(surveyId)
            const totalPages = data.pages ? data.pages.length : 0

            return {
                surveyId,
                totalQuestions,
                totalPages
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    // Helper methods
    async getQuestionCount(surveyId) {
        try {
            const codeQuestions = await this.prismaClient.codeQuestion.findMany({
                where: { surveyId },
                select: { code: true }
            })

            if (codeQuestions.length === 0) return 0

            const codeIds = codeQuestions.map(cq => cq.code)
            return await this.prismaClient.question.count({
                where: { codeId: { in: codeIds } }
            })
        } catch (error) {
            this.logger.error(error)
            return 0
        }
    }
}

module.exports = SurveyRepository

