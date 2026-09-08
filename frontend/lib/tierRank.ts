export type Tier = 'BASIC' | 'PREMIUM' | 'PRO';

const RANKS: Record<string, number> = { BASIC: 0, PREMIUM: 1, PRO: 2 };

export const tierRank = (tier?: string): number =>
  RANKS[(tier ?? 'BASIC').toUpperCase()] ?? 0;

export const tierLabel: Record<string, string> = {
  BASIC: 'Basic',
  PREMIUM: 'Premium',
  PRO: 'Pro',
};
