// Official List of Conventional / Non-Sharia IDX Stocks (.JK)
// Sources: Daftar Efek Syariah (DES) OJK & Indeks Saham Syariah Indonesia (ISSI) BEI

export const NON_SHARIA_SYMBOLS = new Set([
  "BBCA", "BBRI", "BMRI", "BBNI", "BBTN", "BDMN", "BNGA", "ARTO", "MEGA", "BNII",
  "PNBN", "PNIN", "PNLF", "NISP", "BJBR", "BJTM", "BBKP", "BGTG", "BABP", "NOBU",
  "BBYB", "AGRO", "AMAR", "BCIC", "BVIC", "SDRA", "BNLI", "BNBA", "MCOR", "BEKS",
  "ADMF", "BFIN", "CFIN", "WOMF", "TRIM", "PANS", "YULE", "AHAP", "ASDM", "LPGI",
  "HMSP", "GGRM", "WIIM", "ITIC", "MLBI", "DLTA", "WINE", "BEER"
]);

export function isShariaStock(symbol?: string | null): boolean {
  if (!symbol) return true;
  const cleanSym = symbol.replace(".JK", "").toUpperCase().trim();
  return !NON_SHARIA_SYMBOLS.has(cleanSym);
}
