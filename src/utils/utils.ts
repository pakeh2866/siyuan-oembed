import getOembed from "@/oembed";
import { Dialog, IOperation, IProtyle, Protyle, showMessage } from "siyuan";
import { svelteDialog, inputDialog, inputDialogSync } from "@/libs/dialog";
import { getBlockAttrs, setBlockAttrs, updateBlock } from "@/api";
import { i18n } from "@/i18n";
import OembedPlugin from "../.";
import { defaultBookmarkCardStyle, CUSTOM_ATTRIBUTE } from "@/const";

export let plugin: OembedPlugin;
export function setPlugin(_plugin: any) {
    plugin = _plugin;
}

export interface LinkData {
    title?: string;
    description?: string;
    icon?: string;
    author?: string;
    link: string;
    thumbnail?: string;
    publisher?: string;
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

export const getBlocks = (protyle: Protyle): HTMLElement[] => {
    const selectedBlocks = getSelectedBlocks(protyle);

    // Check if selectedBlocks has elements
    if (selectedBlocks.length > 0) {
        return selectedBlocks;
    }

    // Get current block and return it as a single-element array
    const currentBlock = getCurrentBlock();
    return currentBlock ? [currentBlock] : [];
};

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

export const getSelectedBlocks = (protyle: Protyle): Array<HTMLElement> => {
    return [...protyle.protyle.wysiwyg.element.querySelectorAll(
        ".protyle-wysiwyg--select"
    )];
};

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

export const isSelectionEmpty = (): boolean => {
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

export const isEmptyParagraphBlock = (element: HTMLElement): boolean => {
    while (
        element &&
        (!(element instanceof HTMLElement) || !isSiyuanBlock(element))
    ) {
        element = element.parentElement;
    }
    return (
        element instanceof HTMLElement &&
        element.dataset.type === "NodeParagraph" &&
        element
            .querySelector('[contenteditable="true"]')
            ?.textContent.trim() === ""
    );
};

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

export const extractUrlFromBlock = (block: HTMLElement): string | null => {
    const editElement = block.querySelector<HTMLElement>('[contenteditable="true"]');
    if (!editElement) return null;

    const linkElement = editElement.firstElementChild;
    if (!linkElement) return null;

    return linkElement.getAttribute("data-type") === "a"
        ? linkElement.getAttribute("data-href")
        : null;
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
    if (!regexp.url.test(url)) return;
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
                logo: data.data.logo
                    ? data.data.logo.url
                    : "",
                image: data.data.image
                    ? data.data.image.url
                    : data.data.logo
                    ? data.data.logo.url
                    : "",
                author: data.data.author,
                publisher: data.data.publisher
            };
        });
    }

export const wrapInDiv = (input: string): string => {
    return `<div>${input}</div>`;
};

export const stripNewLines = (input: string): string => {
    return input.replace(/\n/g, '');
};

export const generateBookmarkCard = async (config?: LinkData) => {
        let conf: LinkData = {
            title: "",
            description: "",
            icon: "",
            author: "",
            link: "",
            thumbnail: "",
            publisher: "",
        };
        if (config) {
            Object.assign(conf, config);
        }
        try {
            if (conf.link) {
                const newConf = await microlinkScraper(conf.link);
                if (!newConf) return
                const {
                    url,
                    title,
                    image,
                    logo,
                    description,
                    author,
                    publisher,
                } = newConf;
                return `${defaultBookmarkCardStyle}
                            <main class="kg-card-main">
                                <div class="w-full">
                                    <div class="kg-card kg-bookmark-card">
                                        <a class="kg-bookmark-container" href="${
                                            conf.link || url
                                        }"
                                            ><div class="kg-bookmark-content">
                                                <div class="kg-bookmark-title">${
                                                    conf.title || title
                                                }</div>
                                                <div class="kg-bookmark-description">${
                                                    conf.description ||
                                                    description
                                                }</div>
                                                <div class="kg-bookmark-metadata">
                                                    <img class="kg-bookmark-icon" src="${
                                                        conf.icon || logo
                                                    }" alt="Link icon" />
                                                    <span class="kg-bookmark-author">${
                                                        conf.author || author
                                                    }</span>
                                                    <span class="kg-bookmark-publisher">${
                                                        conf.publisher ||
                                                        publisher
                                                    }</span>
                                                </div>
                                            </div>
                                            <div class="kg-bookmark-thumbnail">
                                                <img src="${
                                                    conf.thumbnail || image
                                                }" alt="Link thumbnail" />
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </main>
                        </div>`;
            }
        } catch (e) {
            console.error(e);
            return;
        }
    };

export const openDialog = (args?: {
        title: string;
        placeholder?: string;
        defaultText?: string;
        confirm?: (text: string) => void;
        cancel?: () => void;
        width?: string;
        height?: string;
    }) => {
        return new Promise((resolve, reject) => {
            const dialog = new Dialog({
                title: i18n.insertURLDialogTitle,
                content: `<div class="b3-dialog__content"><textarea class="b3-text-field fn__block" placeholder="Please enter the URL"></textarea></div>
                    <div class="b3-dialog__action">
                    <button class="b3-button b3-button--cancel">${i18n.cancel}</button><div class="fn__space"></div>
                    <button class="b3-button b3-button--text">${i18n.save}</button>
                    </div>`,
                width: "520px",
            });
            const inputElement = dialog.element.querySelector("textarea");
            const btnsElement = dialog.element.querySelectorAll(".b3-button");
            dialog.bindInput(inputElement, () => {
                (btnsElement[1] as HTMLElement).click();
            });
            inputElement.focus();
            btnsElement[0].addEventListener("click", () => {
                dialog.destroy();
                reject();
            });
            btnsElement[1].addEventListener("click", () => {
                dialog.destroy();
                resolve(inputElement.value);
            });
        });
    };

