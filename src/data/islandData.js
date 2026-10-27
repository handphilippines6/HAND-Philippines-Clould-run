// Island + town coordinates for the Adopt an Island board (Vela Neonatal
// Resuscitation Project). Ported from model1's neonatal/islands.js — the same
// 20 islands and 5 towns, in the same 1400-wide map coordinate space.
export const ISLANDS = [
  { no: 1, x: 883, y: 208, side: 'l', name: 'Nocnocan', muni: 'Talibon' },
  { no: 2, x: 671, y: 212, side: 'r', name: 'Calituban', muni: 'Talibon' },
  { no: 3, x: 845, y: 244, side: 'r', name: 'Cataban', muni: 'Talibon' },
  { no: 4, x: 644, y: 249, side: 'l', name: 'Guindacpan', muni: 'Talibon' },
  { no: 5, x: 783, y: 280, side: 'l', name: 'Sag', muni: 'Talibon' },
  { no: 6, x: 770, y: 360, side: 'l', name: 'Busalian', muni: 'Talibon' },
  { no: 7, x: 533, y: 318, side: 'r', name: 'Mahanay', muni: 'Talibon' },
  { no: 8, x: 817, y: 363, side: 'b', name: 'Suba', muni: 'Talibon' },
  { no: 9, x: 173, y: 384, side: 'r', name: 'Cabulan', muni: 'Buenavista' },
  { no: 10, x: 1048, y: 218, side: 'r', name: 'Hingotanan East / West', muni: 'Bien Unido' },
  { no: 11, x: 999, y: 211, side: 't', name: 'Bilangbilangan East / Daku', muni: 'Bien Unido' },
  { no: 12, x: 997, y: 346, side: 'r', name: 'Maomawan', muni: 'Bien Unido' },
  { no: 13, x: 961, y: 382, side: 'r', name: 'Malingin', muni: 'Bien Unido' },
  { no: 14, x: 908, y: 295, side: 'r', name: 'Sagasa', muni: 'Bien Unido' },
  { no: 15, x: 842, y: 352, side: 'r', name: 'Pinamgo', muni: 'Bien Unido' },
  { no: 16, x: 1179, y: 459, side: 'r', name: 'Carlos P. Garcia', muni: 'Pres. Carlos P. Garcia' },
  { no: 17, x: 1214, y: 779, side: 'r', name: 'Tintinan', muni: 'Ubay' },
  { no: 18, x: 66, y: 474, side: 'r', name: 'Cuaming', muni: 'Inabanga' },
  { no: 19, x: 135, y: 561, side: 'r', name: 'Hambongan', muni: 'Inabanga' },
  { no: 20, x: 336, y: 625, side: 'r', name: 'Lapacan Norte / Sur', muni: 'Inabanga' },
];

export const TOWNS = [
  { n: 'Talibon', x: 733, y: 399 },
  { n: 'Bien Unido', x: 837, y: 429 },
  { n: 'Ubay', x: 1024, y: 593 },
  { n: 'Buenavista', x: 309, y: 539 },
  { n: 'Getafe', x: 391, y: 401 },
];

export const KIT_PRICE = 250;
export const KIT_LABELS = { 1: 'Emergency kit', 2: 'Training kit' };
