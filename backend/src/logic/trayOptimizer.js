/**
 * EcoLlajta Smart-Twin - Optimizador de Bandejas del Deshidratador
 * Calcula la distribución espacial óptima para secado uniforme
 */

const CONSTANTS = require('../config/constants');

/**
 * Cuenta las posiciones de borde (verdes) disponibles en una bandeja
 * Bordes = esquinas + laterales (excluye el centro)
 */
function countEdgePositions(rows, cols) {
    // 4 esquinas + (cols-2)*2 bordes horizontales + (rows-2)*2 bordes verticales
    return 4 + (cols - 2) * 2 + (rows - 2) * 2;
}

/**
 * Genera la distribución óptima de macetas en las bandejas
 * @param {number} potsToPlace - Cantidad de macetas a colocar
 * @param {boolean} maximizeTrays - Si true, usa más bandejas para evitar centros
 * @param {number} traysAvailableInput - Número de bandejas disponibles (default 4)
 * @param {string} optimizationMode - 'strict' = solo bordes, 'balanced' = permite centros si ahorra ciclos
 * @returns {Object} Distribución de bandejas y recomendaciones
 */
function optimizeTrayDistribution(potsToPlace, maximizeTrays = false, traysAvailableInput = 4, traySpacing = 2, optimizationMode = 'balanced') {
    const { DEHYDRATOR, CONSTRAINTS } = CONSTANTS;
    const { CAPACITY_PER_TRAY, GRID_ROWS, GRID_COLS, SPACING_STANDARD, SPACING_COMPACT } = DEHYDRATOR;

    // Seleccionar configuración según espaciado elegido
    const spacingConfig = traySpacing === 1 ? SPACING_COMPACT : SPACING_STANDARD;
    const maxEffective = spacingConfig.maxTrays;
    const bakingHours = spacingConfig.bakingHours;
    const slotsUsed = spacingConfig.slots;

    // Limitar bandejas a la capacidad efectiva del horno
    let TRAYS_AVAILABLE = Math.min(traysAvailableInput || DEHYDRATOR.TRAYS_AVAILABLE, maxEffective);

    const alerts = [];

    // Alerta si el usuario pide más bandejas de las que caben físicamente
    if (traysAvailableInput > maxEffective) {
        alerts.push({
            type: 'warning',
            message: `⚠️ El horno solo permite ${maxEffective} bandejas con espaciado de ${slotsUsed} nivel(es) entre cada una. Se usarán ${maxEffective}.`
        });
    }

    const maxCapacityPerCycle = maxEffective * CAPACITY_PER_TRAY;
    const edgePositionsPerTray = countEdgePositions(GRID_ROWS, GRID_COLS); // 22 posiciones verdes
    const intermediatePositionsPerTray = countIntermediatePositions(GRID_ROWS, GRID_COLS);

    // Calcular cuántas bandejas se necesitan según el modo
    let traysNeededForAllPots;

    if (maximizeTrays) {
        // En modo maximizar: primero solo bordes
        traysNeededForAllPots = Math.ceil(potsToPlace / edgePositionsPerTray);
    } else {
        // En modo normal: llenar completamente
        traysNeededForAllPots = Math.ceil(potsToPlace / CAPACITY_PER_TRAY);
    }

    // Calcular ciclos de horneado necesarios
    // ESTRATEGIA HÍBRIDA:
    // 1. Calculamos ciclos mínimos físicos (usando toda la capacidad si es necesario) para ahorrar tiempo.
    // 2. Calculamos ciclos ideales (solo bordes).
    // Si la diferencia es grande, preferimos ahorrar ciclos llenando centros.

    const physicalCapacityPerCycle = maxEffective * CAPACITY_PER_TRAY; // 40 * bandejas
    const minPhysicalCycles = Math.ceil(potsToPlace / physicalCapacityPerCycle);

    const idealCapacityPerCycle = maxEffective * (maximizeTrays ? edgePositionsPerTray : CAPACITY_PER_TRAY);
    const idealCycles = Math.ceil(potsToPlace / idealCapacityPerCycle);

    // Si 'Maximizar Bandejas' generaría ciclos extra, forzamos usar la capacidad física (rellenar centros)
    // para ahorrar 6h de horneado. SOLO SI optimizationMode es 'balanced'.
    const allowSmartFill = optimizationMode === 'balanced';
    const useSmartFill = maximizeTrays && allowSmartFill && (minPhysicalCycles < idealCycles);

    const cyclesNeeded = useSmartFill ? minPhysicalCycles : idealCycles;
    const totalBakingHoursNeeded = cyclesNeeded * bakingHours;

    // Si necesitamos múltiples ciclos, generar distribución por ciclo
    const cycles = [];
    let remainingTotal = potsToPlace;

    for (let cycleNum = 1; cycleNum <= cyclesNeeded && remainingTotal > 0; cycleNum++) {
        const traysThisCycle = [];

        // Cuantas bandejas usar en este ciclo?
        // Si estamos en SmartFill, intentamos usar todas las disponibles para maximizar bordes
        const traysInThisCycle = useSmartFill ? maxEffective : Math.min(maxEffective, Math.ceil(remainingTotal / (maximizeTrays ? edgePositionsPerTray : CAPACITY_PER_TRAY)));

        // Calcular cuántas macetas procesar en este ciclo
        // Si SmartFill está activo, permitimos usar hasta la capacidad TOTAL (40) si es necesario para evitar otro ciclo
        // Si no, nos limitamos estrictamente a bordes (22)
        const capacityPerTrayThisMode = (maximizeTrays && !useSmartFill) ? edgePositionsPerTray : CAPACITY_PER_TRAY;
        const maxPotsThisCycle = traysInThisCycle * capacityPerTrayThisMode;

        // Distribuimos equitativamente las macetas restantes entre los ciclos pendientes para balancear carga
        const cyclesRemaining = cyclesNeeded - cycleNum + 1;
        const targetPotsForThisCycle = Math.ceil(remainingTotal / cyclesRemaining);

        let remainingThisCycle = Math.min(targetPotsForThisCycle, maxPotsThisCycle);
        let potsPlacedThisCycle = 0;

        if (maximizeTrays) {
            // NUEVA LÓGICA: Llenar bordes de TODAS las bandejas primero
            // Fase 1: Solo bordes - llenar bandeja por bandeja
            const edgeAllocation = [];
            let tempRemaining = remainingThisCycle;

            // Primero asignamos los bordes a cada bandeja (máx 22 por bandeja)
            for (let i = 0; i < traysInThisCycle && tempRemaining > 0; i++) {
                const potsForEdge = Math.min(tempRemaining, edgePositionsPerTray);
                edgeAllocation.push(potsForEdge);
                tempRemaining -= potsForEdge;
            }

            // Asegurar que tengamos entradas para todas las bandejas que usaremos
            while (edgeAllocation.length < traysInThisCycle) {
                edgeAllocation.push(0);
            }

            // Fase 2: Si aún quedan, agregar al centro/intermedio empezando por bandeja 1
            const centerAllocation = new Array(edgeAllocation.length).fill(0);
            let trayIdx = 0;
            while (tempRemaining > 0 && trayIdx < edgeAllocation.length) {
                const currentEdge = edgeAllocation[trayIdx];
                const spaceLeft = CAPACITY_PER_TRAY - currentEdge - centerAllocation[trayIdx];
                const toAdd = Math.min(tempRemaining, spaceLeft);
                centerAllocation[trayIdx] += toAdd;
                tempRemaining -= toAdd;
                trayIdx++;
            }

            // Crear bandejas con la distribución calculada (solo las que tienen macetas)
            for (let i = 0; i < edgeAllocation.length; i++) {
                const potsInTray = edgeAllocation[i] + centerAllocation[i];
                if (potsInTray === 0) continue; // Saltar bandejas vacías

                const grid = generate3ZoneGrid(potsInTray, GRID_ROWS, GRID_COLS);

                const usesIntermediate = potsInTray > edgePositionsPerTray;
                const usesCenter = potsInTray > (edgePositionsPerTray + intermediatePositionsPerTray);

                traysThisCycle.push({
                    trayNumber: traysThisCycle.length + 1,
                    potsCount: potsInTray,
                    edgePots: Math.min(potsInTray, edgePositionsPerTray),
                    centerPots: Math.max(0, potsInTray - edgePositionsPerTray),
                    grid,
                    fillPercentage: ((potsInTray / CAPACITY_PER_TRAY) * 100).toFixed(0) + '%',
                    edgeOnly: !usesIntermediate,
                    usesIntermediate,
                    usesCenter
                });
                potsPlacedThisCycle += potsInTray;
            }
        } else {
            // MODO NORMAL: Llenar bandejas completamente una por una
            for (let i = 0; i < traysInThisCycle && remainingThisCycle > 0; i++) {
                const potsInTray = Math.min(remainingThisCycle, CAPACITY_PER_TRAY);
                const grid = generate3ZoneGrid(potsInTray, GRID_ROWS, GRID_COLS);

                traysThisCycle.push({
                    trayNumber: i + 1,
                    potsCount: potsInTray,
                    grid,
                    fillPercentage: ((potsInTray / CAPACITY_PER_TRAY) * 100).toFixed(0) + '%',
                    edgeOnly: potsInTray <= edgePositionsPerTray
                });
                remainingThisCycle -= potsInTray;
                potsPlacedThisCycle += potsInTray;
            }
        }

        cycles.push({
            cycleNumber: cycleNum,
            trays: traysThisCycle,
            potsInCycle: potsPlacedThisCycle,
            traysUsed: traysThisCycle.length,
            bakingHours: bakingHours
        });

        remainingTotal -= potsPlacedThisCycle;
    }

    // Para compatibilidad, aplanar todas las bandejas del primer ciclo
    const trays = cycles[0]?.trays || [];
    const traysNeeded = trays.length;
    const usesCenter = trays.some(t => t.usesCenter);
    const usesIntermediate = trays.some(t => t.usesIntermediate);

    // Calcular riesgo de secado desigual
    const densityRisk = calculateDensityRisk(potsToPlace, traysNeeded, maximizeTrays && !usesCenter);

    // Generar cronograma de rotación
    const rotationSchedule = generateRotationSchedule(trays);

    return {
        success: true,
        mode: maximizeTrays ? 'optimizado' : 'estándar',
        summary: {
            totalPots: potsToPlace,
            traysUsed: traysNeeded,
            averagePerTray: traysNeeded > 0 ? Math.ceil(potsToPlace / (cyclesNeeded * traysNeeded)) : 0,
            edgeOnlyMode: maximizeTrays && !usesIntermediate && !usesCenter,
            usesIntermediate,
            usesCenter,
            totalTraysNeeded: traysNeededForAllPots
        },
        trays, // Primera tanda para compatibilidad
        cycles, // NUEVO: Distribución por ciclos
        densityAnalysis: densityRisk,
        rotationSchedule,
        // Info de horneado
        bakingInfo: {
            traySpacing: slotsUsed,
            maxTraysPerCycle: maxEffective,
            bakingHoursPerCycle: bakingHours,
            bakingCycles: cyclesNeeded,
            totalBakingHours: totalBakingHoursNeeded
        },
        alerts: [...alerts, ...generateTrayAlerts(potsToPlace, traysNeeded, densityRisk, maximizeTrays, usesIntermediate, usesCenter, maxEffective)]
    };
}

