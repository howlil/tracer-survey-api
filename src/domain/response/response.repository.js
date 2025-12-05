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
                                        include: {
                                            children: true
                                        },
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
                    // Only count parent questions (children are part of parent questions, e.g., rating items)
                    // Children questions for rating/matrix are not counted as separate questions
                    const allQuestions = response.survey.CodeQuestion.flatMap(cq => 
                        (cq.Question || []).filter(q => !q.parentId) // Only parent questions
                    )
                    const totalRequiredQuestions = allQuestions.filter(q => q.isRequired === true).length
                    const answeredRequiredQuestions = await this.getAnsweredQuestionsCount(response.id, true)
                    const totalQuestions = allQuestions.length
                    const answeredQuestions = await this.getAnsweredQuestionsCount(response.id, false)

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
                            majorName: alumni.major.majorName,
                            faculty: {
                                id: alumni.major.faculty.id,
                                facultyName: alumni.major.faculty.facultyName
                            }
                        } : null,
                        degree: alumni?.degree || null,
                        submittedAt: response.submittedAt,
                        totalQuestions,
                        answeredQuestions,
                        totalRequiredQuestions,
                        answeredRequiredQuestions,
                        completionPercentage: totalRequiredQuestions > 0 ? Math.round((answeredRequiredQuestions / totalRequiredQuestions) * 100) : 0
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
                                    Question: {
                                        include: {
                                            children: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })

            let totalCompletion = 0
            let responseCount = 0
            for (const response of allResponses) {
                // Count total required questions (only parent questions, children are part of parent)
                const allQuestions = response.survey.CodeQuestion.flatMap(cq => 
                    (cq.Question || []).filter(q => !q.parentId) // Only parent questions
                )
                const totalRequiredQuestions = allQuestions.filter(q => q.isRequired === true).length
                const answeredRequiredQuestions = await this.getAnsweredQuestionsCount(response.id, true)
                if (totalRequiredQuestions > 0) {
                    totalCompletion += (answeredRequiredQuestions / totalRequiredQuestions) * 100
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
                            }
                        }
                    }
                }
            })

            if (!response) {
                throw new Error("Response not found")
            }

            const alumni = response.respondent.alumni
            // Only count parent questions (children are part of parent questions, e.g., rating items)
            // Children questions for rating/matrix are not counted as separate questions
            const allQuestions = response.survey.CodeQuestion.flatMap(cq => 
                (cq.Question || []).filter(q => !q.parentId) // Only parent questions
            )
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
                    // For rating/matrix questions, check children answers
                    if (question.questionType === "MATRIX_SINGLE_CHOICE" && question.children && question.children.length > 0) {
                        // Get all children question IDs
                        const childrenIds = question.children.map(c => c.id)
                        
                        // Get answers for all children
                        const childrenAnswers = answers.filter(a => childrenIds.includes(a.questionId))
                        
                        // Check if all children are answered
                        const allChildrenAnswered = childrenIds.every(childId => 
                            childrenAnswers.some(a => a.questionId === childId)
                        )
                        
                        // Build answer text from children answers
                        let answerText = null
                        if (allChildrenAnswered && childrenAnswers.length > 0) {
                            const answerTexts = childrenAnswers.map(childAnswer => {
                                if (childAnswer.answerOptionQuestion) {
                                    return childAnswer.answerOptionQuestion.answerText
                                }
                                return childAnswer.textAnswer || ''
                            }).filter(text => text !== '')
                            
                            if (answerTexts.length > 0) {
                                answerText = answerTexts.join(', ')
                            }
                        }
                        
                        // Build answer options for rating (from parent's answerQuestion)
                        const answerOptions = question.answerQuestion.map(option => {
                            const isSelected = childrenAnswers.some(
                                a => a.answerOptionQuestionId === option.id
                            )
                            
                            return {
                                id: option.id,
                                optionText: option.answerText,
                                isSelected
                            }
                        })
                        
                        return {
                            questionId: question.id,
                            questionText: question.questionText,
                            questionType: question.questionType,
                            isRequired: question.isRequired,
                            isAnswered: allChildrenAnswered,
                            sortOrder: question.sortOrder,
                            answer: answerText,
                            answerOptions: answerOptions,
                            children: question.children.map(child => {
                                const childAnswer = childrenAnswers.find(a => a.questionId === child.id)
                                return {
                                    id: child.id,
                                    questionText: child.questionText,
                                    isAnswered: !!childAnswer,
                                    answer: childAnswer?.answerOptionQuestion?.answerText || childAnswer?.textAnswer || null
                                }
                            })
                        }
                    }
                    
                    // For non-rating questions, use existing logic
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

            // Calculate completion percentage based on required questions only
            const requiredQuestions = questionResponses.filter(qr => qr.isRequired)
            const totalRequiredQuestions = requiredQuestions.length
            const answeredRequiredQuestions = requiredQuestions.filter(qr => qr.isAnswered).length
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
                    majorName: alumni.major.majorName,
                    faculty: {
                        id: alumni.major.faculty.id,
                        facultyName: alumni.major.faculty.facultyName
                    }
                } : null,
                degree: alumni?.degree || null,
                submittedAt: response.submittedAt,
                totalQuestions,
                answeredQuestions,
                totalRequiredQuestions,
                answeredRequiredQuestions,
                completionPercentage: totalRequiredQuestions > 0 ? Math.round((answeredRequiredQuestions / totalRequiredQuestions) * 100) : 0,
                responses: questionResponses
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async exportTracerStudyResponses(options, res) {
        try {
            this.logger.info('[exportTracerStudyResponses] Repository called with options:', JSON.stringify(options))
            const { format = 'excel', search, facultyId, majorId, graduatedYear, graduatePeriode, degree, completionStatus } = options
            this.logger.info('[exportTracerStudyResponses] Parsed options:', JSON.stringify({
                format,
                search,
                facultyId,
                majorId,
                graduatedYear,
                graduatePeriode,
                degree,
                completionStatus
            }))

            // Build where clause (same as getTracerStudyResponses)
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

            if (search) {
                where.respondent.OR = [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { alumni: { nim: { contains: search, mode: 'insensitive' } } }
                ]
            }

            // Get all responses (no pagination for export)
            this.logger.info('[exportTracerStudyResponses] Fetching responses with where clause:', JSON.stringify(where))
            const responses = await this.prisma.findMany({
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
                                        include: {
                                            children: {
                                                include: {
                                                    answerQuestion: {
                                                        orderBy: { sortOrder: 'asc' }
                                                    }
                                                },
                                                orderBy: { sortOrder: 'asc' }
                                            },
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

            this.logger.info('[exportTracerStudyResponses] Found', responses.length, 'responses before completion filter')

            // Filter by completion status if specified
            let filteredResponses = responses
            if (completionStatus) {
                // Calculate completion percentage for all responses
                const responsesWithCompletion = await Promise.all(
                    responses.map(async (response) => {
                        const allQuestions = response.survey.CodeQuestion.flatMap(cq => 
                            (cq.Question || []).filter(q => !q.parentId)
                        )
                        const totalRequiredQuestions = allQuestions.filter(q => q.isRequired === true).length
                        const answeredRequiredQuestions = await this.getAnsweredQuestionsCount(response.id, true)
                        const completionPercentage = totalRequiredQuestions > 0 
                            ? Math.round((answeredRequiredQuestions / totalRequiredQuestions) * 100) 
                            : 0
                        
                        return { response, completionPercentage }
                    })
                )
                
                if (completionStatus === 'complete') {
                    filteredResponses = responsesWithCompletion
                        .filter(item => item.completionPercentage === 100)
                        .map(item => item.response)
                } else if (completionStatus === 'pending') {
                    filteredResponses = responsesWithCompletion
                        .filter(item => item.completionPercentage < 100)
                        .map(item => item.response)
                } else {
                    filteredResponses = responsesWithCompletion.map(item => item.response)
                }
                
                this.logger.info('[exportTracerStudyResponses] Found', filteredResponses.length, 'responses after completion filter')
            }

            // Get all questions from the first response (assuming all responses use the same survey)
            // Build question headers dynamically
            let allQuestions = []
            let questionHeaders = []
            
            if (filteredResponses.length > 0) {
                const firstResponse = filteredResponses[0]
                allQuestions = firstResponse.survey.CodeQuestion.flatMap(cq => {
                    return (cq.Question || []).filter(q => !q.parentId).map(q => {
                        // For rating/matrix questions, include children as sub-columns
                        if (q.questionType === 'MATRIX_SINGLE_CHOICE' && q.children && q.children.length > 0) {
                            return {
                                ...q,
                                children: q.children.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                            }
                        }
                        return q
                    })
                }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

                // Build headers: basic info + all questions
                questionHeaders = allQuestions.flatMap(q => {
                    if (q.questionType === 'MATRIX_SINGLE_CHOICE' && q.children && q.children.length > 0) {
                        // For matrix questions, create a column for each child
                        return q.children.map(child => `${q.questionText} - ${child.questionText}`)
                    } else {
                        return [q.questionText]
                    }
                })
            }

            // Build headers
            const headers = [
                'NIM',
                'Nama Lengkap',
                'Email',
                'Fakultas',
                'Program Studi',
                'Jenjang',
                'Tahun Lulus',
                'Periode Wisuda',
                ...questionHeaders,
                'Kelengkapan (%)',
                'Tanggal Submit'
            ]

            this.logger.info('[exportTracerStudyResponses] Built', headers.length, 'headers including', questionHeaders.length, 'question columns')

            const rows = await Promise.all(
                filteredResponses.map(async (response) => {
                    const alumni = response.respondent?.alumni
                    
                    // Get all answers for this response
                    const answers = await this.prismaClient.answer.findMany({
                        where: { responseRespondentId: response.id },
                        include: {
                            answerOptionQuestion: true
                        }
                    })

                    const answerMultipleChoices = await this.prismaClient.answerMultipleChoice.findMany({
                        where: { responseRespondentId: response.id },
                        include: {
                            answerOption: true
                        }
                    })

                    // Build answer map for quick lookup
                    const answerMap = new Map()
                    answers.forEach(a => {
                        if (!answerMap.has(a.questionId)) {
                            answerMap.set(a.questionId, [])
                        }
                        answerMap.get(a.questionId).push(a)
                    })

                    const answerMultipleChoiceMap = new Map()
                    answerMultipleChoices.forEach(amc => {
                        if (!answerMultipleChoiceMap.has(amc.questionId)) {
                            answerMultipleChoiceMap.set(amc.questionId, [])
                        }
                        answerMultipleChoiceMap.get(amc.questionId).push(amc)
                    })

                    // Calculate completion percentage
                    const totalRequiredQuestions = allQuestions.filter(q => q.isRequired === true).length
                    const answeredRequiredQuestions = await this.getAnsweredQuestionsCount(response.id, true)
                    const completionPercentage = totalRequiredQuestions > 0 
                        ? Math.round((answeredRequiredQuestions / totalRequiredQuestions) * 100) 
                        : 0

                    // Build row data: basic info + answers
                    const basicInfo = [
                        alumni?.nim || '',
                        response.respondent?.fullName || '',
                        response.respondent?.email || '',
                        alumni?.major?.faculty?.facultyName || '',
                        alumni?.major?.majorName || '',
                        alumni?.degree || '',
                        alumni?.graduatedYear || '',
                        alumni?.graduatePeriode?.replace('WISUDA_', 'Wisuda ') || ''
                    ]

                    // Build answer columns
                    const answerColumns = allQuestions.flatMap(q => {
                        if (q.questionType === 'MATRIX_SINGLE_CHOICE' && q.children && q.children.length > 0) {
                            // For matrix questions, get answer for each child
                            return q.children.map(child => {
                                const childAnswers = answerMap.get(child.id) || []
                                const childMultipleChoices = answerMultipleChoiceMap.get(child.id) || []
                                
                                // Get answer text
                                let answerText = ''
                                if (childAnswers.length > 0) {
                                    const answerTexts = childAnswers.map(a => {
                                        if (a.answerOptionQuestion) {
                                            return a.answerOptionQuestion.answerText
                                        }
                                        return a.textAnswer || ''
                                    }).filter(t => t !== '')
                                    answerText = answerTexts.join(', ')
                                } else if (childMultipleChoices.length > 0) {
                                    const answerTexts = childMultipleChoices.map(amc => {
                                        if (amc.answerOption) {
                                            return amc.answerOption.answerText
                                        }
                                        return ''
                                    }).filter(t => t !== '')
                                    answerText = answerTexts.join(', ')
                                }
                                
                                return answerText || ''
                            })
                        } else {
                            // For regular questions
                            const questionAnswers = answerMap.get(q.id) || []
                            const questionMultipleChoices = answerMultipleChoiceMap.get(q.id) || []
                            
                            let answerText = ''
                            
                            // For essay/long_test questions, prioritize textAnswer
                            if (q.questionType === 'ESSAY' || q.questionType === 'LONG_TEST') {
                                if (questionAnswers.length > 0) {
                                    const textAnswers = questionAnswers
                                        .map(a => a.textAnswer)
                                        .filter(t => t && t !== '' && t !== '__TEXT_ANSWER__')
                                    if (textAnswers.length > 0) {
                                        answerText = textAnswers.join(', ')
                                    }
                                }
                            } else {
                                // Check for multiple choice answers
                                if (questionMultipleChoices.length > 0) {
                                    const answerTexts = questionMultipleChoices.map(amc => {
                                        if (amc.answerOption) {
                                            return amc.answerOption.answerText
                                        }
                                        return ''
                                    }).filter(t => t !== '')
                                    answerText = answerTexts.join(', ')
                                }
                                
                                // Check for single choice or text answers
                                if (questionAnswers.length > 0) {
                                    const answerTexts = questionAnswers.map(a => {
                                        // If answerOptionQuestion exists and answerText is not __TEXT_ANSWER__, use it
                                        if (a.answerOptionQuestion && a.answerOptionQuestion.answerText && a.answerOptionQuestion.answerText !== '__TEXT_ANSWER__') {
                                            return a.answerOptionQuestion.answerText
                                        }
                                        // Otherwise, use textAnswer if available
                                        if (a.textAnswer && a.textAnswer !== '__TEXT_ANSWER__') {
                                            return a.textAnswer
                                        }
                                        return ''
                                    }).filter(t => t !== '')
                                    
                                    if (answerText) {
                                        answerText += ', ' + answerTexts.join(', ')
                                    } else {
                                        answerText = answerTexts.join(', ')
                                    }
                                }
                            }
                            
                            return [answerText || '']
                        }
                    })

                    return [
                        ...basicInfo,
                        ...answerColumns,
                        completionPercentage,
                        response.submittedAt ? new Date(response.submittedAt).toLocaleDateString('id-ID') : 'Belum Submit'
                    ]
                })
            )

            this.logger.info('[exportTracerStudyResponses] Formatted', rows.length, 'rows for Excel')

            // For export, we don't need dropdown validation, just simple Excel file
            const ExcelJS = require('exceljs')
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Data')
            
            // Set headers
            worksheet.getRow(1).values = headers
            worksheet.getRow(1).font = { bold: true }
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            }
            
            // Set column widths
            headers.forEach((header, index) => {
                worksheet.getColumn(index + 1).width = Math.max(header.length, 15)
            })
            
            // Add data rows
            rows.forEach((row, rowIndex) => {
                worksheet.getRow(rowIndex + 2).values = row
            })
            
            this.logger.info('[exportTracerStudyResponses] Creating Excel buffer...')
            const excelBuffer = await workbook.xlsx.writeBuffer()
            this.logger.info('[exportTracerStudyResponses] Excel buffer created, size:', excelBuffer.length, 'bytes')

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader('Content-Disposition', `attachment; filename="tracer-study-export-${new Date().toISOString().split('T')[0]}.xlsx"`)
            this.logger.info('[exportTracerStudyResponses] Sending Excel file to client...')
            return res.status(200).send(excelBuffer)
        } catch (error) {
            this.logger.error('[exportTracerStudyResponses] Repository error:', error)
            this.logger.error('[exportTracerStudyResponses] Repository error message:', error.message)
            this.logger.error('[exportTracerStudyResponses] Repository error stack:', error.stack)
            if (error.code) {
                this.logger.error('[exportTracerStudyResponses] Error code:', error.code)
            }
            if (error.meta) {
                this.logger.error('[exportTracerStudyResponses] Error meta:', JSON.stringify(error.meta))
            }
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
            const { format = 'excel', search, company, position } = options

            // Build where clause (same as getUserSurveyResponses)
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

            if (search) {
                where.respondent.OR = [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { manager: { company: { contains: search, mode: 'insensitive' } } }
                ]
            }

            // Get all responses (no pagination for export)
            const responses = await this.prisma.findMany({
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
                                        include: {
                                            children: {
                                                include: {
                                                    answerQuestion: {
                                                        orderBy: { sortOrder: 'asc' }
                                                    }
                                                },
                                                orderBy: { sortOrder: 'asc' }
                                            },
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

            // Get all questions from the first response (assuming all responses use the same survey)
            // Build question headers dynamically
            let allQuestions = []
            let questionHeaders = []
            
            if (responses.length > 0) {
                const firstResponse = responses[0]
                allQuestions = firstResponse.survey.CodeQuestion.flatMap(cq => {
                    return (cq.Question || []).filter(q => !q.parentId).map(q => {
                        // For rating/matrix questions, include children as sub-columns
                        if (q.questionType === 'MATRIX_SINGLE_CHOICE' && q.children && q.children.length > 0) {
                            return {
                                ...q,
                                children: q.children.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                            }
                        }
                        return q
                    })
                }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

                // Build headers: basic info + all questions
                questionHeaders = allQuestions.flatMap(q => {
                    if (q.questionType === 'MATRIX_SINGLE_CHOICE' && q.children && q.children.length > 0) {
                        // For matrix questions, create a column for each child
                        return q.children.map(child => `${q.questionText} - ${child.questionText}`)
                    } else {
                        return [q.questionText]
                    }
                })
            }

            // Build headers
            const headers = [
                'Nama Manager',
                'Email',
                'Perusahaan',
                'Posisi',
                ...questionHeaders,
                'Kelengkapan (%)',
                'Tanggal Submit'
            ]

            const rows = await Promise.all(
                responses.map(async (response) => {
                    const manager = response.respondent?.manager
                    
                    // Get all answers for this response
                    const answers = await this.prismaClient.answer.findMany({
                        where: { responseRespondentId: response.id },
                        include: {
                            answerOptionQuestion: true
                        }
                    })

                    const answerMultipleChoices = await this.prismaClient.answerMultipleChoice.findMany({
                        where: { responseRespondentId: response.id },
                        include: {
                            answerOption: true
                        }
                    })

                    // Build answer map for quick lookup
                    const answerMap = new Map()
                    answers.forEach(a => {
                        if (!answerMap.has(a.questionId)) {
                            answerMap.set(a.questionId, [])
                        }
                        answerMap.get(a.questionId).push(a)
                    })

                    const answerMultipleChoiceMap = new Map()
                    answerMultipleChoices.forEach(amc => {
                        if (!answerMultipleChoiceMap.has(amc.questionId)) {
                            answerMultipleChoiceMap.set(amc.questionId, [])
                        }
                        answerMultipleChoiceMap.get(amc.questionId).push(amc)
                    })

                    // Calculate completion percentage
                    const totalRequiredQuestions = allQuestions.filter(q => q.isRequired === true).length
                    const answeredRequiredQuestions = await this.getAnsweredQuestionsCount(response.id, true)
                    const completionPercentage = totalRequiredQuestions > 0 
                        ? Math.round((answeredRequiredQuestions / totalRequiredQuestions) * 100) 
                        : 0

                    // Build row data: basic info + answers
                    const basicInfo = [
                        response.respondent?.fullName || '',
                        response.respondent?.email || '',
                        manager?.company || '',
                        manager?.position || ''
                    ]

                    // Build answer columns
                    const answerColumns = allQuestions.flatMap(q => {
                        if (q.questionType === 'MATRIX_SINGLE_CHOICE' && q.children && q.children.length > 0) {
                            // For matrix questions, get answer for each child
                            return q.children.map(child => {
                                const childAnswers = answerMap.get(child.id) || []
                                const childMultipleChoices = answerMultipleChoiceMap.get(child.id) || []
                                
                                // Get answer text
                                let answerText = ''
                                if (childAnswers.length > 0) {
                                    const answerTexts = childAnswers.map(a => {
                                        if (a.answerOptionQuestion) {
                                            return a.answerOptionQuestion.answerText
                                        }
                                        return a.textAnswer || ''
                                    }).filter(t => t !== '')
                                    answerText = answerTexts.join(', ')
                                } else if (childMultipleChoices.length > 0) {
                                    const answerTexts = childMultipleChoices.map(amc => {
                                        if (amc.answerOption) {
                                            return amc.answerOption.answerText
                                        }
                                        return ''
                                    }).filter(t => t !== '')
                                    answerText = answerTexts.join(', ')
                                }
                                
                                return answerText || ''
                            })
                        } else {
                            // For regular questions
                            const questionAnswers = answerMap.get(q.id) || []
                            const questionMultipleChoices = answerMultipleChoiceMap.get(q.id) || []
                            
                            let answerText = ''
                            
                            // For essay/long_test questions, prioritize textAnswer
                            if (q.questionType === 'ESSAY' || q.questionType === 'LONG_TEST') {
                                if (questionAnswers.length > 0) {
                                    const textAnswers = questionAnswers
                                        .map(a => a.textAnswer)
                                        .filter(t => t && t !== '' && t !== '__TEXT_ANSWER__')
                                    if (textAnswers.length > 0) {
                                        answerText = textAnswers.join(', ')
                                    }
                                }
                            } else {
                                // Check for multiple choice answers
                                if (questionMultipleChoices.length > 0) {
                                    const answerTexts = questionMultipleChoices.map(amc => {
                                        if (amc.answerOption) {
                                            return amc.answerOption.answerText
                                        }
                                        return ''
                                    }).filter(t => t !== '')
                                    answerText = answerTexts.join(', ')
                                }
                                
                                // Check for single choice or text answers
                                if (questionAnswers.length > 0) {
                                    const answerTexts = questionAnswers.map(a => {
                                        // If answerOptionQuestion exists and answerText is not __TEXT_ANSWER__, use it
                                        if (a.answerOptionQuestion && a.answerOptionQuestion.answerText && a.answerOptionQuestion.answerText !== '__TEXT_ANSWER__') {
                                            return a.answerOptionQuestion.answerText
                                        }
                                        // Otherwise, use textAnswer if available
                                        if (a.textAnswer && a.textAnswer !== '__TEXT_ANSWER__') {
                                            return a.textAnswer
                                        }
                                        return ''
                                    }).filter(t => t !== '')
                                    
                                    if (answerText) {
                                        answerText += ', ' + answerTexts.join(', ')
                                    } else {
                                        answerText = answerTexts.join(', ')
                                    }
                                }
                            }
                            
                            return [answerText || '']
                        }
                    })

                    return [
                        ...basicInfo,
                        ...answerColumns,
                        completionPercentage,
                        response.submittedAt ? new Date(response.submittedAt).toLocaleDateString('id-ID') : 'Belum Submit'
                    ]
                })
            )

            // For export, we don't need dropdown validation, just simple Excel file
            const ExcelJS = require('exceljs')
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Data')
            
            // Set headers
            worksheet.getRow(1).values = headers
            worksheet.getRow(1).font = { bold: true }
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            }
            
            // Set column widths
            headers.forEach((header, index) => {
                worksheet.getColumn(index + 1).width = Math.max(header.length, 15)
            })
            
            // Add data rows
            rows.forEach((row, rowIndex) => {
                worksheet.getRow(rowIndex + 2).values = row
            })
            
            const excelBuffer = await workbook.xlsx.writeBuffer()

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader('Content-Disposition', `attachment; filename="user-survey-export-${new Date().toISOString().split('T')[0]}.xlsx"`)
            return res.status(200).send(excelBuffer)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    // Helper method to count answered questions
    async getAnsweredQuestionsCount(responseId, onlyRequired = false) {
        try {
            // Get response to access survey questions
            const response = await this.prisma.findUnique({
                where: { id: responseId },
                include: {
                    survey: {
                        include: {
                            CodeQuestion: {
                                include: {
                                    Question: {
                                        include: {
                                            children: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })

            if (!response) {
                return 0
            }

            // Get all parent questions (children are part of parent, e.g., rating items)
            const allParentQuestions = response.survey.CodeQuestion.flatMap(cq => 
                (cq.Question || []).filter(q => !q.parentId) // Only parent questions
            )
            const questionsToCheck = onlyRequired 
                ? allParentQuestions.filter(q => q.isRequired === true)
                : allParentQuestions

            // Get all answers
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

            // Count answered parent questions
            let answeredCount = 0
            for (const question of questionsToCheck) {
                // For rating/matrix questions, check if all children are answered
                if (question.questionType === "MATRIX_SINGLE_CHOICE" && question.children && question.children.length > 0) {
                    const childrenIds = question.children.map(c => c.id)
                    const allChildrenAnswered = childrenIds.every(childId => answeredQuestionIds.has(childId))
                    if (allChildrenAnswered) {
                        answeredCount++
                    }
                } else {
                    // For non-rating questions, check if parent question is answered
                    if (answeredQuestionIds.has(question.id)) {
                        answeredCount++
                    }
                }
            }

            return answeredCount
        } catch (error) {
            this.logger.error(error)
            return 0
        }
    }

    async submitResponse(data) {
        try {
            const { surveyId, respondentId, answers } = data

            // Verify survey exists
            const survey = await this.prismaClient.survey.findUnique({
                where: { id: surveyId }
            })

            if (!survey) {
                throw new Error('Survey tidak ditemukan')
            }

            // Verify respondent exists
            const respondent = await this.prismaClient.respondent.findUnique({
                where: { id: respondentId }
            })

            if (!respondent) {
                throw new Error('Respondent tidak ditemukan')
            }

            // Get all required parent questions (children are part of parent, e.g., rating items)
            const allParentQuestions = await this.prismaClient.question.findMany({
                where: {
                    codeQuestion: {
                        surveyId
                    },
                    parentId: null // Only get parent questions
                },
                include: {
                    children: true
                }
            })

            const requiredParentQuestions = allParentQuestions.filter(q => q.isRequired === true)

            // Get answered question IDs from submitted answers
            const answeredQuestionIds = new Set(
                answers
                    .filter(a => {
                        const hasAnswerText = a.answerText !== undefined && a.answerText !== null && a.answerText !== ''
                        const hasAnswerOptionIds = a.answerOptionIds && a.answerOptionIds.length > 0
                        return hasAnswerText || hasAnswerOptionIds
                    })
                    .map(a => a.questionId)
            )

            // Check if all required parent questions are answered
            // For rating/matrix questions, check if all children are answered
            const unansweredRequiredQuestions = []
            for (const question of requiredParentQuestions) {
                if (question.questionType === "MATRIX_SINGLE_CHOICE" && question.children && question.children.length > 0) {
                    // For rating questions, check if all children are answered
                    const childrenIds = question.children.map(c => c.id)
                    const allChildrenAnswered = childrenIds.every(childId => answeredQuestionIds.has(childId))
                    if (!allChildrenAnswered) {
                        unansweredRequiredQuestions.push(question)
                    }
                } else {
                    // For non-rating questions, check if parent question is answered
                    if (!answeredQuestionIds.has(question.id)) {
                        unansweredRequiredQuestions.push(question)
                    }
                }
            }
            
            if (unansweredRequiredQuestions.length > 0) {
                const ErrorHttp = require("../../shared/http/error.http")
                const questionTexts = unansweredRequiredQuestions
                    .slice(0, 3)
                    .map(q => q.questionText || 'Pertanyaan')
                    .join(', ')
                const moreText = unansweredRequiredQuestions.length > 3 
                    ? ` dan ${unansweredRequiredQuestions.length - 3} pertanyaan lainnya` 
                    : ''
                throw new ErrorHttp(
                    400,
                    `Mohon lengkapi semua pertanyaan wajib terlebih dahulu. Pertanyaan yang belum diisi: ${questionTexts}${moreText}`
                )
            }

            // Check if response already exists
            let responseRespondent = await this.prismaClient.responseRespondent.findFirst({
                where: {
                    surveyId,
                    respondentId
                }
            })

            const result = await this.prismaClient.$transaction(async (tx) => {
                // Create or update response
                if (responseRespondent) {
                    // Update existing response
                    responseRespondent = await tx.responseRespondent.update({
                        where: { id: responseRespondent.id },
                        data: {
                            submittedAt: new Date()
                        }
                    })

                    // Delete old answers
                    await tx.answer.deleteMany({
                        where: { responseRespondentId: responseRespondent.id }
                    })

                    await tx.answerMultipleChoice.deleteMany({
                        where: { responseRespondentId: responseRespondent.id }
                    })
                } else {
                    // Create new response
                    responseRespondent = await tx.responseRespondent.create({
                        data: {
                            surveyId,
                            respondentId,
                            submittedAt: new Date()
                        }
                    })
                }

                // Process answers
                for (const answerData of answers) {
                    const { questionId, answerText, answerOptionIds } = answerData

                    // Verify question exists and belongs to survey
                    const question = await tx.question.findFirst({
                        where: {
                            id: questionId,
                            codeQuestion: {
                                surveyId
                            }
                        },
                        include: {
                            answerQuestion: true,
                            parent: {
                                include: {
                                    answerQuestion: true
                                }
                            }
                        }
                    })

                    if (!question) {
                        this.logger.warn(`Question ${questionId} tidak ditemukan atau tidak termasuk dalam survey`)
                        continue
                    }

                    // Handle text answers (essay, short_text, long_text, etc.)
                    if (answerText !== undefined && answerText !== null && answerText !== '') {
                        // Find answer option if it's an "other" option
                        let answerOptionQuestionId = null
                        if (answerOptionIds && answerOptionIds.length > 0) {
                            // Check if one of the options is an "other" option
                            const otherOption = question.answerQuestion.find(
                                opt => opt.otherOptionPlaceholder !== null && answerOptionIds.includes(opt.id)
                            )
                            if (otherOption) {
                                answerOptionQuestionId = otherOption.id
                            }
                        }

                        // For text-only answers (no answerOptionQuestionId), create or get a dummy AnswerOptionQuestion
                        if (!answerOptionQuestionId) {
                            // Check if a dummy option already exists for this question (in fetched data or database)
                            let dummyOption = question.answerQuestion.find(
                                opt => opt.answerText === '__TEXT_ANSWER__' && opt.otherOptionPlaceholder === null
                            )

                            if (!dummyOption) {
                                // Check in database if dummy option exists
                                dummyOption = await tx.answerOptionQuestion.findFirst({
                                    where: {
                                        questionId: questionId,
                                        answerText: '__TEXT_ANSWER__',
                                        otherOptionPlaceholder: null
                                    }
                                })

                                if (!dummyOption) {
                                    // Create a dummy AnswerOptionQuestion for text-only answers
                                    dummyOption = await tx.answerOptionQuestion.create({
                                        data: {
                                            questionId: questionId,
                                            answerText: '__TEXT_ANSWER__',
                                            sortOrder: 0,
                                            isTriggered: false,
                                            otherOptionPlaceholder: null
                                        }
                                    })
                                }
                            }

                            answerOptionQuestionId = dummyOption.id
                        }

                        await tx.answer.create({
                            data: {
                                responseRespondentId: responseRespondent.id,
                                questionId,
                                textAnswer: answerText.trim(),
                                answerOptionQuestionId: answerOptionQuestionId
                            }
                        })
                    }

                    // Handle multiple choice answers (for rating questions, this is the selected option ID)
                    if (answerOptionIds && answerOptionIds.length > 0 && (!answerText || answerText === '')) {
                        // Check if this is a rating question child (has parentId)
                        const isRatingChild = question.parentId !== null
                        
                        if (isRatingChild) {
                            // For rating question children, create Answer record with answerOptionQuestionId
                            const selectedOptionId = answerOptionIds[0] // Rating questions have only one option per child
                            
                            // For rating children, the answerOptionQuestionId should reference the parent's answerQuestion
                            let finalOptionId = selectedOptionId
                            if (question.parent && question.parent.answerQuestion) {
                                const parentOption = question.parent.answerQuestion.find(opt => opt.id === selectedOptionId)
                                if (!parentOption) {
                                    // Option not found in parent, use as is (shouldn't happen in normal flow)
                                    finalOptionId = selectedOptionId
                                }
                            }
                            
                            await tx.answer.create({
                                data: {
                                    responseRespondentId: responseRespondent.id,
                                    questionId,
                                    textAnswer: '', // Rating questions don't have text answers
                                    answerOptionQuestionId: finalOptionId
                                }
                            })
                        } else {
                            // For regular multiple choice questions, use AnswerMultipleChoice
                            // Filter out "other" options (they're handled above)
                            const regularOptions = answerOptionIds.filter(optionId => {
                                const option = question.answerQuestion.find(opt => opt.id === optionId)
                                return option && !option.otherOptionPlaceholder
                            })

                            if (regularOptions.length > 0) {
                                await tx.answerMultipleChoice.createMany({
                                    data: regularOptions.map(optionId => ({
                                        responseRespondentId: responseRespondent.id,
                                        questionId,
                                        answerOptionQuestionId: optionId
                                    }))
                                })
                            }
                        }
                    }
                }

                return {
                    id: responseRespondent.id,
                    surveyId: responseRespondent.surveyId,
                    respondentId: responseRespondent.respondentId,
                    submittedAt: responseRespondent.submittedAt
                }
            })

            return result
        } catch (error) {
            this.logger.error('Error in submitResponse:', error)
            throw error
        }
    }

    async saveDraft(data) {
        try {
            const { surveyId, respondentId, answers = [] } = data

            // Verify survey exists
            const survey = await this.prismaClient.survey.findUnique({
                where: { id: surveyId }
            })

            if (!survey) {
                throw new Error('Survey tidak ditemukan')
            }

            // Verify respondent exists
            const respondent = await this.prismaClient.respondent.findUnique({
                where: { id: respondentId }
            })

            if (!respondent) {
                throw new Error('Respondent tidak ditemukan')
            }

            // Check if response already exists (only find drafts - where submittedAt is null)
            let responseRespondent = await this.prismaClient.responseRespondent.findFirst({
                where: {
                    surveyId,
                    respondentId,
                    submittedAt: null // Only find drafts
                }
            })

            const result = await this.prismaClient.$transaction(async (tx) => {
                // Create or update response (without submittedAt for draft)
                if (responseRespondent) {
                    // Update existing draft response (keep submittedAt as null for draft)
                    responseRespondent = await tx.responseRespondent.update({
                        where: { id: responseRespondent.id },
                        data: {
                            updatedAt: new Date(),
                            // Don't set submittedAt - keep it as draft (null)
                        }
                    })

                    // Delete old answers
                    await tx.answer.deleteMany({
                        where: { responseRespondentId: responseRespondent.id }
                    })

                    await tx.answerMultipleChoice.deleteMany({
                        where: { responseRespondentId: responseRespondent.id }
                    })
                } else {
                    // Create new response (draft - submittedAt is null)
                    responseRespondent = await tx.responseRespondent.create({
                        data: {
                            surveyId,
                            respondentId,
                            submittedAt: null, // Explicitly set to null for draft
                        }
                    })
                }

                // Process answers
                for (const answerData of answers) {
                    const { questionId, answerText, answerOptionIds } = answerData

                    // Verify question exists and belongs to survey
                    const question = await tx.question.findFirst({
                        where: {
                            id: questionId,
                            codeQuestion: {
                                surveyId
                            }
                        },
                        include: {
                            answerQuestion: true
                        }
                    })

                    if (!question) {
                        this.logger.warn(`Question ${questionId} tidak ditemukan atau tidak termasuk dalam survey`)
                        continue
                    }

                    // Handle text answers (essay, short_text, long_text, etc.)
                    if (answerText !== undefined && answerText !== null && answerText !== '') {
                        // Find answer option if it's an "other" option
                        let answerOptionQuestionId = null
                        if (answerOptionIds && answerOptionIds.length > 0) {
                            // Check if one of the options is an "other" option
                            const otherOption = question.answerQuestion.find(
                                opt => opt.otherOptionPlaceholder !== null && answerOptionIds.includes(opt.id)
                            )
                            if (otherOption) {
                                answerOptionQuestionId = otherOption.id
                            }
                        }

                        // For text-only answers (no answerOptionQuestionId), create or get a dummy AnswerOptionQuestion
                        if (!answerOptionQuestionId) {
                            // Check if a dummy option already exists for this question (in fetched data or database)
                            let dummyOption = question.answerQuestion.find(
                                opt => opt.answerText === '__TEXT_ANSWER__' && opt.otherOptionPlaceholder === null
                            )

                            if (!dummyOption) {
                                // Check in database if dummy option exists
                                dummyOption = await tx.answerOptionQuestion.findFirst({
                                    where: {
                                        questionId: questionId,
                                        answerText: '__TEXT_ANSWER__',
                                        otherOptionPlaceholder: null
                                    }
                                })

                                if (!dummyOption) {
                                    // Create a dummy AnswerOptionQuestion for text-only answers
                                    dummyOption = await tx.answerOptionQuestion.create({
                                        data: {
                                            questionId: questionId,
                                            answerText: '__TEXT_ANSWER__',
                                            sortOrder: 0,
                                            isTriggered: false,
                                            otherOptionPlaceholder: null
                                        }
                                    })
                                }
                            }

                            answerOptionQuestionId = dummyOption.id
                        }

                        await tx.answer.create({
                            data: {
                                responseRespondentId: responseRespondent.id,
                                questionId,
                                textAnswer: answerText.trim(),
                                answerOptionQuestionId: answerOptionQuestionId
                            }
                        })
                    }

                    // Handle multiple choice answers
                    if (answerOptionIds && answerOptionIds.length > 0) {
                        // Filter out "other" options (they're handled above)
                        const regularOptions = answerOptionIds.filter(optionId => {
                            const option = question.answerQuestion.find(opt => opt.id === optionId)
                            return option && !option.otherOptionPlaceholder
                        })

                        if (regularOptions.length > 0) {
                            await tx.answerMultipleChoice.createMany({
                                data: regularOptions.map(optionId => ({
                                    responseRespondentId: responseRespondent.id,
                                    questionId,
                                    answerOptionQuestionId: optionId
                                }))
                            })
                        }
                    }
                }

                return {
                    id: responseRespondent.id,
                    surveyId: responseRespondent.surveyId,
                    respondentId: responseRespondent.respondentId,
                    submittedAt: responseRespondent.submittedAt
                }
            })

            return result
        } catch (error) {
            this.logger.error('Error in saveDraft:', error)
            throw error
        }
    }
}

module.exports = ResponseRepository

