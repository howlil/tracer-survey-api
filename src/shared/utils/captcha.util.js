const crypto = require('crypto')

class CaptchaUtil {
    static #captchaStore = new Map()
    static #expireTime = 5 * 60 * 1000 
    static #cleanupInterval = 10 * 60 * 1000
    static #cleanupStarted = false

    static #initCleanup() {
        if (!CaptchaUtil.#cleanupStarted) {
            setInterval(() => {
                CaptchaUtil.#cleanupExpired()
            }, CaptchaUtil.#cleanupInterval)
            CaptchaUtil.#cleanupStarted = true
        }
    }


    static generateMathCaptcha() {
        CaptchaUtil.#initCleanup()
        const num1 = Math.floor(Math.random() * 10) + 1
        const num2 = Math.floor(Math.random() * 10) + 1
        const operators = ['+', '-', '*']
        const operator = operators[Math.floor(Math.random() * operators.length)]
        
        let answer
        let question

        switch (operator) {
            case '+':
                answer = num1 + num2
                question = `${num1} + ${num2}`
                break
            case '-':
                // Pastikan hasil tidak negatif
                const maxNum = Math.max(num1, num2)
                const minNum = Math.min(num1, num2)
                answer = maxNum - minNum
                question = `${maxNum} - ${minNum}`
                break
            case '*':
                // Untuk perkalian, gunakan angka lebih kecil
                const smallNum1 = Math.floor(Math.random() * 5) + 1
                const smallNum2 = Math.floor(Math.random() * 5) + 1
                answer = smallNum1 * smallNum2
                question = `${smallNum1} × ${smallNum2}`
                break
        }

        const captchaId = crypto.randomBytes(16).toString('hex')
        
        // Store captcha dengan timestamp
        CaptchaUtil.#captchaStore.set(captchaId, {
            answer: answer.toString(),
            createdAt: Date.now()
        })

        return {
            captchaId,
            question,
            // Tidak return answer untuk security
        }
    }

    /**
     * Generate captcha text (4-6 karakter alfanumerik)
     * @returns {Object} { captchaId, question, answer }
     */
    static generateTextCaptcha(length = 5) {
        CaptchaUtil.#initCleanup()
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars
        let text = ''
        
        for (let i = 0; i < length; i++) {
            text += chars.charAt(Math.floor(Math.random() * chars.length))
        }

        const captchaId = crypto.randomBytes(16).toString('hex')
        
        // Store captcha dengan timestamp
        CaptchaUtil.#captchaStore.set(captchaId, {
            answer: text,
            createdAt: Date.now()
        })

        return {
            captchaId,
            question: text, // Untuk text captcha, question = text yang harus diinput
        }
    }

    /**
     * Validate captcha answer
     * @param {string} captchaId - ID dari captcha yang di-generate
     * @param {string} answer - Jawaban dari user
     * @returns {boolean} true jika valid, false jika tidak
     */
    static validateCaptcha(captchaId, answer) {
        if (!captchaId || !answer) {
            return false
        }

        const captchaData = CaptchaUtil.#captchaStore.get(captchaId)

        if (!captchaData) {
            return false
        }

        // Check if expired
        const now = Date.now()
        if (now - captchaData.createdAt > CaptchaUtil.#expireTime) {
            CaptchaUtil.#captchaStore.delete(captchaId)
            return false
        }

        // Validate answer (case insensitive untuk text captcha)
        const isValid = captchaData.answer.toLowerCase() === answer.toString().toLowerCase().trim()

        // Remove captcha setelah digunakan (one-time use)
        CaptchaUtil.#captchaStore.delete(captchaId)

        return isValid
    }

    /**
     * Cleanup expired captchas
     */
    static #cleanupExpired() {
        const now = Date.now()
        const expiredKeys = []

        for (const [captchaId, data] of CaptchaUtil.#captchaStore.entries()) {
            if (now - data.createdAt > CaptchaUtil.#expireTime) {
                expiredKeys.push(captchaId)
            }
        }

        expiredKeys.forEach(key => {
            CaptchaUtil.#captchaStore.delete(key)
        })

        if (expiredKeys.length > 0) {
            console.log(`Cleaned up ${expiredKeys.length} expired captchas`)
        }
    }

    /**
     * Get captcha info tanpa reveal answer (untuk debugging)
     */
    static getCaptchaInfo(captchaId) {
        const captchaData = CaptchaUtil.#captchaStore.get(captchaId)
        
        if (!captchaData) {
            return null
        }

        const now = Date.now()
        const age = now - captchaData.createdAt
        const isExpired = age > CaptchaUtil.#expireTime

        return {
            exists: true,
            age: Math.floor(age / 1000), // dalam detik
            isExpired,
            expiresIn: Math.max(0, Math.floor((CaptchaUtil.#expireTime - age) / 1000))
        }
    }

    /**
     * Clear all captchas (untuk testing)
     */
    static clearAll() {
        CaptchaUtil.#captchaStore.clear()
    }
}

module.exports = CaptchaUtil

