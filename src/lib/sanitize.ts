import DOMPurify from 'dompurify';

const BLOG_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'b', 'i',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote',
    'a', 'img', 'span', 'div', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr', 'sup', 'sub',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'title'],
  ALLOW_DATA_ATTR: false,
};

const EMAIL_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li',
    'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'class', 'target', 'rel',
    'width', 'height', 'cellpadding', 'cellspacing', 'border', 'align',
  ],
  ALLOW_DATA_ATTR: false,
  FORCE_BODY: true,
};

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, BLOG_CONFIG) as string;
}

export function sanitizeEmailHtml(html: string): string {
  return DOMPurify.sanitize(html, EMAIL_CONFIG) as string;
}
