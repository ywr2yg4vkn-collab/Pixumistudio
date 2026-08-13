export type BeadPaletteBox = {
  id: string;
  name: string;
  beadCountLabel: string;
  description: string;
  colors: string[];
  note: string;
};

/** Paleta Pixumi fixa: cores organizadas ao redor do círculo cromático. */
export const CHROMATIC_48_COLORS = [
  // Vermelho → laranja → amarelo → verde
  "#7A0019", "#E31B3B", "#FF9EAB",
  "#8C1D00", "#F04B23", "#FFB38A",
  "#9A4D00", "#F28C18", "#FFD18A",
  "#8A7100", "#F2C500", "#FFF0A3",
  "#587A00", "#A8D500", "#DDF28A",
  "#006B3C", "#00A86B", "#8BE0B7",
  // Ciano → azul → violeta → magenta
  "#006B70", "#00A9A5", "#8BE5DF",
  "#004C8C", "#0077CC", "#8FCBFF",
  "#001F6B", "#2454C6", "#9AAFFF",
  "#3D167A", "#7138B8", "#C9A6F2",
  "#71005E", "#B21B91", "#F09BDE",
  "#8A0038", "#D62F73", "#F5A6C7",
  // Neutros e tons de base
  "#000000", "#242424", "#555555", "#888888", "#BDBDBD", "#F2F2F2",
  "#FFFFFF", "#FFF8E7", "#E6D2B5", "#8B5A2B", "#4A2A18", "#17233D",
] as const;

export const CHROMATIC_48_PALETTE: BeadPaletteBox = {
  id: "chromatic-48",
  name: "Círculo cromático Pixumi",
  beadCountLabel: "48 cores fixas",
  description: "Paleta única com matizes cromáticos, três intensidades por família e neutros de suporte.",
  colors: [...CHROMATIC_48_COLORS],
  note: "As cores são referências visuais para planejamento; confirme os códigos comerciais do fabricante antes da compra.",
};

/** Compatibilidade de leitura para projetos antigos: agora sempre retorna a paleta fixa. */
export const BEAD_PALETTE_BOXES: BeadPaletteBox[] = [CHROMATIC_48_PALETTE];
export const DEFAULT_BEAD_PALETTE_ID = CHROMATIC_48_PALETTE.id;
export function getBeadPalette(_id?: string | null) { return CHROMATIC_48_PALETTE; }
