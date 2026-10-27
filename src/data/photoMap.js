/**
 * HAND-Philippines — photo resolution (ported from the approved Wix model1
 * build, images.js).
 *
 * Every id below is a file ALREADY hosted in the client's Wix Media Manager.
 * Each mapping was chosen by CONTENT, verified against the live site with two
 * independent perceptual fingerprints (16x16 and 32x32 dHash plus average-hash
 * agreement). The approved source file is named in each comment.
 *
 * photo(key, width) returns Wix's resize URL (/v1/fit/), so a phone never
 * downloads the multi-megabyte original and the aspect ratio is preserved.
 * No enc_auto: it would keep a PNG source a PNG; a .jpg name makes Wix
 * re-encode to JPEG.
 *
 * resolveSrc() keeps the legacy contract too: absolute URLs pass through and
 * 'img/...' references fall back to the bundled /img copy, so nothing that
 * predates the port ever breaks.
 */

const MEDIA = 'https://static.wixstatic.com/media';

/** Default CDN box (px). Wix's /v1/fit/ scales within it, preserving ratio. */
const DEFAULT_BOX = 1600;

/** model1 photo key -> Wix Media file id. */
export const PHOTOS = {
  /* home hero: physician treating a child   <- pedds consult (1).JPG */
  'clinic-child': 'f3ccce_9cd8cade5d2c46e89beead97e8cf9033~mv2.jpg',
  /* rural healthcare crisis                 <- Children of Barrio Tungod displaying their gratitude_.jpg */
  'barrio-children': 'f3ccce_c2e43b708c6e419f91dfe31ab96fa2d7~mv2.jpg',
  /* disaster response (best-effort)         <- A family in a makeshift shelter after Super Typhoon Rai_.jpg has no live URL */
  'community-kids': 'f3ccce_b44bf9f67fbe49db88d444a7d1273d94~mv2.jpg',
  /* program tile: Medicine                  <- med mission nurse2.jpeg */
  'medication-table': 'f3ccce_d773552f5e274d3da42bcc0a2b8c7d6d~mv2.jpeg',
  /* program tile: Supplies                  <- image19.jpeg */
  'boat-equipment': '2f2616_8454bb8d1429436980189adbaa477ca2~mv2.jpeg',
  /* program tile: Diagnostics               <- image15.jpeg */
  'tent-exam': '2f2616_72937954a78949729c13b6f849de1725~mv2.jpeg',
  /* program tile: Surgery                   <- image20.jpeg */
  'surgical-team': '2f2616_3d51fabbae6f4f85b22396cb61635012~mv2.jpeg',
  /* program card: Medical Missions          <- volunteersin2018.jpg */
  'surgical-mission-group': 'f3ccce_dbf113eca02949e39424071c342cecc4~mv2.jpg',
  /* program card: Student Rotation          <- Co-founder, Dr.jpg */
  'student-volunteers': 'f3ccce_d6fadb9d37ae428890a5df642c898708~mv2.jpg',
  /* program card: Bayanihan Mission         <- Bayanihan Photo.png */
  'mission-banner': 'f3ccce_e540cfe7fa674dd9baf02d21a6499104~mv2.png',
  /* program card: Community Health          <- Co-founder, Sarah Jordaan RN, with preschoolers of Tungod Daycare */
  'dental-check': '3feb7a_2190f8c3e72940dd9027c448c1932206~mv2.jpg',
  /* program card: Volunteer Program         <- image2 (5).jpeg */
  'volunteers-kids': '2f2616_bb96e44016894cb9bea042a78eee7a2f~mv2.jpeg',
  /* mission gallery                         <- Medical mission volunteer nurse Ms.jpeg */
  'field-clinic': 'f3ccce_3d1d30fb9644448fb792c37e159f0509~mv2.jpeg',
  /* surgical team gallery                   <- Copy of Ashley point.JPG */
  'patient-care': 'e9ba0e_51ec3a78287f448e9467bae09683226a~mv2.jpg',
  /* Mission Bohol gallery                   <- Board Chairperson, Ms.jpg */
  'harbor-group': 'f3ccce_f9006f6a1860476b829896b496344760~mv2.jpg',
  /* Annual Gala                             <- GALA_GALS.jpg */
  'gala-dance': 'f3ccce_08e166d8260d4fd9bc696a4e1d622c25~mv2.jpg',
  /* Charity Concert                         <- SING.jpg */
  'hall-crowd': 'f3ccce_9e13e6ba79df4009bd0b643ab1ca251d~mv2.jpg',
  /* Bayanihan Drive (best-effort)           <- no live URL found for the drive set */
  'thank-you-truck': '2f2616_cd052c4b5818442486acf68d29c9f011~mv2.jpg',
  /* medical triage (best-effort)            <- local male doc pedia / US volunteers sets unused on pages */
  'pedia-desk': 'e9ba0e_6f8196ef60ef4790bdd9b8da94760731~mv2.jpg',
  /* community education (best-effort)       <- no live URL found for the seminar set */
  'health-seminar': '2f2616_fdc8fe047c314a9e8f459a45970b8e57~mv2.jpeg',
  /* donate hero: kids of Barrio Tungod      <- Young girl from Barrio Tungod Community Daycare Center_.jpg */
  'donate-hero-kids': 'f3ccce_bb82f3d2b6c2408f9dadca528a4723f6~mv2.jpg'
};

/** Build a Wix CDN URL for a photo key at the requested box width. */
function photoInner(name, width = 1600) {
  const id = PHOTOS[name];
  if (!id) throw new Error(`Unknown photo "${name}". Add it to PHOTOS in images.js.`);
  const box = Math.max(200, Math.round(width));
  return `${MEDIA}/${id}/v1/fit/w_${box},h_${box},q_75/${name}.jpg`;
}

/**
 * Resolve any image reference used in the app to a usable URL.
 *
 *   'barrio-children' (photo key)   -> Wix CDN URL from PHOTOS
 *   'img/foo.jpg' / '/img/foo.jpg'  -> '/img/foo.jpg' (bundled copy)
 *   'https://…' / 'data:…'          -> returned unchanged
 *   '' / null / undefined           -> returned unchanged (SmartImage placeholder)
 *
 * @param {string} src   Reference as written in the data/content layer.
 * @param {number} width Requested CDN box in px (default 1600).
 */
export function resolveSrc(src, width = DEFAULT_BOX) {
  if (!src || typeof src !== 'string') return src;
  if (/^(https?:|data:|blob:)/i.test(src)) return src;

  // model1 photo KEY (no extension, no slash): resolve through PHOTOS.
  if (/^[a-z0-9-]+$/i.test(src)) {
    try {
      return photoInner(src, width);
    } catch {
      return '';
    }
  }

  const file = src.replace(/^\/?img\//, '');
  // Unknown or not-yet-confirmed: serve the bundled copy, from an absolute
  // path so nested routes (e.g. /donate/daf) still resolve it correctly.
  return `/img/${file}`;
}
