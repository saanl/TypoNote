import React from 'react';
import { 
  Bold, Italic, Heading1, Heading2, Heading3, 
  List, ListOrdered, Table, Image, Link, Code, 
  Minus, Quote, Eye, Columns, FileText, Download,
  Plus, ChevronUp, ChevronDown,
  Star, Heart, Zap, Smile, Flag, Bookmark, AlertTriangle, Lightbulb,
  CheckCircle, AlertCircle, Info,
  MonitorPlay
} from 'lucide-react';
import { ViewMode, Snippet, TranslationMap } from '../types';

interface Props {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  insertText: (prefix: string, suffix?: string) => void;
  onExportPdf: () => void;
  visible: boolean;
  onToggleVisible: () => void;
  snippets: Snippet[];
  onAddSnippet: () => void;
  t: TranslationMap;
}

// Map string names to Lucide components for rendering
export const ICON_MAP: Record<string, React.FC<any>> = {
  'Star': Star,
  'Heart': Heart,
  'Zap': Zap,
  'Smile': Smile,
  'Flag': Flag,
  'Bookmark': Bookmark,
  'AlertTriangle': AlertTriangle,
  'Lightbulb': Lightbulb,
  'CheckCircle': CheckCircle,
  'AlertCircle': AlertCircle,
  'Info': Info
};

