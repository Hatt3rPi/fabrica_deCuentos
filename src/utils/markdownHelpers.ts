/**
 * Utilidades para manejar contenido Markdown en prompts
 */

/**
 * Detecta si un texto contiene sintaxis Markdown
 */
export function isMarkdown(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  // Patrones comunes de Markdown
  const markdownPatterns = [
    /^#{1,6}\s/m,           // Headers (# ## ###)
    /\*\*[^*]+\*\*/,        // Bold (**text**)
    /\*[^*]+\*/,            // Italic (*text*)
    /`[^`]+`/,              // Inline code (`code`)
    /```[\s\S]*?```/,       // Code blocks (```code```)
    /^\s*[-*+]\s/m,         // Unordered lists (- * +)
    /^\s*\d+\.\s/m,         // Ordered lists (1. 2.)
    /^\s*>\s/m,             // Blockquotes (>)
    /\[([^\]]+)\]\(([^)]+)\)/, // Links ([text](url))
    /!\[([^\]]*)\]\(([^)]+)\)/, // Images (![alt](src))
    /^\s*\|.*\|.*$/m,       // Tables (|col1|col2|)
    /^---+$/m,              // Horizontal rules (---)
  ];

  return markdownPatterns.some(pattern => pattern.test(text));
}

/**
 * Limpia y valida contenido Markdown para almacenamiento
 */
export function sanitizeMarkdown(text: string): string {
  if (!text) return '';
  
  // Trim whitespace pero preserva líneas en blanco intencionales
  return text.trim();
}

/**
 * Convierte texto plano a Markdown básico si es necesario
 */
export function enhanceTextAsMarkdown(text: string): string {
  if (!text) return '';
  
  // Si ya es Markdown, no hacer nada
  if (isMarkdown(text)) return text;
  
  // Conversiones básicas de texto plano a Markdown
  let enhanced = text;
  
  // Convertir líneas que parecen títulos
  enhanced = enhanced.replace(/^([A-Z][A-Za-z\s]{3,}):?$/gm, '## $1');
  
  // Convertir listas simples
  enhanced = enhanced.replace(/^[-*]\s/gm, '- ');
  enhanced = enhanced.replace(/^\d+[.)]\s/gm, (match) => {
    const num = match.match(/^\d+/)?.[0] || '1';
    return `${num}. `;
  });
  
  return enhanced;
}

/**
 * Obtiene un extracto del contenido para preview
 */
export function getMarkdownExcerpt(text: string, maxLength: number = 100): string {
  if (!text) return '';
  
  // Remover sintaxis Markdown para el extracto
  const clean = text
    .replace(/#{1,6}\s/g, '')      // Headers
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Bold
    .replace(/\*([^*]+)\*/g, '$1')      // Italic
    .replace(/`([^`]+)`/g, '$1')        // Inline code
    .replace(/```[\s\S]*?```/g, '[código]') // Code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[imagen: $1]') // Images
    .replace(/^\s*[-*+]\s/gm, '• ')     // List bullets
    .replace(/^\s*\d+\.\s/gm, '')       // List numbers
    .replace(/^\s*>\s/gm, '')           // Blockquotes
    .replace(/\n+/g, ' ')               // Multiple newlines
    .trim();
  
  if (clean.length <= maxLength) return clean;
  
  return clean.substring(0, maxLength).trim() + '...';
}