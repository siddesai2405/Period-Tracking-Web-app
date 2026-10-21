/**
 * Gaussian Process Regression — multi-dimensional RBF (squared-exponential) kernel
 *
 * Algorithm: Cholesky-based GP inference (Algorithm 2.1, Rasmussen & Williams 2006)
 * Kernel:    k(x, x') = σ²_f · exp(−‖x−x'‖² / 2ℓ²) + σ²_n δ(x,x')
 *
 * Fixed hyperparameters are appropriate for sparse cycle data (n < 20).
 * All operations are pure / side-effect free and run entirely client-side.
 */

export interface GPResult {
  mean: number;      // posterior mean prediction (days)
  std: number;       // posterior predictive std (days)
  lower95: number;   // 95% credible interval lower bound
  upper95: number;   // 95% credible interval upper bound
}

// ─── Linear algebra ──────────────────────────────────────────────────────────

/** Lower-triangular Cholesky factor L such that A ≈ L Lᵀ */
function choleskyL(A: number[][]): number[][] {
  const n = A.length;
  const L = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = 0;
      for (let k = 0; k < j; k++) s += L[i][k] * L[j][k];
      L[i][j] =
        i === j
          ? Math.sqrt(Math.max(1e-12, A[i][i] - s))
          : (A[i][j] - s) / (L[j][j] + 1e-12);
    }
  }
  return L;
}

/** Forward substitution: solve L x = b */
function fwdSub(L: number[][], b: number[]): number[] {
  const n = L.length;
  const x = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < i; j++) s += L[i][j] * x[j];
    x[i] = (b[i] - s) / (L[i][i] + 1e-12);
  }
  return x;
}

/** Backward substitution: solve Lᵀ x = b */
function bkwSub(L: number[][], b: number[]): number[] {
  const n = L.length;
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = 0;
    for (let j = i + 1; j < n; j++) s += L[j][i] * x[j];
    x[i] = (b[i] - s) / (L[i][i] + 1e-12);
  }
  return x;
}

// ─── Kernel ───────────────────────────────────────────────────────────────────

/** Squared-exponential (RBF) kernel between feature vectors a and b */
function rbfKernel(a: number[], b: number[], sigmaF: number, ell: number): number {
  const d2 = a.reduce((s, ai, i) => s + (ai - b[i]) ** 2, 0);
  return sigmaF * sigmaF * Math.exp(-d2 / (2 * ell * ell));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fit a GP on (X_train, y_train) and compute posterior predictive at x_star.
 *
 * X_train  rows: [normalized_time, sleep_z, water_z, stress_z, symptom_z]
 * y_train  targets: historical cycle lengths (days)
 * x_star   query feature vector
 *
 * Default hyperparameters are tuned for menstrual cycle data:
 *   sigmaF = 3.5 days   (typical inter-cycle amplitude)
 *   ell    = 0.55        (length scale in normalized feature space)
 *   sigmaN = 2.0 days   (observation / reporting noise)
 */
export function gpPredict(
  X_train: number[][],
  y_train: number[],
  x_star: number[],
  sigmaF = 3.5,
  ell = 0.55,
  sigmaN = 2.0,
): GPResult {
  const n = X_train.length;
  if (n === 0) throw new Error("gpPredict: no training data");

  // ── Build K(X,X) + σ²_n I ──────────────────────────────────────────────────
  const K: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      const k = rbfKernel(X_train[i], X_train[j], sigmaF, ell);
      return i === j ? k + sigmaN * sigmaN : k;
    }),
  );

  // ── k* = K(x*, X) ──────────────────────────────────────────────────────────
  const kStar = X_train.map((x) => rbfKernel(x_star, x, sigmaF, ell));

  // ── k** = k(x*, x*) ────────────────────────────────────────────────────────
  const kSS = rbfKernel(x_star, x_star, sigmaF, ell);

  // ── Cholesky: K = L Lᵀ ─────────────────────────────────────────────────────
  const L = choleskyL(K);

  // ── α = (K + σ²_n I)^{-1} y = L^{-ᵀ} (L^{-1} y) ─────────────────────────
  const alpha = bkwSub(L, fwdSub(L, y_train));

  // ── Posterior mean: μ* = k*ᵀ α ─────────────────────────────────────────────
  const mean = kStar.reduce((s, k, i) => s + k * alpha[i], 0);

  // ── Posterior variance: σ²* = k** − vᵀv,  v = L^{-1} k* ───────────────────
  const v = fwdSub(L, kStar);
  const variance = Math.max(0, kSS - v.reduce((s, vi) => s + vi * vi, 0));
  const std = Math.sqrt(variance);

  return {
    mean,
    std,
    lower95: mean - 1.96 * std,
    upper95: mean + 1.96 * std,
  };
}

// ─── Feature helpers ─────────────────────────────────────────────────────────

/** Z-score normalise a vector in-place using provided mean and std */
export function zNorm(values: number[], mu: number, sigma: number): number[] {
  return sigma > 0 ? values.map((v) => (v - mu) / sigma) : values.map(() => 0);
}

/** Compute mean and std of an array */
export function meanStd(values: number[]): { mu: number; sigma: number } {
  if (values.length === 0) return { mu: 0, sigma: 1 };
  const mu = values.reduce((a, b) => a + b, 0) / values.length;
  const sigma = Math.sqrt(
    values.reduce((s, v) => s + (v - mu) ** 2, 0) / values.length,
  );
  return { mu, sigma: sigma || 1 };
}
