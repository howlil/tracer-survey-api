import BaseRepository from './base.repository.js';

class UserRepository extends BaseRepository {
    constructor() {
        super('User');
    }

    
}

module.exports = new UserRepository();