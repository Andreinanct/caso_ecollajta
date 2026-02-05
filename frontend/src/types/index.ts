// Tipos para el Simulador EcoLlajta Smart-Twin

// ==================== CONSTANTES ====================
export const PRODUCTION_CONSTANTS = {
    RATIO: {
        EGGSHELL_GRAMS: 180,
        ALGINATE_GRAMS: 18,
        WATER_ML: 140,
        RATIO_VALUE: 10
    },
    TIMES: {
        WET_MIXING_MIN: 5,
        MOLD_REST_MIN: 5,
        PREP_PER_BATCH_MIN: 1.22,
        BAKING_TOTAL_MIN: 240,
        BAKING_FLIP_MIN: 120,
        PRECALENTADO_MIN: 30
    },
    DEHYDRATOR: {
        TRAYS_AVAILABLE: 4,
        CAPACITY_PER_TRAY: 40,
        GRID_ROWS: 5,
        GRID_COLS: 8,
        TEMPERATURE_CELSIUS: 45
    },
    PERFORMANCE: {
        PRODUCTION_RATE: 28.9,
        DEFECT_RATE: 0.0455,
        MATERIAL_YIELD: 0.9315,
        COST_PER_UNIT_BS: 5.12
    },
    CONSTRAINTS: {
        MAX_POTS_PER_GROUP: 20,
        TYPICAL_WASTE_GRAMS: 400,
        STAFF_AVAILABLE: 11
    }
} as const;

// ==================== INTERFACES ====================
export interface Alert {
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
}

export interface DosageInputs {
    eggshell: { grams: number; kg: string };
    alginate: { grams: number; bags: number };
    water: { ml: number; liters: string };
    oil: { liters: number };
}

export interface DosageEstimates {
    functionalUnits: number;
    defectUnits: number;
    wasteGrams: number;
    totalCostBs: string;
    costPerUnit: number;
}

export interface DosageResult {
    inputs: DosageInputs;
    estimates: DosageEstimates;
    ratio: { description: string; isValid: boolean };
    alerts: Alert[];
}

export interface StaffAllocation {
    [station: string]: {
        staff: number;
        percentage: string;
    };
}

export interface Timeline {
    setup: number;
    production: number;
    baking: number;
    totalMinutes: number;
    totalHours: string;
}

export interface Feasibility {
    isViable: boolean;
    targetPots: number;
    hoursAvailable: number;
    productionTimeNeeded: string;
    totalCycleTime?: string;
}

export interface SchedulePhase {
    phase: string;
    startMin: number;
    endMin: number;
    activities: string[];
    critical?: boolean;
    alert?: string;
}

export interface BreakdownItem {
    station: string;
    staff: number;
    minutes: number;
    hours: string;
    mode: string;
}

export interface StaffResult {
    feasibility: Feasibility;
    staffAllocation: StaffAllocation;
    totalStaff: number;
    timeline: Timeline;
    detailedBreakdown?: BreakdownItem[];
    efficiency: { potsPerPerson: string; potsPerHour: string };
    alerts: Alert[];
    schedule: SchedulePhase[];
}

export interface TrayData {
    trayNumber: number;
    potsCount: number;
    grid: boolean[][];
    fillPercentage: string;
    edgeOnly?: boolean;
    usesIntermediate?: boolean;
    usesCenter?: boolean;
    edgePots?: number;
    centerPots?: number;
}

export interface DensityAnalysis {
    level: 'bajo' | 'medio' | 'alto';
    value: string;
    description: string;
    recommendation: string;
}

export interface RotationPhase {
    minute: number;
    action: string;
    details: string;
    critical?: boolean;
}

export interface RotationSchedule {
    phases: RotationPhase[];
    totalTime: string;
}

export interface BakingCycle {
    cycleNumber: number;
    trays: TrayData[];
    potsInCycle: number;
    traysUsed: number;
    bakingHours: number;
}

export interface TrayResult {
    success: boolean;
    mode?: string;
    error?: string;
    recommendation?: string;
    summary?: {
        totalPots: number;
        traysUsed: number;
        averagePerTray: number;
        edgeOnlyMode?: boolean;
        usesIntermediate?: boolean;
        usesCenter?: boolean;
        totalTraysNeeded?: number;
    };
    trays?: TrayData[];
    cycles?: BakingCycle[];
    densityAnalysis?: DensityAnalysis;
    rotationSchedule?: RotationSchedule;
    bakingInfo?: {
        traySpacing: number;
        maxTraysPerCycle: number;
        bakingHoursPerCycle: number;
        bakingCycles: number;
        totalBakingHours: number;
    };
    alerts?: Alert[];
}


export interface FullSimulationResult {
    simulation: {
        targetPots: number;
        hoursAvailable: number;
        timestamp: string;
    };
    dosage: DosageResult;
    staffAllocation: StaffResult;
    schedule: SchedulePhase[];
    trayDistribution: TrayResult;
    summary: {
        isViable: boolean;
        viabilityReason?: string;
        totalAlerts: Alert[];
    };
}

export interface SimulationParams {
    targetPots: number;
    hoursAvailable: number;
    staffCount: number;
    maximizeTrays: boolean;
    traysAvailable: number;
    moldsAvailable: number;
    traySpacing: 1 | 2; // 1 = compacto (16 bandejas, +1h), 2 = estándar (10 bandejas, 4h)
    optimizationMode?: 'strict' | 'balanced'; // strict = Solo bordes (no centros), balanced = Minimiza ciclos usando centros si es necesario
}

export interface OptimalResourcesResult {
    targetPots: number;
    trays: {
        optimal: number;
        minimum: number;
        reason: string;
    };
    staff: {
        recommendedFor8h: number;
        explanation: string;
    };
    molds: {
        optimal: number;
        minimum: number;
        reason: string;
    };
    time: {
        fastestPossible: string;
        explanation: string;
        breakdown?: {
            production: string;
            productionMinutes?: number;
            baking: string;
            bakingMinutes?: number;
            setup: string;
            setupMinutes?: number;
        };
    };
}
