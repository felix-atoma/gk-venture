import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const NAVY = rgb(0x22 / 255, 0x28 / 255, 0x3a / 255);
const GOLD = rgb(0xb8 / 255, 0x92 / 255, 0x3a / 255);
const GREY = rgb(0x5b / 255, 0x5b / 255, 0x5b / 255);

/** Standard PDF fonts only cover WinAnsi; drop anything else so drawText never throws. */
const ansi = (s: string) => s.normalize('NFC').replace(/[^\x20-\x7E -ÿ]/g, '?');

export interface CertificateInfo {
  requestId: string;
  title: string;
  signerName: string;
  signerEmail: string;
  typedName: string;
  signedAt: Date;
  viewedAt: Date | null;
  createdAt: Date;
  ip: string;
  userAgent: string;
  originalSha256: string;
}

/** Throws if the buffer is not a loadable, unencrypted PDF. Returns the page count. */
export async function assertValidPdf(buffer: Buffer) {
  if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') throw new Error('Not a PDF file');
  const doc = await PDFDocument.load(buffer); // throws on encrypted/corrupt PDFs
  return doc.getPageCount();
}

/**
 * Produces the signed PDF: a footer stamp on every original page plus an appended
 * signature certificate page carrying the drawn signature and the audit details.
 */
export async function stampSignedPdf(original: Buffer, signaturePng: Buffer, info: CertificateInfo) {
  const doc = await PDFDocument.load(original);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const serif = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sig = await doc.embedPng(signaturePng);

  const stamp = ansi(
    `Electronically signed by ${info.signerName} on ${info.signedAt.toISOString()} - G|K Ventures ref ${info.requestId}`,
  );
  for (const page of doc.getPages()) {
    const { width } = page.getSize();
    const size = 7;
    const w = font.widthOfTextAtSize(stamp, size);
    page.drawText(stamp, { x: Math.max(10, (width - w) / 2), y: 10, size, font, color: GREY });
  }

  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: NAVY });
  page.drawText('G|K VENTURES', { x: margin, y: height - 50, size: 22, font: serif, color: rgb(1, 1, 1) });
  page.drawText('Certificate of Electronic Signature', {
    x: margin,
    y: height - 68,
    size: 10,
    font,
    color: GOLD,
  });

  let y = height - 120;
  const line = (label: string, value: string) => {
    page.drawText(ansi(label), { x: margin, y, size: 10, font: bold, color: NAVY });
    const text = ansi(value);
    // Wrap long values (hashes, user agents) at ~70 chars.
    const chunks = text.match(/.{1,70}/g) ?? [''];
    chunks.forEach((c, i) => page.drawText(c, { x: margin + 150, y: y - i * 13, size: 10, font, color: GREY }));
    y -= 13 * chunks.length + 9;
  };

  line('Document', info.title);
  line('Reference ID', info.requestId);
  line('Signer', `${info.signerName} <${info.signerEmail}>`);
  line('Typed name', info.typedName);
  line('Sent', info.createdAt.toISOString());
  line('First viewed', info.viewedAt?.toISOString() ?? '-');
  line('Signed (UTC)', info.signedAt.toISOString());
  line('IP address', info.ip);
  line('Browser', info.userAgent || '-');
  line('Original SHA-256', info.originalSha256);

  y -= 10;
  page.drawText('Signature', { x: margin, y, size: 10, font: bold, color: NAVY });
  const dims = sig.scaleToFit(260, 110);
  y -= dims.height + 30;
  page.drawRectangle({
    x: margin,
    y: y - 5,
    width: dims.width + 20,
    height: dims.height + 20,
    borderColor: GOLD,
    borderWidth: 1,
  });
  page.drawImage(sig, { x: margin + 10, y: y + 5, width: dims.width, height: dims.height });

  y -= 50;
  const statement = ansi(
    'The signer reviewed the document above, consented to sign electronically, and applied the signature shown. ' +
      'The Original SHA-256 identifies the exact document presented for signature; any later change to the document ' +
      'will not match this fingerprint. This certificate and the related audit trail are retained by G|K Ventures, ' +
      'P. O. Box AN 5765, Accra-North, Ghana.',
  );
  for (const row of wrap(statement, font, 9, width - margin * 2)) {
    page.drawText(row, { x: margin, y, size: 9, font, color: GREY });
    y -= 12;
  }

  return Buffer.from(await doc.save());
}

function wrap(text: string, font: { widthOfTextAtSize(t: string, s: number): number }, size: number, max: number) {
  const rows: string[] = [];
  let current = '';
  for (const word of text.split(' ')) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > max && current) {
      rows.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) rows.push(current);
  return rows;
}
