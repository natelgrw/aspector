import React, { useCallback, useRef, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import type { CircuitData, GraphData, GraphNode } from '../types';


interface GraphVisProps {
    data: CircuitData | null;
    onDownloadJson: () => void;
    onClose: () => void;
}

const COMPONENT_COLORS: Record<string, string> = {
    nfet: '#0052FF',     // Coinbase Blue
    pfet: '#627EEA',     // ETH Purple
    resistor: '#F7931A', // BTC Orange
    capacitor: '#1652F0',// Darker Blue
    vsource: '#00C076',  // Success Green
    isource: '#00C076',  // Success Green
    default: '#58667E'   // Slate Gray
};
const NET_COLOR = '#050F19'; // Almost Black for Nets
const EDGE_COLOR = '#E2E8F0'; // Light Gray for Edges

const GraphVis: React.FC<GraphVisProps> = ({ data, onDownloadJson, onClose }) => {
    const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = React.useState({ w: 800, h: 600 });
    const [graphData, setGraphData] = React.useState<GraphData>({ nodes: [], links: [] });

    useEffect(() => {
        if (!data || !data.graph) return;

        const nodes: GraphNode[] = [];
        const links: any[] = [];

        // Add nodes
        Object.entries(data.graph.nodes).forEach(([id, nodeData]) => {
            const isComponent = nodeData.type === 'COMPONENT';
            nodes.push({
                id: id,
                label: id,
                group: isComponent ? 'component' : 'net',
                type: nodeData.subtype || nodeData.type,
                val: isComponent ? 10 : 7,
                properties: nodeData
            });
        });

        // Add edges
        if (data.graph.edges) {
            data.graph.edges.forEach(edge => {
                links.push({
                    source: edge.source,
                    target: edge.target,
                    label: edge.pin
                });
            });
        }

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
            setTimeout(() => {
                fgRef.current?.zoomToFit(400, 50);
            }, 200);
        }
    }, [graphData]);

    const handleNodePaint = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.label;
        const fontSize = 12 / globalScale;

        ctx.font = `600 ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

        // Draw shape
        const color = node.group === 'component'
            ? (COMPONENT_COLORS[node.type] || COMPONENT_COLORS.default)
            : NET_COLOR;

        ctx.fillStyle = color;
        ctx.beginPath();

        const size = node.group === 'component' ? 6 : 4;

        if (node.group === 'component') {
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
        } else {
            ctx.rect(node.x - size, node.y - size, size * 2, size * 2);
        }

        ctx.fill();

        // Draw label
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#050F19'; // Almost Black text
        ctx.fillText(label, node.x, node.y + size + fontSize + 2);

        // Draw type label small
        if (globalScale > 1.5) {
            ctx.fillStyle = '#58667E'; // Secondary Gray
            ctx.font = `${fontSize * 0.8}px Inter, sans-serif`;
            ctx.fillText(`(${node.type.toUpperCase()})`, node.x, node.y + size + fontSize * 2 + 2);
        }

    }, []);

    if (!data) return null;

    return (
        <div ref={containerRef} className="w-full h-full relative bg-white">
            <ForceGraph2D
                ref={fgRef}
                width={dimensions.w}
                height={dimensions.h}
                graphData={graphData}
                nodeLabel="label"
                linkColor={() => EDGE_COLOR}
                linkWidth={1.5}
                nodeCanvasObject={handleNodePaint}
                cooldownTicks={100}
                backgroundColor="transparent"
            />

            <div className="absolute top-6 right-6 flex gap-3">
                <button
                    onClick={() => fgRef.current?.zoomToFit(400)}
                    className="px-4 py-2 bg-white hover:bg-gray-50 rounded-full text-gray-900 font-medium text-sm border border-gray-200 transition-all hover:border-gray-300"
                >
                    Reset View
                </button>

                <button
                    onClick={onDownloadJson}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-medium text-sm transition-all shadow-sm hover:shadow"
                >
                    Download JSON
                </button>

                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-white hover:bg-gray-50 rounded-full text-gray-900 font-medium text-sm border border-gray-200 transition-all hover:border-gray-300"
                >
                    Close
                </button>
            </div>

            <div className="absolute bottom-6 left-6 flex flex-wrap gap-2 max-w-[80%]">
                <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: NET_COLOR }}></div>
                    <span className="text-gray-900 font-medium text-xs">Net</span>
                </div>
                {Object.entries(COMPONENT_COLORS).filter(([k]) => k !== 'default').map(([type, color]) => (
                    <div key={type} className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }}></div>
                        <span className="text-gray-600 font-medium text-xs uppercase">{type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GraphVis;
