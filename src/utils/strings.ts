/**
 * escapeHtml
 *
 * Escape a string to be used as text or an attribute in HTML
 *
 * @param {string} string - the string we want to escape
 * @returns {string} The escaped string
 */
export const escapeHtml = (string: string): string => {
    const htmlChars: { [key: string]: string } = {
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
        "<": "&lt;",
        ">": "&gt;",
    };
    return string.replace(/[&"'<>]/g, (c: string) => htmlChars[c]);
};

export const regexp: { [key: string]: RegExp } = {
    id: /^\d{14}-[0-9a-z]{7}$/,
    siyuanUrl: /^siyuan:\/\/blocks\/(\d{14}-[0-9a-z]{7})/,
    snippet: /^\d{14}-[0-9a-z]{7}$/,
    created: /^\d{10}$/,
    history:
        /[/\\]history[/\\]\d{4}-\d{2}-\d{2}-\d{6}-(clean|update|delete|format|sync|replace)([/\\]\d{14}-[0-9a-z]{7})+\.sy$/,
    snapshot: /^[0-9a-f]{40}$/,
    shorthand: /^\d{13}$/,
    url: /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+(:[0-9]+)?|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/,
};

export const stripNewLines = (input: string): string => {
    return input.replace(/\n/g, "");
};

export const wrapInDiv = (input: string): string => {
    return `<div>${input}</div>`;
};

export const isExternal = (url: string) => {
    return url.startsWith("https://");
};

export const getUrlFinalSegment = (url: string): string => {
    try {
        const segments = new URL(url).pathname.split("/");
        const last = segments.pop() || segments.pop(); // Handle potential trailing slash
        return last;
    } catch (_) {
        return "File";
    }
};

export const blank = (text: string): boolean => {
    return text === undefined || text === null || text === "";
};

export const notBlank = (text: string): boolean => {
    return !blank(text);
};
