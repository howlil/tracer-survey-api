/**
 * Generate PIN dengan kombinasi huruf dan angka (alphanumeric)
 * Menggunakan karakter yang mudah dibaca (menghindari 0, O, 1, I, l untuk menghindari kebingungan)
 * 
 * @param {number} length - Panjang PIN (default: 6)
 * @returns {string} PIN yang di-generate
 */
function generatePin(length = 6) {
    // Menggunakan karakter yang mudah dibaca:
    // - Angka: 2-9 (menghindari 0 dan 1 yang mirip dengan O dan I)
    // - Huruf: A-Z (kecuali I dan O yang mirip dengan 1 dan 0)
    const characters = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    let pin = ''
    for (let i = 0; i < length; i += 1) {
        const index = Math.floor(Math.random() * characters.length)
        pin += characters[index]
    }
    return pin
}

module.exports = {
    generatePin,
}

