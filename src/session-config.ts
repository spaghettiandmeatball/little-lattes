// Apply on each launch; room, gallery and radio preferences remain independent.
export const RECOMMENDED_SETTINGS = {
  mode: 'volume',
  scheme: 'advanced',
  padMode: 'aim',
  quality: '2',
} as const;

export const FRESH_CUP = {
  x: .5,
  y: .5,
  intention: 'draw',
  delivery: .35,
  rimAccess: true,
  stopAtRim: false,
} as const;
