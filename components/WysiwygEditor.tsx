import React, { useState, useEffect, useRef } from 'react';
import MarkdownPreview from './MarkdownPreview';
import { MarkdownThemeName } from '../types';

interface Props {
  content: string;
  onChange: (newContent: string) => void;
  markdownTheme: MarkdownThemeName;
  enableHtml: boolean;
  customCss: string;
}

interface Block {
  id: string; // Use index-based ID effectively but store as string
  content: string;
  type: 'line' | 'code-block' | 'table';
}

const WysiwygEditor: React.FC<Props> = ({ 
  content, 
  onChange,
  markdownTheme,
  enableHtml,
  customCss
}) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Parse content into blocks
  useEffect(() => {
    // Only re-parse if we are not editing to avoid overwriting local edit state
    // OR if the content length changed significantly (external update)
    // For this simple implementation, we re-parse on every external content change
    // but we need to ensure we don't lose focus or cursor position if it was self-triggered.
    // However, since we handle local edits in the textarea, we only push UP to parent.
    // The parent pushes DOWN. We need to handle this cycle.
    // Simplified strategy: We always re-parse, assuming onChange is fast.
    
    const lines = content.split('\n');
    const newBlocks: Block[] = [];
    
    let inCodeBlock = false;
    let inTable = false;
    let currentBlockLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isCodeFence = line.trim().startsWith('```');
        const isTableRow = line.trim().startsWith('|');

        // Handling Code Blocks
        if (isCodeFence) {
            if (inCodeBlock) {
                // End of code block
                currentBlockLines.push(line);
                newBlocks.push({ id: `blk-${newBlocks.length}`, content: currentBlockLines.join('\n'), type: 'code-block' });
                currentBlockLines = [];
                inCodeBlock = false;
                continue;
            } else {
                // Start of code block
                // If we were building a table or text, push it first
                if (currentBlockLines.length > 0) {
                     newBlocks.push({ id: `blk-${newBlocks.length}`, content: currentBlockLines.join('\n'), type: inTable ? 'table' : 'line' });
                     currentBlockLines = [];
                     inTable = false;
                }
                inCodeBlock = true;
                currentBlockLines.push(line);
                continue;
            }
        }
        
        if (inCodeBlock) {
            currentBlockLines.push(line);
            continue;
        }

        // Handling Tables
        // Simple heuristic: consecutive lines starting with |
        if (isTableRow) {
            if (!inTable) {
                // Start of table
                // Push previous text if any
                 if (currentBlockLines.length > 0) {
                     newBlocks.push({ id: `blk-${newBlocks.length}`, content: currentBlockLines.join('\n'), type: 'line' });
                     currentBlockLines = [];
                }
                inTable = true;
            }
            currentBlockLines.push(line);
            continue;
        } else if (inTable) {
            // End of table (encountered non-table line)
            newBlocks.push({ id: `blk-${newBlocks.length}`, content: currentBlockLines.join('\n'), type: 'table' });
            currentBlockLines = [];
            inTable = false;
            // Process current line as normal text below
        }

        // Normal Text
        // For normal text, we treat EVERY LINE as a block to allow line-level editing
        // UNLESS we are grouping logic (like tables).
        // To strictly follow "click line to edit", let's push each line.
        if (currentBlockLines.length > 0) {
             // Should not happen for normal lines if we push immediately, 
             // but handles leftover from previous logic
             newBlocks.push({ id: `blk-${newBlocks.length}`, content: currentBlockLines.join('\n'), type: 'line' });
             currentBlockLines = [];
        }
        
        newBlocks.push({ id: `blk-${newBlocks.length}`, content: line, type: 'line' });
    }

    // Flush remaining
    if (currentBlockLines.length > 0) {
        newBlocks.push({ id: `blk-${newBlocks.length}`, content: currentBlockLines.join('\n'), type: inCodeBlock ? 'code-block' : inTable ? 'table' : 'line' });
    }

    setBlocks(newBlocks);
  }, [content]);

  const handleBlockChange = (index: number, newBlockContent: string) => {
    // Optimistically update local blocks
    const updatedBlocks = [...blocks];
    updatedBlocks[index] = { ...updatedBlocks[index], content: newBlockContent };
    setBlocks(updatedBlocks);
  };

  const handleBlockBlur = () => {
    setEditingIndex(null);
    // Reconstruct full content
    const fullContent = blocks.map(b => b.content).join('\n');
    onChange(fullContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      // If Enter is pressed in a normal line block, we might want to split blocks?
      // For simplicity in this version, we let the textarea handle newlines. 
      // When re-parsed, it will become multiple blocks.
      // However, to make it feel like a "line" editor, Shift+Enter could be newline, Enter could be "save and go next".
      // But standard textarea behavior is safer for data integrity.
      if (e.key === 'Escape') {
          handleBlockBlur();
      }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 pb-32">
      {blocks.map((block, index) => (
        <div 
            key={index} 
            className="min-h-[1.5em] relative group"
            onClick={() => {
                if (editingIndex !== index) setEditingIndex(index);
            }}
        >
          {editingIndex === index ? (
            <textarea
              autoFocus
              value={block.content}
              onChange={(e) => handleBlockChange(index, e.target.value)}
              onBlur={handleBlockBlur}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-full bg-transparent outline-none font-mono text-base resize-none overflow-hidden"
              style={{ 
                  minHeight: '1.5em',
                  // Simple auto-height hack
                  height: `${Math.max(block.content.split('\n').length * 1.5, 1.5)}em`
              }}
            />
          ) : (
            <div className={`cursor-text ${block.content.trim() === '' ? 'h-6' : ''}`}>
               {/* Render empty lines effectively */}
               {block.content.trim() === '' ? (
                   <div className="opacity-0 group-hover:opacity-30 select-none text-gray-400">Type here...</div>
               ) : (
                   <MarkdownPreview 
                        content={block.content} 
                        theme={markdownTheme}
                        enableHtml={enableHtml}
                        customCss={customCss}
                        className="!p-0" // Remove padding for inline feel
                    />
               )}
            </div>
          )}
        </div>
      ))}
      
      {/* Click area at bottom to append new line */}
      <div 
        className="h-32 cursor-text" 
        onClick={() => {
            const fullContent = blocks.map(b => b.content).join('\n') + '\n';
            onChange(fullContent);
            // The useEffect will trigger re-parse, creating a new empty block at the end
            // We can try to auto-focus it, but that requires more complex ref management.
            // For now, user has to click the new empty line.
        }} 
      />
    </div>
  );
};

export default WysiwygEditor;