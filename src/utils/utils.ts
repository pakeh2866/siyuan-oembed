export const isExternal = (url: string) => {
    return url.startsWith('https://');
};

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
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
        '<': '&lt;',
        '>': '&gt;',
    };
    return string.replace(/[&"'<>]/g, (c: string) => htmlChars[c]);
};

export const regexp: { [key: string]: RegExp } = {
    id: /^\d{14}-[0-9a-z]{7}$/,
    siyuanUrl: /^siyuan:\/\/blocks\/(\d{14}-[0-9a-z]{7})/,
    snippet: /^\d{14}-[0-9a-z]{7}$/,
    created: /^\d{10}$/,
    history: /[/\\]history[/\\]\d{4}-\d{2}-\d{2}-\d{6}-(clean|update|delete|format|sync|replace)([/\\]\d{14}-[0-9a-z]{7})+\.sy$/,
    snapshot: /^[0-9a-f]{40}$/,
    shorthand: /^\d{13}$/,
    url: /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+(:[0-9]+)?|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/
};

export const isSiyuanBlock = (element: any): boolean => {
    return !!(element
        && element instanceof HTMLElement
        && element.dataset.type
        && element.dataset.nodeId
        && regexp.id.test(element.dataset.nodeId)
    );
}

export const getCurrentBlock = (): Node | null | undefined => {
    const selection = document.getSelection();
    let element = selection?.focusNode;
    while (element
        && (!(element instanceof HTMLElement)
            || !isSiyuanBlock(element)
        )
    ) {
        element = element.parentElement;
    }
    return element;
}

// export const isEmptyParagraph = (): boolean => {
//     const selection = document.getSelection();
//     let element: Node | null = selection?.focusNode;
//     while (element
//         && (!(element instanceof HTMLElement)
//             || !isSiyuanBlock(element)
//         )
//     ) {
//         element = element.parentElement;
//     }
//     if (element instanceof HTMLElement) {
//         const editElement = element.querySelector('[contenteditable="true"]');
//         return editElement ? editElement.textContent.trim() === '' && element.dataset.type === "NodeParagraph": false;
//     } else {
//         // handle the case where element is not an HTMLElement
//         return false;
//     }
// }

export const isEmptyParagraphBlock = (): boolean => {
    const selection = document.getSelection();
    const element = selection?.focusNode?.parentElement;
    return element instanceof HTMLElement
        && isSiyuanBlock(element)
        && element.dataset.type === "NodeParagraph"
        && element.querySelector('[contenteditable="true"]')?.textContent.trim() === '';
}

export const isEmptyBlock = (): boolean => {
    const selection = document.getSelection();
    const element = selection?.focusNode?.parentElement;
    return element instanceof HTMLElement
        && isSiyuanBlock(element)
        && element.querySelector('[contenteditable="true"]')?.textContent.trim() === '';
}

export const isParagraphBlock = (): boolean => {
    const selection = document.getSelection();
    const element = selection?.focusNode?.parentElement;
    return element instanceof HTMLElement
        && isSiyuanBlock(element)
        && element.dataset.type === "NodeParagraph";
}

export const isHTMLBlock = (): boolean => {
    const selection = document.getSelection();
    const element = selection?.focusNode?.parentElement;
    return element instanceof HTMLElement
        && isSiyuanBlock(element)
        && element.dataset.type === "NodeHTMLBlock";
}


export const genHtmlBlock = (data: DOMStringMap): string => {
    return `<div data-node-id="${data.id}" data-node-index="${data.index}" data-type="NodeHTMLBlock" data-oembed="true" class="render-node protyle-wysiwyg--select" updated="${data.updated}" data-subtype="block">
    <div class="protyle-icons">
        <span class="b3-tooltips__nw b3-tooltips protyle-icon protyle-icon--first protyle-action__edit" aria-label="Edit">
            <svg><use xlink:href="#iconEdit"></use></svg>
        </span>
        <span class="b3-tooltips__nw b3-tooltips protyle-icon protyle-action__menu protyle-icon--last" aria-label="More">
            <svg><use xlink:href="#iconMore"></use></svg>
        </span>
    </div>
    <div>
        <protyle-html data-content="${data.content}"></protyle-html>
        <span style="position: absolute"></span>
    </div>
    <div class="protyle-attr" contenteditable="false"></div></div>`;
};


/**
 * Returns an array of all elements matching the given CSS selector that are
 * descendants of the given parent element.
 *
 * @param {string} selector The CSS selector to match.
 * @param {ParentNode} [parent=document] The parent element to search.
 * @return {HTMLElement[]} An array of matching elements.
 */
export const getAll = <ElementType extends HTMLElement>(
    selector: string,
    parent: ParentNode = document
): ElementType[] => Array.prototype.slice.call(parent.querySelectorAll<ElementType>(selector), 0);
