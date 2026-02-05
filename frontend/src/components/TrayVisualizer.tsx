'use client';

import { TrayData } from '@/types';

interface TrayVisualizerProps {
    trays: TrayData[];
    showLabels?: boolean;
}

export default function TrayVisualizer({ trays, showLabels = true }: TrayVisualizerProps) {
    // Determinar zona de la celda: 'edge' (verde), 'intermediate' (amarillo), 'center' (rojo)
    const getZone = (row: number, col: number, totalRows: number, totalCols: number): 'edge' | 'intermediate' | 'center' => {
        // Zona 1: Borde exterior (Verde)
        if (row === 0 || row === totalRows - 1 || col === 0 || col === totalCols - 1) {
            return 'edge';
        }
        // Zona 2: Anillo intermedio (Amarillo)
        // Si no es borde exterior, verificamos si es borde del rectángulo interior
        if (row === 1 || row === totalRows - 2 || col === 1 || col === totalCols - 2) {
            return 'intermediate';
        }
        // Zona 3: Centro puro (Rojo)
        return 'center';
    };

    // Contar cuántas celdas de cada zona hay llenas
    const countPositions = (grid: boolean[][]): { edge: number; intermediate: number; center: number } => {
        let counts = { edge: 0, intermediate: 0, center: 0 };
        grid.forEach((row, rowIdx) => {
            row.forEach((filled, colIdx) => {
                if (filled) {
                    const zone = getZone(rowIdx, colIdx, grid.length, row.length);
                    counts[zone]++;
                }
            });
        });
        return counts;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {trays.map((tray, index) => {
                const positions = countPositions(tray.grid);

                return (
                    <div
                        key={index}
                        className="tray-container animate-fade-in"
                        style={{ animationDelay: `${index * 150}ms` }}
                    >
                        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🔥</span>
                                <h4 className="font-bold text-[var(--text-primary)]">
                                    Bandeja {tray.trayNumber}
                                </h4>
                                {tray.edgeOnly && (
                                    <span className="badge badge-success text-xs">Solo Bordes ✓</span>
                                )}
                                {tray.usesIntermediate && !tray.usesCenter && (
                                    <span className="badge bg-amber-500 text-white text-xs">+Intermedio</span>
                                )}
                                {tray.usesCenter && (
                                    <span className="badge bg-red-500 text-white text-xs">+Centro</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-sm flex-wrap">
                                <span className="text-green-500 font-medium whitespace-nowrap">
                                    🟢 {positions.edge}
                                </span>
                                {positions.intermediate > 0 && (
                                    <span className="text-amber-500 font-medium whitespace-nowrap">
                                        🟡 {positions.intermediate}
                                    </span>
                                )}
                                {positions.center > 0 && (
                                    <span className="text-red-500 font-medium whitespace-nowrap">
                                        🔴 {positions.center}
                                    </span>
                                )}
                                <span className="badge badge-info ml-2">
                                    {tray.potsCount} macetas
                                </span>
                            </div>
                        </div>

                        <div className="tray-grid">
                            {tray.grid.map((row, rowIdx) =>
                                row.map((filled, colIdx) => {
                                    const zone = getZone(rowIdx, colIdx, tray.grid.length, row.length);
                                    let cellClass = 'empty';

                                    if (filled) {
                                        if (zone === 'edge') cellClass = 'filled';
                                        else if (zone === 'intermediate') cellClass = 'intermediate-risk';
                                        else cellClass = 'center-risk';
                                    }

                                    return (
                                        <div
                                            key={`${rowIdx}-${colIdx}`}
                                            className={`tray-cell ${cellClass}`}
                                            title={
                                                filled
                                                    ? zone === 'edge' ? `Borde [${rowIdx},${colIdx}]: Óptimo`
                                                        : zone === 'intermediate' ? `Intermedio [${rowIdx},${colIdx}]: Riesgo medio`
                                                            : `Centro [${rowIdx},${colIdx}]: Riesgos Crítico`
                                                    : `Vacío [${rowIdx},${colIdx}]`
                                            }
                                        />
                                    );
                                })
                            )}
                        </div>

                        {showLabels && (
                            <div className="flex flex-wrap justify-between mt-3 text-xs text-[var(--text-muted)] gap-2">
                                <span className="flex items-center gap-1">🟢 Borde (Óptimo)</span>
                                <span className="flex items-center gap-1">🟡 Intermedio (Atención)</span>
                                <span className="flex items-center gap-1">🔴 Centro (Crítico)</span>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Leyenda Global */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--border-light)] justify-center bg-[var(--bg-tertiary)] p-3 rounded-lg">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ background: 'var(--gradient-primary)' }} />
                    <span className="text-xs font-medium">Borde: Flujo Directo</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-500 to-amber-600" />
                    <span className="text-xs font-medium">Intermedio: Flujo Medio</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-red-500 to-red-600" />
                    <span className="text-xs font-medium">Centro: Flujo Pobre</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border border-dashed border-[var(--border-medium)] bg-[var(--bg-card)]" />
                    <span className="text-xs font-medium">Vacío</span>
                </div>
            </div>
        </div>
    );
}
