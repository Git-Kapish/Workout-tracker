// Single source for limits. Validation uses these; the DB CHECK constraints only
// enforce the lower bounds (sets > 0, reps > 0, weight >= 0).
export const MAX_SETS = 50;
export const MAX_REPS = 1000;
export const MAX_WEIGHT_KG = 1000;
export const MAX_WEIGHT_DECIMALS = 2;
export const MAX_NAME_LENGTH = 60;
export const WEEKS_SHOWN = 8;
/** The weight-over-time chart shows at most this many of the most recent sessions. */
export const MAX_CHART_POINTS = 30;
