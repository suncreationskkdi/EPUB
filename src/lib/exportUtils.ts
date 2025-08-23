import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { BookDetails, Chapter } from '../types';

// Helper function to convert markdown to HTML
const markdownToHtml = (markdown: string): string => {
  let html = markdown;
  
  // First, handle special formatting blocks
  // Handle poem blocks first (before other processing)
  html = html.replace(/~\n([\s\S]*?)\n~~/g, (match, content) => {
    const lines = content.split('\n').map((line: string, index: number) => 
      `<p style="margin: 0; ${index % 2 === 1 ? 'text-indent: 2em;' : ''}">${line}</p>`
    ).join('');
    return `<div class="poem" style="margin: 1rem 0;">${lines}</div>`;
  });
  
  // Handle poem2 blocks (all lines indented)
  html = html.replace(/\+\n([\s\S]*?)\n\+\+/g, (match, content) => {
    const lines = content.split('\n').map((line: string) => 
      `<p style="margin: 0; text-indent: 2em;">${line}</p>`
    ).join('');
    return `<div class="poem2" style="margin: 1rem 0;">${lines}</div>`;
  });
  
  // Handle custom alignment
  html = html.replace(/^-r\s*(.*$)/gm, '<p style="text-align: right;">$1</p>');
  html = html.replace(/^-c\s*(.*$)/gm, '<p style="text-align: center;">$1</p>');
  
  // Handle headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Handle bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Handle code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Handle blockquotes
  html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
  
  // Handle unordered lists
  const ulItems = html.match(/^- .*$/gm);
  if (ulItems) {
    const listItems = ulItems.map(item => item.replace(/^- (.*)$/, '<li>$1</li>')).join('');
    html = html.replace(/^- .*$/gm, '').replace(/\n+/g, '\n');
    html = html + `<ul>${listItems}</ul>`;
  }
  
  // Handle ordered lists
  const olItems = html.match(/^\d+\. .*$/gm);
  if (olItems) {
    const listItems = olItems.map(item => item.replace(/^\d+\. (.*)$/, '<li>$1</li>')).join('');
    html = html.replace(/^\d+\. .*$/gm, '').replace(/\n+/g, '\n');
    html = html + `<ol>${listItems}</ol>`;
  }
  
  // Handle links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Handle images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />');
  
  // Clean up extra whitespace and newlines
  html = html.replace(/\n\s*\n/g, '\n\n');
  
  // Split into paragraphs and wrap each in <p> tags
  const paragraphs = html.split('\n\n').filter(p => p.trim());
  html = paragraphs.map(paragraph => {
    const trimmed = paragraph.trim();
    // Don't wrap if it's already a block element
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul>') || trimmed.startsWith('<ol>') || 
        trimmed.startsWith('<blockquote>') || trimmed.startsWith('<pre>') || 
        trimmed.startsWith('<div') || trimmed.startsWith('<p ')) {
      return trimmed;
    }
    // Replace single newlines with <br> within paragraphs
    const withBreaks = trimmed.replace(/\n/g, '<br>');
    return `<p>${withBreaks}</p>`;
  }).join('\n');
  
  return html;
};

// Helper function to parse content into chunks (same as Preview component)
interface ContentChunk {
  type: 'markdown' | 'right' | 'center' | 'poem' | 'poem2' | 'title';
  content: string;
}

