// Caméra et lecture des QR codes.
// Lecteur : BarcodeDetector natif s'il lit les QR codes (Android, macOS…), sinon la bibliothèque
// barcode-detector (zxing-wasm), chargée seulement à ce moment ; son fichier .wasm est servi en local.

let lecteur = null; // promesse du lecteur, créée une seule fois

/** Lecteur de QR codes : objet avec detect(source) → [{ rawValue }]. */
export function lecteurQr() {
  lecteur ??= creerLecteur();
  return lecteur;
}

async function creerLecteur() {
  if ('BarcodeDetector' in window) {
    const formats = await window.BarcodeDetector.getSupportedFormats().catch(() => []);
    if (formats.includes('qr_code')) return new window.BarcodeDetector({ formats: ['qr_code'] });
  }
  const [{ BarcodeDetector, prepareZXingModule }, { default: urlWasm }] = await Promise.all([
    import('barcode-detector/ponyfill'),
    import('zxing-wasm/reader/zxing_reader.wasm?url'),
  ]);
  // Le .wasm vient de notre serveur (par défaut, la bibliothèque le chercherait sur un CDN)
  prepareZXingModule({
    overrides: { locateFile: (chemin, prefixe) => (chemin.endsWith('.wasm') ? urlWasm : prefixe + chemin) },
  });
  return new BarcodeDetector({ formats: ['qr_code'] });
}

/**
 * Ouvre la caméra (arrière sur téléphone, webcam sur PC) dans l'élément vidéo.
 * Renvoie { ok: true, arreter() } ou { ok: false } si la caméra est refusée ou absente.
 */
export async function ouvrirCamera(video) {
  if (!navigator.mediaDevices?.getUserMedia) return { ok: false };
  try {
    const flux = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
    video.srcObject = flux;
    await video.play().catch(() => {});
    return {
      ok: true,
      arreter() {
        for (const piste of flux.getTracks()) piste.stop();
        video.srcObject = null;
      },
    };
  } catch {
    return { ok: false };
  }
}