export const logSuccess = (operation: string) =>
    console.log(`${operation} completed successfully`);

export const logError = (operation: string, error: unknown) =>
    console.error(`Error during ${operation}:`, error);

export const toggleBookmarkCard = async (protyle: Protyle): Promise<void> => {
    protyle.insert(window.Lute.Caret);

    const currentBlock = getCurrentBlock();
    const id = currentBlock.dataset.nodeId;

    if (!id) {
        throw new Error("No valid block ID found");
    }

    try {
        const link = (await openDialog()) as string;

        if (!link || !regexp.url.test(link)) {
            return;
        }

        try {
            await convertToBookmarkCard(id, link);
        } catch (error) {
            logError("Error converting to oembed:", error);
        }
    } catch (error) {
        logError("bookmark update", error);
        throw error; // Re-throw to allow caller to handle the error
    }
};

export const convertToBookmarkCard = async (
    id: string,
    link: string
): Promise<void> => {
    if (!id || !link) return;

    try {
        const dom = await generateBookmarkCard({ link });
        if (!dom) return;

        const success = await updateBlock("dom", dom, id);

        if (!success) {
            throw new Error("Failed to update block");
        }

        await setBlockAttrs(id, { [CUSTOM_ATTRIBUTE]: link });
        logSuccess("Block successfully updated with oembed content");
        showMessage("Link converted!");
    } catch (error) {
        logError("Failed to convert block to oembed:", error);
        throw error;
    }
};

export const convertToOembed = async (
    id: string,
    link: string
): Promise<void> => {
    if (!id || !link) return;

    try {
        const html = await getOembed(link);
        if (!html) return;

        const wrappedHtml = wrapInDiv(html);
        const success = await updateBlock("dom", wrappedHtml, id);

        if (!success) {
            throw new Error("Failed to update block");
        }

        await setBlockAttrs(id, { [CUSTOM_ATTRIBUTE]: link });
        logSuccess("Block successfully updated with oembed content");
        showMessage("Link converted!");
    } catch (error) {
        logError("Failed to convert block to oembed:", error);
        throw error;
    }
};

export const toggleOembed = async (protyle: Protyle): Promise<void> => {
    protyle.insert(window.Lute.Caret);

    const currentBlock = getCurrentBlock();
    const id = currentBlock.dataset.nodeId;

    if (!id) {
        throw new Error("No valid block ID found");
    }

    try {
        const link = (await openDialog()) as string;

        if (!link || !regexp.url.test(link)) {
            return;
        }

        try {
            await convertToOembed(id, link);
        } catch (error) {
            logError("Error converting to oembed:", error);
        }
    } catch (error) {
        logError("bookmark update", error);
        throw error; // Re-throw to allow caller to handle the error
    }
};

export const processSelectedBlocks = async (
    blocks:  HTMLElement[],
    processor: (id: string, link: string) => Promise<void>
) => {
    let link: string = null
    try {
        const promises = blocks.map(async (item: HTMLElement) => {
            const id = item?.dataset.nodeId;
            if (!id) {
                throw new Error("No valid block ID found");
            }
            try {
                // if the block is empty, open the dialog to get the link
                if (isEmptyParagraphBlock(item)) {
                    link = (await openDialog()) as string;
                }
                // if the block is not empty,
                else {
                    // check if the block has our custom tag already (CUSTOM_ATTRIBUTE)
                    const isOembed = await isOembedLink(id)

                    if (isOembed) {
                        // toggle the link back if it had been previously converted
                        const attrs = await getBlockAttrs(id);
                        const originalLink = attrs?.[CUSTOM_ATTRIBUTE];

                        const success = await updateBlock(
                            "markdown",
                            `[${originalLink}](${originalLink})`,
                            id
                        );
                        if (!success) {
                            throw new Error("Failed to update block");
                        }

                        await setBlockAttrs(id, { [CUSTOM_ATTRIBUTE]: null });

                    }
                    else {
                        // extract the link from the block
                        link = extractUrlFromBlock(item);
                    }
                }

                if (!link || !regexp.url.test(link)) {
                    return;
                }

                try {
                    await processor(id, link);
                } catch (error) {
                    logError("Error using processor:", error);
                }
            } catch (error) {
                logError("bookmark update", error);
                throw error; // Re-throw to allow caller to handle the error
            }
        });
        await Promise.all(promises);
    } catch (error) {
        logError("Error processing blocks:", error);
    }
};

export const isOembedLink = async (blockId: string): Promise<boolean> => {
    const attrs = await getBlockAttrs(blockId);
    return !!(attrs?.[CUSTOM_ATTRIBUTE] && attrs[CUSTOM_ATTRIBUTE].trim() !== '');
}