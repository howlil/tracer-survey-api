
class ResponseHttp {
    
    constructor(statusCode, message, data = null) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    send(res) {
        const responseBody ={
            success: this.statusCode < 400,
            message: this.message,
        }

        if (this.data !== null && this.data !== undefined){
            responseBody.data = this.data
        }
        
        return res.status(this.statusCode).json(responseBody);
    }

}

module.exports = ResponseHttp;