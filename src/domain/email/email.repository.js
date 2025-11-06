const BaseRepository = require("../../shared/base/base.repository")

class EmailRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.emailTemplate, logger)
        this.prismaClient = prisma
    }

    // Email Template Methods
    async getEmailTemplates(options = {}) {
        try {
            const { page = 1, limit = 10, search } = options

            const where = {}
            if (search) {
                where.OR = [
                    { code: { contains: search, mode: 'insensitive' } },
                    { templateName: { contains: search, mode: 'insensitive' } },
                    { subject: { contains: search, mode: 'insensitive' } }
                ]
            }

            const result = await this.getAll({
                page,
                limit,
                where,
                orderBy: { createdAt: 'desc' }
            })

            return {
                templates: result.data,
                meta: result.meta
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getEmailTemplateById(id) {
        try {
            const template = await this.prisma.findUnique({
                where: { id }
            })

            if (!template) {
                throw new Error("Email template not found")
            }

            return template
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async createEmailTemplate(data) {
        try {
            const template = await this.prisma.create({
                data: {
                    code: data.code,
                    templateName: data.templateName,
                    subject: data.subject,
                    bodyText: data.bodyText,
                    bodyHtml: data.bodyHtml
                }
            })

            return template
        } catch (error) {
            this.logger.error(error)
            if (error.code === 'P2002') {
                throw new Error("Code already exists")
            }
            throw error
        }
    }

    async updateEmailTemplate(id, data) {
        try {
            const template = await this.prisma.update({
                where: { id },
                data: {
                    ...(data.code && { code: data.code }),
                    ...(data.templateName && { templateName: data.templateName }),
                    ...(data.subject && { subject: data.subject }),
                    ...(data.bodyText && { bodyText: data.bodyText }),
                    ...(data.bodyHtml && { bodyHtml: data.bodyHtml })
                }
            })

            return template
        } catch (error) {
            this.logger.error(error)
            if (error.code === 'P2025') {
                throw new Error("Email template not found")
            }
            if (error.code === 'P2002') {
                throw new Error("Code already exists")
            }
            throw error
        }
    }

    async deleteEmailTemplate(id) {
        try {
            // Check if template is used in blast emails
            const blastEmails = await this.prismaClient.blastEmail.count({
                where: { emailTemplateId: id }
            })

            if (blastEmails > 0) {
                throw new Error("Cannot delete email template that is used in blast emails")
            }

            await this.prisma.delete({
                where: { id }
            })

            return true
        } catch (error) {
            this.logger.error(error)
            if (error.code === 'P2025') {
                throw new Error("Email template not found")
            }
            throw error
        }
    }

    // Blast Email Methods
    async getBlastEmails(options = {}) {
        try {
            const { page = 1, limit = 10, search, status, emailType } = options

            const where = {}
            if (search) {
                where.title = { contains: search, mode: 'insensitive' }
            }
            if (status) {
                where.status = status
            }
            if (emailType) {
                where.emailType = emailType
            }

            const result = await this.prismaClient.blastEmail.findMany({
                skip: (page - 1) * limit,
                take: limit,
                where,
                include: {
                    emailTemplate: {
                        select: {
                            id: true,
                            code: true,
                            templateName: true,
                            subject: true
                        }
                    },
                    survey: {
                        select: {
                            id: true,
                            targetRole: true
                        }
                    },
                    blastEmailRespondent: true
                },
                orderBy: { createdAt: 'desc' }
            })

            const total = await this.prismaClient.blastEmail.count({ where })

            // Format blast emails with calculated fields
            const formattedBlastEmails = await Promise.all(
                result.map(async (blastEmail) => {
                    const recipientCount = blastEmail.blastEmailRespondent.length
                    const sentCount = blastEmail.blastEmailRespondent.filter(
                        ber => ber.status === 'SENT'
                    ).length
                    const failedCount = blastEmail.blastEmailRespondent.filter(
                        ber => ber.status === 'FAILED'
                    ).length

                    // Determine recipientType from survey targetRole
                    // Note: recipientType and recipientFilters are not stored in DB
                    // This is a limitation - would need migration to add these fields
                    const recipientType = this.determineRecipientType(blastEmail.survey.targetRole)

                    return {
                        id: blastEmail.id,
                        surveyId: blastEmail.surveyId,
                        emailTemplateId: blastEmail.emailTemplateId,
                        emailTemplate: blastEmail.emailTemplate,
                        emailType: blastEmail.emailType,
                        title: blastEmail.title,
                        dateToSend: blastEmail.dateToSend,
                        status: blastEmail.status,
                        recipientType,
                        recipientFilters: null, // Would need to be stored in DB
                        recipientCount,
                        sentCount,
                        failedCount,
                        createdAt: blastEmail.createdAt,
                        updatedAt: blastEmail.updatedAt
                    }
                })
            )

            return {
                blastEmails: formattedBlastEmails,
                meta: {
                    total,
                    limit,
                    page,
                    totalPages: Math.ceil(total / limit)
                }
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getBlastEmailById(id) {
        try {
            const blastEmail = await this.prismaClient.blastEmail.findUnique({
                where: { id },
                include: {
                    emailTemplate: true,
                    survey: {
                        select: {
                            id: true,
                            targetRole: true
                        }
                    },
                    blastEmailRespondent: true
                }
            })

            if (!blastEmail) {
                throw new Error("Blast email not found")
            }

            const recipientCount = blastEmail.blastEmailRespondent.length
            const sentCount = blastEmail.blastEmailRespondent.filter(
                ber => ber.status === 'SENT'
            ).length
            const failedCount = blastEmail.blastEmailRespondent.filter(
                ber => ber.status === 'FAILED'
            ).length

            const recipientType = this.determineRecipientType(blastEmail.survey.targetRole)

            return {
                id: blastEmail.id,
                surveyId: blastEmail.surveyId,
                emailTemplateId: blastEmail.emailTemplateId,
                emailTemplate: blastEmail.emailTemplate,
                emailType: blastEmail.emailType,
                title: blastEmail.title,
                dateToSend: blastEmail.dateToSend,
                status: blastEmail.status,
                recipientType,
                recipientFilters: null, // Would need to be stored in DB
                recipientCount,
                sentCount,
                failedCount,
                createdAt: blastEmail.createdAt,
                updatedAt: blastEmail.updatedAt
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async createBlastEmail(data) {
        try {
            // Validate survey exists
            const survey = await this.prismaClient.survey.findUnique({
                where: { id: data.surveyId }
            })

            if (!survey) {
                throw new Error("Survey not found")
            }

            // Validate email template exists
            const template = await this.prisma.findUnique({
                where: { id: data.emailTemplateId }
            })

            if (!template) {
                throw new Error("Email template not found")
            }

            // Create blast email
            const blastEmail = await this.prismaClient.blastEmail.create({
                data: {
                    surveyId: data.surveyId,
                    emailTemplateId: data.emailTemplateId,
                    emailType: data.emailType,
                    title: data.title,
                    dateToSend: new Date(data.dateToSend)
                },
                include: {
                    emailTemplate: {
                        select: {
                            id: true,
                            code: true,
                            templateName: true,
                            subject: true
                        }
                    }
                }
            })

            // Determine recipients based on recipientType and filters
            const recipients = await this.getRecipients(data.recipientType, data.recipientFilters, survey.targetRole)

            // Create BlastEmailRespondent entries
            if (recipients.length > 0) {
                await this.prismaClient.blastEmailRespondent.createMany({
                    data: recipients.map(respondentId => ({
                        blastEmailId: blastEmail.id,
                        respondentId,
                        status: 'SCHEDULED'
                    }))
                })
            }

            // Get the created blast email with all relations
            const createdBlastEmail = await this.getBlastEmailById(blastEmail.id)

            return createdBlastEmail
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async updateBlastEmail(id, data) {
        try {
            // Check if blast email exists and is in SCHEDULED status
            const existingBlastEmail = await this.prismaClient.blastEmail.findUnique({
                where: { id }
            })

            if (!existingBlastEmail) {
                throw new Error("Blast email not found")
            }

            if (existingBlastEmail.status !== 'SCHEDULED') {
                throw new Error("Can only update blast emails with SCHEDULED status")
            }

            // Update basic fields
            const updateData = {}
            if (data.emailTemplateId) updateData.emailTemplateId = data.emailTemplateId
            if (data.emailType) updateData.emailType = data.emailType
            if (data.title) updateData.title = data.title
            if (data.dateToSend) updateData.dateToSend = new Date(data.dateToSend)

            if (Object.keys(updateData).length > 0) {
                await this.prismaClient.blastEmail.update({
                    where: { id },
                    data: updateData
                })
            }

            // If recipientType or recipientFilters changed, update recipients
            if (data.recipientType || data.recipientFilters) {
                const survey = await this.prismaClient.survey.findUnique({
                    where: { id: existingBlastEmail.surveyId }
                })

                const recipientType = data.recipientType || this.determineRecipientType(survey.targetRole)
                const recipientFilters = data.recipientFilters || null

                // Delete existing recipients
                await this.prismaClient.blastEmailRespondent.deleteMany({
                    where: { blastEmailId: id }
                })

                // Get new recipients
                const recipients = await this.getRecipients(recipientType, recipientFilters, survey.targetRole)

                // Create new BlastEmailRespondent entries
                if (recipients.length > 0) {
                    await this.prismaClient.blastEmailRespondent.createMany({
                        data: recipients.map(respondentId => ({
                            blastEmailId: id,
                            respondentId,
                            status: 'SCHEDULED'
                        }))
                    })
                }
            }

            // Return updated blast email
            return await this.getBlastEmailById(id)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async deleteBlastEmail(id) {
        try {
            // Check if blast email exists and is in SCHEDULED status
            const blastEmail = await this.prismaClient.blastEmail.findUnique({
                where: { id }
            })

            if (!blastEmail) {
                throw new Error("Blast email not found")
            }

            if (blastEmail.status !== 'SCHEDULED') {
                throw new Error("Can only delete blast emails with SCHEDULED status")
            }

            // Delete blast email (cascade will delete BlastEmailRespondent)
            await this.prismaClient.blastEmail.delete({
                where: { id }
            })

            return true
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async previewRecipientCount(recipientType, recipientFilters) {
        try {
            const recipients = await this.getRecipients(recipientType, recipientFilters)
            return {
                recipientCount: recipients.length
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    // Helper Methods
    async getRecipients(recipientType, recipientFilters = null, surveyTargetRole = null) {
        try {
            let where = {}

            if (recipientType === 'ALL') {
                // Get all respondents
                where = {}
            } else if (recipientType === 'ALUMNI') {
                where.role = 'ALUMNI'
                if (recipientFilters) {
                    where.alumni = {}
                    if (recipientFilters.facultyId) {
                        where.alumni.major = { facultyId: recipientFilters.facultyId }
                    }
                    if (recipientFilters.majorId) {
                        where.alumni.majorId = recipientFilters.majorId
                    }
                    if (recipientFilters.graduatedYear) {
                        where.alumni.graduatedYear = recipientFilters.graduatedYear
                    }
                    if (recipientFilters.graduatePeriode) {
                        where.alumni.graduatePeriode = recipientFilters.graduatePeriode
                    }
                }
            } else if (recipientType === 'MANAGER') {
                where.role = 'MANAGER'
            } else if (recipientType === 'CUSTOM') {
                // For custom recipients, we need to filter by email addresses
                if (recipientFilters && recipientFilters.customRecipients && recipientFilters.customRecipients.length > 0) {
                    where.email = { in: recipientFilters.customRecipients }
                } else {
                    // If custom but no customRecipients, return empty
                    return []
                }
            } else {
                // Default: use survey targetRole
                if (surveyTargetRole) {
                    where.role = surveyTargetRole
                }
            }

            const respondents = await this.prismaClient.respondent.findMany({
                where,
                select: { id: true }
            })

            return respondents.map(r => r.id)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    determineRecipientType(surveyTargetRole) {
        if (surveyTargetRole === 'ALUMNI') return 'ALUMNI'
        if (surveyTargetRole === 'MANAGER') return 'MANAGER'
        return 'ALL'
    }
}

module.exports = EmailRepository

