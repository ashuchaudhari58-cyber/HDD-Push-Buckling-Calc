/* Unit constants exactly as used in the source workbooks. Do not "improve" these values:
   the regression tests compare against the spreadsheets to many significant figures. */

export const G_N_PER_TON = 9806.65;        // Push force Calculation.xlsx: T1(ton) * 9806.65 -> N
export const N_TO_TON = 0.0001019716;      // Push force Calculation.xlsx: N -> ton
export const PSI_TO_KGCM2 = 0.070307;      // Push force Calculation.xlsx: SMYS psi -> kg/cm²
export const MPA_TO_KGCM2 = 10.1971621;    // 1 MPa = 10.1971621 kg/cm²
export const KGCM2_TO_MPA = 0.0980665;     // 1 kg/cm² = 0.0980665 MPa
export const TON_TO_KN_V1 = 9.81;          // HDPE_Push_Clamp_Calc_V1: ton -> kN (x 9.81)
export const TON_TO_KN = 9.80665;          // exact tonne-force -> kN (display only)
export const IN_TO_CM = 2.54;
export const DEG = Math.PI / 180;
export const WATER_KGCM3 = 0.001;          // fresh water, 1000 kg/m³