/**
 * Genera prioridad de bandejas (centro hacia afuera)
 */
function generateTrayPriority(totalTrays) {
    const priority = [];
    const middle = totalTrays / 2;
    // Lógica simple: alternar alrededor del centro
    // Ejemplo 4: 2, 3, 1, 4
    const centerIndices = [];
    if (totalTrays % 2 === 0) {
        centerIndices.push(totalTrays / 2, (totalTrays / 2) + 1);
    } else {
        centerIndices.push(Math.ceil(totalTrays / 2));
    }

    // Crear array 1..N
    const all = Array.from({ length: totalTrays }, (_, i) => i + 1);
    // Ordenar por distancia al centro "ideal" (mitad + 0.5)
    const centerPoint = (totalTrays + 1) / 2;
    return all.sort((a, b) => Math.abs(a - centerPoint) - Math.abs(b - centerPoint));
}

/**
 * Cuenta posiciones intermedias (anillo amarillo)
 */
function countIntermediatePositions(rows, cols) {
    // Si rows=5, cols=8.
    // Borde ocupa anillos extremos.
    // Rectángulo interior es (rows-2) x (cols-2).
    // Anillo amarillo es el perímetro de ese rectángulo interior.
    const innerRows = rows - 2;
    const innerCols = cols - 2;
    if (innerRows <= 0 || innerCols <= 0) return 0;

    // Perimetro: 2*(rows+cols) - 4
    return countEdgePositions(innerRows, innerCols);
}

