const express = require('express')

class IndexRoute {
    #app
    constructor() {
        this.#app = express.Router()
        this.setUp()
        this.wellcome()
    }

    setUp() {
        this.#app.use("/api", require("./faq/faq.route"))
        this.#app.use("/api", require("./role-permission/rolePermission.route"))
        this.#app.use("/api", require("./faculty/faculty.route"))
        this.#app.use("/api", require("./major/major.route"))
        this.#app.use("/api", require("./admin/admin.route"))
    }

    getRouter() {
        return this.#app
    }

    wellcome() {
        this.#app.get("/", (req, res) => {
            res.status(200).json(
                {
                    "success": true,
                    "message": "API Ready"
                }
            )
        })

    }


}

module.exports = new IndexRoute().getRouter()