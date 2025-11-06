const BaseRepository = require("../../shared/base/base.repository")

class ResponseRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.responseRespondent, logger)
        this.prismaClient = prisma
    }

    async getTracerStudyResponses(options = {}) {
        try {
            const { page = 1, limit = 10, search, facultyId, majorId, graduatedYear, graduatePeriode, degree } = options

            // Build where clause for filtering
            const where = {
                survey: {
                    targetRole: "ALUMNI"
                },
                respondent: {
                    role: "ALUMNI",
                    alumni: {
                        ...(facultyId && { major: { facultyId } }),
                        ...(majorId && { majorId }),
                        ...(graduatedYear && { graduatedYear }),
                        ...(graduatePeriode && { graduatePeriode }),
                        ...(degree && { degree })
                    }
                }
            }

            // Add search filter
            if (search) {
                where.respondent.OR = [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { alumni: { nim: { contains: search, mode: 'insensitive' } } }
                ]
            }

            // Get paginated responses
            const result = await this.getAll({
                page,
                limit,
                where,
                include: {
                    respondent: {
                        include: {
                            alumni: {
                                include: {
                                    major: {
                                        include: {
                                            faculty: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    survey: {
                        include: {
                            CodeQuestion: {
                                include: {
                                    Question: {
                                        orderBy: { sortOrder: 'asc' }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            // Format responses
            const formattedResponses = await Promise.all(
                result.data.map(async (response) => {
                    const alumni = response.respondent.alumni
                    // Count total questions across all CodeQuestions
                    const totalQuestions = response.survey.CodeQuestion.reduce((sum, cq) => sum + cq.Question.length, 0)
                    const answeredQuestions = await this.getAnsweredQuestionsCount(response.id)

                    return {
                        id: response.id,
                        respondentId: response.respondentId,
                        fullName: response.respondent.fullName,
                        email: response.respondent.email,
                        nim: alumni?.nim || null,
                        graduatedYear: alumni?.graduatedYear || null,
                        graduatePeriode: alumni?.graduatePeriode || null,
                        major: alumni?.major ? {
                            id: alumni.major.id,
                            name: alumni.major.majorName,
                            faculty: {
                                id: alumni.major.faculty.id,
                                name: alumni.major.faculty.facultyName
                            }
                        } : null,
                        degree: alumni?.degree || null,
                        submittedAt: response.submittedAt,
                        totalQuestions,
                        answeredQuestions,
                        completionPercentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
                    }
                })
            )

            // Get stats
            const totalAlumni = await this.prismaClient.respondent.count({
                where: {
                    role: "ALUMNI"
                }
            })

            // Since submittedAt is required in schema, all responses are considered submitted
            // But we count responses that actually exist
            const submittedCount = await this.prisma.count({
                where
            })

            const notSubmittedCount = totalAlumni - submittedCount

            // Calculate average completion percentage
            const allResponses = await this.prisma.findMany({
                where,
                include: {
                    survey: {
                        include: {
                            CodeQuestion: {
                                include: {
                                    Question: true
                                }
                            }
                        }
                    }
                }
            })

            let totalCompletion = 0
            let responseCount = 0
            for (const response of allResponses) {
                const totalQuestions = response.survey.CodeQuestion.reduce((sum, cq) => sum + cq.Question.length, 0)
                const answeredQuestions = await this.getAnsweredQuestionsCount(response.id)
                if (totalQuestions > 0) {
                    totalCompletion += (answeredQuestions / totalQuestions) * 100
                    responseCount++
                }
            }
            const averageCompletionPercentage = responseCount > 0 ? Math.round(totalCompletion / responseCount) : 0

            return {
                responses: formattedResponses,
                meta: result.meta,
                stats: {
                    totalAlumni,
                    submittedCount,
                    notSubmittedCount,
                    averageCompletionPercentage
                }
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getTracerStudyResponseDetail(id) {
        try {
            const response = await this.prisma.findUnique({
                where: { id },
                include: {
                    respondent: {
                        include: {
                            alumni: {
                                include: {
                                    major: {
                                        include: {
                                            faculty: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    survey: {
                        include: {
                            CodeQuestion: {
                                include: {
                                    Question: {
                                        include: {
                                            answerQuestion: {
                                                orderBy: { sortOrder: 'asc' }
                                            }
                                        },
                                        orderBy: { sortOrder: 'asc' }
                                    }
                                }
                            }
                        }
                    }
                }
            })

            if (!response) {
                throw new Error("Response not found")
            }

            const alumni = response.respondent.alumni
            // Flatten all questions from all CodeQuestions
            const allQuestions = response.survey.CodeQuestion.flatMap(cq => cq.Question)
            const totalQuestions = allQuestions.length

            // Get all answers for this response
            const answers = await this.prismaClient.answer.findMany({
                where: { responseRespondentId: id },
                include: {
                    answerOptionQuestion: true
                }
            })

            const answerMultipleChoices = await this.prismaClient.answerMultipleChoice.findMany({
                where: { responseRespondentId: id },
                include: {
                    answerOption: true
                }
            })

            // Build question responses
            const questionResponses = await Promise.all(
                allQuestions.map(async (question) => {
                    const questionAnswers = answers.filter(a => a.questionId === question.id)
                    const questionMultipleChoices = answerMultipleChoices.filter(a => a.questionId === question.id)

                    let answerText = null
                    const answerOptions = question.answerQuestion.map(option => {
                        const isSelected = questionMultipleChoices.some(
                            amc => amc.answerOptionQuestionId === option.id
                        ) || questionAnswers.some(
                            a => a.answerOptionQuestionId === option.id
                        )

                        if (isSelected) {
                            if (!answerText) {
                                answerText = option.answerText
                            } else {
                                answerText += `, ${option.answerText}`
                            }
                        }

                        return {
                            id: option.id,
                            optionText: option.answerText,
                            isSelected
                        }
                    })

                    // For essay/long_test questions, get text answer
                    if (question.questionType === "ESSAY" || question.questionType === "LONG_TEST") {
                        const textAnswer = questionAnswers.find(a => a.textAnswer)
                        if (textAnswer) {
                            answerText = textAnswer.textAnswer
                        }
                    }

                    // For single choice, get the selected option text
                    if (question.questionType === "SINGLE_CHOICE" || question.questionType === "COMBO_BOX") {
                        const selectedAnswer = questionAnswers.find(a => a.answerOptionQuestionId)
                        if (selectedAnswer && selectedAnswer.answerOptionQuestion) {
                            answerText = selectedAnswer.answerOptionQuestion.answerText
                        }
                    }

                    return {
                        questionId: question.id,
                        questionText: question.questionText,
                        questionType: question.questionType,
                        isRequired: question.isRequired,
                        isAnswered: answerText !== null && answerText !== "",
                        sortOrder: question.sortOrder,
                        answer: answerText,
                        answerOptions: answerOptions
                    }
                })
            )

            const answeredQuestions = questionResponses.filter(qr => qr.isAnswered).length

            return {
                id: response.id,
                respondentId: response.respondentId,
                fullName: response.respondent.fullName,
                email: response.respondent.email,
                nim: alumni?.nim || null,
                graduatedYear: alumni?.graduatedYear || null,
                graduatePeriode: alumni?.graduatePeriode || null,
                major: alumni?.major ? {
                    id: alumni.major.id,
                    name: alumni.major.majorName,
                    faculty: {
                        id: alumni.major.faculty.id,
                        name: alumni.major.faculty.facultyName
                    }
                } : null,
                degree: alumni?.degree || null,
                submittedAt: response.submittedAt,
                totalQuestions,
                answeredQuestions,
                completionPercentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
                responses: questionResponses
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async exportTracerStudyResponses(options, res) {
        try {
            // For now, return a placeholder - export functionality can be implemented later
            // This would typically use a library like exceljs or similar
            return res.status(501).json({
                success: false,
                message: "Export functionality not yet implemented"
            })
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getUserSurveyResponses(options = {}) {
        try {
            const { page = 1, limit = 10, search, company, position } = options

            // Build where clause for filtering
            const where = {
                survey: {
                    targetRole: "MANAGER"
                },
                respondent: {
                    role: "MANAGER",
                    manager: {
                        ...(company && { company: { contains: company, mode: 'insensitive' } }),
                        ...(position && { position: { contains: position, mode: 'insensitive' } })
                    }
                }
            }

            // Add search filter
            if (search) {
                where.respondent.OR = [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { manager: { company: { contains: search, mode: 'insensitive' } } }
                ]
            }

            // Get paginated responses
            const result = await this.getAll({
                page,
                limit,
                where,
                include: {
                    respondent: {
                        include: {
                            manager: true
                        }
                    },
                    survey: {
                        include: {
                            CodeQuestion: {
                                include: {
                                    Question: {
                                        orderBy: { sortOrder: 'asc' }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            // Format responses
            const formattedResponses = await Promise.all(
                result.data.map(async (response) => {
                    const manager = response.respondent.manager
                    // Count total questions across all CodeQuestions
                    const totalQuestions = response.survey.CodeQuestion.reduce((sum, cq) => sum + cq.Question.length, 0)
                    const answeredQuestions = await this.getAnsweredQuestionsCount(response.id)

                    return {
                        id: response.id,
                        respondentId: response.respondentId,
                        fullName: response.respondent.fullName,
                        email: response.respondent.email,
                        company: manager?.company || null,
                        position: manager?.position || null,
                        submittedAt: response.submittedAt,
                        totalQuestions,
                        answeredQuestions,
                        completionPercentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
                    }
                })
            )

            // Get stats
            const totalManagers = await this.prismaClient.respondent.count({
                where: {
                    role: "MANAGER"
                }
            })

            // Since submittedAt is required in schema, all responses are considered submitted
            // But we count responses that actually exist
            const submittedCount = await this.prisma.count({
                where
            })

            const notSubmittedCount = totalManagers - submittedCount

            // Calculate average completion percentage
            const allResponses = await this.prisma.findMany({
                where,
                include: {
                    survey: {
                        include: {
                            CodeQuestion: {
                                include: {
                                    Question: true
                                }
                            }
                        }
                    }
                }
            })

            let totalCompletion = 0
            let responseCount = 0
            for (const response of allResponses) {
                const totalQuestions = response.survey.CodeQuestion.reduce((sum, cq) => sum + cq.Question.length, 0)
                const answeredQuestions = await this.getAnsweredQuestionsCount(response.id)
                if (totalQuestions > 0) {
                    totalCompletion += (answeredQuestions / totalQuestions) * 100
                    responseCount++
                }
            }
            const averageCompletionPercentage = responseCount > 0 ? Math.round(totalCompletion / responseCount) : 0

            return {
                responses: formattedResponses,
                meta: result.meta,
                stats: {
                    totalManagers,
                    submittedCount,
                    notSubmittedCount,
                    averageCompletionPercentage
                }
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getUserSurveyResponseDetail(id) {
        try {
            const response = await this.prisma.findUnique({
                where: { id },
                include: {
                    respondent: {
                        include: {
                            manager: true
                        }
                    },
                    survey: {
                        include: {
                            CodeQuestion: {
                                include: {
                                    Question: {
                                        include: {
                                            answerQuestion: {
                                                orderBy: { sortOrder: 'asc' }
                                            }
                                        },
                                        orderBy: { sortOrder: 'asc' }
                                    }
                                }
                            }
                        }
                    }
                }
            })

            if (!response) {
                throw new Error("Response not found")
            }

            const manager = response.respondent.manager
            // Flatten all questions from all CodeQuestions
            const allQuestions = response.survey.CodeQuestion.flatMap(cq => cq.Question)
            const totalQuestions = allQuestions.length

            // Get all answers for this response
            const answers = await this.prismaClient.answer.findMany({
                where: { responseRespondentId: id },
                include: {
                    answerOptionQuestion: true
                }
            })

            const answerMultipleChoices = await this.prismaClient.answerMultipleChoice.findMany({
                where: { responseRespondentId: id },
                include: {
                    answerOption: true
                }
            })

            // Build question responses
            const questionResponses = await Promise.all(
                allQuestions.map(async (question) => {
                    const questionAnswers = answers.filter(a => a.questionId === question.id)
                    const questionMultipleChoices = answerMultipleChoices.filter(a => a.questionId === question.id)

                    let answerText = null
                    const answerOptions = question.answerQuestion.map(option => {
                        const isSelected = questionMultipleChoices.some(
                            amc => amc.answerOptionQuestionId === option.id
                        ) || questionAnswers.some(
                            a => a.answerOptionQuestionId === option.id
                        )

                        if (isSelected) {
                            if (!answerText) {
                                answerText = option.answerText
                            } else {
                                answerText += `, ${option.answerText}`
                            }
                        }

                        return {
                            id: option.id,
                            optionText: option.answerText,
                            isSelected
                        }
                    })

                    // For essay/long_test questions, get text answer
                    if (question.questionType === "ESSAY" || question.questionType === "LONG_TEST") {
                        const textAnswer = questionAnswers.find(a => a.textAnswer)
                        if (textAnswer) {
                            answerText = textAnswer.textAnswer
                        }
                    }

                    // For single choice, get the selected option text
                    if (question.questionType === "SINGLE_CHOICE" || question.questionType === "COMBO_BOX") {
                        const selectedAnswer = questionAnswers.find(a => a.answerOptionQuestionId)
                        if (selectedAnswer && selectedAnswer.answerOptionQuestion) {
                            answerText = selectedAnswer.answerOptionQuestion.answerText
                        }
                    }

                    return {
                        questionId: question.id,
                        questionText: question.questionText,
                        questionType: question.questionType,
                        isRequired: question.isRequired,
                        isAnswered: answerText !== null && answerText !== "",
                        sortOrder: question.sortOrder,
                        answer: answerText,
                        answerOptions: answerOptions
                    }
                })
            )

            const answeredQuestions = questionResponses.filter(qr => qr.isAnswered).length

            return {
                id: response.id,
                respondentId: response.respondentId,
                fullName: response.respondent.fullName,
                email: response.respondent.email,
                company: manager?.company || null,
                position: manager?.position || null,
                submittedAt: response.submittedAt,
                totalQuestions,
                answeredQuestions,
                completionPercentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
                responses: questionResponses
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async exportUserSurveyResponses(options, res) {
        try {
            // For now, return a placeholder - export functionality can be implemented later
            // This would typically use a library like exceljs or similar
            return res.status(501).json({
                success: false,
                message: "Export functionality not yet implemented"
            })
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    // Helper method to count answered questions
    async getAnsweredQuestionsCount(responseId) {
        try {
            const [answers, multipleChoices] = await Promise.all([
                this.prismaClient.answer.findMany({
                    where: { responseRespondentId: responseId },
                    distinct: ['questionId']
                }),
                this.prismaClient.answerMultipleChoice.findMany({
                    where: { responseRespondentId: responseId },
                    distinct: ['questionId']
                })
            ])

            const answeredQuestionIds = new Set([
                ...answers.map(a => a.questionId),
                ...multipleChoices.map(mc => mc.questionId)
            ])

            return answeredQuestionIds.size
        } catch (error) {
            this.logger.error(error)
            return 0
        }
    }
}

module.exports = ResponseRepository

