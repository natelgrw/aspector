"""
graph_to_json.py

Author: natelgrw
Last Edited: 12/21/2025

Script containing functions converting netlist circuit graph data to JSON format.
"""

import torch
import json
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
    0: 'D', 1: 'G', 2: 'S', 3: 'B',
    4: 'P', 5: 'N',
    6: 'pos', 7: 'neg',
    8: 'ctrl_pos', 9: 'ctrl_neg'
}


# ===== Functions ===== #


def convert_to_serializable(obj):
    """
    Recursively converts torch tensors and other non-serializable 
    objects to JSON serializable formats.
    """
    if isinstance(obj, torch.Tensor):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(i) for i in obj]
    elif isinstance(obj, tuple):
        return [convert_to_serializable(i) for i in obj]
    else:
        return obj


def get_label(val, mapping):
    """
    Converts value to label using mapping, handling 
    both one-hot and numeric encodings.
    """
    if isinstance(val, (list, torch.Tensor)):
        v_list = val.tolist() if hasattr(val, 'tolist') else list(val)
        if len(v_list) == 1:
            return mapping.get(int(v_list[0]), f"unknown_{int(v_list[0])}")
        try:
            idx = v_list.index(1)
            return mapping.get(idx, f"unknown_{idx}")
        except (ValueError, IndexError):
            if v_list:
                return mapping.get(int(v_list[0]), f"unknown_{int(v_list[0])}")
    elif isinstance(val, (int, float)):
        return mapping.get(int(val), f"unknown_{int(val)}")
    
    return "unknown"


def reconstruct_circuit(data):
    """
    Reconstruct human-readable circuit mapping from graph data.
    """
    # identify data source
    is_hetero = not isinstance(data, dict)
    
    if is_hetero:
        metadata = getattr(data, 'circuit_metadata', {})
        node_names = getattr(data, 'node_names', {})
        comp_details = getattr(data, 'comp_details', [])
        
        comp_names = node_names.get('component', [])
        net_names = node_names.get('net', [])
        
        comp_feats = data['component'].x.tolist()
        net_feats = data['net'].x.tolist()
        
        edge_data = data['component', 'connects', 'net']
        edge_indices = edge_data.edge_index.t().tolist()
        edge_attrs = edge_data.edge_attr.tolist()
    else:
        metadata = data.get('metadata', {})
        nodes = data.get('nodes', {})
        features = data.get('features', {})
        edges = data.get('edges', {})
        
        comp_names = nodes.get('component', [])
        net_names = nodes.get('net', [])
        
        comp_feats = convert_to_serializable(features.get('component', []))
        net_feats = convert_to_serializable(features.get('net', []))
        
        edge_indices = convert_to_serializable(edges.get('index', []))
        edge_attrs = convert_to_serializable(edges.get('attr', []))
        comp_details = data.get('comp_details', [])

    # map components
    components = {}
    edges_list = []
    
    for i, name in enumerate(comp_names):
        feat = comp_feats[i] if i < len(comp_feats) else []
        details = comp_details[i] if i < len(comp_details) else {}
        
        params = {}
        if len(feat) >= 6:
            # Reconstruct params from features if details missing (fallback)
            if 'l' not in details and feat[1] > 0: params['l'] = feat[1]
            if 'nfin' not in details and feat[2] > 0: params['nfin'] = int(feat[2])
            if 'r' not in details and feat[3] > 0: params['r'] = feat[3]
            if 'c' not in details and feat[4] > 0: params['c'] = feat[4]
            if 'dc' not in details and feat[5] != 0:
                label = details.get('dc_param_name', 'dc')
                params[label] = feat[5]
        
        # Merge details into params, preferring details
        final_params = {**params, **details}

        subtype = get_label(feat[0] if feat else None, COMP_TYPE_MAP)
        
        components[name] = {
            "type": "COMPONENT",
            "subtype": subtype
        }

    # map nets
    nets = {}
    for i, name in enumerate(net_names):
        # We don't store subtype for nets in target, just type=NET
        # But we can keep it if useful later, for now strict adherence
        nets[name] = {
            "type": "NET"
        }

    # map edges 
    for i, (c_idx, n_idx) in enumerate(edge_indices):
        if c_idx >= len(comp_names) or n_idx >= len(net_names):
            continue
            
        c_name = comp_names[c_idx]
        n_name = net_names[n_idx]
        attr = edge_attrs[i] if i < len(edge_attrs) else []
        
        term_name = get_label(attr, TERM_MAP)
        
        edges_list.append({
            "source": c_name,
            "target": n_name,
            "pin": term_name
        })

    return {
        "topology_id": 1, 
        "netlist": metadata.get('filename', 'unknown.scs'), 
        "graph": {
            "directed": False,
            "nodes": {**components, **nets},
            "edges": edges_list
        }
    }


# ===== Main ===== #


def main():
    """
    Main function for converting graph data to JSON format.
    """
    input_file = "data/sample_circuit.pt"
    output_file = "data/sample_circuit.json"
    
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found.")
        return

    print(f"Loading {input_file}...")
    try:
        data_list = torch.load(input_file, weights_only=False)
    except Exception as e:
        print(f"Error loading {input_file}: {e}")
        return

    if not isinstance(data_list, list):
        data_list = [data_list]

    print("Reconstructing circuit structure and converting to JSON...")
    structured_data = [reconstruct_circuit(d) for d in data_list]

    print(f"Saving to {output_file}...")
    try:
        with open(output_file, 'w') as f:
            json.dump(structured_data, f, indent=2)
        print(f"Successfully converted dataset to structured JSON in {output_file}.")
    except Exception as e:
        print(f"Error saving {output_file}: {e}")


if __name__ == "__main__":
    main()
