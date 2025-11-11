const PasswordUtil = require("../../shared/utils/password.util")
const TokenUtil = require("../../shared/utils/token.util")

class AuthService {
    constructor(authRepository, logger) {
        this.authRepository = authRepository
        this.logger = logger
    }

    async adminLogin(email, password) {
        try {
            const admin = await this.authRepository.findAdminByEmail(email)

            if (!admin) {
                throw new Error('Email atau password salah')
            }

            if (!admin.isActive) {
                throw new Error('Akun admin tidak aktif')
            }

            const isPasswordValid = await PasswordUtil.verifyPassword(password, admin.password)

            if (!isPasswordValid) {
                throw new Error('Email atau password salah')
            }

            const token = TokenUtil.generateToken(admin.id)

            return {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                username: admin.username,
                token
            }
        } catch (error) {
            this.logger.error('Error in adminLogin:', error)
            throw error
        }
    }

    async alumniLogin(pin) {
        try {
            const pinAlumni = await this.authRepository.findAlumniByPin(pin)

            if (!pinAlumni) {
                throw new Error('PIN tidak valid')
            }

            if (pinAlumni.pinType !== 'ALUMNI') {
                throw new Error('PIN tidak valid untuk login alumni')
            }

            // PIN Alumni tidak boleh terhubung dengan manager (harus null)
            if (pinAlumni.managerId) {
                throw new Error('PIN tidak valid untuk login alumni')
            }

            if (!pinAlumni.alumniId) {
                throw new Error('PIN alumni tidak terhubung dengan alumni')
            }

            if (!pinAlumni.alumni) {
                throw new Error('Data alumni tidak ditemukan')
            }

            const alumni = pinAlumni.alumni
            const respondent = alumni.respondent

            const token = TokenUtil.generateToken(respondent.id)

            return {
                id: respondent.id,
                name: respondent.fullName,
                email: respondent.email,
                token
            }
        } catch (error) {
            this.logger.error('Error in alumniLogin:', error)
            throw error
        }
    }

    async managerLogin(pin) {
        try {
            const pinManager = await this.authRepository.findManagerByPin(pin)

            if (!pinManager) {
                throw new Error('PIN tidak valid')
            }

            if (pinManager.pinType !== 'MANAGER') {
                throw new Error('PIN tidak valid untuk login manager')
            }

            if (!pinManager.manager) {
                throw new Error('Data manager tidak ditemukan')
            }

            if (!pinManager.managerId) {
                throw new Error('PIN manager tidak terhubung dengan manager')
            }

            if (!pinManager.alumniId) {
                throw new Error('PIN manager tidak terhubung dengan alumni')
            }

            if (!pinManager.alumni) {
                throw new Error('Data alumni yang terhubung dengan PIN tidak ditemukan')
            }

            const manager = pinManager.manager
            const respondent = manager.respondent
            const alumni = pinManager.alumni

            const token = TokenUtil.generateToken(respondent.id)

            return {
                id: respondent.id,
                name: respondent.fullName,
                email: respondent.email,
                token,
                // Info alumni yang bisa di-survey dengan PIN ini
                alumniId: alumni.id,
                alumniName: alumni.respondent.fullName,
                alumniEmail: alumni.respondent.email
            }
        } catch (error) {
            this.logger.error('Error in managerLogin:', error)
            throw error
        }
    }
}

module.exports = AuthService