/**
 * Genera grid usando lógica de 3 zonas (Verde, Amarillo, Rojo)
 */
function generate3ZoneGrid(potsCount, rows, cols) {
    const grid = Array(rows).fill(null).map(() => Array(cols).fill(false));

    const zone1 = []; // Verde (Borde Exterior)
    const zone2 = []; // Amarillo (Intermedio)
    const zone3 = []; // Rojo (Centro Puro)

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Zona 1: Borde exterior strict
            if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                zone1.push([r, c]);
                continue;
            }

            // Zona 2: Anillo siguiente
            // Si no es zona 1, verificamos si es borde del rectángulo interior
            if (r === 1 || r === rows - 2 || c === 1 || c === cols - 2) {
                zone2.push([r, c]);
                continue;
            }

            // Zona 3: El resto
            zone3.push([r, c]);
        }
    }

    // Ordenar para llenar estéticamente (opcional, pero ayuda)
    // No es estrictamente necesario si solo queremos ocupar posiciones

    let placed = 0;

    // 1. Llenar Verde
    for (const [r, c] of zone1) {
        if (placed >= potsCount) break;
        grid[r][c] = true;
        placed++;
    }

    // 2. Llenar Amarillo
    for (const [r, c] of zone2) {
        if (placed >= potsCount) break;
        grid[r][c] = true;
        placed++;
    }

    // 3. Llenar Rojo
    for (const [r, c] of zone3) {
        if (placed >= potsCount) break;
        grid[r][c] = true;
        placed++;
    }

    return grid;
}

