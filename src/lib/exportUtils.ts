import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { BookDetails, Chapter } from '../types';

const generateHtmlContent = (details: BookDetails, chapters: Chapter[]): string => {
  const coverPage = details.coverImage ? `<div class="page"><img src="${details.coverImage}" style="width:100%; height:100%; object-fit: cover;" alt="Cover"/></div>` : '';
  
  const detailsPage = `<div class="page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
    <h1 style="font-family: 'Noto Serif', serif; font-size: 48px; margin-bottom: 2rem;">${details.title}</h1>
    <p style="font-family: 'Noto Serif', serif; font-size: 24px;">By ${details.author}</p>
    ${details.publisher ? `<p style="font-family: 'Noto Sans', sans-serif; font-size: 16px; margin-top: 4rem;">Published by ${details.publisher}</p>` : ''}
    ${details.contributor ? `<p style="font-family: 'Noto Sans', sans-serif; font-size: 16px;">Contribution by ${details.contributor}</p>` : ''}
  </div>`;

  const chapterPages = chapters.map(chapter => `<div class="page">${chapter.content.replace(/# .*/, `<h1>${chapter.title}</h1>`)}</div>`).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap');
        body { font-family: 'Noto Sans', sans-serif; margin: 0; padding: 0; }
        .page { 
          width: 210mm; 
          height: 297mm; 
          padding: 20mm; 
          box-sizing: border-box; 
          page-break-after: always;
          background: white;
          color: black;
        }
        h1, h2, h3 { font-family: 'Noto Serif', serif; }
        p[style*="text-align: right"] { text-align: right; }
        p[style*="text-align: center"] { text-align: center; }
        .poem p:nth-child(2n) { text-indent: 2em; }
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

export const exportToHTML = (details: BookDetails, chapters: Chapter[]) => {
    const html = generateHtmlContent(details, chapters);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `${details.title || 'ebook'}.html`);
};

export const exportToEPUB = async (details: BookDetails, chapters: Chapter[]) => {
    const zip = new JSZip();
    const { title, author, contributor, coverImage } = details;

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
      body { font-family: sans-serif; }
      h1, h2, h3 { font-family: serif; }
      p.align-right { text-align: right; }
      p.align-center { text-align: center; }
      div.poem p:nth-child(2n) { text-indent: 2em; }
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
        const content = chapter.content.replace(/# .*/, `<h1>${chapter.title}</h1>`);
        oebps?.file(`chapter-${i + 1}.xhtml`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${chapter.title}</title><link href="style.css" rel="stylesheet" type="text/css"/></head>
<body>${content}</body>
</html>`);
        return { id: `chapter-${i + 1}`, href: `chapter-${i + 1}.xhtml` };
    });

    const manifestItems = [
        coverImage ? '<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>' : '',
        coverManifestItem,
        ...chapterFiles.map(f => `<item id="${f.id}" href="${f.href}" media-type="application/xhtml+xml"/>`),
        '<item id="css" href="style.css" media-type="text/css"/>',
        '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'
    ].join('\n');

    const spineItems = [
        coverImage ? '<itemref idref="cover"/>' : '',
        ...chapterFiles.map(f => `<itemref idref="${f.id}"/>`)
    ].join('\n');

    oebps?.file('content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${title}</dc:title>
    <dc:creator opf:role="aut">${author}</dc:creator>
    ${contributor ? `<dc:contributor opf:role="oth">${contributor}</dc:contributor>` : ''}
    <dc:identifier id="bookid">urn:uuid:${crypto.randomUUID()}</dc:identifier>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>${manifestItems}</manifest>
  <spine toc="ncx">${spineItems}</spine>
</package>`);

    const navPoints = chapters.map((c, i) => `<navPoint id="navpoint-${i+1}" playOrder="${i+1}"><navLabel><text>${c.title}</text></navLabel><content src="chapter-${i+1}.xhtml"/></navPoint>`).join('\n');
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
