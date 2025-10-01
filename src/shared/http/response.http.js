
class ResponseHttp {
    
    constructor(statusCode, message, data = null) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    send(res) {
        return res.status(this.statusCode).json({
            success: this.statusCode < 400,
            message: this.message,
            data: this.data
        });
    }

}

module.exports = ResponseHttp;