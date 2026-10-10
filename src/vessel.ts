// Scene units per metre are defined by the cup's 40 mm inner radius.
export const PITCHER = {
  tipY: -.315,
  tipZ: .19,
  bodyRadius: .22,
  bodyHalfHeight: .24,
  handleReach: .39,
  rimAllowanceM: .0008,
  rimHeadroomM: .024,
  accessBlendM: .008,
} as const;

// Interaction-only enlarged bowl: the displayed cup and liquid units stay unchanged.
// Equivalent to enlarging the clearance cup 2x, then fitting it back to the table.
export const POUR_ACCESS_SCALE = 2;
