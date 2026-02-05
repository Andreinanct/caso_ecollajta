import React from 'react';
import { OptimalResourcesResult } from '@/types';

interface Props {
    data: OptimalResourcesResult;
    onApplyStaff: () => void;
    onApplyTrays: () => void;
    onApplyMolds: () => void;
    onApplyTime: () => void;
}

export default function OptimizationPanel({ data, onApplyStaff, onApplyTrays, onApplyMolds, onApplyTime }: Props) {
    // Parsear breakdown de tiempos (1 decimal desde backend)
    const tProdHours = parseFloat(data.time.breakdown?.production || "0");
    const tBakeHours = parseFloat(data.time.breakdown?.baking || "4");
    const tSetupHours = parseFloat(data.time.breakdown?.setup || "0.5");

    // Minutos directos del backend (si están disponibles)
    const tProdMin = data.time.breakdown?.productionMinutes || Math.round(tProdHours * 60);
    const tBakeMin = data.time.breakdown?.bakingMinutes || 240;
    const tSetupMin = data.time.breakdown?.setupMinutes || 30;

    const tTotalHours = tProdHours + tBakeHours + tSetupHours || 1;

    // Porcentajes para la barra
    const wSetup = (tSetupHours / tTotalHours) * 100;
    const wProd = (tProdHours / tTotalHours) * 100;
    const wBake = (tBakeHours / tTotalHours) * 100;

    // Función para formatear tiempo (usa minutos si es < 1h)
    const formatTime = (hours: number, minutes: number) => {
        if (hours < 1) {
            return `${minutes} min`;
        }
        return `${hours.toFixed(1)}h`;
    };

    // Estilo base adaptable al tema
    const cardStyle = "card bg-[var(--bg-card)] border-l-4 shadow-lg p-5 rounded-xl w-full border-y border-r border-[var(--border-light)] transition-colors duration-300";

    return (
        <div className="animate-fade-in space-y-4 pb-8 w-full">

            {/* 1. Header Section */}
            <div className={`${cardStyle} border-blue-500`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1 text-left w-full">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                            <span className="text-2xl">🧠</span> Estrategia Sugerida
                        </h2>
                        <p className="text-[var(--text-muted)] text-sm">
                            Plan optimizado para <strong className="text-[var(--text-primary)] border-b border-blue-500">{data.targetPots} macetas</strong> usando análisis de cuellos de botella.
                        </p>
                    </div>
                    {/* Stats Compacto */}
                    <div className="flex gap-4 text-center bg-[var(--bg-tertiary)] py-2 px-4 rounded-lg border border-[var(--border-light)] shadow-sm self-start md:self-center w-full md:w-auto justify-center">
                        <div>
                            <div className="text-xl font-black text-blue-500 dark:text-blue-400">{data.staff.recommendedFor8h}</div>
                            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Personal</div>
                        </div>
                        <div className="w-px bg-[var(--border-medium)]"></div>
                        <div>
                            <div className="text-xl font-black text-amber-500 dark:text-amber-400">{data.molds.optimal}</div>
                            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Moldes</div>
                        </div>
                        <div className="w-px bg-[var(--border-medium)]"></div>
                        <div>
                            <div className="text-xl font-black text-purple-500 dark:text-purple-400">{data.time.fastestPossible}h</div>
                            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Tiempo</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Staff Card */}
            <div className={`${cardStyle} border-blue-600`}>
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-center">

                    <div className="flex flex-col items-center w-full md:w-28 border-r border-[var(--border-light)] md:pr-6 justify-center">
                        <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-3xl mb-2 text-blue-500 ring-1 ring-blue-500/20">
                            👥
                        </div>
                        <span className="text-[10px] font-black text-blue-500 tracking-[0.2em] uppercase">EQUIPO</span>
                    </div>

                    <div className="space-y-3 w-full text-left">
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">{data.staff.recommendedFor8h}</span>
                            <span className="text-lg text-[var(--text-muted)] font-medium">operarios</span>
                        </div>

                        <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-light)] flex flex-wrap gap-1">
                            {Array.from({ length: Math.min(data.staff.recommendedFor8h, 20) }).map((_, i) => (
                                <div key={i} className="w-2 h-6 bg-blue-500 rounded-sm" title="Operario"></div>
                            ))}
                        </div>

                        <div className="text-xs text-[var(--text-muted)] leading-relaxed border-l-2 border-blue-500/30 pl-3 space-y-1">
                            <p><strong className="text-blue-500 dark:text-blue-400">📊 Cálculo:</strong> {data.staff.explanation}</p>
                            <p><strong className="text-blue-500 dark:text-blue-400">🔧 Distribución:</strong> Molienda (15%), Dosificación (10%), Mezclado (25%), Moldeado (30% - siempre PAR), Horneado (10%), Control (10%).</p>
                            <p><strong className="text-blue-500 dark:text-blue-400">⚠️ Cuello de botella:</strong> Moldeado manual (~30 u/h por persona). Siempre en parejas para desmoldado seguro.</p>
                        </div>
                    </div>

                    <div className="w-full md:w-auto md:pl-6 md:border-l border-[var(--border-light)] flex flex-col justify-center">
                        <button onClick={onApplyStaff} className="btn bg-blue-600 hover:bg-blue-500 text-white w-full md:w-36 py-2.5 text-sm font-bold shadow-lg active:scale-95 transition-all rounded-lg mb-1">
                            Aplicar
                        </button>
                        <span className="text-[9px] text-center text-[var(--text-muted)] uppercase tracking-wide opacity-50">Actualizar Params</span>
                    </div>
                </div>
            </div>

            {/* 3. Molds Card - NUEVO */}
            <div className={`${cardStyle} border-amber-600`}>
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-center">

                    <div className="flex flex-col items-center w-full md:w-28 border-r border-[var(--border-light)] md:pr-6 justify-center">
                        <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-3xl mb-2 text-amber-500 ring-1 ring-amber-500/20">
                            🧱
                        </div>
                        <span className="text-[10px] font-black text-amber-500 tracking-[0.2em] uppercase">MOLDES</span>
                    </div>

                    <div className="space-y-3 w-full text-left">
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">{data.molds.optimal}</span>
                            <span className="text-lg text-[var(--text-muted)] font-medium">unidades</span>
                        </div>

                        <div className="flex gap-3 text-xs">
                            <div className="bg-[var(--bg-tertiary)] px-3 py-1.5 rounded border border-[var(--border-light)]">
                                <span className="text-[var(--text-muted)] mr-2">Tiempo reposo:</span>
                                <span className="font-mono font-bold text-[var(--text-secondary)]">5 min/molde</span>
                            </div>
                            <div className="bg-amber-500/10 px-3 py-1.5 rounded border border-amber-500/30">
                                <span className="text-amber-600 dark:text-amber-300 mr-2">Ciclos/hora:</span>
                                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">12 por molde</span>
                            </div>
                        </div>

                        <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-light)] flex flex-wrap gap-2">
                            {Array.from({ length: Math.min(data.molds.optimal, 15) }).map((_, i) => (
                                <div key={i} className="w-8 h-8 bg-amber-500/80 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow" title={`Molde ${i + 1}`}>
                                    {i + 1}
                                </div>
                            ))}
                        </div>

                        <div className="text-xs text-[var(--text-muted)] leading-relaxed border-l-2 border-amber-500/30 pl-3 space-y-1">
                            <p><strong className="text-amber-500 dark:text-amber-400">📊 Cálculo:</strong> {data.molds.reason}</p>
                            <p><strong className="text-amber-500 dark:text-amber-400">🔄 Rotación:</strong> Cada molde se libera cada 5 min. Con {data.molds.optimal} moldes puedes producir hasta {data.molds.optimal * 12} macetas/hora.</p>
                            <p><strong className="text-amber-500 dark:text-amber-400">⚠️ Limitante:</strong> Si tienes pocos moldes, el personal quedará esperando. Mínimo recomendado: {data.molds.minimum}.</p>
                        </div>
                    </div>

                    <div className="w-full md:w-auto md:pl-6 md:border-l border-[var(--border-light)] flex flex-col justify-center">
                        <button onClick={onApplyMolds} className="btn bg-amber-600 hover:bg-amber-500 text-white w-full md:w-36 py-2.5 text-sm font-bold shadow-lg active:scale-95 transition-all rounded-lg mb-1">
                            Aplicar
                        </button>
                        <span className="text-[9px] text-center text-[var(--text-muted)] uppercase tracking-wide opacity-50">Actualizar Params</span>
                    </div>
                </div>
            </div>

            {/* 4. Trays Card */}
            <div className={`${cardStyle} border-emerald-600`}>
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-center">

                    <div className="flex flex-col items-center w-full md:w-28 border-r border-[var(--border-light)] md:pr-6 justify-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-3xl mb-2 text-emerald-500 ring-1 ring-emerald-500/20">
                            🍱
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 tracking-[0.2em] uppercase">BANDEJAS</span>
                    </div>

                    <div className="space-y-3 w-full text-left">
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">{data.trays.optimal}</span>
                            <span className="text-lg text-[var(--text-muted)] font-medium">unidades</span>
                        </div>

                        <div className="flex gap-3 text-xs flex-wrap">
                            <div className="bg-[var(--bg-tertiary)] px-3 py-1.5 rounded border border-[var(--border-light)]">
                                <span className="text-[var(--text-muted)] mr-2">Física:</span>
                                <span className="font-mono font-bold text-[var(--text-secondary)]">40 u/bandeja</span>
                            </div>
                            <div className="bg-emerald-500/10 px-3 py-1.5 rounded border border-emerald-500/30">
                                <span className="text-emerald-600 dark:text-emerald-300 mr-2">Óptima:</span>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">22 u/bandeja</span>
                            </div>
                            <div className="bg-red-500/10 px-3 py-1.5 rounded border border-red-500/30">
                                <span className="text-red-600 dark:text-red-300 mr-2">Máx horno:</span>
                                <span className="font-mono font-bold text-red-600 dark:text-red-400">10 bandejas</span>
                            </div>
                        </div>

                        <div className="text-xs text-[var(--text-muted)] leading-relaxed border-l-2 border-emerald-500/30 pl-3 space-y-1">
                            <p><strong className="text-emerald-500 dark:text-emerald-400">📊 Cálculo:</strong> {data.trays.reason}</p>
                            <p><strong className="text-emerald-500 dark:text-emerald-400">🌡️ Secado uniforme:</strong> Usar solo bordes (22 posiciones) mejora la circulación de aire.</p>
                            <p><strong className="text-emerald-500 dark:text-emerald-400">🔥 Límite horno:</strong> 32 espacios. Estándar (2 espacios) = 10 bandejas/4h. Compacto (1 espacio) = 16 bandejas/6h.</p>
                            <p><strong className="text-emerald-500 dark:text-emerald-400">✅ Calidad:</strong> Reduce deformaciones y grietas ~15%.</p>
                        </div>
                    </div>

                    <div className="w-full md:w-auto md:pl-6 md:border-l border-[var(--border-light)] flex flex-col justify-center">
                        <button onClick={onApplyTrays} className="btn bg-emerald-600 hover:bg-emerald-500 text-white w-full md:w-36 py-2.5 text-sm font-bold shadow-lg active:scale-95 transition-all rounded-lg mb-1">
                            Aplicar
                        </button>
                        <span className="text-[9px] text-center text-[var(--text-muted)] uppercase tracking-wide opacity-50">Actualizar Params</span>
                    </div>
                </div>
            </div>

            {/* 5. Time Card - DESGLOSE CON MINUTOS */}
            <div className={`${cardStyle} border-purple-600`}>
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-center">

                    <div className="flex flex-col items-center w-full md:w-28 border-r border-[var(--border-light)] md:pr-6 justify-center">
                        <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center text-3xl mb-2 text-purple-500 ring-1 ring-purple-500/20">
                            ⏱️
                        </div>
                        <span className="text-[10px] font-black text-purple-500 tracking-[0.2em] uppercase">TIEMPO</span>
                    </div>

                    <div className="space-y-4 w-full text-left">
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">{data.time.fastestPossible}</span>
                            <span className="text-lg text-[var(--text-muted)] font-medium">horas totales</span>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-full h-6 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex shadow-inner border border-[var(--border-light)] relative">
                            <div style={{ width: `${wSetup}%` }} className="bg-yellow-500 h-full flex items-center justify-center text-[9px] font-bold text-black/70">
                                {wSetup > 8 && 'S'}
                            </div>
                            <div style={{ width: `${wProd}%` }} className="bg-blue-500 h-full flex items-center justify-center text-[9px] font-bold text-white">
                                {wProd > 15 && 'PROD'}
                            </div>
                            <div style={{ width: `${wBake}%` }} className="bg-red-500 h-full flex items-center justify-center text-[9px] font-bold text-white">
                                {wBake > 15 && 'HORNO'}
                            </div>
                        </div>

                        {/* LEYENDA con MINUTOS para valores pequeños */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex items-center gap-2 bg-yellow-500/10 px-2 py-1.5 rounded border border-yellow-500/20">
                                <div className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0"></div>
                                <div>
                                    <div className="font-bold text-yellow-600 dark:text-yellow-400">Setup</div>
                                    <div className="text-[var(--text-muted)] font-mono">{tSetupMin} min</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/10 px-2 py-1.5 rounded border border-blue-500/20">
                                <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                                <div>
                                    <div className="font-bold text-blue-600 dark:text-blue-400">Producción</div>
                                    <div className="text-[var(--text-muted)] font-mono">{formatTime(tProdHours, tProdMin)}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1.5 rounded border border-red-500/20">
                                <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                                <div>
                                    <div className="font-bold text-red-600 dark:text-red-400">Horneado</div>
                                    <div className="text-[var(--text-muted)] font-mono">{tBakeMin} min ({tBakeHours}h)</div>
                                </div>
                            </div>
                        </div>

                        {/* Explicación */}
                        <div className="text-xs text-[var(--text-muted)] leading-relaxed border-l-2 border-purple-500/30 pl-3 space-y-1">
                            <p><strong className="text-purple-500 dark:text-purple-400">📊 Cálculo:</strong> {data.time.explanation}</p>
                            <p><strong className="text-yellow-500">🔶 Setup:</strong> Precalentamiento horno a 45°C + preparación ({tSetupMin} minutos fijos).</p>
                            <p><strong className="text-blue-500">🔵 Producción:</strong> Tiempo neto de manufactura. Varía según personal y moldes ({tProdMin} min).</p>
                            <p><strong className="text-red-500">🔴 Horneado:</strong> Deshidratación de {tBakeMin} min ({tBakeHours}h). Ciclos activos.</p>
                        </div>
                    </div>

                    <div className="w-full md:w-auto md:pl-6 md:border-l border-[var(--border-light)] flex flex-col justify-center">
                        <button onClick={onApplyTime} className="btn bg-purple-600 hover:bg-purple-500 text-white w-full md:w-36 py-2.5 text-sm font-bold shadow-lg active:scale-95 transition-all rounded-lg mb-1">
                            Aplicar
                        </button>
                        <span className="text-[9px] text-center text-[var(--text-muted)] uppercase tracking-wide opacity-50">Actualizar Params</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
