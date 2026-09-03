import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

// A4 at 96 DPI: 210mm = 794px, 297mm = 1123px
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const RENDER_SCALE = 2;

const MM_PER_PX = 210 / A4_WIDTH_PX;

async function waitForAssets(element: HTMLElement): Promise<void> {
  const fonts = document.fonts;
  if (fonts) await fonts.ready;

  await Promise.all(
    Array.from(element.querySelectorAll('img')).map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
      });
    })
  );
}

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
  clone.removeAttribute('id');
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
  clone.style.overflow = 'visible';
  clone.style.transform = 'none';
  clone.style.transformOrigin = 'top left';
  document.body.appendChild(clone);

  try {
    await waitForAssets(clone);
    const canvas = await html2canvas(clone, {
      scale: RENDER_SCALE,
      useCORS: true,
      // Uma imagem remota sem CORS não pode tornar o canvas "tainted", caso
      // contrário toDataURL falha e o PDF fica corrompido/não é gerado.
      allowTaint: false,
      backgroundColor: '#ffffff',
      windowWidth: A4_WIDTH_PX,
      logging: false,
    });

    const canvasWidth = canvas.width; // A4_WIDTH_PX * scale
    const canvasHeight = canvas.height;
    const pageSlicePx = A4_HEIGHT_PX * RENDER_SCALE; // altura de uma página A4 no canvas

    const naturalPageCount = Math.max(1, Math.ceil(canvasHeight / pageSlicePx));

    // Se a fatura exceder LIGEIRAMENTE uma página (até ~35% extra), em vez de
    // cortar numa "segunda folha" com poucas linhas, encolhe-se o documento
    // para caber inteiro numa só folha A4.
    const fitOnePage = naturalPageCount === 2 && canvasHeight < pageSlicePx * 1.35;
    const pageCount = fitOnePage ? 1 : naturalPageCount;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    for (let i = 0; i < pageCount; i++) {
      if (i > 0) doc.addPage();

      if (!fitOnePage) {
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
      } else {
        // Documento completo numa só folha, centrado e com escala proporcional.
        const imageHeightMm = (canvasHeight / RENDER_SCALE) * MM_PER_PX;
        const fitScale = A4_HEIGHT_PX * MM_PER_PX / imageHeightMm;
        const drawW = A4_WIDTH_PX * MM_PER_PX * fitScale;
        const drawH = imageHeightMm * fitScale;
        const xMm = Math.max(0, (A4_WIDTH_PX * MM_PER_PX - drawW) / 2);
        doc.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          xMm,
          0,
          drawW,
          drawH,
          undefined,
          'FAST'
        );
      }
    }

    doc.save(filename);
  } finally {
    clone.remove();
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
