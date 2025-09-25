const prisma = require("../../libs/configs/prisma.config")

class BaseRepository {
    constructor(model) {
        if (!model) throw new Error('Model name is required');  
        this.model = model;
        this.prisma = prisma;
    }

    async findAll(options = {}) {
        try {
            return await this.prisma[this.model].findMany({
                ...options
            });
        } catch (error) {
            throw new Error(`Error finding all ${this.model}: ${error.message}`);
        }
    }

    async findById(id, options = {}) {
        try {
            if (!id) throw new Error('ID is required');
            return await this.prisma[this.model].findUnique({
                where: { id },
                ...options
            });
        } catch (error) {
            throw new Error(`Error finding ${this.model} by ID: ${error.message}`);
        }
    }

    async create(data) {
        try {
            if (!data) throw new Error('Data is required');
            return await this.prisma[this.model].create({
                data
            });
        } catch (error) {
            throw new Error(`Error creating ${this.model}: ${error.message}`);
        }
    }

    async update(id, data) {
        try {
            if (!id) throw new Error('ID is required');
            if (!data) throw new Error('Data is required');
            return await this.prisma[this.model].update({
                where: { id },
                data
            });
        } catch (error) {
            throw new Error(`Error updating ${this.model}: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            if (!id) throw new Error('ID is required');
            return await this.prisma[this.model].delete({
                where: { id }
            });
        } catch (error) {
            throw new Error(`Error deleting ${this.model}: ${error.message}`);
        }
    }

    async findOne(conditions, options = {}) {
        try {
            if (!conditions) throw new Error('Conditions are required');
            return await this.prisma[this.model].findFirst({
                where: conditions,
                ...options
            });
        } catch (error) {
            throw new Error(`Error finding ${this.model}: ${error.message}`);
        }
    }
}

module.exports = BaseRepository;