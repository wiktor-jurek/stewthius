import { UMAP } from "umap-js";

export function parseVector(str: string): number[] {
  return str
    .replace(/[\[\]]/g, "")
    .split(",")
    .map(Number);
}

function cosineDistance(a: number[], b: number[]): number {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 1;
  return 1 - dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Projects high-dimensional embeddings to 2D using UMAP with cosine distance.
 * Returns normalized [0,1] coordinates for each input vector.
 */
export function projectToUMAP(embeddings: number[][]): [number, number][] {
  const n = embeddings.length;
  if (n === 0) return [];
  if (n === 1) return [[0.5, 0.5]];

  const nNeighbors = Math.min(15, n - 1);

  const umap = new UMAP({
    nComponents: 2,
    nNeighbors,
    minDist: 0.5,
    spread: 2.5,
    nEpochs: 400,
    distanceFn: cosineDistance,
  });

  const projected = umap.fit(embeddings);

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const [x, y] of projected) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return projected.map(([x, y]) => [(x - minX) / rangeX, (y - minY) / rangeY]);
}
