import getOembed from "@/oembed";
import { Dialog, IOperation, IProtyle, Protyle, showMessage } from "siyuan";
import { svelteDialog, inputDialog, inputDialogSync } from "@/libs/dialog";
import { forwardProxy, getBlockAttrs, getBlockByID, setBlockAttrs, updateBlock } from "@/api";
import { i18n } from "@/i18n";
import OembedPlugin from "../.";
import { defaultBookmarkCardStyle, CUSTOM_ATTRIBUTE } from "@/const";
import getURLMetadata from "./URLMetadata";
import { hasClosestBlock } from "./hasClosest";

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

export const getBlocks = (): HTMLElement[] => {
    const selectedBlocks = getSelectedBlocks();

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

export const getSelectedBlocks = (): Array<HTMLElement> => {
    return Array.from(getProtyle().querySelectorAll(".protyle-wysiwyg--select")) as HTMLElement[];
};

export const getProtyle = (): HTMLElement => {
    return document.querySelector(`.protyle`);
};

export const getElementByBlockId = (nodeId: string): HTMLElement => {
    return document.querySelector(`div[data-node-id="${nodeId}"]`);
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

export const microlinkScraper = async (url: string) => {
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

export const screenshotScraper = async (
    url: string,
    overlay: string = "dark",
    background: string = "linear-gradient(225deg, #FF057C 0%, #8D0B93 50%, #321575 100%)"
) => {
    if (!regexp.url.test(url)) return;
    return fetch(
        `https://api.microlink.io/?url=${encodeURI(url)}&overlay.browser=${encodeURI(
            overlay
        )}&overlay.background=${encodeURI(background)}&screenshot=true&embed=screenshot.url`
    )
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
                logo: data.data.logo ? data.data.logo.url : "",
                image: data.data.image ? data.data.image.url : data.data.logo ? data.data.logo.url : "",
                author: data.data.author,
                publisher: data.data.publisher,
                screenshot: data.data.screenshot ? data.data.screenshot.url : "",
            };
        });
};

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
        const missingProps = [
            "title",
            "description",
            "icon",
            "author",
            "thumbnail",
            "publisher",
        ].filter((prop) => !conf[prop as keyof typeof conf]);

        if (missingProps.length > 0) {
            try {
                const fetchedData = await getURLMetadata(conf.link);
                if (!fetchedData) return;
                missingProps.forEach((prop) => {
                    if (!conf.title && prop === "title")
                        conf.title = fetchedData.title;
                    if (!conf.description && prop === "description")
                        conf.description = fetchedData.description;
                    if (!conf.icon && prop === "icon")
                        conf.icon = fetchedData.icon;
                    if (!conf.author && prop === "author")
                        conf.author = fetchedData.author;
                    if (!conf.thumbnail && prop === "thumbnail")
                        conf.thumbnail = fetchedData.thumbnail;
                    if (!conf.publisher && prop === "publisher")
                        conf.publisher = fetchedData.publisher;
                });
            } catch (error) {
                logError(
                    "Failed to fetch metadata for link",
                    error
                );
            }
        }
        try {
            if (conf.link) {
                // const newConf = await microlinkScraper(conf.link);
                // if (!newConf) return

                // const {
                //     url,
                //     title,
                //     image,
                //     logo,
                //     description,
                //     author,
                //     publisher,
                // } = newConf;
                return `<div>
                            ${defaultBookmarkCardStyle}
                            <main class="kg-card-main">
                                <div class="w-full">
                                    <div class="kg-card kg-bookmark-card">
                                        <a class="kg-bookmark-container" href="${conf.link}">
                                            <div class="kg-bookmark-content">
                                                <div class="kg-bookmark-title">${conf.title}</div>
                                                <div class="kg-bookmark-description">${conf.description || ""}</div>
                                                <div class="kg-bookmark-metadata">
                                                    <img class="kg-bookmark-icon" src="${conf.icon}" alt="Link icon" />
                                                    ${
                                                        conf.author ?
                                                        `<span class="kg-bookmark-author">${conf.author || ""}</span>` : ""
                                                    }
                                                    ${
                                                        conf.publisher ?
                                                        `<span class="kg-bookmark-publisher">${
                                                            conf.publisher || ""
                                                        }</span>` : ""
                                                    }
                                                </div>
                                            </div>
                                            ${
                                                conf.thumbnail ?
                                                `<div class="kg-bookmark-thumbnail">
                                                    <img src="${conf.thumbnail || ""}" alt="Link thumbnail" />
                                                </div>` : ""
                                            }
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

export const toggleBookmarkCard = async (): Promise<void> => {
    // protyle.insert(window.Lute.Caret);

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
            currentBlock.focus();
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
    link: string,
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
        const element = getElementByBlockId(id);
        focusBlock(element);
        logSuccess("Block successfully updated with oembed content");
        showMessage("Link converted!");
    } catch (error) {
        logError("Failed to convert block to oembed:", error);
        throw error;
    }
};

export const convertToOembed = async (
    id: string,
    link: string,
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
        const element = getElementByBlockId(id);
        focusBlock(element);
        logSuccess("Block successfully updated with oembed content");
        showMessage("Link converted!");
    } catch (error) {
        logError("Failed to convert block to oembed:", error);
        throw error;
    }
};

export const toggleOembed = async (): Promise<void> => {
    // protyle.insert(window.Lute.Caret);

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
            currentBlock.focus();
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
                            `[${await fetchUrlTitle(originalLink)}](${originalLink})`,
                            id
                        );
                        if (!success) {
                            throw new Error("Failed to update block");
                        }

                        await setBlockAttrs(id, { [CUSTOM_ATTRIBUTE]: null });
                        const element = getElementByBlockId(id);
                        focusBlock(element);
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

export const getUrlFinalSegment = (url: string): string => {
    try {
        const segments = new URL(url).pathname.split("/");
        const last = segments.pop() || segments.pop(); // Handle potential trailing slash
        return last;
    } catch (_) {
        return "File";
    }
}

export const blank = (text: string): boolean => {
    return text === undefined || text === null || text === "";
}

export const notBlank = (text: string): boolean => {
    return !blank(text);
}

export const fetchUrlTitle = async (url: string): Promise<string> => {
    if (!(url.startsWith("http") || url.startsWith("https"))) {
        url = "https://" + url;
    }
    try {
        let data = await forwardProxy(
            url,
            "GET",
            null,
            [
                {
                    "User-Agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
                },
            ],
            5000,
            "text/html"
        );
        if (!data || data.status !== 200) {
            return "";
        }

        data.headers["Content-Type"].forEach((ele) => {
            if (!ele.includes("text/html")) {
                return getUrlFinalSegment(url);
            }
        });
        let html = data?.body;

        const doc = new DOMParser().parseFromString(html, "text/html");
        const title = doc.querySelectorAll("title")[0];

        if (title == null || blank(title?.innerText)) {
            // If site is javascript based and has a no-title attribute when unloaded, use it.
            var noTitle = title?.getAttribute("no-title");
            if (notBlank(noTitle)) {
                return noTitle;
            }

            // Otherwise if the site has no title/requires javascript simply return Title Unknown
            return "";
        }

        return title.innerText.replace(/(\r\n|\n|\r)/gm, "").trim();
    } catch (ex) {
        console.error(ex);
        return "";
    }
};

export const focusByWbr = (element: Element, range: Range) => {
    const wbrElements = element.querySelectorAll("wbr");
    console.log("🚀 ~ file: utils.ts:852 ~ focusByWbr ~ wbrElements:", wbrElements)
    if (wbrElements.length === 0) {
        return;
    }
    // 没找到 wbr 产生多个的地方，先顶顶
    wbrElements.forEach((item, index) => {
        if (index !== 0) {
            item.remove();
        }
    });
    const wbrElement = wbrElements[0];
    if (!wbrElement.previousElementSibling) {
        if (wbrElement.previousSibling) {
            // text<wbr>
            range.setStart(wbrElement.previousSibling, wbrElement.previousSibling.textContent.length);
        } else if (wbrElement.nextSibling) {
            if (wbrElement.nextSibling.nodeType === 3) {
                // <wbr>text
                range.setStart(wbrElement.nextSibling, 0);
            } else {
                // <wbr><span>a</span>
                range.setStartAfter(wbrElement);
            }
        } else {
            // 内容为空
            range.setStart(wbrElement.parentElement, 0);
        }
    } else {
        const wbrPreviousSibling = hasPreviousSibling(wbrElement);
        if (wbrPreviousSibling && wbrElement.previousElementSibling.isSameNode(wbrPreviousSibling)) {
            if (wbrElement.previousElementSibling.lastChild?.nodeType === 3) {
                // <em>text</em><wbr> 需把光标放在里面，因为 chrome 点击后也是默认在里面
                range.setStart(
                    wbrElement.previousElementSibling.lastChild,
                    wbrElement.previousElementSibling.lastChild.textContent.length
                );
            } else if (
                wbrPreviousSibling.nodeType !== 3 &&
                (wbrPreviousSibling as HTMLElement).classList.contains("img")
            ) {
                // <img><wbr>, 删除图片后的唯一的一个字符
                range.setStartAfter(wbrPreviousSibling);
            } else {
                // <span class="hljs-function"><span class="hljs-keyword">fun</span></span>
                range.setStartBefore(wbrElement);
            }
        } else {
            // <em>text</em>text<wbr>
            range.setStart(wbrElement.previousSibling, wbrElement.previousSibling.textContent.length);
        }
    }
    range.collapse(true);
    wbrElement.remove();
    focusByRange(range);
};

export const focusByRange = (range: Range) => {
    if (!range) {
        return;
    }

    const startNode = range.startContainer.childNodes[range.startOffset] as HTMLElement;
    if (startNode && startNode.nodeType !== 3 && ["INPUT", "TEXTAREA"].includes(startNode.tagName)) {
        startNode.focus();
        return;
    }
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
};

export const hasPreviousSibling = (element: Node) => {
    let previousSibling = element.previousSibling;
    while (previousSibling) {
        if (previousSibling.textContent === "" && previousSibling.nodeType === 3) {
            previousSibling = previousSibling.previousSibling;
        } else {
            return previousSibling;
        }
    }
    return false;
};

export const hasNextSibling = (element: Node) => {
    let nextSibling = element.nextSibling;
    while (nextSibling) {
        if (nextSibling.textContent === "" && nextSibling.nodeType === 3) {
            nextSibling = nextSibling.nextSibling;
        } else {
            return nextSibling;
        }
    }
    return false;
};

export const getEditorRange = (element: Element) => {
    let range: Range;
    if (getSelection().rangeCount > 0) {
        range = getSelection().getRangeAt(0);
        if (element.isSameNode(range.startContainer) || element.contains(range.startContainer)) {
            return range;
        }
    }
    // 代码块过长，在代码块的下一个块前删除，代码块会滚动到顶部，因粗需要 preventScroll
    (element as HTMLElement).focus({ preventScroll: true });
    let targetElement;
    if (element.classList.contains("table")) {
        // 当光标不在表格区域中时表格无法被复制 https://ld246.com/article/1650510736504
        targetElement = element.querySelector("th") || element.querySelector("td");
    } else {
        targetElement = getContenteditableElement(element);
        if (!targetElement) {
            targetElement = element;
        } else if (targetElement.tagName === "TABLE") {
            // 文档中开头为表格，获取错误 https://ld246.com/article/1663408335459?r=88250
            targetElement = targetElement.querySelector("th") || element.querySelector("td");
        }
    }
    range = targetElement.ownerDocument.createRange();
    range.setStart(targetElement || element, 0);
    range.collapse(true);
    return range;
};

export const getContenteditableElement = (element: Element) => {
    if (
        !element ||
        (element.getAttribute("contenteditable") === "true" && !element.classList.contains("protyle-wysiwyg"))
    ) {
        return element;
    }
    return element.querySelector('[contenteditable="true"]');
};

export const isNotEditBlock = (element: Element) => {
    return (
        [
            "NodeBlockQueryEmbed",
            "NodeThematicBreak",
            "NodeMathBlock",
            "NodeHTMLBlock",
            "NodeIFrame",
            "NodeWidget",
            "NodeVideo",
            "NodeAudio",
        ].includes(element.getAttribute("data-type")) ||
        (element.getAttribute("data-type") === "NodeCodeBlock" && element.classList.contains("render-node"))
    );
};

export const getAllProtyles = () => {
    let protyles = [];
    const getProtyle = (layout) => {
        if (layout.model && layout.model.editor && layout.model.editor.protyle) {
            protyles.push(layout.model.editor.protyle);
        }
        if (layout.children) {
            layout.children.forEach((child) => getProtyle(child));
        }
    };
    getProtyle(window.top.siyuan.layout.layout);
    return protyles;
}

export const focusBlock = (element: Element, parentElement?: HTMLElement, toStart = true): false | Range => {
    if (!element) {
        return false;
    }

    // hr、嵌入块、数学公式、iframe、音频、视频、图表渲染块等，删除段落块后，光标位置矫正 https://github.com/siyuan-note/siyuan/issues/4143
    if (
        element.classList.contains("render-node") ||
        element.classList.contains("iframe") ||
        element.classList.contains("hr") ||
        element.classList.contains("av")
    ) {
        const range = document.createRange();
        const type = element.getAttribute("data-type");
        let setRange = false;
        if (type === "NodeThematicBreak") {
            range.selectNodeContents(element.firstElementChild);
            setRange = true;
        } else if (type === "NodeBlockQueryEmbed") {
            if (element.lastElementChild.previousElementSibling?.firstChild) {
                range.selectNodeContents(element.lastElementChild.previousElementSibling.firstChild);
                range.collapse(true);
            } else {
                // https://github.com/siyuan-note/siyuan/issues/5267
                range.selectNodeContents(element);
                range.collapse(true);
            }
            setRange = true;
        } else if (["NodeMathBlock", "NodeHTMLBlock"].includes(type)) {
            if (element.lastElementChild.previousElementSibling?.lastElementChild?.firstChild) {
                // https://ld246.com/article/1655714737572
                range.selectNodeContents(element.lastElementChild.previousElementSibling.lastElementChild.firstChild);
                range.collapse(true);
            } else if (element.lastElementChild.previousElementSibling) {
                range.selectNodeContents(element.lastElementChild.previousElementSibling);
                range.collapse(true);
            }
            setRange = true;
        } else if (type === "NodeIFrame" || type === "NodeWidget") {
            range.setStart(element, 0);
            setRange = true;
        } else if (type === "NodeVideo") {
            range.setStart(element.firstElementChild, 0);
            setRange = true;
        } else if (type === "NodeAudio") {
            range.setStart(element.firstElementChild.lastChild, 0);
            setRange = true;
        } else if (type === "NodeCodeBlock") {
            range.selectNodeContents(element);
            range.collapse(true);
            setRange = true;
        } else if (type === "NodeAttributeView") {
            /// #if !MOBILE
            const cursorElement = element.querySelector(".av__cursor");
            if (cursorElement) {
                range.setStart(cursorElement.firstChild, 0);
                setRange = true;
            } else {
                return false;
            }
            /// #else
            return false;
            /// #endif
        }
        if (setRange) {
            focusByRange(range);
            return range;
        } else {
            focusSideBlock(element);
            return false;
        }
    }
    let cursorElement;
    if (toStart) {
        cursorElement = getContenteditableElement(element);
    } else {
        Array.from(element.querySelectorAll('[contenteditable="true"]'))
            .reverse()
            .find((item) => {
                if (item.getBoundingClientRect().width > 0) {
                    cursorElement = item;
                    return true;
                }
            });
    }
    if (cursorElement) {
        if (cursorElement.tagName === "TABLE") {
            if (toStart) {
                cursorElement = cursorElement.querySelector("th, td");
            } else {
                const cellElements = cursorElement.querySelectorAll("th, td");
                cursorElement = cellElements[cellElements.length - 1];
            }
        }
        let range;
        if (toStart) {
            // 需要定位到第一个 child https://github.com/siyuan-note/siyuan/issues/5930
            range = setFirstNodeRange(cursorElement, getEditorRange(cursorElement));
            range.collapse(true);
        } else {
            let focusHljs = false;
            // 定位到末尾 https://github.com/siyuan-note/siyuan/issues/5982
            if (cursorElement.classList.contains("hljs")) {
                // 代码块末尾定位需在 /n 之前 https://github.com/siyuan-note/siyuan/issues/9141，https://github.com/siyuan-note/siyuan/issues/9189
                let lastNode = cursorElement.lastChild;
                if (!lastNode) {
                    // 粘贴 ``` 报错
                    cursorElement.innerHTML = "\n";
                    lastNode = cursorElement.lastChild;
                }
                if (lastNode.textContent === "" && lastNode.nodeType === 3) {
                    lastNode = hasPreviousSibling(cursorElement.lastChild) as HTMLElement;
                }
                if (lastNode && lastNode.textContent.endsWith("\n")) {
                    // https://github.com/siyuan-note/siyuan/issues/11362
                    if (lastNode.nodeType === 1) {
                        lastNode = lastNode.lastChild;
                        while (lastNode && lastNode.textContent.indexOf("\n") === -1) {
                            lastNode = lastNode.previousSibling;
                        }
                    }
                    range = getEditorRange(cursorElement);
                    range.setStart(lastNode, lastNode.textContent.length - 1);
                    focusHljs = true;
                }
            }
            if (!focusHljs) {
                range = setLastNodeRange(cursorElement, getEditorRange(cursorElement));
            }
            range.collapse(false);
        }
        focusByRange(range);
        return range;
    } else if (parentElement) {
        parentElement.focus();
    } else {
        // li 下面为 hr、嵌入块、数学公式、iframe、音频、视频、图表渲染块等时递归处理
        if (element.classList.contains("li")) {
            return focusBlock(element.querySelector("[data-node-id]"), parentElement, toStart);
        }
    }
    return false;
};

