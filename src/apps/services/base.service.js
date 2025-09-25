class BaseService {
    constructor(repository) {
        if (!repository) throw new Error('Repository is required');
        this.repository = repository;
    }

    async findAll(options = {}) {
        try {
            return await this.repository.findAll(options);
        } catch (error) {
            throw new Error(`Service error: ${error.message}`);
        }
    }

    async findById(id, options = {}) {
        try {
            const result = await this.repository.findById(id, options);
            if (!result) throw new Error('Record not found');
            return result;
        } catch (error) {
            throw new Error(`Service error: ${error.message}`);
        }
    }

    async create(data) {
        try {
            return await this.repository.create(data);
        } catch (error) {
            throw new Error(`Service error: ${error.message}`);
        }
    }   

    async update(id, data) {
        try {
            const exists = await this.repository.findById(id);
            if (!exists) throw new Error('Record not found');
            return await this.repository.update(id, data);
        } catch (error) {
            throw new Error(`Service error: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            const exists = await this.repository.findById(id);
            if (!exists) throw new Error('Record not found');
            return await this.repository.delete(id);
        } catch (error) {
            throw new Error(`Service error: ${error.message}`);
        }
    }

    async findOne(conditions, options = {}) {
        try {
            return await this.repository.findOne(conditions, options);
        } catch (error) {
            throw new Error(`Service error: ${error.message}`);
        }
    }
}

module.exports = BaseService;