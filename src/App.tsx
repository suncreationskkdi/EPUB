import React from 'react';
import Header from './components/Header';
import ChapterList from './components/ChapterList';
import Editor from './components/Editor';
import Preview from './components/Preview';

function App() {
  return (
    <div className="flex flex-col h-screen bg-background font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ChapterList />
        <main className="flex-1 flex overflow-hidden">
          <Editor />
          <Preview />
        </main>
      </div>
    </div>
  );
}

export default App;
