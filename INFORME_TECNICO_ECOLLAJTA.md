# EcoLlajta Smart-Twin: Memoria Técnica de Ingeniería de Producción

## 1. Resumen Ejecutivo
Este sistema implementa un gemelo digital (Digital Twin) de la línea de producción de macetas biodegradables. Su motor de simulación integra principios de **Planeación de Requerimientos de Materiales (MRP)** y **Teoría de Restricciones (TOC)** para optimizar el uso de recursos limitados (mano de obra y capacidad de horno) bajo demanda variable.

## 2. Modelado de Procesos y Recursos

### 2.1. Estandarización de Lista de Materiales (BOM & Formulación)
**Principio:** Control de Variabilidad en Insumos.
El sistema automatiza el cálculo de la **Lista de Materiales (BOM)** basándose en la relación estequiométrica crítica 10:1 (Cáscara:Alginato).
*   **Gestión de Mermas:** El algoritmo integra un factor de rendimiento material (`Material Yield Factor`) del 93.15%, calculado empíricamente, para anticipar mermas técnicas en mezclado y asegurar que el *output* neto cumpla con la Orden de Producción (OP).
*   **Validación Estocástica:** Se implementan límites de control para rechazar combinaciones de insumos fuera de tolerancia técnica.

### 2.2. Planificación de Capacidad de Mano de Obra (Line Balancing)
**Principio:** Modelado de Sistemas de Colas y Balanceo de Línea.
El motor de asignación de personal (`Staff Allocator`) resuelve dinámicamente el problema de asignación de recursos utilizando dos heurísticas operativas según la escala del equipo:

1.  **Operación Celular (Batch Secuencial) | Staff ≤ 3:**
    *   **Modelo:** La línea funciona como una celda de manufactura única donde `Lead Time = Σ Cycle Times`.
    *   **Justificación:** Con recursos escasos, el *setup* y cambio de tareas penalizan la simultaneidad. El software modela esto forzando un flujo secuencial, crítico para calcular tiempos de entrega realistas en equipos pequeños.

2.  **Línea de Producción Continua (Paralelo) | Staff > 3:**
    *   **Modelo:** Transición a flujo continuo con estaciones de trabajo desacopladas.
    *   **Identificación del Cuello de Botella (Bottleneck Analysis):** El algoritmo identifica la estación con menor tasa de producción (típicamente Moldeado, ~30 u/h) y calcula el **Cycle Time** del sistema basado en esta restricción (TOC).
    *   **Eficiencia de Coordinación:** Se aplica un factor de degradación de eficiencia (overhead de supervisión) no lineal al aumentar el personal, evitando la falacia de escalado infinito.

### 2.3. Optimización de Restricciones Físicas (Deshidratador)
**Principio:** Optimización Espacial y Termodinámica de Procesos.
El deshidratador se modela como el recurso restrictivo de capacidad finita (CCR). El software ejecuta un algoritmo de **Zonificación de Riesgo Térmico**:

*   **Heurística de Carga:** Prioriza la ocupación de zonas de convección forzada óptima (bordes/verdes) sobre zonas de estancamiento térmico (centro/rojas).
*   **Control de Calidad Predictivo:** Si la *Orden de Producción* excede la capacidad de las zonas óptimas, el sistema alerta sobre el incremento en la probabilidad de defectos por gradientes de humedad, permitiendo al ingeniero decidir entre dividir el lote (Split Batch) o asumir el riesgo de calidad.

## 3. Indicadores Clave de Desempeño (KPIs)
El Dashboard proporciona métricas en tiempo real para la toma de decisiones:
*   **Tasa de Producción (Throughput):** Unidades/Hora efectivas.
*   **Eficiencia de Mano de Obra:** Unidades producidas por Hora-Hombre.
*   **Utilización de Capacidad:** Porcentaje de ocupación del CCR (Deshidratador).
*   **Viabilidad de Lead Time:** Validación automática de cumplimiento de plazos (`Cycle Time Total ≤ Tiempo Disponible`).

## 4. Conclusión
La herramienta trasciende una calculadora simple; actúa como un **Sistema de Ejecución de Manufactura (MES) ligero**, capaz de simular escenarios "What-If" para maximizar el OEE (Overall Equipment Effectiveness) de la planta piloto.