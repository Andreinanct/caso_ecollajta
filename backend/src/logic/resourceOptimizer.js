/**
 * EcoLlajta Smart-Twin - Optimizador de Recursos
 * Calcula los recursos ideales (Staff, Bandejas, Tiempo) para una meta dada.
 */

const CONSTANTS = require('../config/constants');
const { countEdgePositions } = require('./trayOptimizer'); // Necesitamos esta utilidad si es exportable, si no la re-implementamos simple

/**
 * Calcula los recursos óptimos para una producción objetivo
 * asumiendo una jornada laboral estándar o buscando la eficiencia máxima.
 * @param {number} targetPots - Meta de producción
 */
function calculateOptimalResources(targetPots) {
    const { TIMES, DEHYDRATOR, PERFORMANCE, MOLDS } = CONSTANTS;

    // 1. Optimización de BANDEJAS (Trays)
    const edgePerTray = 2 * DEHYDRATOR.GRID_ROWS + 2 * (DEHYDRATOR.GRID_COLS - 2);
    const totalCapacityPerTray = DEHYDRATOR.CAPACITY_PER_TRAY;

    const optimalTrays = Math.ceil(targetPots / edgePerTray);
    const minTrays = Math.ceil(targetPots / totalCapacityPerTray);

    // 2. Optimización de PERSONAL (Staff) para Jornada Estándar (8h)
    const productionWindowHours = 3.5;
    const requiredThroughput = targetPots / productionWindowHours;
    const rateMoldeado = 30;
    const staffMoldeado = Math.ceil(requiredThroughput / rateMoldeado);

    let recommendedStaff8h = Math.ceil(staffMoldeado * 3.33);
    if (recommendedStaff8h < 4) recommendedStaff8h = 4;

    // 3. Optimización de MOLDES
    // Tiempo de reposo por molde: 5 min
    // Throughput requerido en la ventana de producción
    const moldRestTime = MOLDS?.REST_TIME_MIN || TIMES.MOLD_REST_MIN || 5;
    const cyclesPerMoldPerHour = 60 / moldRestTime; // 12 ciclos/hora por molde

    // Moldes necesarios para sostener el throughput del moldeado
    // Si moldeado produce a ~30 u/h por persona, y tenemos staffMoldeado personas:
    const moldingRate = rateMoldeado * staffMoldeado; // u/h total del equipo de moldeado

    // Cada molde puede ciclar cyclesPerMoldPerHour veces por hora
    // Necesitamos suficientes moldes para que no sean cuello de botella
    const optimalMolds = Math.ceil(moldingRate / cyclesPerMoldPerHour);
    const minMolds = Math.max(2, Math.ceil(targetPots / (cyclesPerMoldPerHour * productionWindowHours)));

    // Limitar a valores razonables
    const recommendedMolds = Math.max(3, Math.min(optimalMolds, 20));

    // 4. Estimación de TIEMPO PRECISA
    const { allocateStaff } = require('./staffAllocator');
    const simulation = allocateStaff(targetPots, 24, recommendedStaff8h, recommendedMolds);

    const realTotalTime = parseFloat(simulation.timeline.totalHours);
    const realProductionTime = parseFloat(simulation.timeline.productionHours);
    const setupMinutes = CONSTANTS.TIMES.PRECALENTADO_MIN;
    const bakingMinutes = CONSTANTS.TIMES.BAKING_TOTAL_MIN;

    return {
        targetPots,
        trays: {
            optimal: optimalTrays,
            minimum: minTrays,
            reason: `Para máxima calidad de secado, usa ${optimalTrays} bandejas (solo bordes). Mínimo absoluto: ${minTrays}.`
        },
        staff: {
            recommendedFor8h: recommendedStaff8h,
            explanation: `Para terminar en una jornada de 8h (3.5h producción + horno), necesitas ~${recommendedStaff8h} personas.`
        },
        molds: {
            optimal: recommendedMolds,
            minimum: minMolds,
            reason: `Con ${recommendedMolds} moldes (rotación cada ${moldRestTime} min), el moldeado no será cuello de botella.`
        },
        time: {
            fastestPossible: realTotalTime.toFixed(1),
            explanation: `Con ${recommendedStaff8h} personas y ${recommendedMolds} moldes, tardarías ${realTotalTime.toFixed(1)}h.`,
            breakdown: {
                production: realProductionTime.toFixed(1),
                productionMinutes: Math.round(simulation.timeline.production),
                baking: (bakingMinutes / 60).toFixed(1),
                bakingMinutes: bakingMinutes,
                setup: (setupMinutes / 60).toFixed(1),
                setupMinutes: setupMinutes
            }
        }
    };
}

module.exports = {
    calculateOptimalResources
};
