export interface PerfSpecs {
    gain: number;
    UGBW: number;
    PM: number;
    power: number;
}

export interface Terminal {
    terminal: string;
    net: string;
}

export interface ComponentParams {
    [key: string]: number | string;
}

export interface Component {
    type: string;
    parameters: ComponentParams;
    terminals: Terminal[];
}

export interface Net {
    type: string;
    connected_components: string[];
}

export interface Metadata {
    tempc: number;
    fet_num: number;
    perf_specs: PerfSpecs;
    filename: string;
}

export interface CircuitData {
    metadata: Metadata;
    components: { [key: string]: Component };
    nets: { [key: string]: Net };
}

export interface GraphNode {
    id: string;
    group: 'component' | 'net';
    type?: string; // specific component type (nfet, etc) or net type (signal, etc)
    label: string;
    x?: number;
    y?: number;
    [key: string]: any;
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
