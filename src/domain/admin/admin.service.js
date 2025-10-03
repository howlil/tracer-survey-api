const BaseService = require("../../shared/base/base.service")

class AdminService extends BaseService {
    constructor(opts) {
        super(opts.adminRepository, opts.logger)
        this.adminRepository = opts.adminRepository
    }

    async createAdmin(data) {

        const existingEmail = await this.adminRepository.findByEmail(data.email)

        if (existingEmail) {
            throw new Error('Email already exists')
        }

        const existingUsername = await this.adminRepository.findByUsername(username)
        if (existingUsername) {
            throw new Error('Username already exists')
        }

    }
}

module.exports = AdminService