const Toolbar: React.FC<Props> = ({ 
  viewMode, setViewMode, insertText, onExportPdf, 
  visible, onToggleVisible, snippets, onAddSnippet, t
}) => {

  const handleSnippetClick = (e: React.MouseEvent, snippet: Snippet) => {
    e.preventDefault(); // Prevent default focus loss/scrolling behavior
    // Check if content has ${} placeholder
    const parts = snippet.content.split('${}');
    if (parts.length > 1) {
      // It's a template
      insertText(parts[0], parts[1]);
    } else {
      // It's a simple insertion
      insertText(snippet.content, '');
    }
  };

  const ToolbarButton = ({ onClick, icon: Icon, active = false, title }: any) => (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-2 rounded-md transition-colors ${
        active 
          ? 'bg-[var(--accent)] text-white' 
          : 'hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
    >
      <Icon size={18} />
    </button>
  );

  const renderSnippetIcon = (s: Snippet) => {
      if (!s.icon) return <span className="text-sm font-medium">{s.label}</span>;

      // 1. Check if it matches a preset Lucide icon
      const IconComponent = ICON_MAP[s.icon];
      if (IconComponent) {
          return <IconComponent size={16} />;
      }
      
      // 2. Check if it's an Image URL (basic heuristic)
      if (s.icon.startsWith('http') || s.icon.startsWith('data:image')) {
          return <img src={s.icon} alt={s.label} className="w-4 h-4 object-contain" />;
      }

      // 3. Check if it's raw SVG
      if (s.icon.trim().startsWith('<svg')) {
           return <div className="w-4 h-4 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: s.icon }} />;
      }

      // 4. Fallback to text (Emoji or generic class name text)
      return <span className="text-sm">{s.icon}</span>;
  };

  return (
    <div 
        className="relative z-40 shrink-0 no-print flex flex-col transition-colors duration-500"
        style={{ background: 'var(--bg-toolbar)' }}
    >
      {/* Animated Toolbar Content */}
      <div 
        className={`
            transition-[height,opacity] duration-500 ease-elastic overflow-hidden
            ${visible ? 'h-14 opacity-100' : 'h-0 opacity-0'}
        `}
      >
        <div 
            className={`
                h-14 flex items-center justify-between px-4
                transform transition-transform duration-500 ease-elastic
                ${visible ? 'translate-y-0' : '-translate-y-10'}
            `}
        >
            {/* Formatting Tools */}
            <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar mask-gradient pr-4">
                <div className="flex space-x-1 pr-2 border-r border-[var(--border)] mr-2 shrink-0">
                <ToolbarButton icon={Heading1} onClick={() => insertText('# ', '')} title={t.heading1} />
                <ToolbarButton icon={Heading2} onClick={() => insertText('## ', '')} title={t.heading2} />
                <ToolbarButton icon={Heading3} onClick={() => insertText('### ', '')} title={t.heading3} />
                </div>
                
                <div className="flex space-x-1 pr-2 border-r border-[var(--border)] mr-2 shrink-0">
                <ToolbarButton icon={Bold} onClick={() => insertText('**', '**')} title={t.bold} />
                <ToolbarButton icon={Italic} onClick={() => insertText('*', '*')} title={t.italic} />
                <ToolbarButton icon={Minus} onClick={() => insertText('\n---\n', '')} title={t.divider} />
                </div>

                <div className="flex space-x-1 pr-2 border-r border-[var(--border)] mr-2 shrink-0">
                    <ToolbarButton icon={List} onClick={() => insertText('- ', '')} title={t.bulletList} />
                    <ToolbarButton icon={ListOrdered} onClick={() => insertText('1. ', '')} title={t.orderedList} />
                    <ToolbarButton icon={Quote} onClick={() => insertText('> ', '')} title={t.quote} />
                </div>

                <div className="flex space-x-1 pr-2 border-r border-[var(--border)] mr-2 shrink-0">
                    <ToolbarButton icon={Code} onClick={() => insertText('```\n', '\n```')} title={t.codeBlock} />
                    <ToolbarButton icon={Table} onClick={() => insertText('| Header | Header |\n| --- | --- |\n| Cell | Cell |', '')} title={t.table} />
                    <ToolbarButton icon={Link} onClick={() => insertText('[Link Title](url)', '')} title={t.link} />
                    <ToolbarButton icon={Image} onClick={() => insertText('![Alt Text](url)', '')} title={t.image} />
                </div>

                {/* Custom Snippets Section */}
                <div className="flex items-center space-x-1">
                    {snippets.map((s) => (
                         <button 
                            key={s.id}
                            type="button"
                            onClick={(e) => handleSnippetClick(e, s)}
                            className="h-8 min-w-[32px] px-2 flex items-center justify-center rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-transparent hover:border-[var(--border)]"
                            title={s.content}
                        >
                            {renderSnippetIcon(s)}
                        </button>
                    ))}

                    <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); onAddSnippet(); }}
                        className="flex items-center gap-1 p-1.5 px-2 rounded-md text-sm font-medium transition-colors text-[var(--accent)] hover:bg-[var(--bg-secondary)]"
                        title={t.addShortcut}
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-3 pl-2 shrink-0 z-10 shadow-[-10px_0_10px_-5px_var(--bg-toolbar)]" style={{ background: 'var(--bg-toolbar)' }}>
                <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); onExportPdf(); }}
                    className="flex items-center gap-1 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors px-2 py-1 rounded hover:bg-[var(--bg-secondary)]"
                >
                    <Download size={16} />
                    <span className="hidden lg:inline">{t.pdf}</span>
                </button>

                <div className="flex bg-[var(--bg-secondary)] rounded-lg p-1 space-x-1">
                <ToolbarButton 
                    icon={FileText} 
                    active={viewMode === 'edit'} 
                    onClick={() => setViewMode('edit')} 
                    title={t.editMode}
                />
                <ToolbarButton 
                    icon={MonitorPlay} 
                    active={viewMode === 'wysiwyg'} 
                    onClick={() => setViewMode('wysiwyg')} 
                    title={t.wysiwygMode}
                />
                <ToolbarButton 
                    icon={Columns} 
                    active={viewMode === 'split'} 
                    onClick={() => setViewMode('split')} 
                    title={t.splitMode}
                />
                <ToolbarButton 
                    icon={Eye} 
                    active={viewMode === 'view'} 
                    onClick={() => setViewMode('view')} 
                    title={t.viewMode}
                />
                </div>
            </div>
        </div>
      </div>
      
      {/* Toggle Handle */}
      <div 
        onClick={onToggleVisible}
        className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-12 h-3 cursor-pointer group z-50 flex justify-center"
        title={visible ? t.hideToolbar : t.showToolbar}
      >
        <div 
            className="w-full h-full border-b border-x border-[var(--border)] rounded-b-lg flex items-center justify-center shadow-sm transition-colors"
            style={{ background: 'var(--bg-toolbar)' }}
        >
            {visible ? (
                <ChevronUp size={10} className="text-[var(--text-secondary)]" />
            ) : (
                <ChevronDown size={10} className="text-[var(--text-secondary)]" />
            )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;