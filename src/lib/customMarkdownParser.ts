import { visit } from 'unist-util-visit';
import { Root, Paragraph, Text } from 'mdast';

export function customFormattingPlugin() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node: Paragraph) => {
      if (node.children.length > 0 && node.children[0].type === 'text') {
        const textNode = node.children[0] as Text;
        const value = textNode.value.trim();

        if (value.startsWith('-r')) {
          textNode.value = textNode.value.replace('-r', '').trim();
          node.data = { ...node.data, hProperties: { style: 'text-align: right;' } };
        } else if (value.startsWith('-c')) {
          textNode.value = textNode.value.replace('-c', '').trim();
          node.data = { ...node.data, hProperties: { style: 'text-align: center;' } };
        }
      }
    });

    // The poem block (~...~~) is handled directly in the Preview component
    // for more reliable rendering, so we don't need to parse it here.
  };
}
