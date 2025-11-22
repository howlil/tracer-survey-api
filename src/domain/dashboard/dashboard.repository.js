const BaseRepository = require("../../shared/base/base.repository")

class DashboardRepository extends BaseRepository {
    constructor(prisma, logger) {
        // We'll use ResponseRespondent as the base model, but also keep a reference
        // to the full prisma client for cross‑model aggregations
        super(prisma.responseRespondent, logger)
        this.prismaClient = prisma
    }

    /**
     * Get high level stats for the admin dashboard.
     *
     * The method is intentionally light on business rules – it just aggregates
     * counts that can be visualised on the dashboard UI.
     */
    async getOverview() {
        try {
            const [
                tracerResponses,
                userSurveyResponses,
                totalAlumni,
                totalManagers
            ] = await Promise.all([
                // Total responses for tracer study (alumni)
                this.prisma.count({
                    where: {
                        survey: {
                            targetRole: "ALUMNI"
                        }
                    }
                }),

                // Total responses for user survey (manager)
                this.prisma.count({
                    where: {
                        survey: {
                            targetRole: "MANAGER"
                        }
                    }
                }),

                // Total potential alumni respondents
                this.prismaClient.respondent.count({
                    where: { role: "ALUMNI" }
                }),

                // Total potential manager respondents
                this.prismaClient.respondent.count({
                    where: { role: "MANAGER" }
                })
            ])

            const totalResponses = tracerResponses + userSurveyResponses
            const totalRespondents = totalAlumni + totalManagers

            const responseRate =
                totalRespondents > 0
                    ? Number(((totalResponses / totalRespondents) * 100).toFixed(1))
                    : 0

            const pendingReviews = (totalAlumni - tracerResponses) + (totalManagers - userSurveyResponses)

            return {
                stats: {
                    totalTracerStudy: tracerResponses,
                    totalUserSurvey: userSurveyResponses,
                    responseRate,
                    pendingReviews: pendingReviews < 0 ? 0 : pendingReviews
                }
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    /**
     * Get last N responses for activity feed.
     */
    async getRecentActivities(limit = 10) {
        try {
            const responses = await this.prisma.findMany({
                take: limit,
                orderBy: { submittedAt: "desc" },
                include: {
                    survey: true,
                    respondent: {
                        include: {
                            alumni: {
                                include: {
                                    major: true
                                }
                            },
                            manager: true
                        }
                    }
                }
            })

            return responses.map((response) => {
                const { survey, respondent, submittedAt } = response

                const isTracer = survey.targetRole === "ALUMNI"
                const type = isTracer ? "TRACER_STUDY" : "USER_SURVEY"

                let name = respondent.fullName
                if (isTracer && respondent.alumni?.major) {
                    name = `${respondent.fullName} - ${respondent.alumni.major.majorName}`
                } else if (!isTracer && respondent.manager?.company) {
                    name = `${respondent.manager.company} - Perusahaan`
                }

                // For now, all submitted responses are treated as completed.
                const status = "COMPLETED"

                return {
                    id: response.id,
                    type,
                    name,
                    status,
                    submittedAt
                }
            })
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = DashboardRepository


