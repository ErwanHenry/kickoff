/**
 * Stats calculation utilities library
 * Per PLAN 06-03 requirements: incremental average updates, weighted overall calculation
 */

/**
 * Parse a Drizzle decimal string to number
 * Handles null/undefined → returns 0
 */
export function parseDecimal(value: string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate incremental average
 * Formula: ((oldAverage * oldCount) + newValue) / (oldCount + 1)
 *
 * @param oldAverage - Current average value
 * @param oldCount - Number of data points that produced oldAverage
 * @param newValue - New value to incorporate
 * @returns New average rounded to 2 decimal places
 *
 * @example
 * calculateIncrementalAverage(3.5, 10, 4) // 3.59
 * calculateIncrementalAverage(3.0, 0, 5) // 5.00
 */
export function calculateIncrementalAverage(
  oldAverage: number,
  oldCount: number,
  newValue: number
): number {
  if (oldCount === 0) {
    return Math.round(newValue * 100) / 100;
  }

  const newAverage = (oldAverage * oldCount + newValue) / (oldCount + 1);
  return Math.round(newAverage * 100) / 100;
}

/**
 * Calculate weighted overall score from three axes
 * Formula: (technique * 0.4) + (physique * 0.3) + (collectif * 0.3)
 *
 * @param technique - Technical ability score (1-5)
 * @param physique - Physical ability score (1-5)
 * @param collectif - Collective/teamwork score (1-5)
 * @returns Weighted overall score rounded to 2 decimal places
 *
 * @example
 * calculateWeightedOverall(4.0, 3.5, 3.8) // 3.79
 * calculateWeightedOverall(5.0, 5.0, 5.0) // 5.00
 */
export function calculateWeightedOverall(
  technique: number,
  physique: number,
  collectif: number
): number {
  const overall = technique * 0.4 + physique * 0.3 + collectif * 0.3;
  return Math.round(overall * 100) / 100;
}

/**
 * Update player stats from a batch of new ratings
 * Aggregates multiple ratings and applies incremental formula
 *
 * @param ratings - Array of new ratings with technique, physique, collectif
 * @param currentStats - Current player stats from database
 * @returns Updated stats object with all fields as strings (2 decimal places)
 *
 * Process:
 * 1. Average new ratings per axis
 * 2. Apply incremental formula: new_avg = ((old_avg * n) + avg_new) / (n + 1)
 * 3. Calculate weighted overall from new three-axis averages
 * 4. Increment totalRatingsReceived by ratings.length
 */
export function updatePlayerStatsFromRatings(
  ratings: Array<{ technique: number; physique: number; collectif: number }>,
  currentStats: {
    avgTechnique: string | null;
    avgPhysique: string | null;
    avgCollectif: string | null;
    totalRatingsReceived: number;
  }
): {
  avgTechnique: string;
  avgPhysique: string;
  avgCollectif: string;
  avgOverall: string;
  totalRatingsReceived: number;
} {
  // Parse current stats
  const oldAvgTechnique = parseDecimal(currentStats.avgTechnique);
  const oldAvgPhysique = parseDecimal(currentStats.avgPhysique);
  const oldAvgCollectif = parseDecimal(currentStats.avgCollectif);
  const oldCount = currentStats.totalRatingsReceived;

  // Calculate average of new ratings per axis
  const avgNewTechnique =
    ratings.reduce((sum, r) => sum + r.technique, 0) / ratings.length;
  const avgNewPhysique =
    ratings.reduce((sum, r) => sum + r.physique, 0) / ratings.length;
  const avgNewCollectif =
    ratings.reduce((sum, r) => sum + r.collectif, 0) / ratings.length;

  // Apply incremental formula: treat the batch as a single data point
  // ((old_avg * old_count) + avg_new * batch_size) / (old_count + batch_size)
  const newCount = oldCount + ratings.length;
  const newAvgTechnique =
    (oldAvgTechnique * oldCount + avgNewTechnique * ratings.length) / newCount;
  const newAvgPhysique =
    (oldAvgPhysique * oldCount + avgNewPhysique * ratings.length) / newCount;
  const newAvgCollectif =
    (oldAvgCollectif * oldCount + avgNewCollectif * ratings.length) / newCount;

  // Calculate weighted overall from new three-axis averages
  const newAvgOverall = calculateWeightedOverall(
    newAvgTechnique,
    newAvgPhysique,
    newAvgCollectif
  );

  // Format as strings with 2 decimal places
  return {
    avgTechnique: newAvgTechnique.toFixed(2),
    avgPhysique: newAvgPhysique.toFixed(2),
    avgCollectif: newAvgCollectif.toFixed(2),
    avgOverall: newAvgOverall.toFixed(2),
    totalRatingsReceived: newCount,
  };
}