const parseContentToChunks = (content: string): ContentChunk[] => {
  const chunks: ContentChunk[] = [];
  const lines = content.split('\n');
  let currentChunk: { type: 'markdown' | 'poem' | 'poem2'; lines: string[] } = { type: 'markdown', lines: [] };
  let inPoem = false;
  let inPoem2 = false;

  for (const line of lines) {
    if (inPoem2) {
      if (line.trim() === '++') {
        inPoem2 = false;
        if (currentChunk.lines.length > 0) {
          chunks.push({ type: 'poem2', content: currentChunk.lines.join('\n') });
        }
        currentChunk = { type: 'markdown', lines: [] };
      } else {
        currentChunk.lines.push(line);
      }
      continue;
    }

    if (inPoem) {
      if (line.trim() === '~~') {
        inPoem = false;
        if (currentChunk.lines.length > 0) {
          chunks.push({ type: 'poem', content: currentChunk.lines.join('\n') });
        }
        currentChunk = { type: 'markdown', lines: [] };
      } else {
        currentChunk.lines.push(line);
      }
      continue;
    }

    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('# ')) {
       if (currentChunk.lines.length > 0) {
        chunks.push({ type: 'markdown', content: currentChunk.lines.join('\n') });
      }
      chunks.push({ type: 'title', content: trimmedLine.replace('# ', '') });
      currentChunk = { type: 'markdown', lines: [] };
    } else if (trimmedLine.startsWith('-r')) {
      if (currentChunk.lines.length > 0) {
        chunks.push({ type: 'markdown', content: currentChunk.lines.join('\n') });
      }
      chunks.push({ type: 'right', content: line.substring(line.indexOf('-r') + 2) });
      currentChunk = { type: 'markdown', lines: [] };
    } else if (trimmedLine.startsWith('-c')) {
      if (currentChunk.lines.length > 0) {
        chunks.push({ type: 'markdown', content: currentChunk.lines.join('\n') });
      }
      chunks.push({ type: 'center', content: line.substring(line.indexOf('-c') + 2) });
      currentChunk = { type: 'markdown', lines: [] };
    } else if (trimmedLine === '~') {
      if (currentChunk.lines.length > 0) {
        chunks.push({ type: 'markdown', content: currentChunk.lines.join('\n') });
      }
      inPoem = true;
      currentChunk = { type: 'poem', lines: [] };
    } else if (trimmedLine === '+') {
      if (currentChunk.lines.length > 0) {
        chunks.push({ type: 'markdown', content: currentChunk.lines.join('\n') });
      }
      inPoem2 = true;
      currentChunk = { type: 'poem2', lines: [] };
    } else {
      currentChunk.lines.push(line);
    }
  }

  if (currentChunk.lines.length > 0) {
    chunks.push({ type: currentChunk.type, content: currentChunk.lines.join('\n') });
  }

  return chunks;
};

