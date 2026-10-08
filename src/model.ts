export type Preset = { radius: number; spread: number; drift: number; opacity: number };
export const defaults: Record<string, Preset> = {
  Drawing: { radius: .032, spread: .04, drift: .35, opacity: 1.5 },
  Accessible: { radius: .034, spread: .06, drift: .5, opacity: 1.5 },
  Technique: { radius: .03, spread: .07, drift: .65, opacity: 1.4 },
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
