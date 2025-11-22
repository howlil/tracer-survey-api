function generatePin(length = 6) {
    const digits = '0123456789'
    let pin = ''
    for (let i = 0; i < length; i += 1) {
        const index = Math.floor(Math.random() * digits.length)
        pin += digits[index]
    }
    return pin
}

module.exports = {
    generatePin,
}