// Funciones 'generateOptimalGrid' y 'generateMaximizedGrid' antiguas ya no se usan, reemplazadas por generate3ZoneGrid
// Pero mantenemos compatibilidad por si acaso renombrando la vieja si fuera necesario, 
// o simplemente generate3ZoneGrid cubre ambos casos (sí, lo hace, porque generateOptimalGrid hacía fill de bordes primero también).

/**
 * Genera un grid SOLO con posiciones de borde (verdes)
 * Nunca usa el centro (amarillas)
 */
function generateEdgeOnlyGrid(potsCount, rows, cols) {
    const grid = Array(rows).fill(null).map(() => Array(cols).fill(false));

    // Solo posiciones de borde
    const positions = [];

    // Esquinas primero (máxima prioridad)
    positions.push([0, 0], [0, cols - 1], [rows - 1, 0], [rows - 1, cols - 1]);

    // Bordes horizontales
    for (let c = 1; c < cols - 1; c++) {
        positions.push([0, c], [rows - 1, c]);
    }

    // Bordes verticales
    for (let r = 1; r < rows - 1; r++) {
        positions.push([r, 0], [r, cols - 1]);
    }

    // NO agregamos posiciones del centro

    // Colocar macetas solo en posiciones de borde
    for (let i = 0; i < potsCount && i < positions.length; i++) {
        const [r, c] = positions[i];
        grid[r][c] = true;
    }

    return grid;
}

/**
 * Genera un grid maximizado: llena PRIMERO todos los bordes,
 * y LUEGO agrega al centro si es necesario
 * Esta función es similar a generateOptimalGrid pero garantiza
 * que los bordes estén completos antes de usar el centro
 */
function generateMaximizedGrid(potsCount, rows, cols) {
    const grid = Array(rows).fill(null).map(() => Array(cols).fill(false));

    // Posiciones de borde (prioridad)
    const edgePositions = [];

    // Esquinas primero
    edgePositions.push([0, 0], [0, cols - 1], [rows - 1, 0], [rows - 1, cols - 1]);

    // Bordes horizontales
    for (let c = 1; c < cols - 1; c++) {
        edgePositions.push([0, c], [rows - 1, c]);
    }

    // Bordes verticales
    for (let r = 1; r < rows - 1; r++) {
        edgePositions.push([r, 0], [r, cols - 1]);
    }

    // Posiciones del centro (menor prioridad)
    const centerPositions = [];
    for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
            centerPositions.push([r, c]);
        }
    }

    // Primero llenar todos los bordes
    let placed = 0;
    for (let i = 0; i < edgePositions.length && placed < potsCount; i++) {
        const [r, c] = edgePositions[i];
        grid[r][c] = true;
        placed++;
    }

    // Luego llenar el centro si aún quedan macetas
    for (let i = 0; i < centerPositions.length && placed < potsCount; i++) {
        const [r, c] = centerPositions[i];
        grid[r][c] = true;
        placed++;
    }

    return grid;
}


/**
 * Genera un grid óptimo para distribución de macetas (algoritmo original)
 * Evita el centro y prioriza esquinas/bordes, pero usa centro si es necesario
 */
function generateOptimalGrid(potsCount, rows, cols) {
    const grid = Array(rows).fill(null).map(() => Array(cols).fill(false));

    const positions = [];

    // Esquinas primero
    positions.push([0, 0], [0, cols - 1], [rows - 1, 0], [rows - 1, cols - 1]);

    // Bordes después
    for (let c = 1; c < cols - 1; c++) {
        positions.push([0, c], [rows - 1, c]);
    }
    for (let r = 1; r < rows - 1; r++) {
        positions.push([r, 0], [r, cols - 1]);
    }

    // Centro al final (menor prioridad)
    for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
            positions.push([r, c]);
        }
    }

    for (let i = 0; i < potsCount && i < positions.length; i++) {
        const [r, c] = positions[i];
        grid[r][c] = true;
    }

    return grid;
}

