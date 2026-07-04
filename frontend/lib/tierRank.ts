export type Tier = 'FREE' | 'PREMIUM' | 'PRO';

const RANKS: Record<string, number> = { FREE: 0, PREMIUM: 1, PRO: 2 };

export const tierRank = (tier?: string): number =>
  RANKS[(tier ?? 'FREE').toUpperCase()] ?? 0;

export const tierLabel: Record<string, string> = {
  FREE: 'Free',
  PREMIUM: 'Premium',
  PRO: 'Pro',
};
