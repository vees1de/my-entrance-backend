import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { QrLayout, QrOptionsDto } from './dto/generate-qr.dto';

export interface QrItem {
  qrPng: Buffer;
  title: string;
  subtitle: string;
  footer?: string;
}

@Injectable()
export class PdfService {
  async render(items: QrItem[], options: QrOptionsDto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 36 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const layout = options.layout ?? QrLayout.ONE_PER_PAGE;
      if (layout === QrLayout.ONE_PER_PAGE) this.renderOnePerPage(doc, items);
      else this.renderGrid(doc, items);

      doc.end();
    });
  }

  private renderOnePerPage(doc: PDFKit.PDFDocument, items: QrItem[]) {
    items.forEach((item, idx) => {
      if (idx > 0) doc.addPage();
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const qrSize = 360;
      const x = doc.page.margins.left + (pageWidth - qrSize) / 2;
      let y = 120;

      if (item.title) {
        doc.fontSize(28).text(item.title, doc.page.margins.left, 60, {
          width: pageWidth,
          align: 'center',
        });
      }

      doc.image(item.qrPng, x, y, { width: qrSize, height: qrSize });
      y += qrSize + 24;

      doc.fontSize(18).text(item.subtitle, doc.page.margins.left, y, {
        width: pageWidth,
        align: 'center',
      });

      if (item.footer) {
        doc.fontSize(10).fillColor('#666').text(item.footer, doc.page.margins.left, doc.page.height - 80, {
          width: pageWidth,
          align: 'center',
        });
        doc.fillColor('black');
      }
    });
  }

  private renderGrid(doc: PDFKit.PDFDocument, items: QrItem[]) {
    const cols = 2;
    const rows = 3;
    const perPage = cols * rows;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
    const cellW = pageWidth / cols;
    const cellH = pageHeight / rows;
    const qrSize = Math.min(cellW, cellH) - 60;

    items.forEach((item, idx) => {
      if (idx > 0 && idx % perPage === 0) doc.addPage();
      const local = idx % perPage;
      const col = local % cols;
      const row = Math.floor(local / cols);
      const cellX = doc.page.margins.left + col * cellW;
      const cellY = doc.page.margins.top + row * cellH;
      const qrX = cellX + (cellW - qrSize) / 2;
      const qrY = cellY + 16;

      doc.image(item.qrPng, qrX, qrY, { width: qrSize, height: qrSize });
      doc.fontSize(12).text(item.subtitle, cellX, qrY + qrSize + 8, {
        width: cellW,
        align: 'center',
      });
    });
  }
}
