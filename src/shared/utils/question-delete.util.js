
class QuestionDeleteUtil {

    static async deleteQuestionRecursive(tx, questionId) {
        // Get all child questions
        const childQuestions = await tx.question.findMany({
            where: { parentId: questionId }
        })

        // Recursively delete all children first
        for (const child of childQuestions) {
            await this.deleteQuestionRecursive(tx, child.id)
        }

        // Delete QuestionTree entries where this question is a pointer (child)
        await tx.questionTree.deleteMany({
            where: { questionPointerToId: questionId }
        })

        // Delete QuestionTree entries where this question is a trigger (parent)
        await tx.questionTree.deleteMany({
            where: { questionTriggerId: questionId }
        })

        // Delete AnswerOptionQuestion entries
        await tx.answerOptionQuestion.deleteMany({
            where: { questionId }
        })

        // Delete Answer entries
        await tx.answer.deleteMany({
            where: { questionId }
        })

        // Delete AnswerMultipleChoice entries
        await tx.answerMultipleChoice.deleteMany({
            where: { questionId }
        })

        // Finally, delete the question itself
        await tx.question.delete({
            where: { id: questionId }
        })
    }
}

module.exports = QuestionDeleteUtil

