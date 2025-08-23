import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useBookStore } from '../hooks/useBookStore';

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

const Preview: React.FC = () => {
  const { title, author, publisher, contributors, coverImage, chapters, colors, paragraphIndent, chapterAlignment, ebookUrl, license } = useBookStore();

  return (
    <div className="flex-1 bg-gray-200 p-8 overflow-y-auto">
      <div id="preview-content" className="shadow-lg">
        {coverImage && (
          <div className="preview-page bg-white">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="preview-page bg-white flex flex-col justify-center items-center text-center p-16">
          <h1 className="font-serif text-5xl mb-4" style={{ color: colors.bookTitle }}>{title}</h1>
          <p className="font-serif text-2xl text-gray-700">{author}</p>
          {publisher && <p className="text-gray-500 mt-8">{publisher}</p>}
          {ebookUrl && <p className="text-gray-500 mt-2">{ebookUrl}</p>}
          {contributors.length > 0 && (
            <div className="mt-8">
              {contributors.map((contributor, index) => (
                <p key={index} className="text-gray-500">
                  {contributor}
                </p>
              ))}
            </div>
          )}
          <p className="text-gray-500 mt-4">{license}</p>
        </div>
        {chapters.map((chapter) => {
          const contentWithTitle = `# ${chapter.title}\n${chapter.content.replace(/^# .*\n?/, '')}`;
          const chunks = parseContentToChunks(contentWithTitle);
          
          // Split content into pages based on estimated content height
          const splitIntoPages = (chunks: ContentChunk[]) => {
            const pages: ContentChunk[][] = [];
            let currentPage: ContentChunk[] = [];
            let currentPageHeight = 0;
            const maxPageHeight = 35; // More conservative lines per page to prevent overflow
            
            chunks.forEach(chunk => {
              let chunkHeight = 0;
              
              // Estimate height based on content type and length
              switch (chunk.type) {
                case 'title':
                  chunkHeight = 4; // Large heading takes more space
                  break;
                case 'markdown':
                  // More accurate line estimation
                  const text = chunk.content.replace(/[#*`]/g, ''); // Remove markdown chars
                  const paragraphs = text.split('\n\n').filter(p => p.trim());
                  chunkHeight = paragraphs.reduce((acc, p) => {
                    const lines = Math.ceil(p.length / 60); // ~60 chars per line (more conservative)
                    return acc + Math.max(lines, 1) + 2; // +2 for paragraph spacing
                  }, 0);
                  
                  // Add extra height for special markdown elements
                  if (chunk.content.includes('```')) chunkHeight += 3; // Code blocks
                  if (chunk.content.includes('> ')) chunkHeight += 1; // Blockquotes
                  if (chunk.content.includes('- ') || chunk.content.includes('1. ')) chunkHeight += 2; // Lists
                  break;
                case 'poem':
                case 'poem2':
                  chunkHeight = chunk.content.split('\n').length + 3;
                  break;
                default:
                  chunkHeight = Math.ceil(chunk.content.length / 60) + 2;
              }
              
              // If adding this chunk would exceed page height or chunk is very large, start new page
              if ((currentPageHeight + chunkHeight > maxPageHeight && currentPage.length > 0) || chunkHeight > maxPageHeight) {
                // If current page has content, save it
                if (currentPage.length > 0) {
                  pages.push([...currentPage]);
                }
                
                // If chunk is too large, split it further
                if (chunkHeight > maxPageHeight && chunk.type === 'markdown') {
                  const splitChunk = splitLargeMarkdownChunk(chunk, maxPageHeight);
                  splitChunk.forEach((subChunk, index) => {
                    if (index === 0) {
                      currentPage = [subChunk];
                    } else {
                      pages.push([subChunk]);
                    }
                  });
                  if (splitChunk.length > 0) {
                    currentPage = [splitChunk[splitChunk.length - 1]];
                  }
                  currentPageHeight = Math.ceil(currentPage[0]?.content.length / 60) || 0;
                } else {
                  currentPage = [chunk];
                  currentPageHeight = chunkHeight;
                }
              } else {
                currentPage.push(chunk);
                currentPageHeight += chunkHeight;
              }
            });
            
            // Add the last page if it has content
            if (currentPage.length > 0) {
              pages.push(currentPage);
            }
            
            return pages.length > 0 ? pages : [chunks]; // Fallback to single page
          };
          
          // Helper function to split large markdown chunks
          const splitLargeMarkdownChunk = (chunk: ContentChunk, maxHeight: number): ContentChunk[] => {
            const paragraphs = chunk.content.split('\n\n').filter(p => p.trim());
            const chunks: ContentChunk[] = [];
            let currentContent = '';
            let currentHeight = 0;
            
            paragraphs.forEach(paragraph => {
              const paragraphHeight = Math.ceil(paragraph.length / 60) + 2;
              
              if (currentHeight + paragraphHeight > maxHeight && currentContent.trim()) {
                chunks.push({ type: 'markdown', content: currentContent.trim() });
                currentContent = paragraph;
                currentHeight = paragraphHeight;
              } else {
                currentContent += (currentContent ? '\n\n' : '') + paragraph;
                currentHeight += paragraphHeight;
              }
            });
            
            if (currentContent.trim()) {
              chunks.push({ type: 'markdown', content: currentContent.trim() });
            }
            
            return chunks.length > 0 ? chunks : [chunk];
          };
          
          const pages = splitIntoPages(chunks);
          
          return (
            <React.Fragment key={chapter.id}>
              {pages.map((pageChunks, pageIndex) => (
                <div key={`${chapter.id}-page-${pageIndex}`} className="preview-page bg-white text-black font-serif">
                  <div className="chapter-content">
                    {pageChunks.map((chunk, chunkIndex) => {
                      const key = `${pageIndex}-${chunkIndex}`;
                      switch (chunk.type) {
                        case 'title':
                          return <h1 key={key} className={`text-4xl font-bold mb-8 font-serif text-${chapterAlignment}`} style={{ color: colors.chapterTitle }}>{chunk.content}</h1>;
                        case 'right':
                          return <p key={key} className="text-right">{chunk.content}</p>;
                        case 'center':
                          return <p key={key} className="text-center">{chunk.content}</p>;
                        case 'poem':
                          return (
                            <div key={key} className="poem my-4">
                              {chunk.content.split('\n').map((line, i) => (
                                <p key={i} className="m-0">{line}</p>
                              ))}
                            </div>
                          );
                        case 'poem2':
                          return (
                            <div key={key} className="poem2 my-4">
                              {chunk.content.split('\n').map((line, i) => (
                                <p key={i} className="m-0 ml-8">{line}</p>
                              ))}
                            </div>
                          );
                        case 'markdown':
                          return (
                            <ReactMarkdown
                              key={key}
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h2: ({node, ...props}) => <h2 className={`text-3xl font-bold mt-6 mb-4 font-serif text-${chapterAlignment}`} style={{ color: colors.chapterTitle }} {...props} />,
                                h3: ({node, ...props}) => <h3 className={`text-2xl font-bold mt-4 mb-3 font-serif text-${chapterAlignment}`} style={{ color: colors.chapterTitle }} {...props} />,
                                p: ({node, ...props}) => <p className="my-4 leading-relaxed text-justify" style={{ color: colors.paragraph, textIndent: paragraphIndent ? '2em' : '0' }} {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc list-inside my-4" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-inside my-4" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />,
                                img: ({node, ...props}) => <img className="max-w-full h-auto my-4" {...props} />,
                                a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                                code: ({node, inline, ...props}) => 
                                  inline ? 
                                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} /> : 
                                    <pre className="bg-gray-100 p-4 rounded my-4 overflow-x-auto"><code {...props} /></pre>,
                              }}
                            >
                              {chunk.content}
                            </ReactMarkdown>
                          );
                        default:
                          return null;
                      }
                    })}
                  </div>
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
      <style>{`
        .preview-page {
          width: 210mm;
          height: 297mm;
          margin: 0 auto 2rem auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          page-break-before: always;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .preview-page .poem p:nth-child(2n) {
          text-indent: 2em;
        }
        .poem2 p {
          text-indent: 2em;
        }
        .chapter-content {
          flex: 1;
          overflow: hidden;
          padding: 16px;
        }
        .chapter-content > * {
          page-break-inside: avoid;
        }
        .chapter-content p {
          orphans: 2;
          widows: 2;
        }
      `}</style>
    </div>
  );
};

export default Preview;
