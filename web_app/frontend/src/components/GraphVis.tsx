import React, { useCallback, useRef, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import type { CircuitData, GraphData, GraphNode } from '../types';
import { Download, Maximize2 } from 'lucide-react';

interface GraphVisProps {
    data: CircuitData | null;
    onNodeClick: (node: GraphNode | null) => void;
    onDownloadJson: () => void;
}

const COMPONENT_COLORS: Record<string, string> = {
    nfet: '#3B82F6',     // Blue-500
    pfet: '#A855F7',     // Purple-500
    resistor: '#F97316', // Orange-500
    capacitor: '#EAB308',// Yellow-500
    vsource: '#EF4444',  // Red-500
    isource: '#EF4444',  // Red-500
    default: '#6B7280'   // Gray-500
};
const NET_COLOR = '#10B981'; // emerald-500
const EDGE_COLOR = '#9CA3AF'; // gray-400

const GraphVis: React.FC<GraphVisProps> = ({ data, onNodeClick, onDownloadJson }) => {
    const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = React.useState({ w: 800, h: 600 });
    const [graphData, setGraphData] = React.useState<GraphData>({ nodes: [], links: [] });

    useEffect(() => {
        if (!data) return;

        // Transform data to graph format
        // The endpoint returns `full_json` which is `CircuitData` format. 
        // We need to convert this to nodes/links for the graph.

        const nodes: GraphNode[] = [];
        const links: any[] = [];

        // Add components
        Object.keys(data.components).forEach(name => {
            nodes.push({
                id: name,
                label: name,
                group: 'component',
                type: data.components[name].type,
                val: 10 // size
            });

            // Add links
            data.components[name].terminals.forEach(t => {
                links.push({
                    source: name,
                    target: t.net,
                    label: t.terminal
                });
            });
        });

        // Add nets
        Object.keys(data.nets).forEach(name => {
            nodes.push({
                id: name,
                label: name,
                group: 'net',
                type: data.nets[name].type,
                val: 7 // size
            });
        });

        setGraphData({ nodes, links });

    }, [data]);

    useEffect(() => {
        function handleResize() {
            if (containerRef.current) {
                setDimensions({
                    w: containerRef.current.offsetWidth,
                    h: containerRef.current.offsetHeight
                });
            }
        }

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (fgRef.current && graphData.nodes.length > 0) {
            fgRef.current.d3Force('charge')?.strength(-300);

            // Auto-zoom with a slight delay to ensure rendering is ready
            setTimeout(() => {
                fgRef.current?.zoomToFit(400, 50);
            }, 200);
        }
    }, [graphData]);

    const handleNodePaint = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.label;
        const fontSize = 12 / globalScale;

        ctx.font = `${fontSize}px Sans-Serif`;

        // Draw shape
        const color = node.group === 'component'
            ? (COMPONENT_COLORS[node.type] || COMPONENT_COLORS.default)
            : NET_COLOR;

        ctx.fillStyle = color;
        ctx.beginPath();

        const size = node.group === 'component' ? 6 : 4;

        if (node.group === 'component') {
            // Circle
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
        } else {
            // Square (Net)
            ctx.rect(node.x - size, node.y - size, size * 2, size * 2);
        }

        ctx.fill();

        // Draw label
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#374151'; // gray-700
        ctx.fillText(label, node.x, node.y + size + fontSize + 2);

        // Draw type label small
        if (globalScale > 1.5) {
            ctx.fillStyle = '#9CA3AF'; // gray-400
            ctx.font = `${fontSize * 0.8}px Sans-Serif`;
            ctx.fillText(`(${node.type.toUpperCase()})`, node.x, node.y + size + fontSize * 2 + 2);
        }

    }, []);

    if (!data) return null;

    return (
        <div ref={containerRef} className="w-full h-full relative bg-gray-50/50">
            <ForceGraph2D
                ref={fgRef}
                width={dimensions.w}
                height={dimensions.h}
                graphData={graphData}
                nodeLabel="label"
                nodeColor={node => node.group === 'component' ? (COMPONENT_COLORS[node.type] || COMPONENT_COLORS.default) : NET_COLOR}
                linkColor={() => EDGE_COLOR}
                linkWidth={1}
                onNodeClick={(node) => onNodeClick(node as GraphNode)}
                onBackgroundClick={() => onNodeClick(null)}
                nodeCanvasObject={handleNodePaint}
                cooldownTicks={100}
                backgroundColor="transparent"
            />

            <div className="absolute top-4 right-4 flex gap-2">
                <button
                    onClick={() => fgRef.current?.zoomToFit(400)}
                    className="p-2 bg-white hover:bg-gray-50 rounded text-gray-500 shadow-sm border border-gray-200 transition-colors"
                    title="Fit to view"
                >
                    <Maximize2 size={20} />
                </button>

                <button
                    onClick={onDownloadJson}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded shadow-sm transition-colors font-medium text-sm"
                >
                    <Download size={16} />
                    Download JSON
                </button>
            </div>

            <div className="absolute bottom-4 left-4 flex gap-4 text-xs font-mono">
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full" style={{ background: COMPONENT_COLORS.default }}></div>
                    <span className="text-gray-600 font-sans font-medium">Component</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full" style={{ background: NET_COLOR }}></div>
                    <span className="text-gray-600 font-sans font-medium">Net</span>
                </div>
                {/* Specific Component Legends */}
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full" style={{ background: COMPONENT_COLORS.nfet }}></div>
                    <span className="text-gray-500 text-[10px] font-sans">NFET</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full" style={{ background: COMPONENT_COLORS.pfet }}></div>
                    <span className="text-gray-500 text-[10px] font-sans">PFET</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full" style={{ background: COMPONENT_COLORS.resistor }}></div>
                    <span className="text-gray-500 text-[10px] font-sans">Res</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full" style={{ background: COMPONENT_COLORS.capacitor }}></div>
                    <span className="text-gray-500 text-[10px] font-sans">Cap</span>
                </div>
            </div>
        </div>
    );
};

export default GraphVis;
