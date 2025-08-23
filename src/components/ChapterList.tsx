import React from 'react';
import { useBookStore } from '../hooks/useBookStore';
import { FileText, PlusCircle, Trash2 } from 'lucide-react';
import Button from './ui/Button';

const ChapterList: React.FC = () => {
  const { chapters, activeChapterId, setActiveChapterId, addChapter, deleteChapter, updateChapter } = useBookStore();

  return (
    <div className="w-64 bg-surface flex flex-col h-full border-r border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-text">Chapters</h2>
      </div>
      <div className="flex-grow overflow-y-auto">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
              activeChapterId === chapter.id ? 'bg-primary/20 text-primary' : 'hover:bg-border'
            }`}
            onClick={() => setActiveChapterId(chapter.id)}
          >
            <div className="flex items-center space-x-2">
              <FileText size={16} />
              <input
                type="text"
                value={chapter.title}
                onChange={(e) => updateChapter(chapter.id, { title: e.target.value })}
                className="bg-transparent outline-none focus:ring-1 focus:ring-primary rounded px-1 w-full"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-text-secondary hover:text-error"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to delete "${chapter.title}"?`)) {
                  deleteChapter(chapter.id);
                }
              }}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-border">
        <Button variant="secondary" onClick={addChapter} className="w-full">
          <PlusCircle size={16} className="mr-2" />
          Add Chapter
        </Button>
      </div>
    </div>
  );
};

export default ChapterList;
