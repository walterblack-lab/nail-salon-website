/**
 * Renders the hand SVG to a PNG: the live drawing is cloned, the interface
 * parts (selection rings, tap areas) are removed, and the result is painted
 * onto a canvas with a quiet plum ground and the studio's name.
 */
const OUT_W = 1600;
const OUT_H = 2000;

export async function exportHandPng(svg: SVGSVGElement, fileName: string, signature: string, contact: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.querySelectorAll('[data-export="hide"]').forEach((el) => el.remove());
  // Inline styles carry the CSS `d` used for shape morphing; the attribute already holds the final value.
  clone.querySelectorAll<SVGElement>('[style]').forEach((el) => el.removeAttribute('style'));
  clone.removeAttribute('class');
  const vb = svg.viewBox.baseVal;
  const drawH = OUT_H * 0.84;
  const drawW = (drawH * vb.width) / vb.height;
  clone.setAttribute('width', String(drawW));
  clone.setAttribute('height', String(drawH));

  const markup = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));

  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');

    // Ground: plum with a soft pool of light where the hand sits.
    ctx.fillStyle = '#493447';
    ctx.fillRect(0, 0, OUT_W, OUT_H);
    const pool = ctx.createRadialGradient(OUT_W / 2, OUT_H * 0.42, 40, OUT_W / 2, OUT_H * 0.46, OUT_W * 0.75);
    pool.addColorStop(0, 'rgba(255, 236, 228, 0.16)');
    pool.addColorStop(1, 'rgba(255, 236, 228, 0)');
    ctx.fillStyle = pool;
    ctx.fillRect(0, 0, OUT_W, OUT_H);

    ctx.drawImage(img, (OUT_W - drawW) / 2, OUT_H - drawH, drawW, drawH);

    await document.fonts?.ready;
    ctx.fillStyle = '#fff9f3';
    ctx.font = `700 64px 'Bricolage Grotesque', 'Arial Narrow', sans-serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('mira', 96, 150);
    ctx.font = `600 30px Manrope, system-ui, sans-serif`;
    ctx.globalAlpha = 0.75;
    ctx.fillText(signature, 96, 200);
    ctx.fillText(contact, 96, 244);
    ctx.globalAlpha = 1;

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Could not create the image');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  } finally {
    URL.revokeObjectURL(url);
  }
}
