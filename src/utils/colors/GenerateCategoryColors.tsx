// Dynamic color generation using chroma-js for unlimited categories
// Generates visually distinct colors that remain consistent across sessions
import chroma from "chroma-js";

export const generateCategoryColors = (categories: string[]): Record<string, string> => {
    if (categories.length === 0) return {};

    // Sort categories alphabetically to ensure consistent color assignment
    const sortedCategories = [...categories].sort();

    // Use a high-quality color scale with good visual distinction
    // HSL space provides better perceptual uniformity
    const colorScale = chroma.scale([
        '#006675', // Dark Teal
        '#3636C5', // Dark Blue
        '#008060', // Dark Green
        '#001746', // Dark Purple
        '#36B37E', // Green
        '#00B8D9', // Teal
    ]).mode('hsl');

    const colors: Record<string, string> = {};

    // For larger numbers of categories, interpolate between the scale colors
    sortedCategories.forEach((category, index) => {
        const position = index / Math.max(sortedCategories.length - 1, 1);
        colors[category] = colorScale(position).darken(0.2).hex();
    });

    return colors;
};
export const hexToRgb = (hex: string) => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        }
        : null;
};
export const getContrastTextColor = (bgColor: string) => {
    // This is not working, so I need a distinction between black and white. Go on:
    if (!bgColor.startsWith('#')) {
        console.warn('getContrastTextColor: Invalid hex color', bgColor);
        return '#000000';
    }

    if (bgColor.length === 4) {
        // Expand shorthand hex (#abc -> #aabbcc)
        bgColor = '#' + bgColor[1] + bgColor[1] + bgColor[2] + bgColor[2] + bgColor[3] + bgColor[3];
    }

    if (bgColor.length !== 7) {
        console.warn('getContrastTextColor: Invalid hex color length', bgColor);
        return '#000000';
    }

    const rgb = hexToRgb(bgColor);
    if (!rgb) {
        console.warn('getContrastTextColor: Could not convert hex to rgb', bgColor);
        return '#000000';
    }

    // Calculate luminance
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.6 ? '#000000' : '#FFFFFF';
};
export const getCategoryColor = (category: string, allCategories: string[] = []): {
    bg: string;
    text: string;
} => {
    // If we have all categories, generate dynamic colors
    if (allCategories.length > 0) {
        const dynamicColors = generateCategoryColors(allCategories);
        const bg = dynamicColors[category] || '#6c757d'
        return {bg, text: getContrastTextColor(bg)};
    }

    // Fallback to a hash-based color for consistency
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return {
        bg: chroma.hsl(hue, 0.7, 0.3).hex(),
        text: getContrastTextColor(chroma.hsl(hue, 0.7, 0.3).hex())
    };
};