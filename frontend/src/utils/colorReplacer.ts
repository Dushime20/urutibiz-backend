import { colors } from '../config/colors';

// Common blue color patterns that are typically used in admin dashboards
export const blueColorPatterns = {
  // Tailwind CSS blue classes
  'bg-blue-50': `bg-[${colors.primary[50]}]`,
  'bg-blue-100': `bg-[${colors.primary[100]}]`,
  'bg-blue-200': `bg-[${colors.primary[200]}]`,
  'bg-blue-300': `bg-[${colors.primary[300]}]`,
  'bg-blue-400': `bg-[${colors.primary[400]}]`,
  'bg-blue-500': `bg-[${colors.primary[500]}]`,
  'bg-blue-600': `bg-[${colors.primary[600]}]`,
  'bg-blue-700': `bg-[${colors.primary[700]}]`,
  'bg-blue-800': `bg-[${colors.primary[800]}]`,
  'bg-blue-900': `bg-[${colors.primary[900]}]`,

  // Text colors
  'text-blue-50': `text-[${colors.primary[50]}]`,
  'text-blue-100': `text-[${colors.primary[100]}]`,
  'text-blue-200': `text-[${colors.primary[200]}]`,
  'text-blue-300': `text-[${colors.primary[300]}]`,
  'text-blue-400': `text-[${colors.primary[400]}]`,
  'text-blue-500': `text-[${colors.primary[500]}]`,
  'text-blue-600': `text-[${colors.primary[600]}]`,
  'text-blue-700': `text-[${colors.primary[700]}]`,
  'text-blue-800': `text-[${colors.primary[800]}]`,
  'text-blue-900': `text-[${colors.primary[900]}]`,

  // Border colors
  'border-blue-50': `border-[${colors.primary[50]}]`,
  'border-blue-100': `border-[${colors.primary[100]}]`,
  'border-blue-200': `border-[${colors.primary[200]}]`,
  'border-blue-300': `border-[${colors.primary[300]}]`,
  'border-blue-400': `border-[${colors.primary[400]}]`,
  'border-blue-500': `border-[${colors.primary[500]}]`,
  'border-blue-600': `border-[${colors.primary[600]}]`,
  'border-blue-700': `border-[${colors.primary[700]}]`,
  'border-blue-800': `border-[${colors.primary[800]}]`,
  'border-blue-900': `border-[${colors.primary[900]}]`,

  // Ring/focus colors
  'ring-blue-50': `ring-[${colors.primary[50]}]`,
  'ring-blue-100': `ring-[${colors.primary[100]}]`,
  'ring-blue-200': `ring-[${colors.primary[200]}]`,
  'ring-blue-300': `ring-[${colors.primary[300]}]`,
  'ring-blue-400': `ring-[${colors.primary[400]}]`,
  'ring-blue-500': `ring-[${colors.primary[500]}]`,
  'ring-blue-600': `ring-[${colors.primary[600]}]`,
  'ring-blue-700': `ring-[${colors.primary[700]}]`,
  'ring-blue-800': `ring-[${colors.primary[800]}]`,
  'ring-blue-900': `ring-[${colors.primary[900]}]`,

  // Hover states
  'hover:bg-blue-50': `hover:bg-[${colors.primary[50]}]`,
  'hover:bg-blue-100': `hover:bg-[${colors.primary[100]}]`,
  'hover:bg-blue-200': `hover:bg-[${colors.primary[200]}]`,
  'hover:bg-blue-300': `hover:bg-[${colors.primary[300]}]`,
  'hover:bg-blue-400': `hover:bg-[${colors.primary[400]}]`,
  'hover:bg-blue-500': `hover:bg-[${colors.primary[500]}]`,
  'hover:bg-blue-600': `hover:bg-[${colors.primary[600]}]`,
  'hover:bg-blue-700': `hover:bg-[${colors.primary[700]}]`,
  'hover:bg-blue-800': `hover:bg-[${colors.primary[800]}]`,
  'hover:bg-blue-900': `hover:bg-[${colors.primary[900]}]`,

  'hover:text-blue-50': `hover:text-[${colors.primary[50]}]`,
  'hover:text-blue-100': `hover:text-[${colors.primary[100]}]`,
  'hover:text-blue-200': `hover:text-[${colors.primary[200]}]`,
  'hover:text-blue-300': `hover:text-[${colors.primary[300]}]`,
  'hover:text-blue-400': `hover:text-[${colors.primary[400]}]`,
  'hover:text-blue-500': `hover:text-[${colors.primary[500]}]`,
  'hover:text-blue-600': `hover:text-[${colors.primary[600]}]`,
  'hover:text-blue-700': `hover:text-[${colors.primary[700]}]`,
  'hover:text-blue-800': `hover:text-[${colors.primary[800]}]`,
  'hover:text-blue-900': `hover:text-[${colors.primary[900]}]`,

  'hover:border-blue-50': `hover:border-[${colors.primary[50]}]`,
  'hover:border-blue-100': `hover:border-[${colors.primary[100]}]`,
  'hover:border-blue-200': `hover:border-[${colors.primary[200]}]`,
  'hover:border-blue-300': `hover:border-[${colors.primary[300]}]`,
  'hover:border-blue-400': `hover:border-[${colors.primary[400]}]`,
  'hover:border-blue-500': `hover:border-[${colors.primary[500]}]`,
  'hover:border-blue-600': `hover:border-[${colors.primary[600]}]`,
  'hover:border-blue-700': `hover:border-[${colors.primary[700]}]`,
  'hover:border-blue-800': `hover:border-[${colors.primary[800]}]`,
  'hover:border-blue-900': `hover:border-[${colors.primary[900]}]`,

  // Focus states
  'focus:ring-blue-500': `focus:ring-[${colors.primary[500]}]`,
  'focus:border-blue-500': `focus:border-[${colors.primary[500]}]`,
  'focus:bg-blue-50': `focus:bg-[${colors.primary[50]}]`,
};

