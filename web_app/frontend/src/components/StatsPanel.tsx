import React from 'react';
import type { CircuitData, GraphNode } from '../types';
import { Activity, Cpu, Thermometer } from 'lucide-react';

interface StatsPanelProps {
    data: CircuitData | null;
    selectedNode: GraphNode | null;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ data, selectedNode }) => {
    if (!data) {
        return (
            <div className="w-80 h-full bg-white border-l border-gray-200 p-6 text-gray-400 flex items-center justify-center font-medium">
                <p>No circuit data loaded</p>
            </div>
        );
    }

    const { metadata } = data;
    const perf = metadata.perf_specs || {};

    return (
        <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden text-gray-900 shadow-xl z-20">

            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                <h2 className="text-lg font-semibold text-gray-900">
                    Statistics
                </h2>
                <div className="p-2 bg-gray-50 rounded-full text-gray-500">
                    <Activity size={18} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">

                {/* Overarching Values */}
                <section>
                    <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-3">Global Params</h3>
                    <div className="space-y-3">
                        <SpecRow label="Temperature" value={`${metadata.tempc?.toFixed(1)}°C`} icon={<Thermometer size={14} className="text-gray-400" />} />
                        <SpecRow label="FET Count" value={metadata.fet_num} icon={<Cpu size={14} className="text-gray-400" />} />
                    </div>
                </section>

                {/* Performance Specs */}
                <section>
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">Performance</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-2">
                        <SpecRow label="Gain" value={perf.gain?.toFixed(2)} />
                        <SpecRow label="UGBW" value={perf.UGBW?.toExponential(2)} />
                        <SpecRow label="PM" value={perf.PM?.toFixed(1)} />
                        <SpecRow label="Power" value={perf.power?.toExponential(2)} />
                    </div>
                </section>

                {/* Selected Node Details */}
                <section className="animate-fade-in-up">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">Selection Details</h3>

                    {selectedNode ? (
                        <div className="bg-blue-50/30 rounded-lg p-4 border border-blue-100/50">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedNode.group === 'component' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                                    }`}>
                                    {selectedNode.group === 'component' ? 'C' : 'N'}
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 text-sm">{selectedNode.label}</div>
                                    <div className="text-xs text-blue-600 font-medium uppercase">{selectedNode.type || selectedNode.group}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {selectedNode.group === 'component' && data.components[selectedNode.id]?.parameters && (
                                    <>
                                        {Object.entries(data.components[selectedNode.id].parameters).map(([k, v]) => {
                                            const lowerKey = k.toLowerCase();
                                            // Special logic for Rin resistors: hide resistance completely
                                            if (selectedNode.label.toLowerCase().startsWith('rin') && (lowerKey === 'r' || lowerKey === 'nr')) return null;

                                            return (
                                                <div key={k} className="flex justify-between items-center py-1 border-b border-blue-100/50 last:border-0 border-dashed">
                                                    <span className="text-xs text-gray-500">{k}</span>
                                                    <span className="text-xs font-mono font-medium text-gray-900">
                                                        {formatParamValue(k, v)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                                {selectedNode.group === 'net' && (
                                    <p className="text-xs text-gray-400 italic">Net connections visible in graph lines.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400 italic text-center py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                            Select a node to view details
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

const SpecRow = ({ label, value, icon }: { label: string, value: string | number | undefined, icon?: React.ReactNode }) => (
    <div className="flex justify-between items-center group">
        <div className="flex items-center gap-2 text-gray-500 group-hover:text-gray-700 transition-colors">
            {icon} <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-mono font-medium text-gray-900">{value ?? '-'}</span>
    </div>
);

function formatParamValue(key: string, val: any): string {
    const numVal = parseFloat(val);
    if (isNaN(numVal)) return String(val);

    const lowerKey = key.toLowerCase();

    if (lowerKey === 'l') {
        // L is m, display in exponential with 4 decimals
        return `${numVal.toExponential(4)} m`;
    }
    if (lowerKey === 'r' || lowerKey === 'nr') {
        // Resistance: Ω
        if (numVal >= 1e6) return `${(numVal / 1e6).toFixed(1)} MΩ`;
        if (numVal >= 1e3) return `${(numVal / 1e3).toFixed(1)} kΩ`;
        return `${numVal.toFixed(1)} Ω`;
    }
    if (lowerKey === 'c' || lowerKey === 'nc') {
        // Capacitance: F
        if (numVal < 1e-12) return `${(numVal * 1e15).toFixed(1)} fF`;
        if (numVal < 1e-9) return `${(numVal * 1e12).toFixed(1)} pF`;
        if (numVal < 1e-6) return `${(numVal * 1e9).toFixed(1)} nF`;
        if (numVal < 1e-3) return `${(numVal * 1e6).toFixed(1)} µF`;
        return `${numVal.toExponential(2)} F`;
    }
    if (lowerKey === 'dc' || lowerKey.startsWith('v')) {
        return `${numVal.toFixed(2)} V`;
    }
    if (lowerKey === 'nfin') {
        return `${numVal}`; // just int
    }

    // Default number formatting
    if (Math.abs(numVal) < 1e-3 || Math.abs(numVal) > 1e4) return numVal.toExponential(2);
    return numVal.toFixed(3);
}

export default StatsPanel;
