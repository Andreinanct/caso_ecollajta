const { allocateStaff } = require('./logic/staffAllocator');

console.log("--- DEBUG START ---");
try {
    // Prueba estándar
    const result = allocateStaff(100, 8, 11, 20);
    console.log("Standard Test: OK");

    // Prueba con moldes = 0 (caso borde)
    const resultZero = allocateStaff(100, 8, 11, 0);
    console.log("Zero Molds Test: OK");

} catch (e) {
    console.error("CRASH DETECTED:");
    console.error(e.message);
    console.error(e.stack);
}
console.log("--- DEBUG END ---");
