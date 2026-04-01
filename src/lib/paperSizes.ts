export interface PaperSize {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
}

export const PAPER_SIZES: PaperSize[] = [
  { id: '13x19',   label: '13 × 19 in (Super B)',     widthMm: 330.2, heightMm: 482.6 },
  { id: '12x18',   label: '12 × 18 in (Arch C)',      widthMm: 304.8, heightMm: 457.2 },
  { id: 'tabloid', label: 'Tabloid / 11 × 17 in',     widthMm: 279.4, heightMm: 431.8 },
  { id: 'a3',      label: 'A3 (297 × 420 mm)',         widthMm: 297.0, heightMm: 420.0 },
  { id: 'a4',      label: 'A4 (210 × 297 mm)',         widthMm: 210.0, heightMm: 297.0 },
  { id: 'letter',  label: 'Letter (8.5 × 11 in)',      widthMm: 215.9, heightMm: 279.4 },
];

export const DEFAULT_PAPER_SIZE_ID = '13x19';

export function getPaperSize(id: string): PaperSize {
  return PAPER_SIZES.find(p => p.id === id) ?? PAPER_SIZES[0];
}
