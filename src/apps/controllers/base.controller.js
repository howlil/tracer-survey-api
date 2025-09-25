const ResponseFactory = require('../../libs/factories/response-factory.http');

class BaseController {
    constructor(service) {
        if (!service) throw new Error('Service is required');
        this.service = service;
    }

    async getAll(req, res) {
        try {
            const options = {};
            const data = await this.service.findAll(options);

            ResponseFactory.get(data);

        } catch (error) {
            throw new Error(error);
        }

    }
}