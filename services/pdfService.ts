import htmlPdf from 'html-pdf-node';
import { promises as fs } from 'fs';
import path from 'path';

interface ArticleData {
  id: number;
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  imageCaption?: string;
  author?: any;
  publishedAt?: Date;
  category?: any;
}

interface WatermarkData {
  userFirstName: string;
  userLastName: string;
}

export class PDFService {
  private static getArticleHTML(article: ArticleData, watermark: WatermarkData): string {
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const authorName = typeof article.author === 'string' 
      ? article.author 
      : article.author 
        ? `${article.author.firstName || ''} ${article.author.lastName || ''}`.trim()
        : 'Krugman Insights';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${article.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              background: #ffffff;
              padding: 60px 80px;
              max-width: 210mm;
              margin: 0 auto;
            }
            
            .header {
              border-bottom: 3px solid #B91C1C;
              padding-bottom: 30px;
              margin-bottom: 40px;
              position: relative;
            }
            
            .logo {
              background-color: #B91C1C;
              color: white;
              padding: 12px 20px;
              display: inline-block;
              font-weight: 700;
              font-size: 18px;
              letter-spacing: 0.5px;
              margin-bottom: 20px;
            }
            
            .watermark {
              position: absolute;
              top: 0;
              right: 0;
              background: rgba(185, 28, 28, 0.1);
              color: #B91C1C;
              padding: 8px 16px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 500;
              border: 1px solid rgba(185, 28, 28, 0.2);
            }
            
            .article-meta {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
              font-size: 14px;
              color: #666;
            }
            
            .category {
              background: #F3F4F6;
              color: #374151;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
            }
            
            .title {
              font-size: 36px;
              font-weight: 700;
              line-height: 1.2;
              color: #111827;
              margin-bottom: 20px;
            }
            
            .author-date {
              color: #6B7280;
              font-size: 14px;
              margin-bottom: 30px;
            }
            
            .summary-box {
              background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
              border-left: 4px solid #B91C1C;
              padding: 25px;
              margin: 30px 0;
              border-radius: 0 8px 8px 0;
            }
            
            .summary-title {
              font-weight: 600;
              color: #B91C1C;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 12px;
            }
            
            .summary-content {
              color: #374151;
              font-size: 15px;
              line-height: 1.6;
            }
            
            .article-image {
              width: 100%;
              margin: 30px 0;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            
            .image-caption {
              font-size: 13px;
              color: #6B7280;
              font-style: italic;
              text-align: center;
              margin-top: 10px;
            }
            
            .content {
              font-size: 16px;
              line-height: 1.8;
              color: #374151;
            }
            
            .content p {
              margin-bottom: 20px;
            }
            
            .content h2 {
              font-size: 24px;
              font-weight: 600;
              color: #111827;
              margin: 35px 0 20px 0;
            }
            
            .content h3 {
              font-size: 20px;
              font-weight: 600;
              color: #111827;
              margin: 30px 0 15px 0;
            }
            
            .footer {
              margin-top: 60px;
              padding-top: 30px;
              border-top: 2px solid #E5E7EB;
              text-align: center;
              color: #6B7280;
              font-size: 12px;
            }
            
            .footer-watermark {
              background: rgba(185, 28, 28, 0.05);
              border: 1px solid rgba(185, 28, 28, 0.1);
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
              color: #B91C1C;
              font-weight: 500;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            @media print {
              body { 
                padding: 40px 60px; 
              }
              .watermark {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Ki KRUGMAN INSIGHTS</div>
            <div class="watermark">
              This Article is for ${watermark.userFirstName} ${watermark.userLastName}
            </div>
            <div class="article-meta">
              ${article.category ? `<span class="category">${article.category.name}</span>` : ''}
              <span>${currentDate}</span>
            </div>
            <h1 class="title">${article.title}</h1>
            <div class="author-date">
              By ${authorName} • ${article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : currentDate}
            </div>
          </div>
          
          ${article.summary ? `
            <div class="summary-box">
              <div class="summary-title">What You Need to Know</div>
              <div class="summary-content">${article.summary}</div>
            </div>
          ` : ''}
          
          ${article.imageUrl ? `
            <img src="${article.imageUrl}" alt="${article.title}" class="article-image" />
            ${article.imageCaption ? `<div class="image-caption">${article.imageCaption}</div>` : ''}
          ` : ''}
          
          <div class="content">
            ${article.content}
          </div>
          
          <div class="footer">
            <div class="footer-watermark">
              <strong>This Article is for ${watermark.userFirstName} ${watermark.userLastName}</strong><br>
              This content should not be distributed and is for personal use only.
            </div>
            <div>
              © ${new Date().getFullYear()} Krugman Insights. All rights reserved.<br>
              Premium Financial Intelligence • www.krugmaninsights.com
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static async generateArticlePDF(
    article: ArticleData, 
    watermark: WatermarkData
  ): Promise<Buffer> {
    const html = this.getArticleHTML(article, watermark);
    
    const options = {
      format: 'A4' as const,
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false
    };

    try {
      const file = { content: html };
      const pdfBuffer = await htmlPdf.generatePdf(file, options);
      return pdfBuffer;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  static async saveArticlePDF(
    article: ArticleData,
    watermark: WatermarkData,
    filename?: string
  ): Promise<string> {
    const pdfBuffer = await this.generateArticlePDF(article, watermark);
    
    const uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const pdfFilename = filename || `article-${article.id}-${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, pdfFilename);
    
    await fs.writeFile(filePath, pdfBuffer);
    return filePath;
  }
}