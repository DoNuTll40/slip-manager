export const PROFILES = ["plain", "contrast", "threshold"];
// Each profile returns a canvas: resized (max ~1800px wide) + grayscale, then optional contrast/threshold.
export async function renderProfile(blob, profile) {
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(2, 1800 / bmp.width);
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, w, h); bmp.close();
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) { const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; d[i] = d[i + 1] = d[i + 2] = g; sum += g; }
  const mean = sum / (d.length / 4);
  for (let i = 0; i < d.length; i += 4) {
    let g = d[i];
    if (profile === "contrast") g = Math.max(0, Math.min(255, (g - mean) * 1.6 + mean));
    if (profile === "threshold") g = g > mean * 0.92 ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = g;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
