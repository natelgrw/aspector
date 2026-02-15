# USPECT-256 Vector Bitmap

USPECT-256 (256-bit Universal Structural Physical Embedding for Circuit Topologies) is a vector format used to store circuit topology data in a way that is optimized for graph-based visualization and analysis. This file contains a table detailing what each bit in a USPECT-256 vector encodes.

## Primary Circuit Classification (Bits 0-15)

| Bit | Name |
|-----|------|
| 0 | DOMAIN_ANALOG | 
| 1 | DOMAIN_DIGITAL | 
| 2 | DOMAIN_RF | 
| 3 | DOMAIN_POWER | 
| 4 | DOMAIN_MEMORY | 
| 5 | DOMAIN_MIXED_SIGNAL | 
| 6-15 | Reserved For Future Use |

## Circuit Scale (Bits 16-18)

| Bit | Name |
|-----|------|
| 16 | SCALE_CELL |
| 17 | SCALE_MACRO |
| 18 | SCALE_SYSTEM |

## Circuit Role (Bits 19-47)

| Bit | Name |
|-----|------|
| 19 | ROLE_PROC_SIGNAL |
| 20 | ROLE_PWR_DIST |
| 21 | ROLE_TIMING |
| 22 | ROLE_IO_BUFF |
| 23 | ROLE_DATA_STORE |
| 24 | ROLE_ENV_SENSOR |
| 25 | ROLE_DFT_TEST |
| 26 | ROLE_PROT_REF |
| 27 | ROLE_CONV_DATA |
| 28 | ROLE_INTERCONNECT |
| 29 | ROLE_SECURITY |
| 30 | ROLE_COMPUTE |
| 31 | ROLE_AUX_MISC |
| 32 | ROLE_SUPERVISION |
| 33 | ROLE_ACTUATION |
| 34 | ROLE_CALIBRATION_TRIM |
| 35-47 | Reserved For Future Use |

## Primitive Component Motifs (Bits 48-79)

| Bit | Name |
|-----|------|
| 48 | MOTIF_RES_DIVIDER |
| 49 | MOTIF_RES_BRIDGE |
| 50 | MOTIF_RES_LADDER |
| 51 | MOTIF_RES_ARRAY |
| 52 | MOTIF_CAP_BANK |
| 53 | MOTIF_LC_TANK |
| 54 | MOTIF_MILLER_PATH |
| 55 | MOTIF_FILTER_NET |
| 56 | MOTIF_ESD_CLAMP |
| 57 | MOTIF_RECTIFIER |
| 58 | MOTIF_ZENER_REF |
| 59 | MOTIF_OPTO_DIODE |
| 60 | MOTIF_X_GATE |
| 61 | MOTIF_PASS_TRANS |
| 62 | MOTIF_TIE_LOGIC |
| 63 | MOTIF_NET_TAP |
| 64-79 | Reserved For Future Use |

## Analog & Power Component Motifs (Bits 80-111)

| Bit | Name |
|-----|------|
| 80 | MOTIF_DIFF_PAIR_NMOS |
| 81 | MOTIF_DIFF_PAIR_PMOS |
| 82 | MOTIF_DIFF_RAIL_RAIL |
| 83 | MOTIF_CASCODE_STACK |
| 84 | MOTIF_FOLDED_CASCODE |
| 85 | MOTIF_TELESCOPIC_CORE |
| 86 | MOTIF_DARLINGTON |
| 87 | MOTIF_CHOPPER_MOD |
| 88 | MIRROR_SIMPLE |
| 89 | MIRROR_HIGH_Z |
| 90 | MIRROR_ACTIVE_LOAD |
| 91 | MOTIF_BANDGAP_REF |
| 92 | MOTIF_PTAT_GEN |
| 93 | MOTIF_VBE_MULT |
| 94 | MOTIF_BIAS_DAC |
| 95 | MOTIF_STARTUP_CKT |
| 96 | MOTIF_OUT_STAGE_CLASS_AB |
| 97 | MOTIF_OUT_STAGE_RAIL_RAIL |
| 98 | MOTIF_OUT_FULLY_DIFF |
| 99 | MOTIF_OUT_CMFB_LOOP |
| 100 | MOTIF_POWER_PASS_ELEMENT |
| 101 | MOTIF_POWER_SWITCH_H_BRIDGE |
| 102 | MOTIF_POWER_CHARGE_PUMP |
| 103 | MOTIF_PROTECT_LIMIT_SHUTDOWN |
| 104 | MOTIF_CURRENT_SUMMER |
| 105 | MOTIF_LEVEL_SHIFTER |
| 106 | MOTIF_CAP_MULTIPLIER |
| 107 | MOTIF_DEAD_TIME_CTRL |
| 108 | MOTIF_SENSE_FET |
| 109 | MOTIF_REPLICA_BIAS |
| 110 | MOTIF_ERROR_AMP_CORE |
| 111 | MOTIF_SUBSTRATE_PUMP |

## Digital Component Motifs (Bits 112-143)

| Bit | Name |
|-----|------|
| 112-143 | Reserved For Future Use |

## Memory Component Motifs (Bits 144-175)

| Bit | Name |
|-----|------|
| 144-175 | Reserved For Future Use |

## RF & Mixed Signal Component Motifs (Bits 176-207)

| Bit | Name |
|-----|------|
| 176-207 | Reserved For Future Use |

## Emergent Domain Motifs (Bits 208-239)

| Bit | Name |
|-----|------|
| 208-239 | Reserved For Future Use |

## Universal Error Blocks (Bits 240-247)

| Bit | Name |
|-----|------|
| 240 | ERROR_NON_MODAL |
| 241 | ERROR_SOURCE_ABSENT |
| 242 | ERROR_GALVANIC_ISLAND |
| 243 | ERROR_IDEAL_SHORT |
| 244 | ERROR_IDEAL_OPEN |
| 245 | ERROR_KCL_CONFLICT |
| 246 | ERROR_KVL_CONFLICT |
| 247 | ERROR_PORT_DANGLING |

## Universal Warning Blocks (Bits 248-255)

| Bit | Name |
|-----|------|
| 248 | WARNING_BIAS_PATH_FAIL |
| 249 | WARNING_MATCH_SYMMETRY_FAIL |
| 250 | WARNING_LOOP_PHASE_FAIL |
| 251 | WARNING_NODE_IMPEDANCE_FAIL |
| 252 | WARNING_POTENTIAL_STACK_FAIL |
| 253 | WARNING_CURRENT_STEERING_FAIL |
| 254 | WARNING_SIGNAL_ISOLATION_FAIL |
| 255 | WARNING_STRUCTURAL_DROPOUT_FAIL |