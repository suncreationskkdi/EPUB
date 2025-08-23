import React from 'react';
import { BookOpen, Download, Settings } from 'lucide-react';
import Button from './ui/Button';
import { useBookStore } from '../hooks/useBookStore';
import { exportToPDF, exportToPDFSmall, exportToHTML, exportToEPUB, exportToPlainText } from '../lib/exportUtils';
import BookSettingsDialog from './BookSettingsDialog';

const Header: React.FC = () => {
  const bookState = useBookStore();
  const [showSettings, setShowSettings] = React.useState(false);

  return (
    <>
      <header className="bg-surface h-16 flex items-center justify-between px-6 border-b border-border shadow-md">
        <div className="flex items-center space-x-3">
          <BookOpen className="text-primary" size={28} />
          <h1 className="text-xl font-bold text-text">Epubify</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={() => setShowSettings(true)}>
            <Settings size={16} className="mr-2" />
            Book Settings
          </Button>
          <Button variant="secondary" onClick={() => exportToPlainText(bookState, bookState.chapters)}>Plain Text</Button>
          <Button variant="secondary" onClick={() => exportToHTML(bookState, bookState.chapters)}>HTML</Button>
          <Button variant="secondary" onClick={() => exportToEPUB(bookState, bookState.chapters)}>EPUB</Button>
          <Button variant="primary" onClick={() => exportToPDF(bookState, bookState.chapters)}>
            <Download size={16} className="mr-2" />
            Export PDF
          </Button>
          <Button variant="primary" onClick={() => exportToPDFSmall(bookState, bookState.chapters)}>
            <Download size={16} className="mr-2" />
            PDF Small
          </Button>
        </div>
      </header>
      
      <BookSettingsDialog 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
};

export default Header;