// Function to replace blue colors in a string with your primary color
export function replaceBlueColors(input: string): string {
  let result = input;
  
  Object.entries(blueColorPatterns).forEach(([bluePattern, primaryPattern]) => {
    result = result.replace(new RegExp(bluePattern, 'g'), primaryPattern);
  });
  
  return result;
}

// Function to replace blue colors in an object (useful for component props)
export function replaceBlueColorsInObject<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };
  
  Object.keys(result).forEach(key => {
    if (typeof result[key] === 'string') {
      result[key] = replaceBlueColors(result[key]);
    }
  });
  
  return result;
}

// Common color replacement patterns for inline styles
export const styleColorReplacements = {
  // Replace common blue hex values
  '#3B82F6': colors.primary[500],    // Blue-500
  '#1E40AF': colors.primary[700],    // Blue-700
  '#60A5FA': colors.primary[400],    // Blue-400
  '#93C5FD': colors.primary[300],    // Blue-300
  '#DBEAFE': colors.primary[100],    // Blue-100
  '#EFF6FF': colors.primary[50],     // Blue-50
  '#1D4ED8': colors.primary[800],    // Blue-800
  '#1E3A8A': colors.primary[900],    // Blue-900
  '#2563EB': colors.primary[600],    // Blue-600
  '#0EA5E9': colors.primary[500],    // Blue-500 (alternative)
};

// Function to replace blue colors in inline styles
export function replaceBlueColorsInStyles(styleString: string): string {
  let result = styleString;
  
  Object.entries(styleColorReplacements).forEach(([blueHex, primaryColor]) => {
    result = result.replace(new RegExp(blueHex, 'gi'), primaryColor);
  });
  
  return result;
}

// Utility to get a color variant based on intensity
export function getColorVariant(baseColor: string, intensity: 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900): string {
  return colors.primary[intensity];
}

// Utility to get contrasting text color for a background
export function getContrastTextColor(backgroundColor: string): string {
  // Simple contrast calculation - you might want to use a more sophisticated algorithm
  const isLight = backgroundColor.includes('50') || backgroundColor.includes('100') || backgroundColor.includes('200');
  return isLight ? colors.text.primary : colors.text.white;
}

export default {
  replaceBlueColors,
  replaceBlueColorsInObject,
  replaceBlueColorsInStyles,
  getColorVariant,
  getContrastTextColor,
  blueColorPatterns,
  styleColorReplacements,
};
