/**
 * EcoLlajta Smart-Twin - Rutas de Simulación
 */

const express = require('express');
const router = express.Router();

const { calculateDosage, validateMixRatio } = require('../logic/dosageCalculator');
const { allocateStaff, generateSchedule } = require('../logic/staffAllocator');
const { optimizeTrayDistribution } = require('../logic/trayOptimizer');
const { calculateOptimalResources } = require('../logic/resourceOptimizer');

/**
 * POST /api/simulate/dosage
 * Calcula los insumos necesarios para una meta de producción
 */
router.post('/dosage', (req, res) => {
    try {
        const { targetPots } = req.body;

        if (!targetPots || targetPots < 1) {
            return res.status(400).json({
                error: 'Se requiere una cantidad válida de macetas (targetPots >= 1)'
            });
        }

        const result = calculateDosage(parseInt(targetPots));
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/simulate/validate-mix
 * Valida si una relación de mezcla es correcta
 */
router.post('/validate-mix', (req, res) => {
    try {
        const { eggshell, alginate } = req.body;

        if (!eggshell || !alginate) {
            return res.status(400).json({
                error: 'Se requieren gramos de cáscara de huevo y alginato'
            });
        }

        const result = validateMixRatio(parseFloat(eggshell), parseFloat(alginate));
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/simulate/staff
 * Calcula la distribución óptima de personal
 */
router.post('/staff', (req, res) => {
    try {
        const { targetPots, hoursAvailable, staffCount, moldsAvailable } = req.body;

        if (!targetPots || !hoursAvailable) {
            return res.status(400).json({
                error: 'Se requiere cantidad de macetas y horas disponibles'
            });
        }

        const allocation = allocateStaff(
            parseInt(targetPots),
            parseFloat(hoursAvailable),
            parseInt(staffCount) || 11,
            parseInt(moldsAvailable) || 5
        );

        const schedule = generateSchedule(allocation);

        res.json({
            ...allocation,
            schedule
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/simulate/tray
 * Optimiza la distribución en el deshidratador
 */
router.post('/tray', (req, res) => {
    try {
        const { potsToPlace, maximizeTrays, traysAvailable, traySpacing } = req.body;

        if (!potsToPlace || potsToPlace < 1) {
            return res.status(400).json({
                error: 'Se requiere una cantidad válida de macetas'
            });
        }

        const result = optimizeTrayDistribution(
            parseInt(potsToPlace),
            Boolean(maximizeTrays),
            parseInt(traysAvailable) || 4,
            parseInt(traySpacing) || 2
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/simulate/full
 * Simulación completa del ciclo productivo
 */
router.post('/full', (req, res) => {
    try {
        const { targetPots, hoursAvailable, staffCount, maximizeTrays, traysAvailable, moldsAvailable, traySpacing, optimizationMode } = req.body;

        if (!targetPots || !hoursAvailable) {
            return res.status(400).json({
                error: 'Se requiere cantidad de macetas y horas disponibles'
            });
        }

        // Ejecutar todos los cálculos
        // Ejecutar cálculos en orden: primero Tray para saber tiempos de horno
        const dosage = calculateDosage(parseInt(targetPots));

        const tray = optimizeTrayDistribution(
            parseInt(targetPots),
            Boolean(maximizeTrays),
            parseInt(traysAvailable) || 4,
            parseInt(traySpacing) || 2,
            optimizationMode || 'balanced'
        );

        // Obtener tiempo total de horneado en minutos (del resultado de tray o default 240)
        const totalBakingMinutes = (tray.bakingInfo?.totalBakingHours || 4) * 60;

        const staff = allocateStaff(
            parseInt(targetPots),
            parseFloat(hoursAvailable),
            parseInt(staffCount) || 11,
            parseInt(moldsAvailable) || 5,
            totalBakingMinutes
        );
        const schedule = generateSchedule(staff);

        // Recopilar TODAS las alertas
        const allAlerts = [
            ...dosage.alerts,
            ...staff.alerts
        ];

        // Si el tray tiene alertas, agregarlas
        if (tray.alerts && tray.alerts.length > 0) {
            allAlerts.push(...tray.alerts);
        }

        // Si el tray falló por capacidad, agregar como alerta de error
        if (!tray.success && tray.error) {
            allAlerts.push({
                type: 'error',
                message: tray.error
            });
            if (tray.recommendation) {
                allAlerts.push({
                    type: 'info',
                    message: tray.recommendation
                });
            }
        }

        // Determinar viabilidad general
        const isOverallViable = staff.feasibility.isViable && tray.success;

        res.json({
            simulation: {
                targetPots: parseInt(targetPots),
                hoursAvailable: parseFloat(hoursAvailable),
                timestamp: new Date().toISOString()
            },
            dosage,
            staffAllocation: staff,
            schedule,
            trayDistribution: tray,
            summary: {
                isViable: isOverallViable,
                viabilityReason: !isOverallViable
                    ? (!staff.feasibility.isViable
                        ? `Tiempo insuficiente: necesita ${staff.feasibility.totalCycleTime}h, disponible ${hoursAvailable}h`
                        : tray.error || 'Capacidad del deshidratador excedida')
                    : 'Producción viable',
                totalAlerts: allAlerts
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/simulate/optimize
 * Sugiere recursos óptimos para una cantidad de macetas
 */
router.post('/optimize', (req, res) => {
    try {
        const { targetPots } = req.body;
        if (!targetPots || targetPots < 1) {
            return res.status(400).json({ error: 'Se requiere una meta de macetas válida' });
        }
        const recommendations = calculateOptimalResources(parseInt(targetPots));
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
