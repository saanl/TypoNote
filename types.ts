

export type ViewMode = 'edit' | 'split' | 'view' | 'wysiwyg';
export type Language = 'en' | 'zh';

export type AIModel = 'gemini' | 'deepseek' | 'chatgpt' | 'qwen';
export type MarkdownThemeName = 'default' | 'github' | 'vercel' | 'latex' | 'vscode';

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface Snippet {
  id: string;
  label: string; // The text to show if no icon is selected, or used as tooltip
  icon?: string; // The name of the icon component
  content: string; // The template content
}

export interface AIConfig {
  enabled: boolean;
  model: AIModel;
  apiKey: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface ThemeColors {
  name: string;
  bgPrimary: string;   // Main background fallback
  bgSecondary: string; // Sidebar/Toolbar background fallback
  textPrimary: string;
  textSecondary: string;
  accent: string;
  border: string;
  
  // Advanced granular backgrounds (CSS values: color, rgba, or url)
  sidebarLeftBg?: string;
  sidebarRightBg?: string;
  toolbarBg?: string;
  contentBg?: string;
}

export interface TranslationMap {
  [key: string]: string;
}

export const PRESET_THEMES: ThemeColors[] = [
  {
    name: 'Light',
    bgPrimary: '#ffffff',
    bgSecondary: '#f3f4f6',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    accent: '#3b82f6',
    border: '#e5e7eb'
  },
  {
    name: 'Dark',
    bgPrimary: '#111827',
    bgSecondary: '#1f2937',
    textPrimary: '#f9fafb',
    textSecondary: '#9ca3af',
    accent: '#60a5fa',
    border: '#374151'
  },
  {
    name: 'Morandi',
    bgPrimary: '#f0efe9', // Soft beige/grey
    bgSecondary: '#e6e5df',
    textPrimary: '#5e5e5e', // Muted dark grey
    textSecondary: '#8f8f8f',
    accent: '#7a8b99', // Muted blue-grey
    border: '#d4d3cd'
  },
  {
    name: 'Ocean',
    bgPrimary: '#0f172a',
    bgSecondary: '#1e293b',
    textPrimary: '#e2e8f0',
    textSecondary: '#94a3b8',
    accent: '#38bdf8',
    border: '#334155'
  },
  {
    name: 'Dracula',
    bgPrimary: '#282a36',
    bgSecondary: '#44475a',
    textPrimary: '#f8f8f2',
    textSecondary: '#bd93f9',
    accent: '#ff79c6',
    border: '#6272a4'
  },
  {
    name: 'Moonlight',
    bgPrimary: '#222436',
    bgSecondary: '#191a2a',
    textPrimary: '#c8d3f5',
    textSecondary: '#828bb8',
    accent: '#c099ff',
    border: '#2f334d'
  },
  {
    name: 'Solarized',
    bgPrimary: '#fdf6e3',
    bgSecondary: '#eee8d5',
    textPrimary: '#657b83',
    textSecondary: '#93a1a1',
    accent: '#2aa198',
    border: '#d3d7cf'
  },
  {
    name: 'Parchment',
    bgPrimary: '#fcf5e5', // Warm parchment
    bgSecondary: '#f0e6d2', // Darker parchment for sidebar
    textPrimary: '#2c1810', // Deep ink brown
    textSecondary: '#5d4037', // Lighter sepia
    accent: '#8d6e63', // Rustic brown/reddish accent
    border: '#dccab1' // Aged paper border
  }
];

export const FONTS = [
  { name: 'System Sans', value: '"Inter", system-ui, sans-serif' },
  { name: 'System Serif', value: 'Georgia, serif' },
  { name: 'Mono', value: '"Fira Code", monospace' },
  { name: 'Courier', value: '"Courier New", monospace' },
  { name: 'Helvetica', value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
];