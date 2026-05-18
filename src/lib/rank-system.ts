export interface RankInfo {
  name: string;
  level: number;
}

export function getRank(level: number, ranks: RankInfo[]): RankInfo {
  for (const rank of ranks) {
    if (level >= rank.level) return rank;
  }
  return ranks[ranks.length - 1];
}

export function getNextRank(level: number, ranks: RankInfo[]): RankInfo | null {
  for (const rank of ranks) {
    if (level < rank.level) return rank;
  }
  return null;
}

export function getLevelProgress(level: number, xp: number): number {
  const xpNeeded = (level + 1) * 100;
  return Math.min((xp / xpNeeded) * 100, 100);
}
