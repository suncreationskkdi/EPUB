import React from 'react';
import { 
  Bold, Italic, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Code2, Link, Image,
  AlignLeft, AlignCenter, AlignRight 
} from 'lucide-react';
import Button from './ui/Button';
import Separator from './ui/Separator';

export type FormatType = 
  | 'bold' | 'italic' 
  | 'h1' | 'h2' | 'h3'
  | 'ul' | 'ol'
  | 'quote' | 'codeblock'
  | 'link'
  | 'poem' | 'poem2' | 'right' | 'center';

interface EditorToolbarProps {
  onApplyFormat: (format: FormatType) => void;
  onInsertImage: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ onApplyFormat, onInsertImage }) => {
  const toolGroups = [
    [
      { icon: Bold, format: 'bold' as const, tooltip: 'Bold' },
      { icon: Italic, format: 'italic' as const, tooltip: 'Italic' },
    ],
    [
      { icon: Heading1, format: 'h1' as const, tooltip: 'Heading 1' },
      { icon: Heading2, format: 'h2' as const, tooltip: 'Heading 2' },
      { icon: Heading3, format: 'h3' as const, tooltip: 'Heading 3' },
    ],
    [
      { icon: List, format: 'ul' as const, tooltip: 'Unordered List' },
      { icon: ListOrdered, format: 'ol' as const, tooltip: 'Ordered List' },
      { icon: Quote, format: 'quote' as const, tooltip: 'Blockquote' },
    ],
    [
      { icon: Code2, format: 'codeblock' as const, tooltip: 'Code Block' },
      { icon: Link, format: 'link' as const, tooltip: 'Insert Link' },
      { icon: Image, action: onInsertImage, tooltip: 'Insert Image' },
    ],
    [
      { icon: AlignLeft, format: 'poem' as const, tooltip: 'Poem Block' },
      { icon: AlignLeft, format: 'poem2' as const, tooltip: 'Poem Block 2 (All Indented)' },
      { icon: AlignCenter, format: 'center' as const, tooltip: 'Center Align' },
      { icon: AlignRight, format: 'right' as const, tooltip: 'Right Align' },
    ]
  ];

  return (
    <div className="bg-surface p-2 rounded-t-lg flex items-center space-x-1 border-b border-border flex-wrap">
      {toolGroups.map((group, groupIndex) => (
        <React.Fragment key={groupIndex}>
          {group.map(({ icon: Icon, format, tooltip, action }) => (
            <Button
              key={tooltip}
              variant="ghost"
              size="icon"
              onClick={() => action ? action() : onApplyFormat(format!)}
              title={tooltip}
              className="text-text-secondary hover:text-primary"
            >
              <Icon size={20} />
            </Button>
          ))}
          {groupIndex < toolGroups.length - 1 && <Separator />}
        </React.Fragment>
      ))}
    </div>
  );
};

export default EditorToolbar;
