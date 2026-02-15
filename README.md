# ASPECTOR

A software suite under active development that aids engineers in designing analog circuits at the netlist-transistor level. The eventual goal of ASPECTOR is to host foundation models capable of automating analog IC design across the entire topology and parametization space.

This repository serves as a home base for ASPECTOR, containing a deployable graph visualization web app for visualizing `.scs` netlists and miscellaneous scripts for data type conversion.

Additionally, circuit topologies simulated with ASPECTOR are classified with a custom USPECT-256 vector bitmap to allow for machine learning model training. Documentation for this bitmap is stored in `USPECT_256_BITMAP.md`.

Current Version: **0.3.0**

## 🕹️ Modules

ASPECTOR currently contains two modules that run Cadence Spectre netlist generation and simulation methods to collect data for parameter and topology optimization.

### ⛓️‍💥 ASPECTOR Crucible

Current Version: **1.2.0**

ASPECTOR Crucible is a tool for generating diverse op-amp Spectre netlists for dataset creation and design space exploration using a graph-based random generation approach. It is capable of synthesizing large-scale, stochastic datasets of broken analog circuits and exports them as Cadence Spectre compatible `.scs` files.

Source code and instructions for use can be found [here](https://github.com/natelgrw/aspector-crucible).

### ⚡ ASPECTOR Core

Current Version: **1.4.1**

ASPECTOR Core is a Cadence Spectre based simulation pipeline that searches a wide Analog design space and fine tunes sizing and bias parameters in op-amp netlists to meet target circuit performance specs.

Source code and instructions for use can be found [here](https://github.com/natelgrw/aspecto-core).
