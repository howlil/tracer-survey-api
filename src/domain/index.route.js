const express = require('express')

class IndexRoute {
    #app
    constructor(){
        this.#app = express.Router()
    }

    setUp () {
        this.#app.use("/api",require("./admin/admin.route"))
    }   

}

module.exports = IndexRoute