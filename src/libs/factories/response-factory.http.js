const ResponseHttp = require('../http/response.http');

class ResponseFactory {
    static get(data) {
        return new ResponseHttp(200, "data has been received", data);
    }
    static created(data) {
        return new ResponseHttp(201, "data has been created", data);
    }
    static updated(data) {
        return new ResponseHttp(200, "data has been updated", data);
    }
    static deleted(data) {
        return new ResponseHttp(200, "data has been deleted", data);
    }
   
}

module.exports = ResponseFactory;