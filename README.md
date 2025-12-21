# ASPECTOR: Generative AI for Op-Amp Design

ASPECTOR is a software suite under active development that aids engineers in designing op-amps at the netlist-transistor level. The eventual goal of ASPECTOR is to train a foundation model capable of automating op-amp design across the entire topology and parametization space.

This repository serves as a home base for ASPECTOR, containing miscellaneous scripts,
data, and links to core modules.

Current Version: **0.1.2**

## 🕹️ Modules

ASPECTOR currently contains two modules that run Cadence Spectre netlist generation and simulation methods to collect data for parameter and topology optimization.

### 💎 ASPECTOR Foundry

Current Version: **1.1.1**

ASPECTOR Foundry is a tool for generating diverse op-amp Spectre netlists for dataset creation and design space exploration using a graph-based random generation approach. It synthesizes valid circuit topologies and exports them as Cadence Spectre compatible `.scs` files.

Source code and instructions for use can be found [here](https://github.com/natelgrw/aspector_foundry).

### ⚡ ASPECTOR Core

Current Version: **1.0.0**

ASPECTOR Core is a Cadence Spectre based simulation pipeline that searches a wide Analog design space and fine tunes sizing and bias parameters to meet target circuit performance specs.

Source code and instructions for use can be found [here](https://github.com/natelgrw/aspector_core).