// Helper function to convert markdown to plain text
const markdownToPlainText = (markdown: string): string => {
  let text = markdown;
  
  // Handle special formatting blocks first
  // Handle poem blocks
  text = text.replace(/~\n([\s\S]*?)\n~~/g, (match, content) => {
    const lines = content.split('\n').map((line: string, index: number) => 
      index % 2 === 1 ? `    ${line}` : line
    ).join('\n');
    return `\n${lines}\n`;
  });
  
  // Handle poem2 blocks (all lines indented)
  text = text.replace(/\+\n([\s\S]*?)\n\+\+/g, (match, content) => {
    const lines = content.split('\n').map((line: string) => `    ${line}`).join('\n');
    return `\n${lines}\n`;
  });
  
  // Handle custom alignment
  text = text.replace(/^-r\s*(.*$)/gm, '                                        $1'); // Right align with spaces
  text = text.replace(/^-c\s*(.*$)/gm, '                    $1'); // Center align with spaces
  
  // Remove markdown formatting
  text = text.replace(/^### (.*$)/gm, '$1'); // H3
  text = text.replace(/^## (.*$)/gm, '$1'); // H2
  text = text.replace(/^# (.*$)/gm, '$1'); // H1
  
  // Remove bold and italic
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  
  // Remove code blocks and inline code
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`(.*?)`/g, '$1');
  
  // Handle blockquotes
  text = text.replace(/^> (.*$)/gm, '    "$1"');
  
  // Handle lists
  text = text.replace(/^- (.*$)/gm, '• $1');
  text = text.replace(/^\d+\. (.*$)/gm, '$1');
  
  // Handle links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  
  // Remove images
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[Image: $1]');
  
  // Clean up extra whitespace
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return text.trim();
};

const generateHtmlContent = (details: BookDetails, chapters: Chapter[]): string => {
  const coverPage = details.coverImage ? 
    `<div class="page"><img src="${details.coverImage}" style="width:100%; height:100%; object-fit: cover;" alt="Cover"/></div>` : '';
  
  const detailsPage = `<div class="page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 2rem;">
    <h1 style="font-family: 'Noto Serif', serif; font-size: 48px; margin-bottom: 2rem; color: ${details.colors.bookTitle};">${details.title}</h1>
    <p style="font-family: 'Noto Serif', serif; font-size: 24px; color: black;">By ${details.author}</p>
    ${details.publisher ? `<p style="font-family: 'Noto Sans', sans-serif; font-size: 16px; margin-top: 2rem; color: black;">${details.publisher}</p>` : ''}
    ${details.ebookUrl ? `<p style="font-family: 'Noto Sans', sans-serif; font-size: 16px; margin-top: 0.5rem; color: black;">${details.ebookUrl}</p>` : ''}
    ${details.contributors.length > 0 ? `<div style="margin-top: 2rem;">${details.contributors.map(contributor => 
      `<p style="font-family: 'Noto Sans', sans-serif; font-size: 16px; color: black;">${contributor}</p>`
    ).join('')}</div>` : ''}
    <p style="font-family: 'Noto Sans', sans-serif; font-size: 16px; margin-top: 1rem; color: black;">${details.license}</p>
  </div>`;

  // Helper function to split content into pages
  const splitContentIntoPages = (content: string, chapterTitle: string): string[] => {
    const htmlContent = markdownToHtml(content);
    const maxContentLength = 1500; // Further reduced to prevent cutoff
    
    if (htmlContent.length <= maxContentLength) {
      return [htmlContent];
    }
    
    // Split by paragraphs more carefully
    const paragraphs = htmlContent.split(/<\/p>|<\/h[1-6]>|<\/div>|<\/blockquote>|<\/pre>/).filter(p => p.trim());
    const pages: string[] = [];
    let currentPage = '';
    
    paragraphs.forEach((paragraph, index) => {
      // Reconstruct the closing tag
      let closingTag = '';
      if (paragraph.includes('<p')) closingTag = '</p>';
      else if (paragraph.includes('<h1')) closingTag = '</h1>';
      else if (paragraph.includes('<h2')) closingTag = '</h2>';
      else if (paragraph.includes('<h3')) closingTag = '</h3>';
      else if (paragraph.includes('<div')) closingTag = '</div>';
      else if (paragraph.includes('<blockquote')) closingTag = '</blockquote>';
      else if (paragraph.includes('<pre')) closingTag = '</pre>';
      else closingTag = '</p>';
      
      const fullParagraph = paragraph + closingTag;
      
      // If adding this paragraph would exceed the limit, start a new page
      if (currentPage.length + fullParagraph.length > maxContentLength && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = fullParagraph;
      } else {
        currentPage += fullParagraph;
      }
    });
    
    // Add the last page
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
    
    return pages.length > 0 ? pages : [htmlContent];
  };

  const chapterPages = chapters.flatMap(chapter => {
    const contentWithoutTitle = chapter.content.replace(/^# .*\n?/, '');
    const contentPages = splitContentIntoPages(contentWithoutTitle, chapter.title);
    
    return contentPages.map((pageContent, pageIndex) => {
      const showTitle = pageIndex === 0; // Only show title on first page of chapter
      return `<div class="page" style="color: black; font-family: 'Noto Sans', sans-serif; line-height: 1.6;">
        <div class="chapter-content" style="padding: 2rem; height: calc(100% - 4rem); overflow: hidden;">
          ${showTitle ? `<h1 style="font-family: 'Noto Serif', serif; font-size: 2.5rem; margin-bottom: 2rem; color: ${details.colors.chapterTitle}; text-align: ${details.chapterAlignment};">${chapter.title}</h1>` : ''}
          ${pageContent}
        </div>
      </div>`;
    });
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${details.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap');
        body { 
          font-family: 'Noto Sans', sans-serif; 
          margin: 0; 
          padding: 0; 
          background: white;
          color: black;
        }
        .page { 
          width: 210mm; 
          height: 297mm; 
          padding: 15mm 16mm 25mm 16mm; 
          box-sizing: border-box; 
          page-break-after: always;
          background: white;
          color: black;
          margin: 0 auto 2rem auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .chapter-content {
          flex: 1 1 auto;
          overflow: hidden;
          max-height: calc(297mm - 40mm);
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .chapter-content h1,
        .chapter-content h2,
        .chapter-content h3,
        .chapter-content p,
        .chapter-content div,
        .chapter-content ul,
        .chapter-content ol,
        .chapter-content blockquote,
        .chapter-content pre {
          page-break-inside: avoid;
          break-inside: avoid;
          orphans: 3;
          widows: 3;
        }
        .chapter-content p {
          orphans: 3;
          widows: 3;
          word-wrap: break-word;
          overflow-wrap: break-word;
          margin: 0.6rem 0;
          line-height: 1.4;
          page-break-inside: avoid;
        }
        h1, h2, h3 { 
          font-family: 'Noto Serif', serif; 
          color: ${details.colors.chapterTitle};
          text-align: ${details.chapterAlignment};
          page-break-after: avoid;
          break-after: avoid;
          orphans: 3;
          widows: 3;
        }
        h1 { font-size: 2.5rem; margin-bottom: 1.2rem; page-break-inside: avoid; }
        h2 { font-size: 2rem; margin: 1.2rem 0 0.8rem 0; page-break-inside: avoid; }
        h3 { font-size: 1.5rem; margin: 0.8rem 0 0.4rem 0; page-break-inside: avoid; }
        p { 
          margin: 0.6rem 0; 
          line-height: 1.4;
          text-align: justify;
          color: ${details.colors.paragraph};
          text-indent: ${details.paragraphIndent ? '2em' : '0'};
          word-wrap: break-word;
          overflow-wrap: break-word;
          page-break-inside: avoid;
          orphans: 3;
          widows: 3;
        }
        ul, ol { 
          margin: 0.6rem 0; 
          padding-left: 2rem;
          page-break-inside: avoid;
        }
        li { 
          margin: 0.3rem 0;
          color: ${details.colors.paragraph};
          word-wrap: break-word;
          overflow-wrap: break-word;
          page-break-inside: avoid;
        }
        blockquote { 
          border-left: 4px solid #ccc; 
          padding-left: 1rem; 
          margin: 0.6rem 0; 
          font-style: italic;
          color: ${details.colors.paragraph};
          word-wrap: break-word;
          overflow-wrap: break-word;
          page-break-inside: avoid;
        }
        code { 
          background: #f5f5f5; 
          padding: 0.2rem 0.4rem; 
          border-radius: 3px;
          font-family: monospace;
          color: ${details.colors.paragraph};
        }
        pre { 
          background: #f5f5f5; 
          padding: 1rem; 
          border-radius: 5px; 
          overflow-x: auto;
          margin: 0.6rem 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
          page-break-inside: avoid;
        }
        pre code { 
          background: none; 
          padding: 0;
          color: ${details.colors.paragraph};
        }
        a { 
          color: #0066cc; 
          text-decoration: underline;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .poem p { 
          margin: 0.1rem 0;
          color: ${details.colors.paragraph};
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .poem p:nth-child(2n) { 
          text-indent: 2em;
        }
        .poem2 p { 
          text-indent: 2em;
          color: ${details.colors.paragraph};
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        @media print {
          .page {
            box-shadow: none;
            margin: 0;
            page-break-after: always;
          }
          .chapter-content > * {
            page-break-inside: avoid;
            orphans: 3;
            widows: 3;
          }
        }
      </style>
    </head>
    <body>
      ${coverPage}
      ${detailsPage}
      ${chapterPages}
    </body>
    </html>
  `;
};

export const exportToPDF = async (details: BookDetails, chapters: Chapter[]) => {
  // Create a temporary HTML document for PDF generation
  const htmlContent = generateHtmlContent(details, chapters);
  
  // Create a temporary iframe to render the HTML
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) return;
  
  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();
  
  // Wait for content to load
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pages = iframeDoc.querySelectorAll('.page') as NodeListOf<HTMLElement>;
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const canvas = await html2canvas(page, { 
      scale: 2, 
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    
    if (i > 0) {
      pdf.addPage();
    }
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  }
  
  // Clean up
  document.body.removeChild(iframe);
  pdf.save(`${details.title || 'ebook'}.pdf`);
};

export const exportToPDFSmall = async (details: BookDetails, chapters: Chapter[]) => {
  // Create a temporary HTML document for PDF generation with smaller page size
  const htmlContent = generateHtmlContent(details, chapters).replace(
    'width: 210mm; height: 297mm;',
    'width: 203.2mm; height: 152.4mm;'
  );
  
  // Create a temporary iframe to render the HTML
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '203.2mm';
  iframe.style.height = '152.4mm';
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) return;
  
  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();
  
  // Wait for content to load
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create PDF with 8" x 6" page size (203.2mm x 152.4mm)
  const pdf = new jsPDF('p', 'mm', [203.2, 152.4]);
  const pages = iframeDoc.querySelectorAll('.page') as NodeListOf<HTMLElement>;
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const canvas = await html2canvas(page, { 
      scale: 1.5, 
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    
    if (i > 0) {
      pdf.addPage();
    }
    // Fit content to 8" x 6" page
    pdf.addImage(imgData, 'JPEG', 0, 0, 203.2, 152.4);
  }
  
  // Clean up
  document.body.removeChild(iframe);
  pdf.save(`${details.title || 'ebook'}-small.pdf`);
};

export const exportToHTML = (details: BookDetails, chapters: Chapter[]) => {
    const html = generateHtmlContent(details, chapters);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `${details.title || 'ebook'}.html`);
};

export const exportToEPUB = async (details: BookDetails, chapters: Chapter[]) => {
    const zip = new JSZip();
    const { title, author, contributors, coverImage } = details;

    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    const metaInf = zip.folder('META-INF');
    metaInf?.file('container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

    const oebps = zip.folder('OEBPS');
    
    // CSS
    oebps?.file('style.css', `
      body { 
        font-family: 'Noto Sans', sans-serif; 
        line-height: 1.6;
        color: ${details.colors.paragraph};
        margin: 0;
        padding: 1rem;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      h1, h2, h3 { 
        font-family: 'Noto Serif', serif;
        color: ${details.colors.chapterTitle};
        text-align: ${details.chapterAlignment};
        page-break-after: avoid;
      }
      h1 { font-size: 2.5rem; margin-bottom: 1.5rem; }
      h2 { font-size: 2rem; margin: 1.5rem 0 1rem 0; }
      h3 { font-size: 1.5rem; margin: 1rem 0 0.5rem 0; }
      p { 
        margin: 1rem 0;
        text-align: justify;
        color: ${details.colors.paragraph};
        text-indent: ${details.paragraphIndent ? '2em' : '0'};
        word-wrap: break-word;
        overflow-wrap: break-word;
        orphans: 2;
        widows: 2;
      }
      p.align-right { text-align: right; }
      p.align-center { text-align: center; }
      ul, ol { 
        margin: 1rem 0; 
        padding-left: 2rem;
      }
      li { 
        margin: 0.5rem 0;
        color: ${details.colors.paragraph};
      }
      blockquote { 
        border-left: 4px solid #ccc; 
        padding-left: 1rem; 
        margin: 1rem 0; 
        font-style: italic;
        color: ${details.colors.paragraph};
      }
      code { 
        background: #f5f5f5; 
        padding: 0.2rem 0.4rem; 
        border-radius: 3px;
        font-family: monospace;
        color: ${details.colors.paragraph};
      }
      pre { 
        background: #f5f5f5; 
        padding: 1rem; 
        border-radius: 5px; 
        overflow-x: auto;
        margin: 1rem 0;
      }
      pre code { 
        background: none; 
        padding: 0;
        color: ${details.colors.paragraph};
      }
      a { 
        color: #0066cc; 
        text-decoration: underline;
      }
      div.poem p { 
        margin: 0.2rem 0;
        color: ${details.colors.paragraph};
      }
      div.poem p:nth-child(2n) { 
        text-indent: 2em;
      }
      div.poem2 p { 
        text-indent: 2em;
        color: ${details.colors.paragraph};
      }
      img {
        max-width: 100%;
        height: auto;
        margin: 1rem 0;
      }
    `);

    // Content
    let coverManifestItem = '';
    if (coverImage) {
        const coverData = coverImage.split(',')[1];
        oebps?.file('cover.jpg', coverData, { base64: true });
        coverManifestItem = '<item id="cover-image" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/>';
        oebps?.file('cover.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Cover</title><link href="style.css" rel="stylesheet" type="text/css"/></head>
<body><div style="text-align: center; padding: 0; margin: 0; height: 100%;"><img src="cover.jpg" alt="Cover" style="max-height: 100%; max-width: 100%;"/></div></body>
</html>`);
    }

    // Helper function to split chapter content for EPUB
    const splitChapterForEPUB = (chapter: Chapter, chapterIndex: number) => {
        const contentWithoutTitle = chapter.content.replace(/^# .*\n?/, '');
        
        // Parse content into chunks like in Preview component
        const contentWithTitle = `# ${chapter.title}\n${contentWithoutTitle}`;
        const chunks = parseContentToChunks(contentWithTitle);
        
        // Split chunks into pages based on estimated content height
        const splitIntoPages = (chunks: any[]) => {
            const pages: any[][] = [];
            let currentPage: any[] = [];
            let currentPageHeight = 0;
            const maxPageHeight = 200; // Lines per EPUB page
            
            chunks.forEach(chunk => {
                let chunkHeight = 0;
                
                switch (chunk.type) {
                    case 'title':
                        chunkHeight = 6;
                        break;
                    case 'markdown':
                        const paragraphs = chunk.content.split('\n\n').filter((p: string) => p.trim());
                        chunkHeight = paragraphs.reduce((acc: number, p: string) => {
                            const lines = Math.ceil(p.length / 80);
                            return acc + Math.max(lines, 1) + 1;
                        }, 0);
                        break;
                    case 'poem':
                    case 'poem2':
                        chunkHeight = chunk.content.split('\n').length + 2;
                        break;
                    default:
                        chunkHeight = Math.ceil(chunk.content.length / 80) + 1;
                }
                
                if (currentPageHeight + chunkHeight > maxPageHeight && currentPage.length > 0) {
                    pages.push([...currentPage]);
                    currentPage = [chunk];
                    currentPageHeight = chunkHeight;
                } else {
                    currentPage.push(chunk);
                    currentPageHeight += chunkHeight;
                }
            });
            
            if (currentPage.length > 0) {
                pages.push(currentPage);
            }
            
            return pages.length > 0 ? pages : [chunks];
        };
        
        const pages = splitIntoPages(chunks);
        
        return pages.map((pageChunks, pageIndex) => {
            let htmlContent = '';
            let showTitle = false;
            
            pageChunks.forEach(chunk => {
                switch (chunk.type) {
                    case 'title':
                        showTitle = true;
                        break;
                    case 'right':
                        htmlContent += `<p style="text-align: right;">${chunk.content}</p>`;
                        break;
                    case 'center':
                        htmlContent += `<p style="text-align: center;">${chunk.content}</p>`;
                        break;
                    case 'poem':
                        const poemLines = chunk.content.split('\n').map((line: string, i: number) => 
                            `<p style="margin: 0; ${i % 2 === 1 ? 'text-indent: 2em;' : ''}">${line}</p>`
                        ).join('');
                        htmlContent += `<div class="poem" style="margin: 1rem 0;">${poemLines}</div>`;
                        break;
                    case 'poem2':
                        const poem2Lines = chunk.content.split('\n').map((line: string) => 
                            `<p style="margin: 0; text-indent: 2em;">${line}</p>`
                        ).join('');
                        htmlContent += `<div class="poem2" style="margin: 1rem 0;">${poem2Lines}</div>`;
                        break;
                    case 'markdown':
                        htmlContent += markdownToHtml(chunk.content);
                        break;
                }
            });
            
            return [{
                id: pageIndex === 0 ? `chapter-${chapterIndex + 1}` : `chapter-${chapterIndex + 1}-part-${pageIndex + 1}`,
                href: pageIndex === 0 ? `chapter-${chapterIndex + 1}.xhtml` : `chapter-${chapterIndex + 1}-part-${pageIndex + 1}.xhtml`,
                title: pageIndex === 0 ? chapter.title : `${chapter.title} (continued)`,
                content: htmlContent,
                showTitle: showTitle
            }];
        }).flat();
    };

    const chapterFiles = chapters.flatMap((chapter, i) => {
        return splitChapterForEPUB(chapter, i);
    });

    // Create XHTML files for each chapter part
    chapterFiles.forEach(chapterFile => {
        
        oebps?.file(chapterFile.href, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${chapterFile.title}</title>
  <link href="style.css" rel="stylesheet" type="text/css"/>
  <style>
    body { word-wrap: break-word; overflow-wrap: break-word; }
    p { orphans: 2; widows: 2; }
  </style>
</head>
<body>
  ${chapterFile.showTitle ? `<h1 style="text-align: ${details.chapterAlignment}; color: ${details.colors.chapterTitle};">${chapterFile.title}</h1>` : ''}
  ${chapterFile.content}
</body>
</html>`);
    });

    const manifestItems = [
        coverImage ? '<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>' : '',
        coverManifestItem,
        ...chapterFiles.map(f => `<item id="${f.id}" href="${f.href}" media-type="application/xhtml+xml"/>`),
        '<item id="css" href="style.css" media-type="text/css"/>',
        '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'
    ].filter(Boolean).join('\n');

    const spineItems = [
        coverImage ? '<itemref idref="cover"/>' : '',
        ...chapterFiles.map(f => `<itemref idref="${f.id}"/>`)
    ].filter(Boolean).join('\n');

    oebps?.file('content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${title}</dc:title>
    <dc:creator opf:role="aut">${author}</dc:creator>
    ${contributors.length > 0 ? contributors.map(contributor => 
      `<dc:contributor opf:role="oth">${contributor}</dc:contributor>`
    ).join('\n    ') : ''}
    <dc:identifier id="bookid">urn:uuid:${crypto.randomUUID()}</dc:identifier>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>${manifestItems}</manifest>
  <spine toc="ncx">${spineItems}</spine>
</package>`.replace(/\${details\.colors\.(bookTitle|chapterTitle|paragraph)}/g, (match, colorType) => details.colors[colorType as keyof typeof details.colors]).replace(/\${details\.paragraphIndent \? '2em' : '0'}/g, details.paragraphIndent ? '2em' : '0'));

    // Create navigation points for table of contents
    const navPoints = chapterFiles.filter(f => f.showTitle).map((f, i) => 
      `<navPoint id="navpoint-${i+1}" playOrder="${i+1}"><navLabel><text>${f.title}</text></navLabel><content src="${f.href}"/></navPoint>`
    ).join('\n');
    
    oebps?.file('toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="urn:uuid:${crypto.randomUUID()}"/></head>
  <docTitle><text>${title}</text></docTitle>
  <navMap>${navPoints}</navMap>
</ncx>`);

    const content = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
    saveAs(content, `${title || 'ebook'}.epub`);
};

export const exportToPlainText = (details: BookDetails, chapters: Chapter[]) => {
  const { title, author, publisher, contributors, ebookUrl, license } = details;
  
  let content = '';
  
  // Title page
  content += `${title.toUpperCase()}\n`;
  content += `${'='.repeat(title.length)}\n\n`;
  content += `By ${author}\n\n`;
  
  if (publisher) {
    content += `${publisher}\n`;
  }
  if (ebookUrl) {
    content += `${ebookUrl}\n`;
  }
  if (contributors.length > 0) {
    content += '\n';
    contributors.forEach(contributor => {
      content += `${contributor}\n`;
    });
  }
  content += `\n${license}\n`;
  
  content += '\n' + '='.repeat(50) + '\n\n';
  
  // Chapters
  chapters.forEach((chapter, index) => {
    if (index > 0) {
      content += '\n' + '-'.repeat(30) + '\n\n';
    }
    
    content += `${chapter.title.toUpperCase()}\n`;
    content += `${'-'.repeat(chapter.title.length)}\n\n`;
    
    const contentWithoutTitle = chapter.content.replace(/^# .*\n?/, '');
    const plainTextContent = markdownToPlainText(contentWithoutTitle);
    content += plainTextContent + '\n\n';
  });
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${title || 'ebook'}.txt`);
};