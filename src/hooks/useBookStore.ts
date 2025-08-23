import { create } from 'zustand';
import { Chapter, BookDetails } from '../types';

interface BookState extends BookDetails {
  chapters: Chapter[];
  activeChapterId: string | null;
  setBookDetails: (details: Partial<Omit<BookDetails, 'contributors' | 'coverImage'>>) => void;
  setCoverImage: (image: string | null) => void;
  
  // Contributor actions
  addContributor: () => void;
  updateContributor: (index: number, value: string) => void;
  removeContributor: (index: number) => void;

  // Chapter actions
  addChapter: () => void;
  updateChapter: (id: string, content: Partial<Omit<Chapter, 'id'>>) => void;
  deleteChapter: (id: string) => void;
  setActiveChapterId: (id: string | null) => void;
}

const initialChapter: Chapter = {
  id: `chapter-${Date.now()}`,
  title: 'Chapter 1',
  content: `# Chapter 1\n\nStart writing your story here. You can use Markdown for formatting.\n\n## Special Formatting\n\n-r\nThis line will be right-aligned.\n\n-c\nThis line will be centered.\n\n~\nThis is a poem.\nIt has alternating indentation.\nFor each line.\nMaking it look distinct.\n~~`,
};

export const useBookStore = create<BookState>((set, get) => ({
  // BookDetails
  title: 'My Awesome Book',
  author: 'A. Uthor',
  publisher: '',
  contributors: ['அட்டைப்படம் வடிவமைப்பு, மின்னூல் உருவாக்கம்'],
  coverImage: null,
  ebookUrl: '',
  license: 'All rights reserved.',

  // Chapter details
  chapters: [initialChapter],
  activeChapterId: initialChapter.id,

  setBookDetails: (details) => set((state) => ({ ...state, ...details })),
  setCoverImage: (image) => set({ coverImage: image }),

  // Contributor management
  addContributor: () => {
    set((state) => ({
      contributors: [...state.contributors, ''],
    }));
  },
  updateContributor: (index, value) => {
    set((state) => {
      const newContributors = [...state.contributors];
      newContributors[index] = value;
      return { contributors: newContributors };
    });
  },
  removeContributor: (index) => {
    set((state) => ({
      contributors: state.contributors.filter((_, i) => i !== index),
    }));
  },

  // Chapter management
  addChapter: () => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: `Chapter ${get().chapters.length + 1}`,
      content: `# Chapter ${get().chapters.length + 1}\n\n`,
    };
    set((state) => ({
      chapters: [...state.chapters, newChapter],
      activeChapterId: newChapter.id,
    }));
  },

  updateChapter: (id, content) => {
    set((state) => ({
      chapters: state.chapters.map((chapter) =>
        chapter.id === id ? { ...chapter, ...content } : chapter
      ),
    }));
  },

  deleteChapter: (id) => {
    set((state) => {
      const newChapters = state.chapters.filter((chapter) => chapter.id !== id);
      const newActiveId = newChapters.length > 0 ? newChapters[0].id : null;
      return { chapters: newChapters, activeChapterId: newActiveId };
    });
  },

  setActiveChapterId: (id) => set({ activeChapterId: id }),
}));
