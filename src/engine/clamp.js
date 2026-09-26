/* Thruster clamp force check — HDPE_Push_Clamp_Calc_V1.xlsx, sheet Clamp_Check.
   Required clamp (normal) force = F_push · SF / μ_grip; capacity = p_max · A_pads;
   pipe-wall limit p_allow = 2·σ_bearing / (SDR − 1) (thin-ring basis). */

import { TON_TO_KN_V1 } from './constants.js';

export function clampCheck({ peakTon, sf, muGrip, pads, padLength, padWidth, pMax, sigmaBearing, SDR }) {
  const Fpush = peakTon * TON_TO_KN_V1;            // B5  kN (V1 uses × 9.81)
  const Freq = Fpush * sf / muGrip;                // B10 kN
  const Apad = pads * padLength * padWidth;        // B17 cm²
  const Fcap = pMax * Apad * 100 / 1000;           // B19 kN   p(MPa)·A(cm²)·0.1
  const pAllow = 2 * sigmaBearing / (SDR - 1);     // B25 MPa
  const pApplied = Freq / (Apad * 100 / 1000);     // B26 MPa
  const capacityOk = Fcap >= Freq;                 // D30
  const wallOk = pApplied <= pAllow;               // D31
  return {
    Fpush, Freq, Apad, Fcap, pAllow, pApplied, SDR,
    capacityOk, wallOk, overallOk: capacityOk && wallOk,
    capacityRatio: Freq / Fcap, wallRatio: pApplied / pAllow,
    pRequiredForDemand: Freq / (Apad * 0.1),
    padAreaForWall: Freq / (pAllow * 0.1),         // cm² of pad needed so the wall limit is met
  };
}
