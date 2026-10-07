export type Preset = { radius: number; spread: number; drift: number; opacity: number };
export const defaults: Record<string, Preset> = {
  Drawing: { radius: .022, spread: .015, drift: .04, opacity: 1.8 },
  Accessible: { radius: .032, spread: .09, drift: .3, opacity: 1.5 },
  Technique: { radius: .026, spread: .14, drift: .65, opacity: 1.3 },
};
export class MilkLedger {
  remaining = 100;
  spend(flow: number, dt: number) {
    const amount = Math.min(this.remaining, Math.max(0, flow) * Math.max(0, dt) * 8);
    this.remaining -= amount;
    return amount / 8;
  }
  refill() { this.remaining = 100; }
}
export function validPreset(value: unknown): value is Preset {
  if (!value || typeof value !== 'object') return false;
  const p = value as Preset;
  return [p.radius, p.spread, p.drift, p.opacity].every(Number.isFinite) &&
    p.radius >= .01 && p.radius <= .08 && p.spread >= 0 && p.spread <= .25 &&
    p.drift >= 0 && p.drift <= 1 && p.opacity >= .5 && p.opacity <= 3;
}
