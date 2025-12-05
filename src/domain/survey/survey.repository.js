const BaseRepository = require("../../shared/base/base.repository")
const QuestionDeleteUtil = require("../../shared/utils/question-delete.util")

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

            if (result.data.length === 0) {
                return {
                    surveys: [],
                    meta: result.meta
                }
            }

            const surveyIds = result.data.map(s => s.id)

            const [codeQuestions, responseCounts, rulesCounts] = await Promise.all([
                this.prismaClient.codeQuestion.findMany({
                    where: { surveyId: { in: surveyIds } },
                    select: {
                        surveyId: true,
                        code: true
                    }
                }),
                this.prismaClient.responseRespondent.groupBy({
                    by: ['surveyId'],
                    where: { surveyId: { in: surveyIds } },
                    _count: { surveyId: true }
                }),
                this.prismaClient.surveyRules.groupBy({
                    by: ['surveyId'],
                    where: { surveyId: { in: surveyIds } },
                    _count: { surveyId: true }
                })
            ])

            // Count only parent questions (children are part of parent, e.g., rating items)
            const questionCountMap = new Map()
            if (codeQuestions.length > 0) {
                const codeIds = codeQuestions.map(cq => cq.code)
                const parentQuestionCounts = await this.prismaClient.question.groupBy({
                    by: ['codeId'],
                    where: {
                        codeId: { in: codeIds },
                        parentId: null // Only count parent questions
                    },
                    _count: { id: true }
                })

                // Map question counts by surveyId
                const codeToSurveyId = new Map(codeQuestions.map(cq => [cq.code, cq.surveyId]))
                parentQuestionCounts.forEach(pqc => {
                    const surveyId = codeToSurveyId.get(pqc.codeId)
                    if (surveyId) {
                        const current = questionCountMap.get(surveyId) || 0
                        questionCountMap.set(surveyId, current + pqc._count.id)
                    }
                })
            }

            this.logger.info(`[getSurveys] Question counts calculated: ${JSON.stringify(Array.from(questionCountMap.entries()))}`)

            const responseCountMap = new Map(responseCounts.map(rc => [rc.surveyId, rc._count.surveyId]))
            const rulesCountMap = new Map(rulesCounts.map(rc => [rc.surveyId, rc._count.surveyId]))

            const formattedSurveys = result.data.map((survey) => {
                const name = survey.greetingOpening?.title || survey.description || 'Survey'

                return {
                    id: survey.id,
                    name,
                    questionCount: questionCountMap.get(survey.id) || 0,
                    responseCount: responseCountMap.get(survey.id) || 0,
                    status: survey.status,
                    surveyRulesCount: rulesCountMap.get(survey.id) || 0,
                    targetRole: survey.targetRole
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
                    surveyRules: true,
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

            const [questionCount, responseCount] = await Promise.all([
                this.prismaClient.question.count({
                    where: {
                        codeId: {
                            in: survey.CodeQuestion.map(cq => cq.code)
                        },
                        parentId: null // Only count parent questions
                    }
                }),
                this.prismaClient.responseRespondent.count({
                    where: { surveyId: id }
                })
            ])

            this.logger.info(`[getSurveyById] SurveyId: ${id}, Question Count: ${questionCount}, CodeIds: ${JSON.stringify(survey.CodeQuestion.map(cq => cq.code))}`)

            const name = survey.greetingOpening?.title || survey.description || 'Survey'

            const surveyRulesFormatted = survey.surveyRules.map(rule => ({
                id: rule.id,
                surveyId: rule.surveyId,
                degree: rule.degree,
                createdAt: rule.createdAt,
                updatedAt: rule.updatedAt
            }))

            return {
                id: survey.id,
                name,
                targetRole: survey.targetRole,
                status: survey.status,
                description: survey.description,
                documentUrl: survey.documentUrl,
                greetingOpening: survey.greetingOpening,
                greetingClosing: survey.greetingClosing,
                surveyRules: surveyRulesFormatted,
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
                    greetingOpening: defaultGreetingOpening,
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
                greetingOpening: survey.greetingOpening,
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
            if (data.greetingOpening) {
                const currentOpening = existingSurvey.greetingOpening || {}
                updateData.greetingOpening = {
                    ...currentOpening,
                    ...data.greetingOpening,
                    greeting: data.greetingOpening.greeting
                        ? { ...currentOpening.greeting, ...data.greetingOpening.greeting }
                        : currentOpening.greeting,
                    ikuList: data.greetingOpening.ikuList
                        ? { ...currentOpening.ikuList, ...data.greetingOpening.ikuList }
                        : currentOpening.ikuList,
                    signOff: data.greetingOpening.signOff
                        ? { ...currentOpening.signOff, ...data.greetingOpening.signOff }
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
                const currentOpening = existingSurvey.greetingOpening || {}
                updateData.greetingOpening = {
                    ...currentOpening,
                    title: data.name,
                    ...(updateData.greetingOpening || {})
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

            const name = updatedSurvey.greetingOpening?.title || updatedSurvey.description || 'Survey'

            return {
                id: updatedSurvey.id,
                name,
                targetRole: updatedSurvey.targetRole,
                status: updatedSurvey.status,
                description: updatedSurvey.description,
                documentUrl: updatedSurvey.documentUrl,
                greetingOpening: updatedSurvey.greetingOpening,
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
            const ErrorHttp = require("../../shared/http/error.http")
            
            // Check if survey exists
            const survey = await this.prisma.findUnique({
                where: { id }
            })

            if (!survey) {
                throw new ErrorHttp(404, "Survey not found")
            }

            // Check if survey has responses using count for better performance
            const responseCount = await this.prismaClient.responseRespondent.count({
                where: { surveyId: id }
            })

            if (responseCount > 0) {
                throw new ErrorHttp(400, "Cannot delete survey that has responses. Survey dengan response tidak dapat dihapus.")
            }

            // Delete all related data in transaction
            await this.prismaClient.$transaction(async (tx) => {
                // Get all questions for this survey first
                const codeQuestions = await tx.codeQuestion.findMany({
                    where: { surveyId: id },
                    include: {
                        Question: {
                            select: { id: true }
                        }
                    }
                })

                const allQuestionIds = codeQuestions.flatMap(cq => cq.Question.map(q => q.id))

                // 1. Delete AnswerMultipleChoice and Answer (if any orphaned data exists)
                if (allQuestionIds.length > 0) {
                    // Delete AnswerMultipleChoice first (has composite key)
                    await tx.answerMultipleChoice.deleteMany({
                        where: {
                            questionId: { in: allQuestionIds }
                        }
                    })

                    // Delete Answer
                    await tx.answer.deleteMany({
                        where: {
                            questionId: { in: allQuestionIds }
                        }
                    })
                }

                // 2. Delete all questions and related data using centralized utility
                // This will handle QuestionTree, AnswerOptionQuestion, and Question itself
                for (const questionId of allQuestionIds) {
                    await QuestionDeleteUtil.deleteQuestionRecursive(tx, questionId)
                }

                // 3. Delete all CodeQuestions (must be after Questions are deleted)
                await tx.codeQuestion.deleteMany({
                    where: { surveyId: id }
                })

                // 4. Delete all SurveyRules
                await tx.surveyRules.deleteMany({
                    where: { surveyId: id }
                })

                // 5. Get all BlastEmail IDs first
                const blastEmails = await tx.blastEmail.findMany({
                    where: { surveyId: id },
                    select: { id: true }
                })
                const blastEmailIds = blastEmails.map(be => be.id)

                // 6. Delete all BlastEmailRespondent first (child of BlastEmail)
                if (blastEmailIds.length > 0) {
                    await tx.blastEmailRespondent.deleteMany({
                        where: { blastEmailId: { in: blastEmailIds } }
                    })
                }

                // 7. Delete all BlastEmail
                await tx.blastEmail.deleteMany({
                    where: { surveyId: id }
                })

                // 8. Finally delete the survey
                await tx.survey.delete({
                    where: { id }
                })
            })

            return true
        } catch (error) {
            this.logger.error(error)
            if (error.code === 'P2025') {
                throw new Error("Survey not found")
            }
            if (error.code === 'P2003') {
                // Foreign key constraint error
                this.logger.error(`Foreign key constraint error when deleting survey ${id}:`, error)
                throw new Error("Cannot delete survey. Masih ada data yang terkait dengan survey ini. Pastikan semua data terkait sudah dihapus.")
            }
            if (error.message && error.message.includes("Cannot delete survey that has responses")) {
                throw error
            }
            throw error
        }
    }

    async getSurveyRules(surveyId) {
        try {
            const rules = await this.prismaClient.surveyRules.findMany({
                where: { surveyId },
                orderBy: { createdAt: 'desc' }
            })

            return rules.map(rule => ({
                id: rule.id,
                surveyId: rule.surveyId,
                degree: rule.degree,
                createdAt: rule.createdAt,
                updatedAt: rule.updatedAt
            }))
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

            // Check for duplicate rule (same degree for same survey)
            const existingRule = await this.prismaClient.surveyRules.findFirst({
                where: {
                    surveyId,
                    degree: data.degree
                }
            })

            if (existingRule) {
                throw new Error(`Rule untuk tingkat pendidikan ${data.degree} sudah ada`)
            }

            // Create rule
            const rule = await this.prismaClient.surveyRules.create({
                data: {
                    surveyId,
                    degree: data.degree
                }
            })

            return {
                id: rule.id,
                surveyId: rule.surveyId,
                degree: rule.degree,
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

            // Check for duplicate rule if degree is being updated
            if (data.degree && data.degree !== rule.degree) {
                const existingRule = await this.prismaClient.surveyRules.findFirst({
                    where: {
                        surveyId,
                        degree: data.degree,
                        id: { not: id }
                    }
                })

                if (existingRule) {
                    throw new Error(`Rule untuk tingkat pendidikan ${data.degree} sudah ada`)
                }
            }

            // Update rule
            const updateData = {}
            if (data.degree) updateData.degree = data.degree

            const updatedRule = await this.prismaClient.surveyRules.update({
                where: { id },
                data: updateData
            })

            return {
                id: updatedRule.id,
                surveyId: updatedRule.surveyId,
                degree: updatedRule.degree,
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
                            },
                            questionTreeAsTrigger: {
                                include: {
                                    answerQuestionTrigger: true,
                                    questionPointerTo: {
                                        select: {
                                            id: true,
                                            questionText: true
                                        }
                                    }
                                }
                            }
                        },
                        orderBy: { sortOrder: 'asc' }
                    }
                }
            })

            // Format response
            // First, collect all questions (parents + children) to avoid duplicates
            const allQuestionsMap = new Map()
            
            codeQuestions.forEach(cq => {
                cq.Question.forEach(q => {
                    // Add parent question
                    if (!allQuestionsMap.has(q.id)) {
                        // Map questionTreeAsTrigger to questionTree format
                        const questionTree = (q.questionTreeAsTrigger || []).map(tree => ({
                            answerQuestionTriggerId: tree.answerQuestionTriggerId,
                            questionPointerToId: tree.questionPointerToId
                        }))
                        
                        allQuestionsMap.set(q.id, {
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
                            questionCode: cq.code,
                            pageNumber: q.pageNumber || null, // Include pageNumber from database
                            answerQuestion: q.answerQuestion.map(ao => ({
                                id: ao.id,
                                answerText: ao.answerText,
                                sortOrder: ao.sortOrder,
                                otherOptionPlaceholder: ao.otherOptionPlaceholder,
                                isTriggered: ao.isTriggered
                            })),
                            questionTree: questionTree.length > 0 ? questionTree : undefined, // Include questionTree if exists
                            children: [] // Will be populated below
                        })
                    }
                    
                    // Add children questions to map and to parent's children array
                    q.children.forEach(child => {
                        if (!allQuestionsMap.has(child.id)) {
                            // Child questions use parent's pageNumber if not set
                            const childPageNumber = child.pageNumber || q.pageNumber || null
                            allQuestionsMap.set(child.id, {
                                id: child.id,
                                parentId: child.parentId || q.id,
                                codeId: child.codeId || q.codeId,
                                groupQuestionId: child.groupQuestionId || q.groupQuestionId,
                                questionText: child.questionText,
                                questionType: child.questionType,
                                isRequired: child.isRequired || false,
                                sortOrder: child.sortOrder,
                                placeholder: child.placeholder,
                                searchplaceholder: child.searchplaceholder,
                                questionCode: cq.code,
                                pageNumber: childPageNumber, // Use parent's pageNumber if not set
                                answerQuestion: child.answerQuestion ? child.answerQuestion.map(ao => ({
                                    id: ao.id,
                                    answerText: ao.answerText,
                                    sortOrder: ao.sortOrder,
                                    otherOptionPlaceholder: ao.otherOptionPlaceholder,
                                    isTriggered: ao.isTriggered
                                })) : [],
                                children: []
                            })
                        }
                        
                        // Add to parent's children array (metadata only)
                        const parentQuestion = allQuestionsMap.get(q.id)
                        if (parentQuestion) {
                            parentQuestion.children.push({
                                id: child.id,
                                questionText: child.questionText,
                                questionType: child.questionType,
                                sortOrder: child.sortOrder
                            })
                        }
                    })
                })
            })
            
            // Group questions back by code (for backward compatibility)
            const formattedCodeQuestions = codeQuestions.map(cq => {
                const codeQuestions = []
                cq.Question.forEach(q => {
                    const questionData = allQuestionsMap.get(q.id)
                    if (questionData) {
                        codeQuestions.push(questionData)
                    }
                })
                
                return {
                    code: cq.code,
                    questions: codeQuestions
                }
            })

            // Generate pages from pageNumber (from database) instead of codeQuestion
            // Group all questions by pageNumber
            const questionsByPageNumber = new Map()
            Array.from(allQuestionsMap.values()).forEach(q => {
                const pageNum = q.pageNumber || 1
                if (!questionsByPageNumber.has(pageNum)) {
                    questionsByPageNumber.set(pageNum, [])
                }
                questionsByPageNumber.get(pageNum).push(q)
            })

            // Create pages from pageNumber groups
            const pageNumbers = Array.from(questionsByPageNumber.keys()).sort((a, b) => a - b)
            const pages = pageNumbers.map((pageNum) => {
                // Only get parent question IDs (questions without parentId or with null parentId)
                const pageQuestions = questionsByPageNumber.get(pageNum) || []
                const questionIds = pageQuestions
                    .filter(q => !q.parentId)
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map(q => q.id)

                // Extract prefix from first question's codeId for description (e.g., "A1-tracer..." -> "A")
                const firstQuestion = pageQuestions.find(q => !q.parentId)
                let codePrefix = ''
                if (firstQuestion && firstQuestion.codeId) {
                    // Extract prefix from codeId (e.g., "A1-tracer-study-alumni-2024" -> "A")
                    const match = firstQuestion.codeId.match(/^([A-Z])/)
                    codePrefix = match ? match[1] : ''
                }

                return {
                    page: pageNum,
                    title: `Halaman ${pageNum}`,
                    description: codePrefix ? `Pertanyaan ${codePrefix}` : `Halaman ${pageNum}`,
                    codeId: codePrefix, // Use prefix instead of full code
                    questionIds: questionIds
                }
            })
            
            // Flatten all questions (parents + children) for frontend
            // pageNumber is already set from database
            const allQuestionsFlat = Array.from(allQuestionsMap.values()).map(q => {
                return {
                    ...q,
                    pageNumber: q.pageNumber || 1, // Use pageNumber from database, fallback to 1
                    questionTree: q.questionTree || undefined // Include questionTree if exists
                }
            })

            return {
                codeQuestions: formattedCodeQuestions,
                pages: pages,
                questions: allQuestionsFlat // Include all questions (parents + children) for frontend
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

                const createdQuestions = []
                for (const questionData of data.questions) {
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

                    if (questionData.answerQuestion && questionData.answerQuestion.length > 0) {
                        await tx.answerOptionQuestion.createMany({
                            data: questionData.answerQuestion.map(opt => ({
                                questionId: question.id,
                                answerText: opt.answerText,
                                sortOrder: opt.sortOrder,
                                otherOptionPlaceholder: opt.otherOptionPlaceholder || null,
                                isTriggered: opt.isTriggered || false
                            }))
                        })
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
            const result = await this.prismaClient.$transaction(async (tx) => {
                const question = await tx.question.findUnique({
                    where: { id },
                    include: {
                        codeQuestion: true
                    }
                })

                if (!question || question.codeQuestion.surveyId !== surveyId) {
                    throw new Error("Question not found")
                }

                const updateData = {}
                if (data.questionText) updateData.questionText = data.questionText
                if (data.questionType) updateData.questionType = data.questionType
                if (data.isRequired !== undefined) updateData.isRequired = data.isRequired
                if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
                if (data.placeholder !== undefined) updateData.placeholder = data.placeholder
                if (data.searchplaceholder !== undefined) updateData.searchplaceholder = data.searchplaceholder
                if (data.parentId !== undefined) updateData.parentId = data.parentId
                if (data.groupQuestionId) updateData.groupQuestionId = data.groupQuestionId

                if (data.answerQuestion && Array.isArray(data.answerQuestion)) {
                    await tx.answerOptionQuestion.deleteMany({
                        where: { questionId: id }
                    })

                    if (data.answerQuestion.length > 0) {
                        await tx.answerOptionQuestion.createMany({
                            data: data.answerQuestion.map(opt => ({
                                questionId: id,
                                answerText: opt.answerText,
                                sortOrder: opt.sortOrder,
                                otherOptionPlaceholder: opt.otherOptionPlaceholder || null,
                                isTriggered: opt.isTriggered || false
                            }))
                        })
                    }
                }

                return await tx.question.update({
                    where: { id },
                    data: updateData,
                    include: {
                        answerQuestion: {
                            orderBy: { sortOrder: 'asc' }
                        }
                    }
                })
            })

            return {
                id: result.id,
                codeId: result.codeId,
                parentId: result.parentId,
                groupQuestionId: result.groupQuestionId,
                questionText: result.questionText,
                questionType: result.questionType,
                isRequired: result.isRequired,
                sortOrder: result.sortOrder,
                placeholder: result.placeholder,
                searchplaceholder: result.searchplaceholder,
                answerQuestion: result.answerQuestion.map(ao => ({
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
            await this.prismaClient.$transaction(async (tx) => {
                const question = await tx.question.findUnique({
                    where: { id },
                    include: {
                        codeQuestion: true
                    }
                })

                if (!question || question.codeQuestion.surveyId !== surveyId) {
                    throw new Error("Question not found")
                }

                // Use centralized recursive delete utility
                await QuestionDeleteUtil.deleteQuestionRecursive(tx, id)
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

    async deleteCodeQuestion(surveyId, codeId) {
        try {
            // Verify that codeQuestion exists and belongs to the survey
            const codeQuestion = await this.prismaClient.codeQuestion.findUnique({
                where: { code: codeId },
                include: {
                    Question: {
                        include: {
                            children: true,
                            answerQuestion: true,
                            questionTreeAsTrigger: true,
                            questionTreeAsPointer: true
                        }
                    }
                }
            })

            if (!codeQuestion || codeQuestion.surveyId !== surveyId) {
                throw new Error("CodeQuestion not found")
            }

            // Delete all questions and related data in transaction
            await this.prismaClient.$transaction(async (tx) => {
                // Delete all questions in this codeQuestion using centralized utility
                for (const question of codeQuestion.Question || []) {
                    await QuestionDeleteUtil.deleteQuestionRecursive(tx, question.id)
                }

                // Finally delete the CodeQuestion
                await tx.codeQuestion.delete({
                    where: { code: codeId }
                })
            })

            return true
        } catch (error) {
            this.logger.error(error)
            if (error.code === 'P2025') {
                throw new Error("CodeQuestion not found")
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
                // Separate parent and child questions
                // Process child questions first, then parent questions
                const parentQuestions = data.questions.filter(q => !q.parentId)
                const childQuestions = data.questions.filter(q => q.parentId)
                
                // Process all questions (children first, then parents)
                const allQuestionsToProcess = [...childQuestions, ...parentQuestions]
                
                // Process questions
                for (const questionData of allQuestionsToProcess) {
                    // Create or update CodeQuestion if needed
                    const codeQuestion = await tx.codeQuestion.upsert({
                        where: { code: questionData.codeId },
                        update: {},
                        create: {
                            code: questionData.codeId,
                            surveyId
                        }
                    })

                    // Create or update GroupQuestion if needed
                    if (questionData.groupQuestionId) {
                        await tx.groupQuestion.upsert({
                            where: { id: questionData.groupQuestionId },
                            update: {},
                            create: {
                                id: questionData.groupQuestionId,
                                groupName: `Group ${questionData.groupQuestionId.substring(0, 8)}`
                            }
                        })
                    }

                    // Create or update Question
                    if (questionData.id) {
                        // Check if question exists
                        const existingQuestion = await tx.question.findUnique({
                            where: { id: questionData.id }
                        })

                        if (existingQuestion) {
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
                        } else {
                            // Create new question with provided ID
                            await tx.question.create({
                                data: {
                                    id: questionData.id,
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

                            // Create answer options for new question
                            if (questionData.answerQuestion && questionData.answerQuestion.length > 0) {
                                for (const opt of questionData.answerQuestion) {
                                    const createData = {
                                        questionId: questionData.id,
                                        answerText: opt.answerText,
                                        sortOrder: opt.sortOrder,
                                        otherOptionPlaceholder: opt.otherOptionPlaceholder || null,
                                        isTriggered: opt.isTriggered || false
                                    }
                                    if (opt.id) {
                                        createData.id = opt.id
                                    }
                                    await tx.answerOptionQuestion.create({
                                        data: createData
                                    })
                                }
                            }
                            continue
                        }

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

                            // Match incoming options with existing options
                            // First by ID, then by answerText + sortOrder if ID not provided
                            const matchedExistingIds = new Set()
                            for (const incomingOpt of questionData.answerQuestion) {
                                if (incomingOpt.id && existingOptionIds.has(incomingOpt.id)) {
                                    // Matched by ID
                                    matchedExistingIds.add(incomingOpt.id)
                                } else if (!incomingOpt.id) {
                                    // No ID provided, try to match by answerText + sortOrder
                                    const matched = existingOptions.find(
                                        eo => eo.answerText === incomingOpt.answerText && 
                                              eo.sortOrder === incomingOpt.sortOrder
                                    )
                                    if (matched) {
                                        matchedExistingIds.add(matched.id)
                                        // Update the incoming option to include the matched ID
                                        incomingOpt.id = matched.id
                                    }
                                }
                            }

                            // Delete options that are not matched AND not used in QuestionTree/Answer
                            const toDelete = existingOptions.filter(o => !matchedExistingIds.has(o.id))
                            if (toDelete.length > 0) {
                                // Check which options are safe to delete (not used in QuestionTree or Answer)
                                const safeToDelete = []
                                for (const option of toDelete) {
                                    // Check if used in QuestionTree
                                    const usedInTree = await tx.questionTree.findFirst({
                                        where: { answerQuestionTriggerId: option.id }
                                    })
                                    
                                    // Check if used in Answer
                                    const usedInAnswer = await tx.answer.findFirst({
                                        where: { answerOptionQuestionId: option.id }
                                    })
                                    
                                    // Check if used in AnswerMultipleChoice
                                    const usedInMultipleChoice = await tx.answerMultipleChoice.findFirst({
                                        where: { answerOptionQuestionId: option.id }
                                    })
                                    
                                    // Only delete if not used anywhere
                                    if (!usedInTree && !usedInAnswer && !usedInMultipleChoice) {
                                        safeToDelete.push(option.id)
                                    } else {
                                        // Log warning but don't delete
                                        this.logger.warn(`Cannot delete answerOptionQuestion ${option.id} because it is used in QuestionTree, Answer, or AnswerMultipleChoice`)
                                    }
                                }
                                
                                if (safeToDelete.length > 0) {
                                    await tx.answerOptionQuestion.deleteMany({
                                        where: {
                                            id: { in: safeToDelete }
                                        }
                                    })
                                }
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
                                    // Create new (with ID if provided)
                                    const createData = {
                                        questionId: questionData.id,
                                        answerText: optionData.answerText,
                                        sortOrder: optionData.sortOrder,
                                        otherOptionPlaceholder: optionData.otherOptionPlaceholder || null,
                                        isTriggered: optionData.isTriggered || false
                                    }
                                    if (optionData.id) {
                                        createData.id = optionData.id
                                    }
                                    await tx.answerOptionQuestion.create({
                                        data: createData
                                    })
                                }
                            }
                        } else {
                            // Delete all if no answerQuestion provided
                            // BUT: Check if any options are used before deleting
                            const existingOptions = await tx.answerOptionQuestion.findMany({
                                where: { questionId: questionData.id }
                            })
                            
                            const safeToDelete = []
                            for (const option of existingOptions) {
                                // Check if used in QuestionTree
                                const usedInTree = await tx.questionTree.findFirst({
                                    where: { answerQuestionTriggerId: option.id }
                                })
                                
                                // Check if used in Answer
                                const usedInAnswer = await tx.answer.findFirst({
                                    where: { answerOptionQuestionId: option.id }
                                })
                                
                                // Check if used in AnswerMultipleChoice
                                const usedInMultipleChoice = await tx.answerMultipleChoice.findFirst({
                                    where: { answerOptionQuestionId: option.id }
                                })
                                
                                // Only delete if not used anywhere
                                if (!usedInTree && !usedInAnswer && !usedInMultipleChoice) {
                                    safeToDelete.push(option.id)
                                } else {
                                    this.logger.warn(`Cannot delete answerOptionQuestion ${option.id} because it is used in QuestionTree, Answer, or AnswerMultipleChoice`)
                                }
                            }
                            
                            if (safeToDelete.length > 0) {
                                await tx.answerOptionQuestion.deleteMany({
                                    where: {
                                        id: { in: safeToDelete }
                                    }
                                })
                            }
                        }

                        // Handle question tree (only for parent questions, and only after all questions are created)
                        // Skip here, will process after all questions are created
                    } else {
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

                        const createdOptions = []
                        if (questionData.answerQuestion && questionData.answerQuestion.length > 0) {
                            for (const opt of questionData.answerQuestion) {
                                const createData = {
                                    questionId: question.id,
                                    answerText: opt.answerText,
                                    sortOrder: opt.sortOrder,
                                    otherOptionPlaceholder: opt.otherOptionPlaceholder || null,
                                    isTriggered: opt.isTriggered || false
                                }
                                if (opt.id) {
                                    createData.id = opt.id
                                }
                                const createdOption = await tx.answerOptionQuestion.create({
                                    data: createData
                                })
                                createdOptions.push(createdOption)
                            }
                        }

                        // Handle question tree for new question - skip here, will process after all questions are created
                    }
                }

                // Now process QuestionTree for all parent questions
                // This ensures all child questions are already created before creating QuestionTree
                for (const questionData of parentQuestions) {
                    if (questionData.questionTree && questionData.questionTree.length > 0) {
                        // Verify question exists (should exist from previous loop)
                        const question = await tx.question.findUnique({
                            where: { id: questionData.id }
                        })
                        
                        if (!question) {
                            continue
                        }
                        
                        // Delete existing question trees for this question
                        await tx.questionTree.deleteMany({
                            where: { questionTriggerId: questionData.id }
                        })

                        // Get all answer options for this question to map questionTree
                        const answerOptions = await tx.answerOptionQuestion.findMany({
                            where: { questionId: questionData.id }
                        })

                        // Create new question trees
                        for (const treeData of questionData.questionTree) {
                            let answerOptionId = treeData.answerQuestionTriggerId

                            // If answerQuestionTriggerId is not a UUID, map it using answerText and sortOrder
                            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                            if (!uuidRegex.test(answerOptionId) && treeData._tempAnswerText !== undefined && treeData._tempSortOrder !== undefined) {
                                const mappedOption = answerOptions.find(
                                    opt => opt.answerText === treeData._tempAnswerText && opt.sortOrder === treeData._tempSortOrder
                                )
                                if (mappedOption) {
                                    answerOptionId = mappedOption.id
                                } else {
                                    continue // Skip if option not found
                                }
                            }

                            // Verify that questionPointerToId (child question) exists
                            const childQuestion = await tx.question.findUnique({
                                where: { id: treeData.questionPointerToId }
                            })
                            
                            if (!childQuestion) {
                                continue
                            }

                            await tx.questionTree.create({
                                data: {
                                    questionTriggerId: questionData.id,
                                    answerQuestionTriggerId: answerOptionId,
                                    questionPointerToId: treeData.questionPointerToId
                                }
                            })
                        }
                    } else {
                        // Delete all question trees if no questionTree provided
                        await tx.questionTree.deleteMany({
                            where: { questionTriggerId: questionData.id }
                        })
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
            this.logger.error('Error in saveBuilder:', error)
            // Provide more specific error message for foreign key constraint violations
            if (error.code === 'P2003' || error.message?.includes('Foreign key constraint')) {
                const ErrorHttp = require("../../shared/http/error.http")
                throw new ErrorHttp(409, `Cannot Delete Record: ${error.meta?.field_name || 'Foreign key constraint violated'}. Pastikan semua child questions sudah dibuat sebelum membuat QuestionTree.`)
            }
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

            if (codeQuestions.length === 0) {
                this.logger.info(`[getQuestionCount] No code questions found for surveyId: ${surveyId}`)
                return 0
            }

            const codeIds = codeQuestions.map(cq => cq.code)
            // Only count parent questions (children are part of parent, e.g., rating items)
            const count = await this.prismaClient.question.count({
                where: {
                    codeId: { in: codeIds },
                    parentId: null // Only count parent questions
                }
            })
            
            this.logger.info(`[getQuestionCount] SurveyId: ${surveyId}, CodeIds: ${JSON.stringify(codeIds)}, Parent Questions Count: ${count}`)
            return count
        } catch (error) {
            this.logger.error(error)
            return 0
        }
    }
}

module.exports = SurveyRepository

