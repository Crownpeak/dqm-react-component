import DOMPurify from "dompurify";
import parse from "html-react-parser";

export const SafeParsedHtml = ({html = ''}: { html: string }) => {
    // Restrict allowed tags and attributes for extra safety
    const SAFE_TAGS = [
        // Basic formatting
        'b', 'i', 'strong', 'em', 'u', 'br', 'span',
        // Structural
        'p', 'ul', 'ol', 'li', 'blockquote',
        // Links
        'a',
        // Headings
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        // Media
        'img',
        // Tables
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        // Code
        'code', 'pre',
        // Divs for layout
        'div'
    ];
    const SAFE_ATTRS: string[] = [
        'href', 'title', 'target', 'rel', // links
        'src', 'alt', 'title', 'width', 'height', // images
        'class', 'id', 'style', // general
        'colspan', 'rowspan', // tables
        'align', // alignment
        'data-*', // allow data attributes
        'aria-*', // allow aria attributes
        'role', // allow role attribute
    ];
    let clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: SAFE_TAGS,
        ALLOWED_ATTR: SAFE_ATTRS,
    });

    const removeLeadingTrailingBr = /^\s*(?:<br\s*\/?\s*>)+|(?:<br\s*\/?\s*>)+\s*$/gi

    // Remove leading and trailing <br> tags · https://stackoverflow.com/a/25999450
    clean = clean.replace(removeLeadingTrailingBr, ''); //changed replacement

    return <span>{parse(clean)}</span>;
};