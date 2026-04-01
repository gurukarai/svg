export interface PaperSize {
  id: string;
  label: string;
  shortMm: number;
  longMm: number;
}

export type Orientation = 'landscape' | 'portrait';

export const PAPER_SIZES: PaperSize[] = [
  { id: '13x19',   label: '13 × 19 in (Super B)',  shortMm: 330.2, longMm: 482.6 },
  { id: '12x18',   label: '12 × 18 in (Arch C)',   shortMm: 304.8, longMm: 457.2 },
  { id: 'tabloid', label: 'Tabloid / 11 × 17 in',  shortMm: 279.4, longMm: 431.8 },
  { id: 'a3',      label: 'A3 (297 × 420 mm)',      shortMm: 297.0, longMm: 420.0 },
  { id: 'a4',      label: 'A4 (210 × 297 mm)',      shortMm: 210.0, longMm: 297.0 },
  { id: 'letter',  label: 'Letter (8.5 × 11 in)',   shortMm: 215.9, longMm: 279.4 },
];

export const DEFAULT_PAPER_SIZE_ID = '13x19';
export const DEFAULT_ORIENTATION: Orientation = 'landscape';

export function getPaperSize(id: string): PaperSize {
  return PAPER_SIZES.find(p => p.id === id) ?? PAPER_SIZES[0];
}

export function getCanvasDimensions(size: PaperSize, orientation: Orientation): { widthMm: number; heightMm: number } {
  if (orientation === 'landscape') {
    return { widthMm: size.longMm, heightMm: size.shortMm };
  }
  return { widthMm: size.shortMm, heightMm: size.longMm };
}
