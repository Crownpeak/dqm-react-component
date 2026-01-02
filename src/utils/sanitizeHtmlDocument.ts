export const sanitizeHtmlDocument = (html: string, opts?: { allowScripts?: boolean }): string => {
  const allowScripts = opts?.allowScripts === true;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Prevent base href rewriting and meta refresh redirects
  doc.querySelectorAll('base').forEach((el) => el.remove());
  doc.querySelectorAll('meta[http-equiv]').forEach((el) => {
    const equiv = el.getAttribute('http-equiv')?.toLowerCase();
    if (equiv === 'refresh') el.remove();
  });

  if (!allowScripts) {
    doc.querySelectorAll('script').forEach((el) => el.remove());
    doc.querySelectorAll('noscript').forEach((el) => el.remove());

    // Remove inline event handlers that could open popups/navigate.
    const all = doc.querySelectorAll('*');
    all.forEach((node) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const el = node as any as Element;
      for (const attr of Array.from(el.attributes ?? [])) {
        if (attr.name.toLowerCase().startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      }
    });
  }

  return doc.documentElement.outerHTML;
};

