import { jsPDF } from 'jspdf';

const A4_WIDTH_MM = 210;
const MARGIN_MM = 10;

/**
 * Gera um PDF A4 fiel ao documento e descarrega-o diretamente,
 * sem abrir a caixa de pré-visualização de impressão do navegador.
 */
export async function downloadInvoicePdf(
  source: HTMLElement,
  filename: string
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const contentWidth = A4_WIDTH_MM - MARGIN_MM * 2; // 190mm

  const clone = source.cloneNode(true) as HTMLElement;
  clone.style.position = 'fixed';
  clone.style.left = '-100000px';
  clone.style.top = '0';
  clone.style.width = '794px';
  clone.style.maxWidth = '794px';
  clone.style.margin = '0';
  clone.style.borderRadius = '0';
  clone.style.boxShadow = 'none';
  clone.style.zIndex = '-1';
  document.body.appendChild(clone);

  try {
    await doc.html(clone, {
      x: MARGIN_MM,
      y: MARGIN_MM,
      width: contentWidth,
      margin: [MARGIN_MM, MARGIN_MM, MARGIN_MM, MARGIN_MM],
      autoPaging: 'text',
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        logging: false,
      },
    });

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
