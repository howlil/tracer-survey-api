const express = require('express');
require('dotenv').config();


class Main {
    constructor() {
        this.app = express();
        this.port = process.env.PORT;
    }

    start (){
        this.app.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        });
    }
}

module.exports = new Main();