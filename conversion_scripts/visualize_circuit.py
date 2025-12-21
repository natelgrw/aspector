"""
visualize_graph.py

Author: natelgrw
Last Edited: 12/21/2025

Visualizes a circuit graph using networkx and matplotlib.
"""

import torch
import networkx as nx
import matplotlib.pyplot as plt
import os
import argparse


# ===== Mappings ===== #


COMP_TYPE_MAP = {
    0: 'nfet', 
    1: 'pfet', 
    2: 'resistor', 
    3: 'capacitor', 
    4: 'vsource', 
    5: 'isource', 
    6: 'vcvs'
}

NET_TYPE_MAP = {
    0: 'supply', 
    1: 'bias', 
    2: 'signal', 
    3: 'internal'
}

TERM_MAP = {
    0: 'D', 
    1: 'G', 
    2: 'S', 
    3: 'B', 
    4: 'P', 
    5: 'N', 
    6: 'pos', 
    7: 'neg', 
    8: 'ctrl_pos', 
    9: 'ctrl_neg'
}


# ===== Functions ===== #


def get_label_from_index(idx, mapping):
    """
    Returns the label from the mapping for the given index.
    """
    return mapping.get(int(idx), f"?_{idx}")

def visualize_circuit(data, index, output_path, source_filename=None):
    """
    Visualizes a circuit graph as a .png file using networkx and matplotlib.
    """
    is_hetero = not isinstance(data, dict)
    
    if is_hetero:
        num_comps = data['component'].x.shape[0]
        num_nets = data['net'].x.shape[0]
        
        node_names = getattr(data, 'node_names', {})
        comp_names = node_names.get('component', [f"comp_{i}" for i in range(num_comps)])
        net_names = node_names.get('net', [f"net_{i}" for i in range(num_nets)])
        
        comp_feats = data['component'].x.tolist()
        net_feats = data['net'].x.tolist()
        edge_indices = data['component', 'connects', 'net'].edge_index.t().tolist()
        edge_attrs = data['component', 'connects', 'net'].edge_attr.tolist()
        metadata = getattr(data, 'metadata', {})
    else:
        nodes = data.get('nodes', {})
        comp_names = nodes.get('component', [])
        net_names = nodes.get('net', [])
        comp_feats = data.get('features', {}).get('component', [])
        net_feats = data.get('features', {}).get('net', [])
        edges = data.get('edges', {})
        edge_indices = edges.get('index', [])
        edge_attrs = edges.get('attr', [])
        metadata = data.get('metadata', {})
    
    G = nx.Graph()
    
    # add component nodes
    for i, name in enumerate(comp_names):
        feat = comp_feats[i]
        ctype = get_label_from_index(feat[0], COMP_TYPE_MAP)
        G.add_node(name, type='component', label=f"{name}\n({ctype})", color='skyblue')
        
    # add net nodes
    for i, name in enumerate(net_names):
        feat = net_feats[i]
        ntype = get_label_from_index(feat[0], NET_TYPE_MAP)
        G.add_node(name, type='net', label=f"{name}\n({ntype})", color='lightgreen')
        
    # add edges
    for i, (c_idx, n_idx) in enumerate(edge_indices):
        if c_idx >= len(comp_names) or n_idx >= len(net_names): continue
        c_name = comp_names[c_idx]
        n_name = net_names[n_idx]
        term_idx = edge_attrs[i][0]
        term = get_label_from_index(term_idx, TERM_MAP)
        G.add_edge(c_name, n_name, label=term)
        
    # plotting components, nets, edges, and labels
    plt.figure(figsize=(20, 14))
    pos = nx.spring_layout(G, k=0.7, iterations=50)
    
    comp_nodes = [n for n, d in G.nodes(data=True) if d['type'] == 'component']
    nx.draw_networkx_nodes(G, pos, nodelist=comp_nodes, node_color='skyblue', node_shape='o', node_size=2800, alpha=0.8)
    
    net_nodes = [n for n, d in G.nodes(data=True) if d['type'] == 'net']
    nx.draw_networkx_nodes(G, pos, nodelist=net_nodes, node_color='lightgreen', node_shape='s', node_size=2000, alpha=0.8)
    
    nx.draw_networkx_edges(G, pos, width=1.5, alpha=0.5, edge_color='gray')
    
    labels = nx.get_node_attributes(G, 'label')
    nx.draw_networkx_labels(G, pos, labels, font_size=9, font_weight='bold')
    
    edge_labels = nx.get_edge_attributes(G, 'label')
    nx.draw_networkx_edge_labels(G, pos, edge_labels, font_size=8)
    
    display_name = source_filename if source_filename else metadata.get('filename', f'Index {index}')
    plt.title(f"Circuit Graph Visualization {display_name}", fontsize=20, pad=35)
    
    from matplotlib.lines import Line2D
    legend_elements = [
        Line2D([0], [0], marker='o', color='w', label='Component',
               markerfacecolor='skyblue', markersize=15),
        Line2D([0], [0], marker='s', color='w', label='Net',
               markerfacecolor='lightgreen', markersize=12),
    ]
    plt.legend(handles=legend_elements, loc='upper left', frameon=True, fontsize=12, facecolor='white', framealpha=0.8)

    overarching_text = "OVERARCHING VALUES:\n\n"
    overarching_text += f"Temp: {metadata.get('tempc', 'N/A')}\n"
    if 'fet_num' in metadata:
        overarching_text += f"Fet Num: {metadata['fet_num']}\n"
    perf = metadata.get('perf_specs', {})
    for k, v in perf.items():
        overarching_text += f"{k}: {v}\n"
    
    plt.figtext(0.82, 0.90, overarching_text, fontsize=11, verticalalignment='top', 
                bbox=dict(boxstyle='round,pad=0.5', facecolor='lightyellow', alpha=0.9), fontweight='bold')

    param_text = "COMPONENT PARAMETERS:\n\n"
    comp_details = getattr(data, 'comp_details', []) if is_hetero else data.get('comp_details', [])
    
    for i, name in enumerate(comp_names):
        details = comp_details[i] if i < len(comp_details) else {}
        f = comp_feats[i]
        val_strs = []
        if f[1] > 0: val_strs.append(f"L={f[1]:.2e}")
        if f[2] > 0: val_strs.append(f"nfin={int(f[2])}")
        if f[3] > 0: val_strs.append(f"nR={f[3]:.1f}")
        if f[4] > 0: val_strs.append(f"nC={f[4]:.1e}")
        
        if f[5] != 0:
            param_label = details.get('dc_param_name', 'DC')
            val_strs.append(f"{param_label}={f[5]:.3f}")
        
        if val_strs:
            param_text += f"{name}: {', '.join(val_strs)}\n"

    plt.figtext(0.82, 0.72, param_text, fontsize=9, verticalalignment='top', 
                bbox=dict(boxstyle='round,pad=0.5', facecolor='white', alpha=0.7))
    
    plt.subplots_adjust(right=0.8)
    plt.axis('off')
    
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Visualization saved to {output_path}")


# ===== Main ===== #


def main():
    """
    Main function to visualize a circuit.
    """
    input_file = "data/circuit_dataset.pt"
    output_file = "data/sample_circuit_vis.png"
    index = 0
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    if input_file.endswith('.scs'):
        try:
            from .net_to_graph import NetlistToGraph
        except (ImportError, ValueError):
            from net_to_graph import NetlistToGraph
            
        converter = NetlistToGraph()
        specs = {"gain": 1.97, "UGBW": 4.28e9, "PM": 83.8, "power": 0.000113}
        circuit_data = converter.parse_file(input_file, perf_specs=specs)
    else:
        print(f"Loading {input_file}...")
        try:
            full_data = torch.load(input_file, weights_only=False)
        except Exception as e:
            print(f"Error loading {input_file}: {e}")
            return
            
        if isinstance(full_data, list):
            if index >= len(full_data):
                print(f"Error: Index {index} out of range.")
                return
            circuit_data = full_data[index]
        else:
            circuit_data = full_data
        
    visualize_circuit(circuit_data, index, output_file, source_filename=os.path.basename(input_file))


if __name__ == "__main__":
    main()
