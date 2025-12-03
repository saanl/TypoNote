import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Palette, Type, Upload, Trash2, Plus, Save, X, AlertTriangle, Code,
  Star, Heart, Zap, Smile, Flag, Bookmark, Lightbulb, Globe, GripVertical,
  Bot, Send, Copy, ArrowDownCircle, Sparkles, Sliders, Image as ImageIcon, RefreshCcw,
  Undo2, FolderInput, FileUp, Link as LinkIcon, Loader2, Download, FileJson,
  AlignJustify, List
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Note, ThemeColors, ViewMode, PRESET_THEMES, FONTS, Snippet, Language, AIConfig, AIModel, ChatMessage, MarkdownThemeName } from './types';
import { createNewNote, formatDate, generateRandomTheme, generateId, generateDefaultNotes, TRANSLATIONS, fileToBase64, extractDominantColor, DEFAULT_CUSTOM_CSS, DEFAULT_SNIPPETS } from './utils';
import Toolbar, { ICON_MAP } from './components/Toolbar';
import MarkdownPreview from './components/MarkdownPreview';
import WysiwygEditor from './components/WysiwygEditor';

// --- Components ---

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    footer,
    size = 'md' 
}) => {
    if (!isOpen) return null;
    const maxWidth = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-md';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
                <div className="flex justify-between items-center p-4 border-b border-[var(--border)] shrink-0">
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
                {footer && (
                    <div className="bg-[var(--bg-secondary)]/50 p-4 border-t border-[var(--border)] flex justify-end gap-3 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

interface FileListItemProps {
    note: Note;
    isActive: boolean;
    onClick: () => void;
    onClose: (e: React.MouseEvent) => void;
    deleteTitle: string;
    untitledTitle: string;
    lang: Language;
    mode: 'comfortable' | 'compact';
}

const FileListItem: React.FC<FileListItemProps> = ({ note, isActive, onClick, onClose, deleteTitle, untitledTitle, lang, mode }) => {
  if (mode === 'compact') {
      return (
        <div 
          onClick={onClick}
          className={`group flex items-center justify-between px-3 py-2 cursor-pointer border-b border-[var(--border)] transition-all ${
            isActive ? 'bg-[var(--bg-secondary)] border-l-2 border-l-[var(--accent)]' : 'hover:bg-[var(--bg-secondary)]/50 border-l-2 border-l-transparent'
          }`}
        >
            <div className="flex items-center gap-2 overflow-hidden flex-1">
                 <FileText size={12} className={`shrink-0 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`} />
                 <span className={`truncate text-xs ${isActive ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                     {note.title || untitledTitle}
                 </span>
            </div>
            
            <div className="flex items-center gap-1 shrink-0 ml-2">
                 <span className="text-[9px] text-[var(--text-secondary)]/60">
                    {new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', { month: '2-digit', day: '2-digit' }).format(new Date(note.updatedAt))}
                 </span>
                 <button 
                    onClick={onClose}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 text-[var(--text-secondary)] transition-opacity"
                    title={deleteTitle}
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
      );
  }

  return (
  <div 
    onClick={onClick}
    className={`group flex flex-col p-3 cursor-pointer border-b border-[var(--border)] transition-all ${
      isActive ? 'bg-[var(--bg-secondary)] border-l-4 border-l-[var(--accent)]' : 'hover:bg-[var(--bg-secondary)]/50 border-l-4 border-l-transparent'
    }`}
  >
    <div className="flex justify-between items-start">
      <h4 className={`font-medium truncate pr-4 ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
        {note.title || untitledTitle}
      </h4>
      <button 
        onClick={onClose}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-[var(--text-secondary)] transition-opacity"
        title={deleteTitle}
      >
        <Trash2 size={14} />
      </button>
    </div>
    <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
      {note.content.substring(0, 50).replace(/[#*`]/g, '')}...
    </p>
    <span className="text-[10px] text-[var(--text-secondary)]/70 mt-2">
      {formatDate(note.updatedAt, lang)}
    </span>
  </div>
  );
};

export default function App() {
  // --- State ---
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('typonote_lang');
    if (saved) return saved as Language;
    // Auto detect
    const browserLang = typeof navigator !== 'undefined' ? (navigator.language || 'en') : 'en';
    return browserLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('typonote_notes');
    return saved ? JSON.parse(saved) : generateDefaultNotes();
  });
  
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0].id);
  
  // Responsive Initialization
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 1024;

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Default to WYSIWYG for mobile/tablet, Split for desktop
    return isSmallScreen ? 'wysiwyg' : 'split';
  });
  
  // Theme & Appearance
  const [currentTheme, setCurrentTheme] = useState<ThemeColors>(PRESET_THEMES[0]);
  const [customThemes, setCustomThemes] = useState<ThemeColors[]>(() => {
    const saved = localStorage.getItem('typonote_custom_themes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeFont, setActiveFont] = useState(FONTS[0]);
  const [uploadedFonts, setUploadedFonts] = useState<{name: string, value: string}[]>([]);
  
  // Markdown Style
  const [markdownTheme, setMarkdownTheme] = useState<MarkdownThemeName>(() => {
      return (localStorage.getItem('typonote_markdown_theme') as MarkdownThemeName) || 'default';
  });
  const [enableHtml, setEnableHtml] = useState<boolean>(() => {
      return localStorage.getItem('typonote_enable_html') === 'true';
  });
  const [customCss, setCustomCss] = useState<string>(() => {
      return localStorage.getItem('typonote_custom_css') || DEFAULT_CUSTOM_CSS;
  });

  // Snippets
  const [customSnippets, setCustomSnippets] = useState<Snippet[]>(() => {
    const saved = localStorage.getItem('typonote_snippets');
    return saved ? JSON.parse(saved) : DEFAULT_SNIPPETS;
  });

  // AI Configuration
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem('typonote_ai_config');
    return saved ? JSON.parse(saved) : { enabled: false, model: 'gemini', apiKey: '' };
  });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Agent / Undo State
  const [lastUndoContent, setLastUndoContent] = useState<string | null>(null);

  // UI Toggles
  const [fileSidebarOpen, setFileSidebarOpen] = useState(() => !isSmallScreen);
  const [settingsSidebarOpen, setSettingsSidebarOpen] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(true);

  // File List View Mode
  const [fileListMode, setFileListMode] = useState<'comfortable' | 'compact'>(() => {
     return (localStorage.getItem('typonote_file_list_mode') as 'comfortable' | 'compact') || 'comfortable';
  });

  // Resize Split State
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isResizing, setIsResizing] = useState(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Dialog State
  const [deleteDialogState, setDeleteDialogState] = useState<{isOpen: boolean, noteId: string | null}>({ isOpen: false, noteId: null });
  const [themeDialogState, setThemeDialogState] = useState<{isOpen: boolean, name: string}>({ isOpen: false, name: '' });
  const [snippetDialogState, setSnippetDialogState] = useState<{
      isOpen: boolean; 
      label: string; 
      icon: string; 
      content: string; 
      iconTab: 'preset'|'emoji'|'image'|'svg';
  }>({ isOpen: false, label: '', icon: '', content: '', iconTab: 'preset' });
  
  // Import Modal State
  const [importDialogState, setImportDialogState] = useState<{isOpen: boolean, url: string, activeTab: 'file' | 'url', error: string | null}>({ isOpen: false, url: '', activeTab: 'file', error: null });
  const [isImporting, setIsImporting] = useState(false);

  // Advanced Theme Modal State
  const [advThemeModalOpen, setAdvThemeModalOpen] = useState(false);
  const [tempTheme, setTempTheme] = useState<ThemeColors>(currentTheme);
  const [activeThemeTab, setActiveThemeTab] = useState<'global' | 'left' | 'right' | 'toolbar' | 'content'>('global');

  // Editor State
  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll Sync Refs
  const scrollingSide = useRef<'editor' | 'preview' | null>(null);

  const t = TRANSLATIONS[language];

  // --- Effects ---

  // Persist Notes
  useEffect(() => {
    localStorage.setItem('typonote_notes', JSON.stringify(notes));
  }, [notes]);

  // Persist Language
  useEffect(() => {
    localStorage.setItem('typonote_lang', language);
  }, [language]);
  
  // Persist Markdown Theme
  useEffect(() => {
    localStorage.setItem('typonote_markdown_theme', markdownTheme);
  }, [markdownTheme]);
  
  // Persist HTML setting
  useEffect(() => {
      localStorage.setItem('typonote_enable_html', String(enableHtml));
  }, [enableHtml]);
  
  // Persist Custom CSS
  useEffect(() => {
      localStorage.setItem('typonote_custom_css', customCss);
  }, [customCss]);

  // Persist Custom Themes
  useEffect(() => {
    localStorage.setItem('typonote_custom_themes', JSON.stringify(customThemes));
  }, [customThemes]);

  // Persist Snippets
  useEffect(() => {
    localStorage.setItem('typonote_snippets', JSON.stringify(customSnippets));
  }, [customSnippets]);

  // Persist AI Config
  useEffect(() => {
    localStorage.setItem('typonote_ai_config', JSON.stringify(aiConfig));
  }, [aiConfig]);
  
  // Persist File List Mode
  useEffect(() => {
      localStorage.setItem('typonote_file_list_mode', fileListMode);
  }, [fileListMode]);

  // Scroll Chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, aiConfig.enabled]);

  // Apply Theme CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    const theme = advThemeModalOpen ? tempTheme : currentTheme;

    root.style.setProperty('--bg-primary', theme.bgPrimary);
    root.style.setProperty('--bg-secondary', theme.bgSecondary);
    root.style.setProperty('--text-primary', theme.textPrimary);
    root.style.setProperty('--text-secondary', theme.textSecondary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--border', theme.border);
    
    // Advanced granular backgrounds
    root.style.setProperty('--bg-sidebar-left', theme.sidebarLeftBg || theme.bgSecondary);
    root.style.setProperty('--bg-sidebar-right', theme.sidebarRightBg || theme.bgSecondary);
    root.style.setProperty('--bg-toolbar', theme.toolbarBg || theme.bgPrimary);
    root.style.setProperty('--bg-content', theme.contentBg || theme.bgPrimary);

  }, [currentTheme, tempTheme, advThemeModalOpen]);

  // Apply Font
  useEffect(() => {
    document.body.style.fontFamily = activeFont.value;
  }, [activeFont]);

  // Resize Event Listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !mainContainerRef.current) return;
      
      const containerRect = mainContainerRef.current.getBoundingClientRect();
      const newRatio = (e.clientX - containerRect.left) / containerRect.width;
      
      if (newRatio > 0.2 && newRatio < 0.8) {
        setSplitRatio(newRatio);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // --- Handlers ---

  const handleUpdateNote = (content: string) => {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : t.untitled;
    
    setNotes(prev => prev.map(n => 
      n.id === activeNoteId ? { ...n, content, title, updatedAt: Date.now() } : n
    ));
  };

  const handleNewNote = () => {
    const newNote = createNewNote('');
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    if (!fileSidebarOpen) setFileSidebarOpen(true);
  };

  const downloadNote = (note: Note) => {
    const blob = new Blob([note.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'note'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const initiateDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (notes.length === 1) {
        alert("Cannot delete the last note.");
        return;
    }
    setDeleteDialogState({ isOpen: true, noteId: id });
  };

  const confirmDelete = (save: boolean) => {
    const id = deleteDialogState.noteId;
    if (!id) return;

    if (save) {
        const note = notes.find(n => n.id === id);
        if (note) downloadNote(note);
    }

    const remaining = notes.filter(n => n.id !== id);
    setNotes(remaining);
    if (activeNoteId === id) setActiveNoteId(remaining[0].id);
    
    setDeleteDialogState({ isOpen: false, noteId: null });
  };

  const handleInsertText = (prefix: string, suffix = '') => {
    const textarea = editorRef.current;
    if (!textarea) return;

    // Only proceed if textarea is visible (part of the layout)
    // This prevents trying to focus a hidden element in View/WYSIWYG mode which can cause scroll jumping
    if (textarea.offsetParent === null) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const scrollTop = textarea.scrollTop; // Capture current scroll position
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newContent = before + prefix + selection + suffix + after;
    handleUpdateNote(newContent);

    setTimeout(() => {
      // Focus with preventScroll to stop jumping
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      // Explicitly restore scroll position in case focus() still shifted it
      textarea.scrollTop = scrollTop;
    }, 0);
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fontName = 'CustomFont-' + Date.now();
      const url = URL.createObjectURL(file);
      const newFontFace = new FontFace(fontName, `url(${url})`);
      
      newFontFace.load().then((loadedFace) => {
        document.fonts.add(loadedFace);
        const newFontObj = { name: file.name.split('.')[0], value: fontName };
        setUploadedFonts(prev => [...prev, newFontObj]);
        setActiveFont(newFontObj);
      }).catch(err => {
        console.error("Font loading failed", err);
      });
    }
  };

  const handleGenerateTheme = () => {
    const newTheme = generateRandomTheme();
    setCurrentTheme(newTheme);
    setTempTheme(newTheme);
  };

  const initiateSaveTheme = () => {
    const defaultName = currentTheme.name.startsWith("Random") ? "My New Theme" : currentTheme.name + " Copy";
    setThemeDialogState({ isOpen: true, name: defaultName });
  };

  const confirmSaveTheme = () => {
    if (!themeDialogState.name.trim()) return;
    const themeToSave = { ...currentTheme, name: themeDialogState.name };
    if (advThemeModalOpen) {
         const advThemeToSave = { ...tempTheme, name: themeDialogState.name };
         setCustomThemes(prev => [...prev, advThemeToSave]);
         setCurrentTheme(advThemeToSave);
         setAdvThemeModalOpen(false);
    } else {
        setCustomThemes(prev => [...prev, themeToSave]);
        setCurrentTheme(themeToSave);
    }
    setThemeDialogState({ isOpen: false, name: '' });
  };

  const handleThemeColorChange = (key: keyof ThemeColors, value: string) => {
    setTempTheme(prev => ({ ...prev, accent: value }));
  };

  const updateColorAlpha = (key: keyof ThemeColors, colorHex: string, alpha: number) => {
    const r = parseInt(colorHex.slice(1, 3), 16);
    const g = parseInt(colorHex.slice(3, 5), 16);
    const b = parseInt(colorHex.slice(5, 7), 16);
    const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    setTempTheme(prev => ({ ...prev, [key]: rgba }));
  };

  const handleThemeImageUpload = async (key: keyof ThemeColors, file: File) => {
    try {
        const base64 = await fileToBase64(file);
        const url = `url('${base64}') center / cover no-repeat fixed`;
        setTempTheme(prev => ({ ...prev, [key]: url }));
    } catch (e) {
        console.error("Image upload failed", e);
    }
  };
  
  const handleAutoPalette = async (file: File) => {
       try {
        const base64 = await fileToBase64(file);
        const domColor = await extractDominantColor(base64);
        setTempTheme(prev => ({ ...prev, accent: domColor, textPrimary: domColor }));
       } catch (e) {}
  };
  
  const handleExportTheme = () => {
      const data = JSON.stringify(tempTheme, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `theme-${tempTheme.name.replace(/\s+/g, '-').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };
  
  const handleImportTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const imported = JSON.parse(evt.target?.result as string);
              // Simple validation
              if (imported.bgPrimary && imported.accent && imported.textPrimary) {
                  setTempTheme({ ...imported, name: imported.name || file.name.replace('.json', '') });
                  alert(t.importThemeSuccess);
              } else {
                  alert(t.importThemeError);
              }
          } catch (err) {
              alert(t.importThemeError);
          }
      };
      reader.readAsText(file);
  };


  const handleSaveSnippet = () => {
    if (!snippetDialogState.content.trim()) return;
    if (!snippetDialogState.label.trim() && !snippetDialogState.icon) return;

    const newSnippet: Snippet = {
        id: generateId(),
        label: snippetDialogState.label,
        icon: snippetDialogState.icon || undefined,
        content: snippetDialogState.content
    };
    setCustomSnippets(prev => [...prev, newSnippet]);
    setSnippetDialogState({ isOpen: false, label: '', icon: '', content: '', iconTab: 'preset' });
  };

  const handleExportPdf = () => {
    window.print();
  };

  // --- Import Handlers ---
  const handleImportLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          const newNote: Note = {
              id: generateId(),
              title: file.name.replace(/\.(md|txt)$/, ''),
              content: content,
              updatedAt: Date.now()
          };
          setNotes(prev => [newNote, ...prev]);
          setActiveNoteId(newNote.id);
          setImportDialogState(prev => ({ ...prev, isOpen: false }));
      };
      reader.readAsText(file);
  };

  const handleImportFromUrl = async () => {
      if (!importDialogState.url) return;
      setIsImporting(true);
      setImportDialogState(prev => ({ ...prev, error: null }));

      try {
          const response = await fetch(importDialogState.url);
          if (!response.ok) throw new Error("Fetch failed");
          const text = await response.text();
          
          // Try to derive title from URL
          const urlParts = importDialogState.url.split('/');
          const derivedTitle = urlParts[urlParts.length - 1] || "Imported Note";

          const newNote: Note = {
              id: generateId(),
              title: derivedTitle,
              content: text,
              updatedAt: Date.now()
          };
           setNotes(prev => [newNote, ...prev]);
           setActiveNoteId(newNote.id);
           setImportDialogState(prev => ({ ...prev, isOpen: false, url: '' }));
      } catch (err) {
          setImportDialogState(prev => ({ ...prev, error: t.importError }));
      } finally {
          setIsImporting(false);
      }
  };

  // --- Sync Scroll Logic ---
  
  const handleEditorScroll = () => {
      if (viewMode !== 'split') return;
      if (scrollingSide.current && scrollingSide.current !== 'editor') return;

      const editor = editorRef.current;
      const preview = previewRef.current;
      
      if (editor && preview) {
          const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
          preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
      }
  };

  const handlePreviewScroll = () => {
      if (viewMode !== 'split') return;
      if (scrollingSide.current && scrollingSide.current !== 'preview') return;

      const editor = editorRef.current;
      const preview = previewRef.current;
      
      if (editor && preview) {
           const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
           editor.scrollTop = percentage * (editor.scrollHeight - editor.clientHeight);
      }
  };


  // --- AI Logic ---
  
  const callAIModel = async (prompt: string, systemInstruction?: string): Promise<string> => {
    if (!aiConfig.apiKey) throw new Error("API Key missing");
    
    if (aiConfig.model === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: aiConfig.apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: systemInstruction ? { systemInstruction } : undefined
        });
        return response.text || '';
    } else {
        // Generic OpenAI Compatible Fetch
        let endpoint = '';
        let modelName = '';
        
        switch (aiConfig.model) {
            case 'deepseek':
                endpoint = 'https://api.deepseek.com/chat/completions';
                modelName = 'deepseek-chat';
                break;
            case 'chatgpt':
                endpoint = 'https://api.openai.com/v1/chat/completions';
                modelName = 'gpt-3.5-turbo';
                break;
            case 'qwen':
                endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
                modelName = 'qwen-turbo';
                break;
            default:
                throw new Error("Unknown model");
        }

        const messages = [];
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${aiConfig.apiKey}`
            },
            body: JSON.stringify({
                model: modelName,
                messages: messages
            })
        });

        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !aiConfig.apiKey) return;
    
    const userMsg = { role: 'user' as const, text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    
    const currentQuery = chatInput; 
    const currentContext = activeNote.content;

    setChatInput('');
    setIsAiLoading(true);

    try {
        const promptWithContext = `Below is the context from the current markdown file I am editing:\n\n\`\`\`markdown\n${currentContext}\n\`\`\`\n\nBased on this context (if relevant), please answer the following question:\n${currentQuery}`;
        const text = await callAIModel(promptWithContext);
        setChatHistory(prev => [...prev, { role: 'model', text }]);
    } catch (e) {
        console.error(e);
        setChatHistory(prev => [...prev, { role: 'model', text: t.aiError, isError: true }]);
    } finally {
        setIsAiLoading(false);
    }
  };

  // Agent Auto-Edit Logic
  const handleAutoEdit = async () => {
    if (!chatInput.trim() || !aiConfig.apiKey) return;

    const currentContext = activeNote.content;
    const instructions = chatInput;
    
    setLastUndoContent(currentContext); // Save for undo
    setChatInput('');
    setIsAiLoading(true);

    // Provide immediate feedback in chat
    setChatHistory(prev => [...prev, { role: 'user', text: `📝 Agent: ${instructions}` }]);

    try {
        const systemPrompt = `You are an expert automated Markdown editing agent. Your goal is to rewrite, format, or modify the provided document based STRICTLY on the user's instructions.
        
        RULES:
        1. Output ONLY the raw Markdown content. 
        2. Do NOT wrap the output in \`\`\`markdown code blocks.
        3. Do NOT include conversational filler like "Here is the updated text".
        4. Maintain the original structure unless asked to change it.
        `;

        const prompt = `CURRENT DOCUMENT:\n${currentContext}\n\nUSER INSTRUCTION:\n${instructions}\n\nREWRITTEN DOCUMENT:`;

        let newContent = await callAIModel(prompt, systemPrompt);
        
        // Sanitize: sometimes models still wrap in code blocks despite instructions
        newContent = newContent.replace(/^```markdown\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '');
        
        handleUpdateNote(newContent);
        setChatHistory(prev => [...prev, { role: 'model', text: t.aiApplied }]);

    } catch (e) {
        setChatHistory(prev => [...prev, { role: 'model', text: t.aiError, isError: true }]);
        setLastUndoContent(null); // Clear undo if failed
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleUndoAutoEdit = () => {
      if (lastUndoContent !== null) {
          handleUpdateNote(lastUndoContent);
          setLastUndoContent(null);
          setChatHistory(prev => [...prev, { role: 'model', text: t.aiRestored }]);
      }
  };

  const handleProofread = async () => {
    if (!aiConfig.apiKey) return;
    const content = activeNote.content;
    const prompt = `Please proofread the following Markdown content. Identify grammatical errors, spelling mistakes, or suggestions for improvement. Output the result clearly.\n\nContent:\n${content}`;
    
    setChatHistory(prev => [...prev, { role: 'user' as const, text: t.checkGrammar + " (Current Note)" }]);
    setIsAiLoading(true);

    try {
        const text = await callAIModel(prompt);
        setChatHistory(prev => [...prev, { role: 'model', text }]);
    } catch (e) {
        setChatHistory(prev => [...prev, { role: 'model', text: t.aiError, isError: true }]);
    } finally {
        setIsAiLoading(false);
    }
  };

  // --- Render Helpers ---
  const allFonts = [...FONTS, ...uploadedFonts];
  const noteToDelete = deleteDialogState.noteId ? notes.find(n => n.id === deleteDialogState.noteId) : null;

  const getEditorStyle = () => {
    if (viewMode === 'edit') return { width: '100%', opacity: 1, pointerEvents: 'auto' as const, display: 'flex' };
    if (viewMode === 'view' || viewMode === 'wysiwyg') return { width: '0%', opacity: 0, padding: 0, pointerEvents: 'none' as const, display: 'none' };
    return { width: `${splitRatio * 100}%`, opacity: 1, pointerEvents: 'auto' as const, display: 'flex' };
  };

  const getPreviewStyle = () => {
    if (viewMode === 'edit') return { width: '0%', opacity: 0, padding: 0, pointerEvents: 'none' as const, display: 'none' };
    if (viewMode === 'view') return { width: '100%', opacity: 1, pointerEvents: 'auto' as const, display: 'block' };
    if (viewMode === 'wysiwyg') return { width: '0%', opacity: 0, padding: 0, pointerEvents: 'none' as const, display: 'none' };
    return { width: `${100 - (splitRatio * 100)}%`, opacity: 1, pointerEvents: 'auto' as const, display: 'block' };
  };

  const transitionClass = isResizing ? '' : 'transition-[width,opacity,padding] duration-500 ease-elastic';

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-500">
      
      {/* --- Modals --- */}
      
      {/* Import Modal */}
      <Modal
        isOpen={importDialogState.isOpen}
        onClose={() => setImportDialogState({ isOpen: false, url: '', activeTab: 'file', error: null })}
        title={t.importTitle}
        footer={
            <>
                <button 
                    onClick={() => setImportDialogState({ isOpen: false, url: '', activeTab: 'file', error: null })}
                    className="px-4 py-2 rounded text-sm font-medium hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                >
                    {t.cancel}
                </button>
                {importDialogState.activeTab === 'url' && (
                    <button 
                        onClick={handleImportFromUrl}
                        disabled={!importDialogState.url || isImporting}
                        className="px-4 py-2 rounded text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 shadow-sm flex items-center gap-2"
                    >
                        {isImporting ? <Loader2 size={16} className="animate-spin" /> : null}
                        {t.fetch}
                    </button>
                )}
            </>
        }
      >
        <div className="flex flex-col gap-4">
             {/* Tabs */}
             <div className="flex bg-[var(--bg-secondary)] p-1 rounded-lg">
                 <button 
                    onClick={() => setImportDialogState(s => ({...s, activeTab: 'file', error: null}))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${importDialogState.activeTab === 'file' ? 'bg-[var(--bg-primary)] text-[var(--accent)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                 >
                     <FileUp size={16} />
                     {t.importFromFile}
                 </button>
                 <button 
                    onClick={() => setImportDialogState(s => ({...s, activeTab: 'url', error: null}))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${importDialogState.activeTab === 'url' ? 'bg-[var(--bg-primary)] text-[var(--accent)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                 >
                     <LinkIcon size={16} />
                     {t.importFromUrl}
                 </button>
             </div>
             
             {/* Content */}
             <div className="min-h-[100px] flex flex-col justify-center">
                {importDialogState.activeTab === 'file' ? (
                     <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[var(--border)] rounded-lg cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--bg-secondary)]/30 transition-colors">
                        <Upload size={32} className="text-[var(--text-secondary)] mb-2" />
                        <span className="text-sm text-[var(--text-secondary)] font-medium">{t.selectFile}</span>
                        <input type="file" accept=".md,.txt" className="hidden" onChange={handleImportLocal} />
                     </label>
                ) : (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">URL</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={importDialogState.url}
                                onChange={(e) => setImportDialogState(s => ({...s, url: e.target.value}))}
                                placeholder={t.urlPlaceholder}
                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-2 pl-9 outline-none focus:border-[var(--accent)] text-sm"
                            />
                            <Globe size={16} className="absolute left-3 top-2.5 text-[var(--text-secondary)]" />
                        </div>
                    </div>
                )}
                
                {importDialogState.error && (
                    <div className="mt-4 p-3 bg-red-500/10 text-red-500 text-sm rounded flex items-center gap-2">
                        <AlertTriangle size={16} />
                        {importDialogState.error}
                    </div>
                )}
             </div>
        </div>
      </Modal>

      {/* Advanced Theme Modal */}
      <Modal 
        isOpen={advThemeModalOpen}
        onClose={() => { setAdvThemeModalOpen(false); setCurrentTheme(currentTheme); }} // Revert if closed without saving
        title={t.advThemeTitle}
        size="lg"
        footer={
            <>
                <button 
                    onClick={() => { setTempTheme(currentTheme); setAdvThemeModalOpen(false); }}
                    className="px-4 py-2 rounded text-sm font-medium hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                >
                    {t.cancel}
                </button>
                <button 
                    onClick={initiateSaveTheme}
                    className="px-4 py-2 rounded text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 shadow-sm"
                >
                    {t.saveTheme}
                </button>
            </>
        }
      >
        <div className="flex h-96">
            {/* Sidebar Tabs */}
            <div className="w-40 border-r border-[var(--border)] flex flex-col justify-between pr-2">
                <div className="flex flex-col gap-1">
                    {[
                        { id: 'global', label: t.globalColors },
                        { id: 'left', label: t.sidebarLeft },
                        { id: 'right', label: t.sidebarRight },
                        { id: 'toolbar', label: t.toolbar },
                        { id: 'content', label: t.contentArea },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveThemeTab(tab.id as any)}
                            className={`text-left px-3 py-2 rounded text-sm transition-colors ${activeThemeTab === tab.id ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                {/* Import/Export Buttons in sidebar bottom */}
                <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col gap-2">
                    <button 
                        onClick={handleExportTheme}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded transition-colors"
                    >
                        <Download size={14} />
                        {t.exportTheme}
                    </button>
                    <label className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded transition-colors cursor-pointer">
                        <FileJson size={14} />
                        {t.importTheme}
                        <input type="file" accept=".json" className="hidden" onChange={handleImportTheme} />
                    </label>
                </div>
            </div>

            {/* Content Panel */}
            <div className="flex-1 pl-6 overflow-y-auto">
                {activeThemeTab === 'global' && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">{t.accentColor}</label>
                            <div className="flex gap-4 items-center">
                                <input 
                                    type="color" 
                                    value={tempTheme.accent.substring(0, 7)}
                                    onChange={(e) => handleThemeColorChange('accent', e.target.value)}
                                    className="h-10 w-20 rounded cursor-pointer"
                                />
                                <span className="font-mono text-xs">{tempTheme.accent}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">{t.textColor}</label>
                            <input 
                                type="color" 
                                value={tempTheme.textPrimary.substring(0, 7)}
                                onChange={(e) => handleThemeColorChange('textPrimary', e.target.value)}
                                className="h-10 w-20 rounded cursor-pointer"
                            />
                        </div>
                    </div>
                )}

                {(['left', 'right', 'toolbar', 'content'] as const).includes(activeThemeTab as any) && (
                    <div className="space-y-6">
                        {/* Background Color & Opacity */}
                        <div>
                            <label className="block text-sm font-medium mb-2">{t.bgColor} / {t.opacity}</label>
                            <div className="flex gap-4 items-center">
                                <input 
                                    type="color" 
                                    value={
                                        (tempTheme as any)[activeThemeTab === 'left' ? 'sidebarLeftBg' : activeThemeTab === 'right' ? 'sidebarRightBg' : activeThemeTab === 'toolbar' ? 'toolbarBg' : 'contentBg']?.startsWith('#') 
                                        ? (tempTheme as any)[activeThemeTab === 'left' ? 'sidebarLeftBg' : activeThemeTab === 'right' ? 'sidebarRightBg' : activeThemeTab === 'toolbar' ? 'toolbarBg' : 'contentBg']?.substring(0,7)
                                        : '#ffffff'
                                    }
                                    onChange={(e) => {
                                        const key = activeThemeTab === 'left' ? 'sidebarLeftBg' : activeThemeTab === 'right' ? 'sidebarRightBg' : activeThemeTab === 'toolbar' ? 'toolbarBg' : 'contentBg';
                                        updateColorAlpha(key, e.target.value, 1);
                                    }}
                                    className="h-10 w-20 rounded cursor-pointer"
                                />
                                <input 
                                    type="range" 
                                    min="0" max="1" step="0.05" defaultValue="1"
                                    onChange={(e) => {
                                        const key = activeThemeTab === 'left' ? 'sidebarLeftBg' : activeThemeTab === 'right' ? 'sidebarRightBg' : activeThemeTab === 'toolbar' ? 'toolbarBg' : 'contentBg';
                                        const current = (tempTheme as any)[key] || '#ffffff';
                                        if(current.startsWith('#')) {
                                            updateColorAlpha(key, current, parseFloat(e.target.value));
                                        }
                                    }}
                                    className="w-32 accent-[var(--accent)]"
                                />
                            </div>
                        </div>

                        {/* Background Image */}
                        <div>
                            <label className="block text-sm font-medium mb-2">{t.bgImage}</label>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center justify-center border-2 border-dashed border-[var(--border)] rounded-lg p-4 cursor-pointer hover:border-[var(--accent)] transition-colors">
                                    <div className="flex flex-col items-center gap-2 text-[var(--text-secondary)]">
                                        <ImageIcon size={24} />
                                        <span className="text-xs">{t.uploadImage}</span>
                                    </div>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="hidden" 
                                        onChange={(e) => {
                                            if(e.target.files?.[0]) {
                                                const key = activeThemeTab === 'left' ? 'sidebarLeftBg' : activeThemeTab === 'right' ? 'sidebarRightBg' : activeThemeTab === 'toolbar' ? 'toolbarBg' : 'contentBg';
                                                handleThemeImageUpload(key, e.target.files[0]);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Magic Palette */}
                         <div>
                             <label className="block text-sm font-medium mb-2">{t.applyImagePalette}</label>
                              <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--accent)] hover:underline">
                                <Sparkles size={12} />
                                {t.uploadImage} & Extract
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    if(e.target.files?.[0]) handleAutoPalette(e.target.files[0]);
                                }} />
                             </label>
                        </div>

                    </div>
                )}
            </div>
        </div>
      </Modal>


      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteDialogState.isOpen}
        onClose={() => setDeleteDialogState({ isOpen: false, noteId: null })}
        title={t.deleteNote}
        footer={
            <>
                <button 
                    onClick={() => setDeleteDialogState({ isOpen: false, noteId: null })}
                    className="px-4 py-2 rounded text-sm font-medium hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                >
                    {t.cancel}
                </button>
                <button 
                    onClick={() => confirmDelete(false)}
                    className="px-4 py-2 rounded text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20"
                >
                    {t.deleteOnly}
                </button>
                <button 
                    onClick={() => confirmDelete(true)}
                    className="px-4 py-2 rounded text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 shadow-sm"
                >
                    {t.saveAndDelete}
                </button>
            </>
        }
      >
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-amber-500 bg-amber-500/10 p-3 rounded-lg">
                <AlertTriangle size={24} />
                <p className="text-sm font-medium">{t.warning}</p>
            </div>
            <p>{t.deletePrompt}</p>
            {noteToDelete && (
                <p className="font-bold text-center">"{noteToDelete.title || t.untitled}"</p>
            )}
        </div>
      </Modal>

      {/* Save Theme Modal */}
      <Modal
        isOpen={themeDialogState.isOpen}
        onClose={() => setThemeDialogState({ isOpen: false, name: '' })}
        title={t.saveThemeTitle}
        footer={
            <>
                <button 
                    onClick={() => setThemeDialogState({ isOpen: false, name: '' })}
                    className="px-4 py-2 rounded text-sm font-medium hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                >
                    {t.cancel}
                </button>
                <button 
                    onClick={confirmSaveTheme}
                    className="px-4 py-2 rounded text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 shadow-sm"
                >
                    {t.save}
                </button>
            </>
        }
      >
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">{t.themeName}</label>
            <input 
                type="text" 
                value={themeDialogState.name}
                onChange={(e) => setThemeDialogState({...themeDialogState, name: e.target.value})}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-2 outline-none focus:border-[var(--accent)]"
                placeholder={t.themePlaceholder}
                autoFocus
            />
            <div className="flex gap-2 mt-2">
                <div className="h-6 w-6 rounded-full border border-[var(--border)]" style={{background: currentTheme.bgPrimary}}></div>
                <div className="h-6 w-6 rounded-full border border-[var(--border)]" style={{background: currentTheme.bgSecondary}}></div>
                <div className="h-6 w-6 rounded-full border border-[var(--border)]" style={{background: currentTheme.accent}}></div>
                <span className="text-xs text-[var(--text-secondary)] self-center">{t.currentPreview}</span>
            </div>
        </div>
      </Modal>

      {/* Add Snippet Modal */}
      <Modal
        isOpen={snippetDialogState.isOpen}
        onClose={() => setSnippetDialogState({ isOpen: false, label: '', icon: '', content: '', iconTab: 'preset' })}
        title={t.addShortcutTitle}
        size="lg"
        footer={
            <>
                <button 
                    onClick={() => setSnippetDialogState({ isOpen: false, label: '', icon: '', content: '', iconTab: 'preset' })}
                    className="px-4 py-2 rounded text-sm font-medium hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                >
                    {t.cancel}
                </button>
                <button 
                    onClick={handleSaveSnippet}
                    className="px-4 py-2 rounded text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 shadow-sm"
                >
                    {t.save}
                </button>
            </>
        }
      >
         <div className="flex flex-col lg:flex-row gap-6">
             {/* Left Column: Icon Picker */}
             <div className="w-full lg:w-1/3">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t.selectIcon}</label>
                
                {/* Icon Tabs */}
                <div className="flex mb-2 bg-[var(--bg-secondary)] rounded p-1">
                    <button 
                        onClick={() => setSnippetDialogState(s => ({...s, iconTab: 'preset'}))}
                        className={`flex-1 text-[10px] py-1 rounded transition-colors ${snippetDialogState.iconTab === 'preset' ? 'bg-[var(--bg-primary)] shadow text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
                    >
                        {t.iconTypePreset}
                    </button>
                    <button 
                        onClick={() => setSnippetDialogState(s => ({...s, iconTab: 'emoji'}))}
                        className={`flex-1 text-[10px] py-1 rounded transition-colors ${snippetDialogState.iconTab === 'emoji' ? 'bg-[var(--bg-primary)] shadow text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
                    >
                        {t.iconTypeEmoji}
                    </button>
                    <button 
                        onClick={() => setSnippetDialogState(s => ({...s, iconTab: 'image'}))}
                        className={`flex-1 text-[10px] py-1 rounded transition-colors ${snippetDialogState.iconTab === 'image' ? 'bg-[var(--bg-primary)] shadow text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
                    >
                        {t.iconTypeImage}
                    </button>
                    <button 
                        onClick={() => setSnippetDialogState(s => ({...s, iconTab: 'svg'}))}
                        className={`flex-1 text-[10px] py-1 rounded transition-colors ${snippetDialogState.iconTab === 'svg' ? 'bg-[var(--bg-primary)] shadow text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
                    >
                        {t.iconTypeSvg}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="bg-[var(--bg-secondary)] p-2 rounded border border-[var(--border)] h-48 overflow-y-auto">
                    {snippetDialogState.iconTab === 'preset' && (
                        <div className="grid grid-cols-4 gap-2">
                            {Object.entries(ICON_MAP).map(([name, Icon]) => (
                                <button
                                    key={name}
                                    onClick={() => setSnippetDialogState(s => ({...s, icon: name}))}
                                    className={`p-1.5 rounded flex items-center justify-center transition-colors aspect-square ${
                                        snippetDialogState.icon === name 
                                            ? 'bg-[var(--accent)] text-white' 
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                                    }`}
                                    title={name}
                                >
                                    <Icon size={20} />
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {snippetDialogState.iconTab === 'emoji' && (
                        <div>
                             <input 
                                type="text" 
                                placeholder="Paste Emoji or Text"
                                className="w-full text-center text-2xl p-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded mb-2"
                                value={snippetDialogState.icon && !ICON_MAP[snippetDialogState.icon] && !snippetDialogState.icon.startsWith('http') && !snippetDialogState.icon.startsWith('<svg') ? snippetDialogState.icon : ''}
                                onChange={(e) => setSnippetDialogState(s => ({...s, icon: e.target.value}))}
                                maxLength={4}
                             />
                             <div className="text-xs text-[var(--text-secondary)] text-center">
                                 Example: 🚀, OK, Hi
                             </div>
                        </div>
                    )}

                    {snippetDialogState.iconTab === 'image' && (
                         <div>
                             <input 
                                type="text" 
                                placeholder="https://example.com/icon.png"
                                className="w-full text-xs p-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded mb-2"
                                value={snippetDialogState.icon && snippetDialogState.icon.startsWith('http') ? snippetDialogState.icon : ''}
                                onChange={(e) => setSnippetDialogState(s => ({...s, icon: e.target.value}))}
                             />
                             {snippetDialogState.icon && snippetDialogState.icon.startsWith('http') && (
                                 <div className="flex justify-center mt-2">
                                     <img src={snippetDialogState.icon} className="w-8 h-8 object-contain bg-white rounded" alt="preview" />
                                 </div>
                             )}
                        </div>
                    )}

                    {snippetDialogState.iconTab === 'svg' && (
                         <div>
                             <textarea 
                                placeholder="<svg ...>...</svg>"
                                className="w-full h-32 text-[10px] p-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded font-mono"
                                value={snippetDialogState.icon && snippetDialogState.icon.startsWith('<svg') ? snippetDialogState.icon : ''}
                                onChange={(e) => setSnippetDialogState(s => ({...s, icon: e.target.value}))}
                             />
                        </div>
                    )}
                </div>
                
                <div className="mt-4">
                     <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t.buttonLabel}</label>
                    <input 
                        type="text" 
                        value={snippetDialogState.label}
                        onChange={(e) => setSnippetDialogState({...snippetDialogState, label: e.target.value})}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-2 outline-none focus:border-[var(--accent)]"
                        placeholder={snippetDialogState.icon ? t.optionalWithIcon : t.buttonLabelPlaceholder}
                        maxLength={10}
                    />
                </div>
             </div>

             {/* Right Column: Content Builder */}
             <div className="flex-1 flex flex-col gap-4">
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t.contentTemplate}</label>
                    <textarea 
                        value={snippetDialogState.content}
                        onChange={(e) => setSnippetDialogState({...snippetDialogState, content: e.target.value})}
                        className="w-full h-32 bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-2 outline-none focus:border-[var(--accent)] font-mono text-sm"
                        placeholder="e.g., <div class='warning'>${}</div>"
                    />
                    <p className="text-xs text-[var(--text-secondary)]/70 mt-1">
                        {t.templateHint}
                    </p>
                 </div>

                 {/* Quick Tags */}
                 <div>
                    <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-2 tracking-wider">{t.quickTags}</label>
                    <div className="flex flex-wrap gap-2">
                        {['div', 'span', 'p', 'h1', 'a', 'pre', 'code', 'br'].map(tag => (
                            <button
                                key={tag}
                                onClick={() => {
                                    const tmpl = tag === 'a' ? `<a href="#">\${}</a>` : tag === 'br' ? '<br />' : `<${tag}>\${}</${tag}>`;
                                    setSnippetDialogState(s => ({...s, content: tmpl}));
                                }}
                                className="px-2 py-1 text-xs bg-[var(--bg-secondary)] hover:bg-[var(--accent)] hover:text-white rounded border border-[var(--border)] transition-colors font-mono"
                            >
                                &lt;{tag}&gt;
                            </button>
                        ))}
                    </div>
                 </div>

                 {/* Style Presets */}
                 <div>
                    <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-2 tracking-wider">{t.stylePresets}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { name: 'Success', class: 'success', bg: '#d4edda', text: '#155724' },
                            { name: 'Error', class: 'error', bg: '#f8d7da', text: '#721c24' },
                            { name: 'Warning', class: 'warning', bg: '#fff3cd', text: '#856404' },
                            { name: 'Info', class: 'info', bg: '#d1ecf1', text: '#0c5460' },
                            { name: 'Active', class: 'active', bg: 'var(--accent)', text: 'white' },
                            { name: 'Inactive', class: 'inactive', bg: '#e2e3e5', text: '#6c757d' },
                        ].map(preset => (
                            <button
                                key={preset.name}
                                onClick={() => setSnippetDialogState(s => ({
                                    ...s, 
                                    content: `<span class="${preset.class}">\${}</span>`
                                }))}
                                className="px-2 py-1 text-xs rounded border border-transparent hover:scale-105 transition-transform text-center font-medium"
                                style={{ backgroundColor: preset.bg, color: preset.text }}
                            >
                                {preset.name}
                            </button>
                        ))}
                    </div>
                 </div>
             </div>
         </div>
      </Modal>

      {/* --- Main App UI --- */}

      {/* Top Toolbar */}
      <Toolbar 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        insertText={handleInsertText}
        onExportPdf={handleExportPdf}
        visible={toolbarVisible}
        onToggleVisible={() => setToolbarVisible(!toolbarVisible)}
        snippets={customSnippets}
        onAddSnippet={() => setSnippetDialogState({ isOpen: true, label: '', icon: '', content: '', iconTab: 'preset' })}
        t={t}
      />

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT SIDEBAR: File List */}
        <div 
          className={`
            border-r border-[var(--border)]
            transition-[width,opacity] duration-500 ease-elastic overflow-hidden flex flex-col no-print
            ${fileSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'}
          `}
          style={{ background: 'var(--bg-sidebar-left)' }}
        >
          {/* Inner container */}
          <div className={`
              w-64 flex flex-col h-full
              transform transition-transform duration-500 ease-elastic
              ${fileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="p-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-secondary)]/10">
                <div className="flex items-center gap-1">
                    <button onClick={() => setFileSidebarOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors p-1" title={t.hideSidebar}>
                        <ChevronsLeft size={16} />
                    </button>
                    <button 
                        onClick={() => setFileListMode(prev => prev === 'comfortable' ? 'compact' : 'comfortable')}
                        className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors p-1"
                        title={fileListMode === 'comfortable' ? t.compactMode : t.comfortableMode}
                    >
                         {fileListMode === 'comfortable' ? <AlignJustify size={16} /> : <List size={16} />}
                    </button>
                </div>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setImportDialogState(s => ({...s, isOpen: true}))}
                        className="text-[var(--accent)] hover:bg-[var(--bg-primary)]/50 p-1 rounded transition-colors" 
                        title={t.importNote}
                    >
                        <FolderInput size={16} />
                    </button>
                    <button onClick={handleNewNote} className="text-[var(--accent)] hover:bg-[var(--bg-primary)]/50 p-1 rounded transition-colors" title={t.createNewNote}>
                        <Plus size={16} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {notes.sort((a,b) => b.updatedAt - a.updatedAt).map(note => (
                <FileListItem 
                    key={note.id} 
                    note={note} 
                    isActive={activeNoteId === note.id} 
                    onClick={() => setActiveNoteId(note.id)}
                    onClose={(e) => initiateDelete(e, note.id)}
                    deleteTitle={t.deleteNote}
                    untitledTitle={t.untitled}
                    lang={language}
                    mode={fileListMode}
                />
                ))}
            </div>
          </div>
        </div>

        {/* CENTER: Main Editor Area with Resize Logic */}
        <div 
            className="flex-1 flex flex-col min-w-0 transition-colors duration-500"
            style={{ background: 'var(--bg-content)' }}
        >
           
           <div ref={mainContainerRef} className="flex-1 flex overflow-hidden relative">
             
             {/* Text Input */}
             <div 
                style={getEditorStyle()} 
                className={`h-full flex flex-col overflow-hidden ${transitionClass} ${viewMode === 'edit' ? 'items-center' : ''}`}
             >
               <textarea
                 ref={editorRef}
                 value={activeNote.content}
                 onChange={(e) => handleUpdateNote(e.target.value)}
                 onScroll={handleEditorScroll}
                 onMouseEnter={() => { scrollingSide.current = 'editor'; }}
                 className={`
                    w-full h-full p-8 resize-none outline-none bg-transparent font-mono text-base leading-relaxed scrollbar-hide
                    ${viewMode === 'edit' ? 'max-w-4xl' : ''}
                 `}
                 placeholder="Start typing..."
               />
             </div>

             {/* Resizer Handle - Visible in split mode */}
             {viewMode === 'split' && (
                 <div
                    onMouseDown={() => setIsResizing(true)}
                    className="w-3 relative cursor-col-resize hover:bg-[var(--bg-secondary)] transition-colors z-10 flex-shrink-0 group flex items-center justify-center -ml-1.5"
                 >
                     <div className="w-[1px] h-full bg-[var(--border)] group-hover:bg-[var(--accent)] transition-colors"></div>
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-[var(--bg-primary)] border border-[var(--border)] rounded flex items-center justify-center shadow-sm opacity-100 transition-opacity">
                        <GripVertical size={12} className="text-[var(--text-secondary)]" />
                     </div>
                 </div>
             )}

             {/* Preview */}
             <div 
                style={getPreviewStyle()}
                className={`h-full overflow-hidden ${transitionClass}`}
             >
               <MarkdownPreview 
                 content={activeNote.content} 
                 className="h-full" 
                 centered={viewMode === 'view'}
                 theme={markdownTheme}
                 enableHtml={enableHtml}
                 customCss={customCss}
                 scrollRef={previewRef}
                 onScroll={handlePreviewScroll}
                 onMouseEnter={() => { scrollingSide.current = 'preview'; }}
               />
             </div>

             {/* WYSIWYG Editor */}
             {viewMode === 'wysiwyg' && (
                <div className="absolute inset-0 overflow-y-auto">
                    <WysiwygEditor 
                        content={activeNote.content}
                        onChange={handleUpdateNote}
                        markdownTheme={markdownTheme}
                        enableHtml={enableHtml}
                        customCss={customCss}
                    />
                </div>
             )}

           </div>

           {/* AI Chat Interface - Collapsible */}
            <div className={`
                transition-[height, opacity] duration-500 ease-elastic border-t border-[var(--border)] bg-[var(--bg-secondary)]/30 backdrop-blur-sm
                ${aiConfig.enabled ? 'h-64 opacity-100' : 'h-0 opacity-0 overflow-hidden'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Chat Header/Tools */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
                        <div className="flex items-center gap-2 text-sm text-[var(--accent)] font-medium">
                            <Bot size={16} />
                            {t.aiAssistant} <span className="text-[10px] bg-[var(--bg-primary)] px-1.5 rounded border border-[var(--border)] text-[var(--text-secondary)]">{aiConfig.model}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {lastUndoContent && (
                                <button 
                                    onClick={handleUndoAutoEdit}
                                    className="text-xs flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border border-yellow-500/30 rounded transition-colors animate-in fade-in"
                                >
                                    <Undo2 size={12} />
                                    {t.aiUndo}
                                </button>
                            )}
                            <button 
                                onClick={handleProofread}
                                disabled={!aiConfig.apiKey || isAiLoading}
                                className="text-xs flex items-center gap-1 px-2 py-1 bg-[var(--bg-primary)] hover:bg-[var(--accent)] hover:text-white border border-[var(--border)] rounded transition-colors disabled:opacity-50"
                            >
                                <Sparkles size={12} />
                                {t.checkGrammar}
                            </button>
                        </div>
                    </div>

                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm relative">
                        {/* API Key Missing Overlay */}
                        {!aiConfig.apiKey && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-secondary)]/50 backdrop-blur-sm z-20">
                                <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border)] shadow-xl flex flex-col items-center text-center max-w-xs animate-in fade-in zoom-in-95">
                                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mb-3">
                                        <Zap size={24} />
                                    </div>
                                    <h3 className="font-bold text-[var(--text-primary)] mb-2">API Key Required</h3>
                                    <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                                        {t.aiKeyMissing}
                                    </p>
                                    <button 
                                        onClick={() => setSettingsSidebarOpen(true)}
                                        className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 shadow-sm w-full"
                                    >
                                        {t.openSettings}
                                    </button>
                                </div>
                            </div>
                        )}

                        {chatHistory.length === 0 && (
                             <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-50">
                                <Bot size={48} className="mb-2" />
                                <p>{t.aiChatPlaceholder}</p>
                             </div>
                        )}
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                                    max-w-[80%] rounded-2xl px-4 py-2 shadow-sm
                                    ${msg.role === 'user' 
                                        ? 'bg-[var(--accent)] text-white rounded-br-none' 
                                        : 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-bl-none text-[var(--text-primary)]'
                                    }
                                    ${msg.isError ? 'border-red-500 text-red-500 bg-red-50' : ''}
                                `}>
                                    <div className="whitespace-pre-wrap">{msg.text}</div>
                                    {msg.role === 'model' && !msg.isError && (
                                        <div className="mt-2 pt-2 border-t border-[var(--border)]/50 flex gap-2 justify-end opacity-0 hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleInsertText(msg.text)}
                                                className="p-1 hover:bg-[var(--bg-secondary)] rounded text-[var(--text-secondary)] hover:text-[var(--accent)]"
                                                title={t.insert}
                                            >
                                                <ArrowDownCircle size={14} />
                                            </button>
                                            <button 
                                                onClick={() => navigator.clipboard.writeText(msg.text)}
                                                className="p-1 hover:bg-[var(--bg-secondary)] rounded text-[var(--text-secondary)] hover:text-[var(--accent)]"
                                                title={t.copy}
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isAiLoading && (
                            <div className="flex justify-start">
                                <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl rounded-bl-none px-4 py-2 text-xs text-[var(--text-secondary)] animate-pulse">
                                    {t.aiThinking}
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-[var(--bg-primary)] border-t border-[var(--border)] flex gap-2">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={t.aiChatPlaceholder}
                            className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
                            disabled={isAiLoading || !aiConfig.apiKey}
                        />
                         {/* Agent Auto-Edit Button */}
                        <button 
                            onClick={handleAutoEdit}
                            disabled={!chatInput.trim() || isAiLoading || !aiConfig.apiKey}
                            className="p-2 bg-[var(--bg-secondary)] text-[var(--accent)] border border-[var(--accent)] rounded-lg hover:bg-[var(--accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={t.autoEdit}
                        >
                            <Sparkles size={18} />
                        </button>
                        {/* Send Chat Button */}
                        <button 
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isAiLoading || !aiConfig.apiKey}
                            className="p-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            title={t.send}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>

        </div>

        {/* RIGHT SIDEBAR: Settings */}
        <div 
          className={`
            border-l border-[var(--border)] 
            transition-[width,opacity] duration-500 ease-elastic overflow-hidden flex flex-col no-print
            ${settingsSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'} 
          `}
          style={{ background: 'var(--bg-sidebar-right)' }}
        >
          {/* Inner container */}
          <div className={`
              w-80 flex flex-col h-full
              transform transition-transform duration-500 ease-elastic
              ${settingsSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          `}>
            {/* Header */}
            <div className="p-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-secondary)]/10">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t.settingsTitle}</span>
                <button onClick={() => setSettingsSidebarOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors" title={t.hideSidebar}>
                    <ChevronsRight size={16} />
                </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
                
                {/* Language */}
                <div className="mb-6">
                    <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-2 tracking-wider">{t.language}</label>
                    <div className="flex bg-[var(--bg-primary)] rounded-lg border border-[var(--border)] p-1">
                        <button 
                            onClick={() => setLanguage('en')}
                            className={`flex-1 text-xs py-1.5 rounded transition-colors ${language === 'en' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        >
                            English
                        </button>
                        <button 
                            onClick={() => setLanguage('zh')}
                            className={`flex-1 text-xs py-1.5 rounded transition-colors ${language === 'zh' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        >
                            中文
                        </button>
                    </div>
                </div>

                <div className="h-px bg-[var(--border)] my-4"></div>

                {/* AI Settings */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">{t.aiAssistant}</h3>
                        <div className="flex items-center">
                           <button 
                                onClick={() => setAiConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                className={`w-8 h-4 rounded-full transition-colors relative ${aiConfig.enabled ? 'bg-[var(--accent)]' : 'bg-gray-300 dark:bg-gray-600'}`}
                           >
                               <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${aiConfig.enabled ? 'translate-x-4' : ''}`}></div>
                           </button>
                        </div>
                    </div>
                    
                    {aiConfig.enabled && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                             <div>
                                <label className="block text-sm font-medium mb-1">{t.aiModel}</label>
                                <select 
                                    value={aiConfig.model}
                                    onChange={(e) => setAiConfig({...aiConfig, model: e.target.value as AIModel})}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded p-2 text-sm outline-none focus:border-[var(--accent)]"
                                >
                                    <option value="gemini">Google Gemini</option>
                                    <option value="deepseek">DeepSeek</option>
                                    <option value="chatgpt">ChatGPT (OpenAI)</option>
                                    <option value="qwen">Qwen (Aliyun)</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-sm font-medium mb-1">{t.apiKey}</label>
                                <div className="relative">
                                    <input 
                                        type="password" 
                                        value={aiConfig.apiKey}
                                        onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded p-2 text-sm outline-none focus:border-[var(--accent)] pr-8"
                                        placeholder={t.apiKeyPlaceholder}
                                    />
                                    {aiConfig.apiKey && <div className="absolute right-2 top-2.5 text-green-500"><Zap size={14} /></div>}
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                <div className="h-px bg-[var(--border)] my-4"></div>

                <h3 className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-4 tracking-wider">{t.appearance}</h3>
                
                {/* Markdown Style */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">{t.markdownStyle}</label>
                    <select 
                        value={markdownTheme}
                        onChange={(e) => setMarkdownTheme(e.target.value as MarkdownThemeName)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded p-2 text-sm outline-none focus:border-[var(--accent)]"
                    >
                        <option value="default">Default / 默认</option>
                        <option value="github">GitHub</option>
                        <option value="vercel">Vercel</option>
                        <option value="latex">LaTeX (Academic)</option>
                        <option value="vscode">VSCode</option>
                    </select>

                     {/* HTML Toggle */}
                    <div className="mt-4 flex items-center justify-between">
                        <div>
                             <label className="block text-sm font-medium">{t.enableHtml}</label>
                             <p className="text-[10px] text-[var(--text-secondary)]">{t.enableHtmlDesc}</p>
                        </div>
                        <button 
                            onClick={() => setEnableHtml(!enableHtml)}
                            className={`w-8 h-4 rounded-full transition-colors relative ${enableHtml ? 'bg-[var(--accent)]' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${enableHtml ? 'translate-x-4' : ''}`}></div>
                        </button>
                    </div>

                    {/* Custom CSS Editor (Only visible when HTML is enabled) */}
                    {enableHtml && (
                        <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                             <label className="block text-sm font-medium mb-1">{t.customCss}</label>
                             <p className="text-[10px] text-[var(--text-secondary)] mb-2">{t.customCssDesc}</p>
                             <textarea 
                                value={customCss}
                                onChange={(e) => setCustomCss(e.target.value)}
                                className="w-full h-32 bg-[var(--bg-primary)] border border-[var(--border)] rounded p-2 text-xs font-mono outline-none focus:border-[var(--accent)]"
                                placeholder=".my-class { color: red; }"
                             />
                        </div>
                    )}
                </div>

                {/* Fonts */}
                <div className="mb-6">
                <label className="block text-sm mb-2 font-medium">{t.fontFamily}</label>
                <select 
                    value={activeFont.value}
                    onChange={(e) => setActiveFont(allFonts.find(f => f.value === e.target.value) || FONTS[0])}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded p-2 text-sm outline-none focus:border-[var(--accent)]"
                >
                    {allFonts.map((f, i) => <option key={`${f.value}-${i}`} value={f.value}>{f.name}</option>)}
                </select>
                <div className="mt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--accent)] hover:underline">
                    <Upload size={12} />
                    {t.uploadFont}
                    <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleFontUpload} />
                    </label>
                </div>
                </div>

                {/* Themes */}
                <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">{t.themes}</label>
                    <div className="flex gap-2">
                    <button onClick={() => { setTempTheme(currentTheme); setAdvThemeModalOpen(true); }} className="p-1.5 rounded hover:bg-[var(--bg-primary)] text-[var(--accent)] transition-transform active:scale-95" title={t.customizeTheme}>
                        <Sliders size={14} />
                    </button>
                    <button onClick={handleGenerateTheme} className="p-1.5 rounded hover:bg-[var(--bg-primary)] text-[var(--accent)] transition-transform active:scale-95" title={t.generateTheme}>
                        <RefreshCcw size={14} />
                    </button>
                    <button onClick={initiateSaveTheme} className="p-1.5 rounded hover:bg-[var(--bg-primary)] text-[var(--accent)] transition-transform active:scale-95" title={t.saveTheme}>
                        <Save size={14} />
                    </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {[...PRESET_THEMES, ...customThemes].map((theme, i) => (
                    <button
                        key={`${theme.name}-${i}`}
                        onClick={() => setCurrentTheme(theme)}
                        className={`
                        text-xs p-2 rounded border text-left truncate flex items-center gap-2 transition-all
                        ${currentTheme.name === theme.name ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] shadow-sm' : 'border-[var(--border)] hover:bg-[var(--bg-primary)]'}
                        `}
                    >
                        <div className="w-3 h-3 rounded-full shrink-0 border border-black/10" style={{background: theme.bgPrimary}}></div>
                        {theme.name}
                    </button>
                    ))}
                </div>
                
                {customThemes.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-xs text-[var(--text-secondary)] mb-2">{t.customThemes}</h4>
                        <div className="space-y-1">
                        {customThemes.map((t, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs p-1 hover:bg-[var(--bg-primary)] rounded group">
                            <span className="truncate flex-1">{t.name}</span>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                setCustomThemes(prev => prev.filter(ct => ct.name !== t.name));
                            }} className="text-[var(--text-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={12} />
                            </button>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
                </div>

            </div>
          </div>
        </div>

      </div>

      {/* Footer Status Bar - Removed Top Border */}
      <div 
        className="h-8 flex items-center justify-between px-3 text-xs text-[var(--text-secondary)] shrink-0 no-print transition-colors duration-500"
        style={{ background: 'var(--bg-content)' }}
      >
         <div className="flex items-center gap-3">
            <button 
              onClick={() => setFileSidebarOpen(!fileSidebarOpen)} 
              className={`hover:text-[var(--text-primary)] transition-colors ${fileSidebarOpen ? 'text-[var(--accent)]' : ''}`}
              title={t.toggleFileList}
            >
              <FileText size={14} />
            </button>
            <span>{activeNote.content.length} {t.chars}</span>
            <span>{activeNote.content.split('\n').length} {t.lines}</span>
         </div>
         <div className="flex items-center gap-3">
            <span>UTF-8</span>
            <button 
              onClick={() => setSettingsSidebarOpen(!settingsSidebarOpen)} 
              className={`hover:text-[var(--text-primary)] transition-colors ${settingsSidebarOpen ? 'text-[var(--accent)]' : ''}`}
              title={t.toggleSettings}
            >
              <Settings size={14} />
            </button>
         </div>
      </div>

    </div>
  );
}