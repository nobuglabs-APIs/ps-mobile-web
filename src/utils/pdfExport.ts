import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

// A4 at 96 DPI: 210mm = 794px, 297mm = 1123px
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const RENDER_SCALE = 2;

const MM_PER_PX = 210 / A4_WIDTH_PX;

/**
 * Renderiza o documento A4 num canvas (com html2canvas-pro, que suporta as
 * cores oklch/oklab do Tailwind v4) e descarrega um PDF A4 paginado
 * diretamente, sem abrir a janela de impressão do navegador.
 */
export async function downloadInvoicePdf(
  source: HTMLElement,
  filename: string
): Promise<void> {
  const clone = source.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.left = '-99999px';
  clone.style.top = '0';
  clone.style.width = `${A4_WIDTH_PX}px`;
  clone.style.maxWidth = `${A4_WIDTH_PX}px`;
  clone.style.margin = '0';
  clone.style.borderRadius = '0';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.zIndex = '-1';
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: RENDER_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      windowWidth: A4_WIDTH_PX,
      logging: false,
    });

    const canvasWidth = canvas.width; // A4_WIDTH_PX * scale
    const canvasHeight = canvas.height;
    const pageSlicePx = A4_HEIGHT_PX * RENDER_SCALE; // altura de uma página A4 no canvas

    const pageCount = Math.max(1, Math.ceil(canvasHeight / pageSlicePx));

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    for (let i = 0; i < pageCount; i++) {
      if (i > 0) doc.addPage();

      const sliceY = i * pageSlicePx;
      const remaining = Math.min(pageSlicePx, canvasHeight - sliceY);
      if (remaining <= 0) break;

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = remaining;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, remaining);
        ctx.drawImage(canvas, 0, sliceY, canvasWidth, remaining, 0, 0, canvasWidth, remaining);
      }

      const imageHeightMm = (remaining / RENDER_SCALE) * MM_PER_PX;
      doc.addImage(
        pageCanvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        A4_WIDTH_PX * MM_PER_PX,
        imageHeightMm,
        undefined,
        'FAST'
      );
    }

    doc.save(filename);
  } finally {
    document.body.removeChild(clone);
  }
}

/** Nome de ficheiro seguro para o PDF do documento. */
export function invoiceFileName(docTypeLabel: string, number: string): string {
  const slug = `${docTypeLabel} ${number}`
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .toUpperCase();
  return `${slug}.pdf`;
}
