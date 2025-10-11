const main = require('./src/index');

try {
    main.startUp()
} catch (error) {
    throw new Error(error);
}


