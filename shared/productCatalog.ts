export type ProductModule = "ART" | "BASE" | "SECOND_PIECE" | "FRAME";

export type ProductPreset = {
  id: string;
  label: string;
  family: "keychain" | "frame" | "miniature" | "figure";
  description: string;
  sizeLabel: string;
  suggestedGrid: string;
  modules: ProductModule[];
  assemblySteps: string[];
};

export const PRODUCT_PRESETS: ProductPreset[] = [
  { id: "keychain-single", label: "Chaveiro · 1 peça", family: "keychain", description: "Uma arte compacta com furo e margem para montagem do chaveiro.", sizeLabel: "Compacto", suggestedGrid: "até 32 × 32 beads", modules: ["ART"], assemblySteps: ["Monte a arte na matriz", "Instale a argola ou corrente no ponto indicado"] },
  { id: "keychain-pair", label: "Chaveiro · 2 peças", family: "keychain", description: "Duas artes coordenadas, tratadas como módulos separados no mesmo projeto.", sizeLabel: "Duas peças compactas", suggestedGrid: "duas grades até 24 × 24 beads", modules: ["ART", "SECOND_PIECE"], assemblySteps: ["Monte a peça principal", "Monte a segunda peça", "Una as peças com argola ou corrente"] },
  { id: "frame-small", label: "Quadro pequeno", family: "frame", description: "Composição decorativa compacta para moldura pequena.", sizeLabel: "Pequeno", suggestedGrid: "até 48 × 48 beads", modules: ["ART", "FRAME"], assemblySteps: ["Monte a arte", "Faça o acabamento da borda", "Fixe ou acomode na moldura"] },
  { id: "frame-a4", label: "Quadro A4", family: "frame", description: "Composição dimensionada para uma moldura ou placa no formato A4.", sizeLabel: "A4", suggestedGrid: "aprox. 80 × 112 beads", modules: ["ART", "FRAME"], assemblySteps: ["Monte a arte por seções", "Una as seções pelo verso", "Fixe na moldura A4"] },
  { id: "frame-a3", label: "Quadro A3", family: "frame", description: "Composição maior, com orientação para montagem por seções.", sizeLabel: "A3", suggestedGrid: "aprox. 112 × 160 beads", modules: ["ART", "FRAME"], assemblySteps: ["Monte a arte por módulos", "Una e reforce as seções", "Fixe na moldura A3"] },
  { id: "miniature-small", label: "Miniatura pequena", family: "miniature", description: "Personagem pequeno com base integrada para encaixe.", sizeLabel: "Pequena", suggestedGrid: "até 32 × 48 beads", modules: ["BASE", "ART"], assemblySteps: ["Monte a base", "Monte o personagem", "Una o personagem à base pelo encaixe indicado"] },
  { id: "miniature-medium", label: "Miniatura média", family: "miniature", description: "Personagem de escala média com base integrada na especificação.", sizeLabel: "Média", suggestedGrid: "até 48 × 64 beads", modules: ["BASE", "ART"], assemblySteps: ["Monte a base", "Monte o personagem por partes", "Encaixe o personagem na base"] },
  { id: "miniature-large", label: "Miniatura grande", family: "miniature", description: "Peça maior com base e arte planejadas para montagem modular.", sizeLabel: "Grande", suggestedGrid: "até 64 × 96 beads", modules: ["BASE", "ART"], assemblySteps: ["Monte a base estrutural", "Monte os módulos do personagem", "Una os módulos e encaixe na base"] },
  { id: "figure-medium", label: "Boneco médio", family: "figure", description: "Boneco de porte médio com base obrigatória para estabilidade.", sizeLabel: "Médio", suggestedGrid: "até 64 × 96 beads", modules: ["BASE", "ART"], assemblySteps: ["Monte a base", "Monte corpo e detalhes", "Fixe o boneco na base"] },
  { id: "figure-large", label: "Boneco grande", family: "figure", description: "Boneco de porte grande, dividido em módulos e base reforçada.", sizeLabel: "Grande", suggestedGrid: "até 96 × 144 beads", modules: ["BASE", "ART"], assemblySteps: ["Monte e reforce a base", "Monte os módulos do boneco", "Una os módulos", "Fixe o boneco na base"] },
];

export const DEFAULT_PRODUCT_PRESET_ID = "keychain-single";

export function composeProductMatrix(matrix: string[][], presetId?: string | null, baseColor = "#E6D2B5") {
  const preset = getProductPreset(presetId);
  if (!preset.modules.includes("BASE") || !matrix.length) return matrix;
  const width = Math.max(...matrix.map(row => row.length));
  const normalized = matrix.map(row => row.length === width ? [...row] : [...row, ...Array(width - row.length).fill(baseColor)]);
  const baseHeight = Math.max(4, Math.round(width * 0.12));
  const baseWidth = Math.max(6, Math.round(width * 0.62));
  const left = Math.floor((width - baseWidth) / 2);
  const baseRows = Array.from({ length: baseHeight }, (_, rowIndex) => Array.from({ length: width }, (_, columnIndex) => {
    const inset = Math.min(2, Math.floor(rowIndex / 2));
    return columnIndex >= left - inset && columnIndex < left + baseWidth + inset ? baseColor : "#F2F2F2";
  }));
  return [...normalized, ...baseRows];
}

export const getProductPreset = (id?: string | null) => PRODUCT_PRESETS.find(preset => preset.id === id) || PRODUCT_PRESETS.find(preset => preset.id === DEFAULT_PRODUCT_PRESET_ID)!;