export const focusSideBlock = (updateElement: Element) => {
    if (updateElement.getAttribute("data-node-id")) {
        let sideBlockElement;
        let collapse;
        if (
            updateElement.nextElementSibling &&
            !updateElement.nextElementSibling.classList.contains("protyle-attr") // 用例 https://ld246.com/article/1661928364696
        ) {
            collapse = true;
            sideBlockElement = getNextBlock(updateElement) as HTMLElement;
        } else if (updateElement.previousElementSibling) {
            collapse = false;
            sideBlockElement = getPreviousBlock(updateElement) as HTMLElement;
        }
        if (!sideBlockElement) {
            sideBlockElement = updateElement;
        }
        focusBlock(sideBlockElement, undefined, collapse);
        return;
    }
    const range = getEditorRange(updateElement);
    if (updateElement.nextSibling) {
        range.selectNodeContents(updateElement.nextSibling);
        range.collapse(true);
    } else if (updateElement.previousSibling) {
        range.selectNodeContents(updateElement.previousSibling);
        range.collapse(false);
    }
    focusByRange(range);
};

export const setFirstNodeRange = (editElement: Element, range: Range) => {
    if (!editElement) {
        return range;
    }
    let firstChild = editElement.firstChild as HTMLElement;
    while (firstChild && firstChild.nodeType !== 3 && !firstChild.classList.contains("render-node")) {
        if (firstChild.classList.contains("img")) {
            // https://ld246.com/article/1665360254842
            range.setStartBefore(firstChild);
            return range;
        }
        firstChild = firstChild.firstChild as HTMLElement;
    }
    if (!firstChild) {
        range.selectNodeContents(editElement);
        return range;
    }
    if (firstChild.nodeType !== 3 && firstChild.classList.contains("render-node")) {
        range.setStartBefore(firstChild);
    } else {
        range.setStart(firstChild, 0);
    }
    return range;
};

