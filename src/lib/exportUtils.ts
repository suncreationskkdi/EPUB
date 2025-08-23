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

  const chapterPages = chapters.map(chapter => {
    const contentWithoutTitle = chapter.content.replace(/^# .*\n?/, '');
    const htmlContent = markdownToHtml(contentWithoutTitle);
    
    return `<div class="page" style="padding: 2rem; color: black; font-family: 'Noto Sans', sans-serif; line-height: 1.6;">
      <h1 style="font-family: 'Noto Serif', serif; font-size: 2.5rem; margin-bottom: 2rem; color: ${details.colors.chapterTitle}; text-align: ${details.chapterAlignment};">${chapter.title}</h1>
      ${htmlContent}
    </div>`;
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
          padding: 20mm; 
          box-sizing: border-box; 
          page-break-after: always;
          background: white;
          color: black;
          margin: 0 auto 2rem auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1, h2, h3 { 
          font-family: 'Noto Serif', serif; 
          color: ${details.colors.chapterTitle};
          text-align: ${details.chapterAlignment};
        }
        h1 { font-size: 2.5rem; margin-bottom: 1.5rem; }
        h2 { font-size: 2rem; margin: 1.5rem 0 1rem 0; }
        h3 { font-size: 1.5rem; margin: 1rem 0 0.5rem 0; }
        p { 
          margin: 1rem 0; 
          line-height: 1.6;
          text-align: justify;
          color: ${details.colors.paragraph};
          text-indent: ${details.paragraphIndent ? '2em' : '0'};
        }
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
        .poem p { 
          margin: 0.2rem 0;
          color: ${details.colors.paragraph};
        }
        .poem p:nth-child(2n) { 
          text-indent: 2em;
        }
        .poem2 p { 
          text-indent: 2em;
          color: ${details.colors.paragraph};
        }
        @media print {
          .page {
            box-shadow: none;
            margin: 0;
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
  const previewContainer = document.getElementById('preview-content');
  if (!previewContainer) return;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pages = previewContainer.querySelectorAll('.preview-page') as NodeListOf<HTMLElement>;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const canvas = await html2canvas(page, { scale: 2, backgroundColor: '#ffffff' });
    // Use JPEG for smaller file size with good quality
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    
    if (i > 0) {
      pdf.addPage();
    }
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  }

  pdf.save(`${details.title || 'ebook'}.pdf`);
};

export const exportToPDFSmall = async (details: BookDetails, chapters: Chapter[]) => {
  const previewContainer = document.getElementById('preview-content');
  if (!previewContainer) return;

  // Create PDF with 8" x 6" page size (203.2mm x 152.4mm)
  const pdf = new jsPDF('p', 'mm', [203.2, 152.4]);
  const pages = previewContainer.querySelectorAll('.preview-page') as NodeListOf<HTMLElement>;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const canvas = await html2canvas(page, { scale: 1.5, backgroundColor: '#ffffff' });
    // Use JPEG for smaller file size with good quality
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    
    if (i > 0) {
      pdf.addPage();
    }
    // Fit content to 8" x 6" page
    pdf.addImage(imgData, 'JPEG', 0, 0, 203.2, 152.4);
  }

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
      }
      h1, h2, h3 { 
        font-family: 'Noto Serif', serif;
        color: ${details.colors.chapterTitle};
        text-align: ${details.chapterAlignment};
      }
      h1 { font-size: 2.5rem; margin-bottom: 1.5rem; }
      h2 { font-size: 2rem; margin: 1.5rem 0 1rem 0; }
      h3 { font-size: 1.5rem; margin: 1rem 0 0.5rem 0; }
      p { 
        margin: 1rem 0;
        text-align: justify;
        color: ${details.colors.paragraph};
        text-indent: ${details.paragraphIndent ? '2em' : '0'};
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

    const chapterFiles = chapters.map((chapter, i) => {
        const contentWithoutTitle = chapter.content.replace(/^# .*\n?/, '');
        const htmlContent = markdownToHtml(contentWithoutTitle);
        
        oebps?.file(`chapter-${i + 1}.xhtml`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${chapter.title}</title><link href="style.css" rel="stylesheet" type="text/css"/></head>
<body>
  <h1 style="text-align: ${details.chapterAlignment}; color: ${details.colors.chapterTitle};">${chapter.title}</h1>
  ${htmlContent}
</body>
</html>`);
        return { id: `chapter-${i + 1}`, href: `chapter-${i + 1}.xhtml` };
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

    const navPoints = chapters.map((c, i) => 
      `<navPoint id="navpoint-${i+1}" playOrder="${i+1}"><navLabel><text>${c.title}</text></navLabel><content src="chapter-${i+1}.xhtml"/></navPoint>`
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