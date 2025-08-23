import React, { useRef } from 'react';
import { useBookStore } from '../hooks/useBookStore';
import EditorToolbar, { FormatType } from './EditorToolbar';

const Editor: React.FC = () => {
  const { activeChapterId, chapters, updateChapter } = useBookStore();
  const activeChapter = chapters.find(c => c.id === activeChapterId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeChapter) {
      updateChapter(activeChapter.id, { content: e.target.value });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeChapter) {
      updateChapter(activeChapter.id, { title: e.target.value });
    }
  };

  const applyFormat = (format: FormatType) => {
    const textarea = textareaRef.current;
    if (!textarea || !activeChapter) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let newText = '';
    let cursorOffset = 0;

    const prefixLines = (prefix: string) => selectedText.split('\n').map(line => `${prefix}${line}`).join('\n');

    switch (format) {
      case 'bold': newText = `**${selectedText}**`; cursorOffset = 2; break;
      case 'italic': newText = `*${selectedText}*`; cursorOffset = 1; break;
      case 'h1': newText = `# ${selectedText}`; cursorOffset = 2; break;
      case 'h2': newText = `## ${selectedText}`; cursorOffset = 3; break;
      case 'h3': newText = `### ${selectedText}`; cursorOffset = 4; break;
      case 'ul': newText = prefixLines('- '); cursorOffset = 2; break;
      case 'ol': newText = prefixLines('1. '); cursorOffset = 3; break;
      case 'quote': newText = prefixLines('> '); cursorOffset = 2; break;
      case 'codeblock': newText = `\`\`\`\n${selectedText}\n\`\`\``; cursorOffset = 3; break;
      case 'poem': newText = `~\n${selectedText}\n~~`; break;
      case 'right': newText = `-r\n${selectedText}`; break;
      case 'center': newText = `-c\n${selectedText}`; break;
      case 'link': {
        const url = window.prompt('Enter the URL:');
        if (url) {
          newText = `[${selectedText || 'link text'}](${url})`;
          cursorOffset = 1;
        } else {
          return;
        }
        break;
      }
    }

    const updatedContent = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
    updateChapter(activeChapter.id, { content: updatedContent });

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start, start + newText.length);
      } else {
        const cursorPosition = start + cursorOffset;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  const handleInsertImage = () => {
    const textarea = textareaRef.current;
    if (!textarea || !activeChapter) return;

    const url = window.prompt('Enter the Image URL:');
    if (!url) return;

    const altText = window.prompt('Enter Alt Text (optional):', 'image');
    const imageMarkdown = `![${altText || ''}](${url})\n`;
    
    const start = textarea.selectionStart;
    const updatedContent = textarea.value.substring(0, start) + imageMarkdown + textarea.value.substring(start);
    updateChapter(activeChapter.id, { content: updatedContent });

    setTimeout(() => {
      textarea.focus();
      const cursorPosition = start + imageMarkdown.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  if (!activeChapter) {
    return (
      <div className="w-1/2 p-4 flex items-center justify-center bg-surface text-text-secondary">
        Select a chapter to start editing or add a new one.
      </div>
    );
  }

  return (
    <div className="w-1/2 flex flex-col border-r border-border">
      <EditorToolbar onApplyFormat={applyFormat} onInsertImage={handleInsertImage} />
      <div className="p-4 border-b border-border">
        <input
          type="text"
          value={activeChapter.title}
          onChange={handleTitleChange}
          className="w-full bg-transparent text-3xl font-bold text-text focus:outline-none"
          placeholder="Chapter Title"
        />
      </div>
      <textarea
        ref={textareaRef}
        value={activeChapter.content}
        onChange={handleContentChange}
        className="flex-1 w-full p-4 bg-surface text-text-secondary focus:outline-none resize-none leading-relaxed font-mono text-lg"
        placeholder="Start writing your chapter here..."
      />
    </div>
  );
};

export default Editor;
