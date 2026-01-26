

export interface ComponentParams {
    [key: string]: any;
}

export interface NodeData {
    type: 'COMPONENT' | 'NET';
    subtype?: string; // e.g. 'nfet', 'pfet' for components
    [key: string]: any; // parameters like l, nfin, etc.
}

export interface EdgeData {
    source: string;
    target: string;
    pin: string;
}

export interface GraphStructure {
    directed: boolean;
    nodes: { [key: string]: NodeData };
    edges: EdgeData[];
}

// TODO: The metadata (perf_specs, tempc) is no longer in the root of the JSON based on sample.
// However, the backend code `net_to_graph` still puts it in `metadata` dict in hetero data.
// But `graph_to_json` reconstruct_circuit function output does NOT include a `metadata` key in the root anymore.
// It returns { topology_id, netlist, graph }.
// We need to decide where perf_specs go.
// Looking at `graph_to_json.py`, `metadata` IS available in the function but NOT added to the return dict.
// I should probably fix the backend to include metadata if UI needs it, OR update UI to not expect it.
// The sample_graph.json does NOT have metadata. 
// For now I will assume we strictly follow sample_graph.json structure for the main data, 
// BUT distinct from sample_graph.json, our app relies on metadata for stats.
// I will check if I should add metadata back to backend output. 
// The user asked "perfectly is a representative of that .json file".
// The sample json has NO metadata.
// I will likely lose the stats panel data if I don't include it. 
// However, strictly following the user request "perfectly is a representative of that .json file" implies following that schema.
// BUT, the verification script output says "Top-level keys match" (topology_id, graph, netlist).
// So I will stick to that. The StatsPanel might break or be empty. 
// Use `any` for now to avoid strict typing issues during transition if needed, but here is the strict type:

export interface CircuitData {
    topology_id: number;
    netlist: string;
    graph: GraphStructure;
    // Optional metadata if we decide to smuggle it in later or if it exists elsewhere
    metadata?: any;
}

export interface GraphNode {
    id: string;
    group: 'component' | 'net';
    type?: string;
    label: string;
    x?: number;
    y?: number;
    val?: number;
    properties?: NodeData;
}

export interface GraphLink {
    source: string;
    target: string;
    label?: string;
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}
