import React, { useRef } from 'react';
import { useBookStore } from '../hooks/useBookStore';
import Input from './ui/Input';
import Button from './ui/Button';
import { Upload, Plus, X, Save } from 'lucide-react';

interface BookSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookSettingsDialog: React.FC<BookSettingsDialogProps> = ({ isOpen, onClose }) => {
  const { 
    title, 
    author, 
    publisher, 
    contributors, 
    ebookUrl,
    license,
    colors,
    paragraphIndent,
    chapterAlignment,
    coverImage, 
    setBookDetails, 
    setCoverImage,
    addContributor,
    updateContributor,
    removeContributor
  } = useBookStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-text">Book Settings</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input 
              label="Book Title" 
              value={title} 
              onChange={(e) => setBookDetails({ title: e.target.value })} 
            />
            <Input 
              label="Author" 
              value={author} 
              onChange={(e) => setBookDetails({ author: e.target.value })} 
            />
            <Input 
              label="Publisher (Optional)" 
              value={publisher} 
              onChange={(e) => setBookDetails({ publisher: e.target.value })} 
            />
            <Input 
              label="Ebook URL (Optional)" 
              value={ebookUrl} 
              onChange={(e) => setBookDetails({ ebookUrl: e.target.value })} 
            />
            <Input 
              label="License Details" 
              value={license} 
              onChange={(e) => setBookDetails({ license: e.target.value })} 
              className="md:col-span-2" 
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text mb-4">Typography Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Book Title Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={colors.bookTitle}
                    onChange={(e) => setBookDetails({ colors: { ...colors, bookTitle: e.target.value } })}
                    className="w-12 h-10 rounded border border-border bg-surface"
                  />
                  <Input
                    value={colors.bookTitle}
                    onChange={(e) => setBookDetails({ colors: { ...colors, bookTitle: e.target.value } })}
                    className="flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Chapter Title Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={colors.chapterTitle}
                    onChange={(e) => setBookDetails({ colors: { ...colors, chapterTitle: e.target.value } })}
                    className="w-12 h-10 rounded border border-border bg-surface"
                  />
                  <Input
                    value={colors.chapterTitle}
                    onChange={(e) => setBookDetails({ colors: { ...colors, chapterTitle: e.target.value } })}
                    className="flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Paragraph Text Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={colors.paragraph}
                    onChange={(e) => setBookDetails({ colors: { ...colors, paragraph: e.target.value } })}
                    className="w-12 h-10 rounded border border-border bg-surface"
                  />
                  <Input
                    value={colors.paragraph}
                    onChange={(e) => setBookDetails({ colors: { ...colors, paragraph: e.target.value } })}
                    className="flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="paragraphIndent"
                checked={paragraphIndent}
                onChange={(e) => setBookDetails({ paragraphIndent: e.target.checked })}
                className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-2"
              />
              <label htmlFor="paragraphIndent" className="text-sm font-medium text-text-secondary">
                Enable paragraph indentation (first line indent)
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Chapter Heading Alignment</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="chapterAlignment"
                    value="left"
                    checked={chapterAlignment === 'left'}
                    onChange={(e) => setBookDetails({ chapterAlignment: e.target.value as 'left' | 'center' | 'right' })}
                    className="w-4 h-4 text-primary bg-surface border-border focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm text-text-secondary">Left</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="chapterAlignment"
                    value="center"
                    checked={chapterAlignment === 'center'}
                    onChange={(e) => setBookDetails({ chapterAlignment: e.target.value as 'left' | 'center' | 'right' })}
                    className="w-4 h-4 text-primary bg-surface border-border focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm text-text-secondary">Center</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="chapterAlignment"
                    value="right"
                    checked={chapterAlignment === 'right'}
                    onChange={(e) => setBookDetails({ chapterAlignment: e.target.value as 'left' | 'center' | 'right' })}
                    className="w-4 h-4 text-primary bg-surface border-border focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm text-text-secondary">Right</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Contributors</label>
            <div className="space-y-2">
              {contributors.map((contributor, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input 
                    value={contributor} 
                    onChange={(e) => updateContributor(index, e.target.value)} 
                    className="flex-grow"
                    placeholder={`Contributor ${index + 1}`}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeContributor(index)} 
                    className="text-text-secondary hover:text-error"
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addContributor} className="mt-2">
              <Plus size={16} className="mr-2" />
              Add Contributor
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} className="mr-2" />
              {coverImage ? 'Change Cover' : 'Upload Cover'}
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleCoverUpload} 
              accept="image/*" 
              className="hidden" 
            />
            {coverImage && (
              <img 
                src={coverImage} 
                alt="Cover preview" 
                className="h-16 w-auto rounded-md shadow-md" 
              />
            )}
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Save size={16} className="mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookSettingsDialog;