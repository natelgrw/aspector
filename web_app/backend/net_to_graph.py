"""
net_to_graph.py

Author: natelgrw
Last Edited: 12/21/2025

Script containing functions converting .scs circuit files to .pt graphs.
"""

import re
import os
import torch
try:
    from torch_geometric.data import HeteroData
except ImportError:
    HeteroData = None


# ===== Graph Conversion Class ===== #


class NetlistToGraph:
    """
    Class for converting .scs netlists to .pt graphs.
    """
    def __init__(self):
        # Component mappings
        self.comp_type_map = {
            'nfet': 0,
            'pfet': 1,
            'resistor': 2,
            'capacitor': 3,
            'vsource': 4,
            'isource': 5,
            'vcvs': 6
        }

        self.net_patterns = {
            'supply': re.compile(r'vdd!|gnd!|0'),
            'bias': re.compile(r'vbias|ibias', re.IGNORECASE),
            'signal': re.compile(r'vin|vout', re.IGNORECASE)
        }

        self.term_map = {
            'D': 0, 'G': 1, 'S': 2, 'B': 3,
            'P': 4, 'N': 5,
            'pos': 6, 'neg': 7,
            'ctrl_pos': 8, 'ctrl_neg': 9
        }
        
        self.suffixes = {
            'f': 1e-15, 'p': 1e-12, 'n': 1e-9, 'u': 1e-6, 'm': 1e-3,
            'k': 1e3, 'M': 1e6, 'G': 1e9, 'T': 1e12
        }

    def _parse_value(self, val_str, params=None):
        """
        Parses numeric values with scientific notation or suffixes, 
        resolve parameter names.
        '"""
        if not val_str: return 0.0
        val_str = str(val_str).strip()
        
        if params and val_str in params:
            return params[val_str]
        
        match = re.match(r'([-+]?[\d\.]+(?:[eE][-+]?\d+)?)([a-zA-Z]*)', val_str)
        if match:
            num, suffix = match.groups()
            try:
                base = float(num)
                if suffix and suffix in self.suffixes:
                    return base * self.suffixes[suffix]
                return base
            except ValueError:
                return 0.0
        return 0.0

    def parse_file(self, file_path):
        """
        Parses a .scs netlist file into a .pt graph.
        """
        with open(file_path, 'r') as f:
            content = f.read()
        
        # extract parameters
        params = {}
        param_matches = re.findall(r'parameters\s+(.*)', content)
        for p_line in param_matches:
            parts = re.findall(r'(\w+)=([\w\.\+-e]+)', p_line)
            for k, v in parts:
                params[k] = self._parse_value(v)
        
        # extract subcircuit definitions
        subckts = {}
        subckt_matches = re.finditer(r'subckt\s+(\w+)\s+(.*?)\n(.*?)\nends\s+\1', content, re.DOTALL)
        for match in subckt_matches:
            name, p_str, body = match.groups()
            ports = p_str.split()
            subckts[name] = {'ports': ports, 'body': body}
            
        # extract top level
        top_content = re.sub(r'subckt.*?\nends.*?\n', '', content, flags=re.DOTALL)
        
        # flatten
        flat_components = []
        lines = top_content.split('\n')
        
        in_topology = False
        
        for line in lines:
            line = line.strip()
            
            # State machine for topology section
            if '*--- TOPOLOGY ---*' in line:
                in_topology = True
                continue
            if '*--- TESTBENCH ---*' in line:
                in_topology = False
                continue
                
            # Only parse if in topology section
            if not in_topology:
                continue

            if not line or line.startswith('*') or line.startswith('simulator') or line.startswith('global') or line.startswith('parameters') or line.startswith('include'):
                continue
            
            if line.startswith('x'):
                parts = line.split()
                if len(parts) < 3: continue
                inst_name = parts[0]
                inst_ports = parts[1:-1]
                subckt_name = parts[-1]
                
                if subckt_name in subckts:
                    sub = subckts[subckt_name]
                    port_map = dict(zip(sub['ports'], inst_ports))
                    for s_line in sub['body'].split('\n'):
                        s_line = s_line.strip()
                        if not s_line or s_line.startswith('*') or s_line.startswith('.'): continue
                        comp = self._parse_component_line(s_line, port_map, params, prefix=inst_name)
                        if comp: flat_components.append(comp)
            else:
                comp = self._parse_component_line(line, {}, params, prefix="top")
                if comp: flat_components.append(comp)
                
        return self._build_hetero_data(flat_components, params, os.path.basename(file_path))

    def _parse_component_line(self, line, port_map, params, prefix=""):
        line = line.split('*')[0].strip()
        if not line: return None
        
        parts = line.split()
        if not parts: return None
        
        comp_name = parts[0]
        if prefix and prefix != "top":
            comp_name = f"{prefix}_{comp_name}"
        
        type_found = None
        type_idx = -1
        for i, p in enumerate(parts):
            if p in self.comp_type_map:
                type_found = p
                type_idx = i
                break
        
        if not type_found: return None
        
        # Skip source components
        if type_found in ['vsource', 'isource', 'vcvs']:
            return None
            
        nets_str = " ".join(parts[1:type_idx])
        nets_str = nets_str.replace('(', '').replace(')', '').strip()
        nets_list = nets_str.split()
        mapped_nets = [port_map.get(n, n) for n in nets_list]
        
        comp_params_str = " ".join(parts[type_idx+1:])
        
        # Robust parsing for params to capture raw strings (including expressions)
        raw_params = {}
        tokens = comp_params_str.split()
        
        current_key = None
        current_val_tokens = []
        
        for token in tokens:
            # Check if this token looks like a "key=..." start
            # We assume keys are valid identifiers.
            if re.match(r'^[a-zA-Z_]\w*=', token):
                # If we were building a value for a previous key, save it
                if current_key:
                    raw_params[current_key] = " ".join(current_val_tokens)
                
                # Start new key
                k, v = token.split('=', 1)
                current_key = k
                current_val_tokens = [v] if v else []
            else:
                # Continue building current value
                if current_key is not None:
                    current_val_tokens.append(token)
        
        # Save the last one
        if current_key:
            raw_params[current_key] = " ".join(current_val_tokens)

        # For backward compatibility / numeric features, try to parse simple numbers from these raw strings
        comp_params = {}
        for k, v in raw_params.items():
            # Try to match simple number
            match = re.match(r'^([\w\.\+-e]+)$', v)
            if match:
                comp_params[k] = match.group(1)
            else:
                # If complex expression, we can't easily get a number. 
                # Leave it out of comp_params (numeric) or set to 0 later via get() default
                pass
        
        # Helper to find positional value if named param is missing
        def find_positional_val():
            for p_str in parts[type_idx+1:]:
                # skip key=value pairs
                if '=' in p_str: continue
                val = self._parse_value(p_str, params)
                if val > 0: return val
            return 0.0

        # Handle resistor/capacitor positional values
        if type_found == 'resistor' and 'r' not in comp_params and 'nR' not in comp_params:
            pos_val = find_positional_val()
            if pos_val > 0: comp_params['r'] = pos_val
            
        if type_found == 'capacitor' and 'c' not in comp_params and 'nC' not in comp_params:
            pos_val = find_positional_val()
            if pos_val > 0: comp_params['c'] = pos_val

        sizing = {
            'l': self._parse_value(comp_params.get('l', 0), params),
            'nfin': self._parse_value(comp_params.get('nfin', 0), params) or self._parse_value(comp_params.get('w', 0), params),
            'r': self._parse_value(comp_params.get('nR', 0), params) or self._parse_value(comp_params.get('r', 0), params),
            'c': self._parse_value(comp_params.get('nC', 0), params) or self._parse_value(comp_params.get('c', 0), params),
            'dc': self._parse_value(comp_params.get('dc', 0), params),
        }
        
        # Debugging: Print parsing result
        print(f"[DEBUG] Parsed {comp_name}: params={sizing}, raw_str='{comp_params_str}'")

        if comp_name in ['V0', 'V1'] or comp_name.startswith('V_V') or comp_name in ['VN', 'VP2', 'VN2']:
            if type_found == 'vsource':
                match = re.search(r'dc=(\w+)', comp_params_str)
                if match:
                    param_name = match.group(1)
                    sizing['dc_param_name'] = param_name
                    sizing['dc'] = params.get(param_name, sizing['dc'])
                    
        # Attach raw params (essential for pairing logic)
        sizing['params_raw'] = raw_params

        # handle terminals
        terminals = []
        t_names = []
        if type_found in ['nfet', 'pfet']: t_names = ['D', 'G', 'S', 'B']
        elif type_found in ['resistor', 'capacitor']: t_names = ['P', 'N']
        elif type_found in ['vsource', 'isource']: t_names = ['pos', 'neg']
        elif type_found == 'vcvs': t_names = ['pos', 'neg', 'ctrl_pos', 'ctrl_neg']
            
        for i, tn in enumerate(t_names):
            if i < len(mapped_nets):
                terminals.append({'name': tn, 'net': mapped_nets[i]})
                
        return {
            'name': comp_name,
            'type': type_found,
            'terminals': terminals,
            'params': sizing
        }

    def _build_hetero_data(self, components, global_params, filename="unknown.scs"):
        """
        Build hetero data from components.
        """
        nets = sorted(list(set(t['net'] for c in components for t in c['terminals'])))
        net_idx = {n: i for i, n in enumerate(nets)}
        comp_idx = {c['name']: i for i, c in enumerate(components)}
        
        # net features
        net_feat = []
        for n in nets:
            type_id = 3
            if self.net_patterns['supply'].match(n): type_id = 0
            elif self.net_patterns['bias'].search(n): type_id = 1
            elif self.net_patterns['signal'].search(n): type_id = 2
            
            net_feat.append([float(type_id)])
            
        # component features
        comp_feat = []
        for c in components:
            type_id = self.comp_type_map.get(c['type'], 0)
            p = c['params']
            comp_feat.append([
                float(type_id), 
                float(p['l']), 
                float(p['nfin']), 
                float(p['r']), 
                float(p['c']), 
                float(p['dc'])
            ])
            
        # edges
        edge_index_c2n = []
        edge_attr_c2n = []
        for c in components:
            c_i = comp_idx[c['name']]
            for t in c['terminals']:
                n_i = net_idx[t['net']]
                edge_index_c2n.append([c_i, n_i])
                t_idx = self.term_map.get(t['name'], 0)
                edge_attr_c2n.append([float(t_idx)])
        
        # global features
        metadata = {
            'tempc': global_params.get('tempc', 27.0),
            'fet_num': global_params.get('fet_num', 0),
            'filename': filename
        }

        if not HeteroData:
            return {
                'nodes': {'net': nets, 'component': [c['name'] for c in components]},
                'features': {'net': net_feat, 'component': comp_feat},
                'edges': {'index': edge_index_c2n, 'attr': edge_attr_c2n},
                'metadata': metadata,
                'comp_details': [c['params'] for c in components]
            }
            
        data = HeteroData()
        data['net'].x = torch.tensor(net_feat, dtype=torch.float)
        data['component'].x = torch.tensor(comp_feat, dtype=torch.float)
        
        edge_index = torch.tensor(edge_index_c2n, dtype=torch.long).t().contiguous()
        data['component', 'connects', 'net'].edge_index = edge_index
        data['component', 'connects', 'net'].edge_attr = torch.tensor(edge_attr_c2n, dtype=torch.float)
        
        data['net', 'connected_by', 'component'].edge_index = edge_index[[1, 0]]
        data['net', 'connected_by', 'component'].edge_attr = torch.tensor(edge_attr_c2n, dtype=torch.float)
        
        data.circuit_metadata = metadata
        data.node_names = {
            'net': nets,
            'component': [c['name'] for c in components]
        }
        data.comp_details = [c['params'] for c in components]
        return data


# ===== Main ===== #


if __name__ == "__main__":
    converter = NetlistToGraph()
    
    path = "data/sample_netlist.scs"

    if os.path.exists(path):
        graph = converter.parse_file(path)
        print("Graph generated successfully with numeric parameters.")
        
        output_path = "data/sample_graph.pt"
        torch.save(graph, output_path)
        print(f"Graph saved to {output_path}")

        if isinstance(graph, dict):
            print(f"Nodes: {len(graph['nodes']['component'])} components")
            print("First component feature:", graph['features']['component'][0])
            print("Global metadata:", graph['metadata'])
        else:
            print("HeteroData object created.")
            print("Component features shape:", graph['component'].x.shape)
            print("Metadata:", graph.metadata)
            print("First component details:", graph.comp_details[0])
