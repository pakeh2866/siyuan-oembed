import getOembed from "@/oembed";
import { IOperation, IProtyle, Protyle } from "siyuan";
import { svelteDialog, inputDialog, inputDialogSync } from "@/libs/dialog";

export interface LinkData {
    title: string;
    description: string;
    icon: string;
    author: string;
    link: string;
    thumbnail: string;
    publisher: string;
}

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

export const getCurrentBlock = (): HTMLElement | null | undefined => {
    const selection = document.getSelection();
    let element: HTMLElement | null | undefined = selection?.focusNode as HTMLElement;
    while (element
        && (!isSiyuanBlock(element)
        )
    ) {
        element = element.parentElement as HTMLElement;
    }
    return element;
}

export const isParagraphBlock = (): boolean=> {
    const selection = document.getSelection();
    let element: Node | null = selection?.focusNode;
    while (element
        && (!(element instanceof HTMLElement)
            || !isSiyuanBlock(element)
        )
    ) {
        element = element.parentElement;
    }
    return element instanceof HTMLElement && element.dataset.type === "NodeParagraph";
}

export const isHTMLBlock = (): boolean=> {
    const selection = document.getSelection();
    let element: Node | null = selection?.focusNode;
    while (element
        && (!(element instanceof HTMLElement)
            || !isSiyuanBlock(element)
        )
    ) {
        element = element.parentElement;
    }
    return element instanceof HTMLElement && element.dataset.type === "NodeHTMLBlock";
}

export const isEmptyParagraphBlock = (): boolean => {
    const selection = document.getSelection();
    let element: Node | null = selection?.focusNode;
    while (element
        && (!(element instanceof HTMLElement)
            || !isSiyuanBlock(element)
        )
    ) {
        element = element.parentElement;
    }
    return element instanceof HTMLElement && element.dataset.type === "NodeParagraph" && element.querySelector('[contenteditable="true"]')?.textContent.trim() === '';
}

// export const isEmptyBlock = (): boolean=> {
//     const selection = document.getSelection();
//     let element: Node | null = selection?.focusNode;
//     while (element
//         && (!(element instanceof HTMLElement)
//             || !isSiyuanBlock(element)
//         )
//     ) {
//         element = element.parentElement;
//     }
//     return element instanceof HTMLElement && element.querySelector('[contenteditable="true"]')?.textContent.trim() === '';
// }

// export const isEmptyParagraphBlock = (): boolean => {
//     const selection = document.getSelection();
//     const element = selection?.focusNode?.parentElement;
//     return element instanceof HTMLElement
//         && isSiyuanBlock(element)
//         && element.dataset.type === "NodeParagraph"
//         && element.querySelector('[contenteditable="true"]')?.textContent.trim() === '';
// }

// export const isEmptyBlock = (): boolean => {
//     const selection = document.getSelection();
//     console.log("🚀 ~ isEmptyBlock ~ selection:", selection?.focusNode)
//     const element = selection?.focusNode?.parentElement;
//     return element instanceof HTMLElement
//         && isSiyuanBlock(element)
//         && element.querySelector('[contenteditable="true"]')?.textContent.trim() === '';
// }



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


export const convertToOembed = async (element: HTMLElement, protyle: Protyle) => {
        console.log("🚀 ~ OembedPlugin ~ convertToOembed= ~ detail:", element)
        const doOperations: IOperation[] = [];
        // blockElements.forEach(async (item: HTMLElement) => {
        console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ item:", element)
        console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ item.outerHTML:", element.outerHTML)
        console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ item.index:", element.dataset.nodeIndex)
        console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ item.updated:", element.getAttribute("updated"))
        const editElement = element.querySelector('[contenteditable="true"]');
        console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ editElement:", editElement)

        if (editElement?.firstElementChild?.getAttribute("data-type") === "a" && editElement?.firstElementChild?.getAttribute("data-href")) {
            const urlString = editElement.firstElementChild.getAttribute("data-href")

            const html = await getOembed(urlString)
            if (html) {
                console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ html:", html)


                console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ editElement:", editElement)

                console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ textContent:", editElement.textContent)
                console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ element:", element)
                console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ element.outerHTML:", element.outerHTML)
                console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ genHtmlBlock:", genHtmlBlock({
                        id: element.dataset.nodeId,
                        index: element.dataset.nodeIndex,
                        updated: element.getAttribute("updated"),
                        content: html
                    }))
                element.outerHTML = genHtmlBlock({
                        id: element.dataset.nodeId,
                        index: element.dataset.index,
                        updated: element.dataset.updated,
                        content: escapeHtml(html)
                    });
                // item.dataset.type = "NodeHTMLBlock";
                // item.dataset.class = "render-node protyle-wysiwyg--select";
                // item.dataset.subtype = "block"

                doOperations.push({
                    id: element.dataset.nodeId,
                    data: element.outerHTML,
                    action: "update"
                });
            }
        }
        // }
        protyle.transaction(doOperations);
    };

