/* Resolve a file in /public against the deployed base path (works on GitHub Pages sub-paths). */
export const asset = (p) => `${import.meta.env.BASE_URL}${p}`;
