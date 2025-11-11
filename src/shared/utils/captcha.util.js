const https = require('https')

class CaptchaUtil {
    /**
     * Validate Google reCAPTCHA v2 token
     * @param {string} recaptchaToken - Token dari Google reCAPTCHA v2
     * @param {string} remoteIp - Optional: IP address dari user (untuk security)
     * @returns {Promise<boolean>} true jika valid, false jika tidak
     */
    static async validateRecaptcha(recaptchaToken, remoteIp = null) {
        if (!recaptchaToken) {
            return false
        }

        const secretKey = process.env.RECAPTCHA_SECRET_KEY

        if (!secretKey) {
            console.error('RECAPTCHA_SECRET_KEY tidak ditemukan di environment variables')
            return false
        }

        try {
            const url = new URL('https://www.google.com/recaptcha/api/siteverify')
            url.searchParams.append('secret', secretKey)
            url.searchParams.append('response', recaptchaToken)

            if (remoteIp) {
                url.searchParams.append('remoteip', remoteIp)
            }

            const response = await this.#makeRequest(url.toString())

            // reCAPTCHA v2 hanya return success: true/false
            // Tidak ada score seperti v3
            if (!response || !response.success) {
                return false
            }

            return true
        } catch (error) {
            console.error('Error validating reCAPTCHA:', error)
            return false
        }
    }


    static #makeRequest(url) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url)

            const options = {
                hostname: parsedUrl.hostname,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }

            const req = https.request(options, (res) => {
                let data = ''

                res.on('data', (chunk) => {
                    data += chunk
                })

                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data)
                        resolve(parsed)
                    } catch (error) {
                        reject(new Error('Failed to parse reCAPTCHA response'))
                    }
                })
            })

            req.on('error', (error) => {
                reject(error)
            })

            req.end()
        })
    }


    static getSiteKey() {
        return process.env.RECAPTCHA_SITE_KEY || ''
    }
}

module.exports = CaptchaUtil
