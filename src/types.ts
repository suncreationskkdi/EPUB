export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export interface BookDetails {
  title: string;
  author: string;
  publisher: string;
  contributors: string[];
  coverImage: string | null;
  ebookUrl: string;
  license: string;
  colors: {
    bookTitle: string;
    chapterTitle: string;
    paragraph: string;
  };
  chapterAlignment: 'left' | 'center' | 'right';
  paragraphIndent: boolean;
}
