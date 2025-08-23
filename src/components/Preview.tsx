import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useBookStore } from '../hooks/useBookStore';

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
        
        {/* Continuous content preview */}
        <div className="bg-white text-black font-serif p-8 max-w-4xl mx-auto">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="mb-12">
              <h1 className={`text-4xl font-bold mb-8 font-serif text-${chapterAlignment}`} style={{ color: colors.chapterTitle }}>
                {chapter.title}
              </h1>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className={`text-4xl font-bold mt-8 mb-6 font-serif text-${chapterAlignment}`} style={{ color: colors.chapterTitle }} {...props} />,
                  h2: ({node, ...props}) => <h2 className={`text-3xl font-bold mt-6 mb-4 font-serif text-${chapterAlignment}`} style={{ color: colors.chapterTitle }} {...props} />,
                  h3: ({node, ...props}) => <h3 className={`text-2xl font-bold mt-4 mb-3 font-serif text-${chapterAlignment}`} style={{ color: colors.chapterTitle }} {...props} />,
                  p: ({node, ...props}) => {
                    const content = props.children?.toString() || '';
                    if (content.startsWith('-r ')) {
                      return <p className="text-right my-4" style={{ color: colors.paragraph }} {...props}>{content.substring(3)}</p>;
                    }
                    if (content.startsWith('-c ')) {
                      return <p className="text-center my-4" style={{ color: colors.paragraph }} {...props}>{content.substring(3)}</p>;
                    }
                    return <p className="my-4 leading-relaxed text-justify" style={{ color: colors.paragraph, textIndent: paragraphIndent ? '2em' : '0' }} {...props} />;
                  },
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
                {chapter.content.replace(/^# .*\n?/, '').replace(/~\n([\s\S]*?)\n~~/g, (match, content) => {
                  const lines = content.split('\n').map((line: string, index: number) => 
                    index % 2 === 1 ? `    ${line}` : line
                  ).join('\n');
                  return `\n${lines}\n`;
                }).replace(/\+\n([\s\S]*?)\n\+\+/g, (match, content) => {
                  const lines = content.split('\n').map((line: string) => `    ${line}`).join('\n');
                  return `\n${lines}\n`;
                })}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Preview;