export const setLastNodeRange = (editElement: Element, range: Range, setStart = true) => {
    if (!editElement) {
        return range;
    }
    let lastNode = editElement.lastChild as Element;
    while (lastNode && lastNode.nodeType !== 3) {
        if (lastNode.nodeType !== 3 && lastNode.tagName === "BR") {
            // 防止单元格中 ⇧↓ 全部选中
            return range;
        }
        // https://github.com/siyuan-note/siyuan/issues/12792
        if (!lastNode.lastChild) {
            break;
        }
        // 最后一个为多种行内元素嵌套
        lastNode = lastNode.lastChild as Element;
    }
    // https://github.com/siyuan-note/siyuan/issues/12753
    if (!lastNode) {
        lastNode = editElement;
    }
    if (setStart) {
        if (lastNode.nodeType !== 3 && lastNode.classList.contains("render-node") && lastNode.innerHTML === "") {
            range.setStartAfter(lastNode);
        } else {
            range.setStart(lastNode, lastNode.textContent.length);
        }
    } else {
        if (lastNode.nodeType !== 3 && lastNode.classList.contains("render-node") && lastNode.innerHTML === "") {
            range.setStartAfter(lastNode);
        } else {
            range.setEnd(lastNode, lastNode.textContent.length);
        }
    }
    return range;
};

export const getNextBlock = (element: Element) => {
    let parentElement = element;
    while (parentElement) {
        if (parentElement.nextElementSibling && !parentElement.nextElementSibling.classList.contains("protyle-attr")) {
            return parentElement.nextElementSibling as HTMLElement;
        }
        const pElement = hasClosestBlock(parentElement.parentElement);
        if (pElement) {
            parentElement = pElement;
        } else {
            return false;
        }
    }
    return false;
};

export const getPreviousBlock = (element: Element) => {
    let parentElement = element;
    while (parentElement) {
        if (parentElement.previousElementSibling && parentElement.previousElementSibling.getAttribute("data-node-id")) {
            return parentElement.previousElementSibling;
        }
        const pElement = hasClosestBlock(parentElement.parentElement);
        if (pElement) {
            parentElement = pElement;
        } else {
            return false;
        }
    }
};