export const bookmarkAsString = (linkData: LinkData): string => {
  // const data: LinkData = await getURLMetadata(url);
  return `<div
    style="
        border: 1px solid rgb(222, 222, 222);
        box-shadow: rgba(0, 0, 0, 0.06) 0px 1px 3px;
    "
    ><style>
    .kg-card {
    font-family:
        'Inter Variable',
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        Segoe UI,
        Roboto,
        Helvetica Neue,
        Arial,
        Noto Sans,
        sans-serif,
        Apple Color Emoji,
        Segoe UI Emoji,
        Segoe UI Symbol,
        Noto Color Emoji;
    }
    .kg-card {
        @extend %font-sans;
    }
    .kg-card:not(.kg-callout-card) {
        font-size: 1rem;
    }
    /* Add extra margin before/after any cards,
except for when immediately preceeded by a heading */
    .post-body :not(.kg-card):not([id]) + .kg-card {
        margin-top: 6vmin;
    }
    .post-body .kg-card + :not(.kg-card) {
        margin-top: 6vmin;
    }
    .kg-bookmark-card,
    .kg-bookmark-card * {
        box-sizing: border-box;
    }
    .kg-bookmark-card,
    .kg-bookmark-publisher {
        position: relative;
        /* width: 100%; */
    }
    .kg-bookmark-card a.kg-bookmark-container,
    .kg-bookmark-card a.kg-bookmark-container:hover {
        display: flex;
        background: var(--bookmark-background-color);
        text-decoration: none;
        border-radius: 6px;
        border: 1px solid var(--bookmark-border-color);
        overflow: hidden;
        color: var(--bookmark-text-color);
    }
    .kg-bookmark-content {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        flex-basis: 100%;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 20px;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
            'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    }
    .kg-bookmark-title {
        font-size: 15px;
        line-height: 1.4em;
        font-weight: 600;
    }
    .kg-bookmark-description {
        display: -webkit-box;
        font-size: 14px;
        line-height: 1.5em;
        margin-top: 3px;
        font-weight: 400;
        max-height: 44px;
        overflow-y: hidden;
        opacity: 0.7;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }
    .kg-bookmark-metadata {
        display: flex;
        align-items: center;
        margin-top: 22px;
        width: 100%;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
    }
    .kg-bookmark-metadata > *:not(img) {
        opacity: 0.7;
    }
    .kg-bookmark-icon {
        width: 20px;
        height: 20px;
        margin-right: 6px;
    }
    .kg-bookmark-author,
    .kg-bookmark-publisher {
        display: inline;
    }
    .kg-bookmark-publisher {
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 240px;
        white-space: nowrap;
        display: block;
        line-height: 1.65em;
    }
    .kg-bookmark-metadata > span:nth-of-type(2) {
        font-weight: 400;
    }
    .kg-bookmark-metadata > span:nth-of-type(2):before {
        content: '•';
        margin: 0 6px;
    }
    .kg-bookmark-metadata > span:last-of-type {
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .kg-bookmark-thumbnail {
        position: relative;
        flex-grow: 1;
        min-width: 33%;
    }
    .kg-bookmark-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover; /* or contain */
        position: absolute;
        top: 0;
        left: 0;
        border-radius: 0 2px 2px 0;
    }
</style><div>
            <figure class="kg-card kg-bookmark-card">
                <a class="kg-bookmark-container" href="${linkData.link}"
                    ><div class="kg-bookmark-content">
                        <div class="kg-bookmark-title">${linkData.title}</div>
                        <div class="kg-bookmark-description">${linkData.description}</div>
                        <div class="kg-bookmark-metadata">
                            <img class="kg-bookmark-icon" src="${linkData.icon}" alt="Link icon" />
                            <span class="kg-bookmark-author">${linkData.author}</span>
                            <span class="kg-bookmark-publisher">${linkData.publisher}</span>
                        </div>
                    </div><div class="kg-bookmark-thumbnail">
                                <img src="${linkData.thumbnail}" alt="Link thumbnail" />
                            </div>
                </a>
            </figure></div></div>
            `;
};



export const microlinkScraper = async (url) => {
    return fetch(`https://api.microlink.io/?url=${encodeURI(url)}`)
        .then((res) => {
            if (res.ok) {
                return res.json();
            }
            return null;
        })
        .then((data) => {
            return {
                title: data.data.title,
                description: data.data.description,
                url: url,
                image: data.data.logo ? data.data.logo.url : data.data.image ? data.data.image.url : '',
            };
        });
    }
