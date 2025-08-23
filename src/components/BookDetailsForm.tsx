import React, { useRef } from 'react';
import { useBookStore } from '../hooks/useBookStore';
import Input from './ui/Input';
import Button from './ui/Button';
import { Upload, Plus, X } from 'lucide-react';

const BookDetailsForm: React.FC = () => {
  const { 
    title, 
    author, 
    publisher, 
    contributors, 
    ebookUrl,
    license,
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

  return (
    <div className="p-6 space-y-6 bg-surface border-b border-border overflow-y-auto max-h-[40vh]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input label="Book Title" value={title} onChange={(e) => setBookDetails({ title: e.target.value })} />
        <Input label="Author" value={author} onChange={(e) => setBookDetails({ author: e.target.value })} />
        <Input label="Publisher (Optional)" value={publisher} onChange={(e) => setBookDetails({ publisher: e.target.value })} />
        <Input label="Ebook URL (Optional)" value={ebookUrl} onChange={(e) => setBookDetails({ ebookUrl: e.target.value })} />
        <Input label="License Details" value={license} onChange={(e) => setBookDetails({ license: e.target.value })} className="md:col-span-2" />
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
              <Button variant="ghost" size="icon" onClick={() => removeContributor(index)} className="text-text-secondary hover:text-error">
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
        <input type="file" ref={fileInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
        {coverImage && <img src={coverImage} alt="Cover preview" className="h-12 w-auto rounded-md shadow-md" />}
      </div>
    </div>
  );
};

export default BookDetailsForm;
