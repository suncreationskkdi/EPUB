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
}
