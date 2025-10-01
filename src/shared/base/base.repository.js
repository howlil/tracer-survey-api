
class BaseRepository {
    constructor(prisma, logger) {
        this.prisma = prisma;
        this.logger = logger;
    }

    async create(data) {
        try {
            return await this.prisma.create(data);
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            return await this.prisma.update(id, data);
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    async delete(id) {
        try {
            return await this.prisma.delete(id);
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }
    async findAll() {
        try {
            return await this.prisma.findAll();
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }
    async findById(id) {
        try {
            return await this.prisma.findById(id);
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    async findOne(id) {
        try {
            return await this.prisma.findOne(id);
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    async transaction(callback, options = {}) {
        try {
            return await this.prisma.$transaction(async (tx) => {
                return await callback(tx);
            }, {
                maxWait: options.maxWait || 10000,
                timeout: options.timeout || 10000,
                isolationLevel: options.isolationLevel,
            }
            );
        } catch (error) {
            this.logger.error(error);
            throw error;
        }


    }

    async paginate(options = {}) {
        const {
            page: pageParam = 1,
            limit: limitParam = 10,
            where = {},
            orderBy = {},
            select = {},
            include = {}
        } = options;

        const page = Number(pageParam);
        const limit = Number(limitParam);
        const skip = (page - 1) * limit;


        const excludedFields = ['createdAt', 'updatedAt'];
        const filteredSelect = Object.fromEntries(
            Object.entries(select).filter(([key]) => !excludedFields.includes(key))
        )

        try {

            const [total, data] = await this.prisma.$transaction([
                this.prisma.count({ where }),
                this.prisma.findMany({
                    skip,
                    take: limit,
                    where,
                    orderBy,
                    select: Object.keys(filteredSelect).length ? filteredSelect : undefined,
                    include: Object.keys(include).length ? include : undefined
                })
            ])

            return {
                data,
                pagination: {
                    total,
                    limit,
                    page,
                    totalPages: Math.ceil(total / limit),
                }
            };


        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    static buildWhereClause(filters = {}) {
        const where = {};

        Object.entries(filters).forEach(([key, value]) => {
            if (['createdAt', 'updatedAt', 'page', 'limit', 'sort'].includes(key)) {
                return;
            }

            if (value !== undefined && value !== null && value !== '') {
                if (key.endsWith('_from') || key.endsWith('_to')) {
                    const fieldName = key.replace(/_from|_to$/, '');
                    if (!where[fieldName]) where[fieldName] = {};

                    if (key.endsWith('_from')) {
                        where[fieldName].gte = new Date(value);
                    } else {
                        where[fieldName].lte = new Date(value);
                    }
                    return;
                }

                if (Array.isArray(value)) {
                    where[key] = { in: value };
                    return;
                }

                if (typeof value === 'string' && value.includes(',')) {
                    where[key] = { in: value.split(',') };
                    return;
                }

                if (typeof value === 'string' && !isNaN(value) && !isNaN(parseFloat(value))) {
                    where[key] = value.includes('.') ? parseFloat(value) : parseInt(value, 10);
                    return;
                }

                if (typeof value === 'string') {
                    where[key] = { contains: value, mode: 'insensitive' };
                    return;
                }

                where[key] = value;
            }
        });

        return where;
    }
}

module.exports = BaseRepository;