/**
 * Calcula el riesgo de secado desigual según la densidad
 */
function calculateDensityRisk(pots, trays, edgeOnlyMode = false) {
    const density = pots / (trays * CONSTANTS.DEHYDRATOR.CAPACITY_PER_TRAY);

    // Si está en modo edge-only, el riesgo es automáticamente bajo
    if (edgeOnlyMode) {
        return {
            level: 'bajo',
            value: density.toFixed(2),
            description: '🌟 Modo optimizado: solo posiciones de borde (secado uniforme garantizado)',
            recommendation: 'Condiciones óptimas de operación'
        };
    }

    if (density > 0.8) {
        return {
            level: 'alto',
            value: density.toFixed(2),
            description: 'Alta probabilidad de líquido rosa residual',
            recommendation: 'Reducir carga o aumentar tiempo de rotación'
        };
    } else if (density > 0.5) {
        return {
            level: 'medio',
            value: density.toFixed(2),
            description: 'Secado moderadamente uniforme esperado',
            recommendation: 'Seguir protocolo estándar de rotación'
        };
    }

    return {
        level: 'bajo',
        value: density.toFixed(2),
        description: 'Excelente flujo de aire, secado uniforme esperado',
        recommendation: 'Condiciones óptimas de operación'
    };
}

/**
 * Genera el cronograma de rotación para secado uniforme
 */
function generateRotationSchedule(trays) {
    const { TIMES } = CONSTANTS;

    return {
        phases: [
            {
                minute: 0,
                action: 'Ingreso inicial',
                details: `Colocar ${trays.length} bandeja(s) en el deshidratador a 45°C`
            },
            {
                minute: 60,
                action: 'Primera revisión',
                details: 'Verificar temperatura y humedad visual'
            },
            {
                minute: TIMES.BAKING_FLIP_MIN,
                action: '⚠️ PUNTO CRÍTICO - Volteo',
                details: 'Voltear TODAS las macetas, secar líquido rosa residual',
                critical: true
            },
            {
                minute: 180,
                action: 'Rotación de bandejas',
                details: 'Intercambiar posición de bandeja superior con inferior'
            },
            {
                minute: TIMES.BAKING_TOTAL_MIN,
                action: 'Extracción final',
                details: 'Verificar dureza, retirar del horno'
            }
        ],
        totalTime: `${TIMES.BAKING_TOTAL_MIN} minutos (${TIMES.BAKING_TOTAL_MIN / 60} horas)`
    };
}

/**
 * Genera alertas según las condiciones de la bandeja
 */
function generateTrayAlerts(pots, trays, risk, maximizeTrays = false, usesIntermediate = false, usesCenter = false, traysAvailable = 4) {
    const alerts = [];

    // Alerta de bandejas disponibles
    if (trays >= traysAvailable) {
        if (maximizeTrays && (usesIntermediate || usesCenter)) {
            alerts.push({
                type: 'warning',
                message: `⚠️ Se están utilizando las ${traysAvailable} bandejas disponibles al máximo de su capacidad optimizada`
            });
        } else if (!maximizeTrays) {
            alerts.push({
                type: 'info',
                message: `ℹ️ Ocupación total de bandejas disponibles: ${trays}/${traysAvailable}`
            });
        }
    }

    // Alertas de Modo Optimizado (Zonas)
    if (maximizeTrays) {
        if (!usesIntermediate && !usesCenter) {
            alerts.push({
                type: 'success',
                message: '✅ EXCELENTE: Todas las macetas están en la ZONA VERDE (Borde - Secado Óptimo)'
            });
        } else if (usesIntermediate && !usesCenter) {
            alerts.push({
                type: 'warning',
                message: '⚠️ AVISO: Se usan posiciones de ZONA AMARILLA (Intermedio). Se recomienda especial atención al volteo.'
            });
        } else if (usesCenter) {
            alerts.push({
                type: 'error',
                message: '⛔ CRÍTICO: Se usan posiciones de ZONA ROJA (Centro). Alto riesgo de humedad retenida. Rotación frecuente obligatoria.'
            });
        }
    }

    if (risk.level === 'alto') {
        alerts.push({
            type: 'warning',
            message: 'Densidad alta: realizar rotación cada 45 minutos en lugar de visual'
        });
    }

    alerts.push({
        type: 'info',
        message: 'Recuerda el volteo obligatorio a los 120 minutos'
    });

    return alerts;
}

module.exports = {
    optimizeTrayDistribution
};

