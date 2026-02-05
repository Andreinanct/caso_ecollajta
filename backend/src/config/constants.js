/**
 * EcoLlajta Smart-Twin - Constantes de Producción
 * Datos extraídos de los informes de producción Fase II
 */

const PRODUCTION_CONSTANTS = {
    // Relación de mezcla (Regla de Oro 10:1)
    RATIO: {
        EGGSHELL_GRAMS: 180,      // gramos de cáscara de huevo por unidad
        ALGINATE_GRAMS: 18,       // gramos de alginato por unidad
        WATER_ML: 140,            // mililitros de agua por preparación
        RATIO_VALUE: 10           // relación 10:1
    },

    // Tiempos del proceso (en minutos)
    TIMES: {
        WET_MIXING_MIN: 5,        // tiempo de mezcla húmeda
        MOLD_REST_MIN: 5,         // tiempo de reposo en molde (optimizado)
        PREP_PER_BATCH_MIN: 1.22, // tiempo de preparación por lote de 3
        BAKING_TOTAL_MIN: 240,    // tiempo total de horneado (4 horas)
        BAKING_FLIP_MIN: 120,     // punto crítico para volteo (2 horas)
        PRECALENTADO_MIN: 30      // precalentamiento del horno
    },

    // Capacidades del deshidratador
    DEHYDRATOR: {
        TRAYS_AVAILABLE: 4,           // charolas disponibles (default inicial)
        CAPACITY_PER_TRAY: 40,        // macetas por charola (5x8)
        GRID_ROWS: 5,                 // filas de la cuadrícula
        GRID_COLS: 8,                 // columnas de la cuadrícula
        TEMPERATURE_CELSIUS: 45,      // temperatura de horneado
        // Configuración de espacios en el horno
        TOTAL_SLOTS: 32,              // espacios totales para bandejas vacías
        // Modo ESTÁNDAR (2 espacios entre bandejas) - mejor circulación de aire
        SPACING_STANDARD: {
            slots: 2,                 // espacios vacíos entre cada bandeja
            maxTrays: 10,             // 32 / (1+2) ≈ 10 bandejas
            bakingHours: 4            // tiempo de horneado estándar
        },
        // Modo COMPACTO (1 espacio entre bandejas) - más capacidad, más tiempo
        SPACING_COMPACT: {
            slots: 1,                 // espacios vacíos entre cada bandeja
            maxTrays: 16,             // 32 / (1+1) = 16 bandejas
            bakingHours: 6            // +2h (1h extra por fase) por menor circulación de aire
        }
    },

    // Indicadores de rendimiento
    PERFORMANCE: {
        PRODUCTION_RATE: 28.9,    // macetas por hora
        DEFECT_RATE: 0.0455,      // tasa de defectos (4.55%)
        MATERIAL_YIELD: 0.9315,   // rendimiento del material (93.15%)
        COST_PER_UNIT_BS: 5.12    // costo unitario en bolivianos
    },

    // Restricciones del sistema
    CONSTRAINTS: {
        MAX_POTS_PER_GROUP: 20,   // máximo antes de penalizar evaporación
        TYPICAL_WASTE_GRAMS: 400, // merma típica (340-447g)
        STAFF_AVAILABLE: 11       // integrantes del grupo
    },

    // Configuración de MOLDES (nuevo)
    MOLDS: {
        DEFAULT_AVAILABLE: 5,     // moldes disponibles por defecto
        MIN_MOLDS: 1,             // mínimo de moldes
        MAX_MOLDS: 20,            // máximo de moldes (escalabilidad)
        OPTIMAL_MOLDS: 3,         // cantidad óptima según pruebas
        REST_TIME_MIN: 5          // tiempo de reposo en molde (minutos)
    },

    // Estaciones de trabajo
    STATIONS: {
        MOLIENDA: { name: 'Molienda', minStaff: 1, maxStaff: 3 },
        DOSIFICACION: { name: 'Dosificación', minStaff: 1, maxStaff: 2 },
        MEZCLADO: { name: 'Mezclado', minStaff: 2, maxStaff: 4 },
        MOLDEADO: { name: 'Moldeado', minStaff: 2, maxStaff: 4 },
        HORNEADO: { name: 'Horneado', minStaff: 1, maxStaff: 2 }
    }
};

module.exports = PRODUCTION_CONSTANTS;
