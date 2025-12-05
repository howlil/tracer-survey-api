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
            console.error('[reCAPTCHA] Token tidak ada')
            return false
        }

        const secretKey = process.env.RECAPTCHA_SECRET_KEY

        if (!secretKey) {
            console.error('[reCAPTCHA] RECAPTCHA_SECRET_KEY tidak ditemukan di environment variables')
            return false
        }

        try {
            // Build form data untuk POST request
            const formData = new URLSearchParams()
            formData.append('secret', secretKey)
            formData.append('response', recaptchaToken)
            
            if (remoteIp) {
                formData.append('remoteip', remoteIp)
            }

            const response = await this.#makeRequest(
                'https://www.google.com/recaptcha/api/siteverify',
                formData.toString()
            )

            // reCAPTCHA v2 hanya return success: true/false
            // Tidak ada score seperti v3
            if (!response || !response.success) {
                console.error('[reCAPTCHA] Validation failed:', {
                    success: response?.success,
                    'error-codes': response?.['error-codes']
                })
                return false
            }

            return true
        } catch (error) {
            console.error('[reCAPTCHA] Error validating:', error.message, error.stack)
            return false
        }
    }


    static #makeRequest(url, postData) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url)

            const options = {
                hostname: parsedUrl.hostname,
                path: parsedUrl.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
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
                        console.error('Failed to parse reCAPTCHA response:', data)
                        reject(new Error('Failed to parse reCAPTCHA response'))
                    }
                })
            })

            req.on('error', (error) => {
                console.error('Request error:', error)
                reject(error)
            })

            // Write POST data
            req.write(postData)
            req.end()
        })
    }


    static getSiteKey() {
        return process.env.RECAPTCHA_SITE_KEY || ''
    }
}

module.exports = CaptchaUtil
