// Color configuration for the admin dashboard
// Replace blue colors with your primary color

export const colors = {
  // Your primary color (replace this with your actual primary color)
  primary: {
    50: '#f0f9ff',   // Lightest shade
    100: '#e0f2fe',  // Very light
    200: '#bae6fd',  // Light
    300: '#7dd3fc',  // Medium light
    400: '#38bdf8',  // Medium
    500: '#0ea5e9',  // Main primary color
    600: '#0284c7',  // Medium dark
    700: '#0369a1',  // Dark
    800: '#075985',  // Very dark
    900: '#0c4a6e',  // Darkest shade
  },

  // Semantic colors using your primary color
  success: '#10b981',    // Green
  warning: '#f59e0b',    // Amber
  error: '#ef4444',      // Red
  info: '#0ea5e9',       // Your primary color

  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    dark: '#0f172a',
  },

  // Text colors
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    light: '#94a3b8',
    white: '#ffffff',
  },

  // Border colors
  border: {
    light: '#e2e8f0',
    medium: '#cbd5e1',
    dark: '#94a3b8',
  },

  // Button colors (replacing blue with your primary)
  button: {
    primary: {
      background: '#0ea5e9',      // Your primary color
      text: '#ffffff',
      hover: '#0284c7',
      active: '#0369a1',
      disabled: '#94a3b8',
    },
    secondary: {
      background: '#f1f5f9',
      text: '#0f172a',
      hover: '#e2e8f0',
      active: '#cbd5e1',
      disabled: '#cbd5e1',
    },
    outline: {
      background: 'transparent',
      text: '#0ea5e9',            // Your primary color
      border: '#0ea5e9',          // Your primary color
      hover: '#f0f9ff',
      active: '#e0f2fe',
    },
  },

  // Link colors (replacing blue with your primary)
  link: {
    default: '#0ea5e9',           // Your primary color
    hover: '#0284c7',
    active: '#0369a1',
    visited: '#7c3aed',          // Purple for visited links
  },

  // Focus and selection colors
  focus: {
    ring: '#0ea5e9',              // Your primary color
    border: '#0ea5e9',            // Your primary color
  },

  // Status colors
  status: {
    online: '#10b981',
    offline: '#6b7280',
    busy: '#f59e0b',
    away: '#f97316',
  },
};

// CSS custom properties for easy use in CSS
export const cssVariables = `
  :root {
    --color-primary-50: ${colors.primary[50]};
    --color-primary-100: ${colors.primary[100]};
    --color-primary-200: ${colors.primary[200]};
    --color-primary-300: ${colors.primary[300]};
    --color-primary-400: ${colors.primary[400]};
    --color-primary-500: ${colors.primary[500]};
    --color-primary-600: ${colors.primary[600]};
    --color-primary-700: ${colors.primary[700]};
    --color-primary-800: ${colors.primary[800]};
    --color-primary-900: ${colors.primary[900]};
    
    --color-success: ${colors.success};
    --color-warning: ${colors.warning};
    --color-error: ${colors.error};
    --color-info: ${colors.info};
    
    --color-background-primary: ${colors.background.primary};
    --color-background-secondary: ${colors.background.secondary};
    --color-background-tertiary: ${colors.background.tertiary};
    --color-background-dark: ${colors.background.dark};
    
    --color-text-primary: ${colors.text.primary};
    --color-text-secondary: ${colors.text.secondary};
    --color-text-tertiary: ${colors.text.tertiary};
    --color-text-light: ${colors.text.light};
    --color-text-white: ${colors.text.white};
    
    --color-border-light: ${colors.border.light};
    --color-border-medium: ${colors.border.medium};
    --color-border-dark: ${colors.border.dark};
    
    --color-button-primary-bg: ${colors.button.primary.background};
    --color-button-primary-text: ${colors.button.primary.text};
    --color-button-primary-hover: ${colors.button.primary.hover};
    --color-button-primary-active: ${colors.button.primary.active};
    --color-button-primary-disabled: ${colors.button.primary.disabled};
    
    --color-link-default: ${colors.link.default};
    --color-link-hover: ${colors.link.hover};
    --color-link-active: ${colors.link.active};
    --color-link-visited: ${colors.link.visited};
    
    --color-focus-ring: ${colors.focus.ring};
    --color-focus-border: ${colors.focus.border};
  }
`;

export default colors;
