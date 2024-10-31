import { Dialog, Protyle, showMessage } from "siyuan";
import { CUSTOM_ATTRIBUTE, defaultBookmarkCardStyle } from "./const";
import { LinkData } from "./types/utils";
import { logger } from "./utils/logger";
import { getURLMetadata } from "./utils/metadata";
import { i18n } from "./i18n";
import { extractUrlFromBlock, focusBlock, getCurrentBlock, getElementByBlockId, isEmptyParagraphBlock } from "./utils/block";
import { blank, getUrlFinalSegment, notBlank, regexp, wrapInDiv } from "./utils/strings";
import { forwardProxy, getBlockAttrs, setBlockAttrs, updateBlock } from "./api";
import getOembed from "./oembed";

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
    const missingProps = ["title", "description", "icon", "author", "thumbnail", "publisher"].filter(
        (prop) => !conf[prop as keyof typeof conf]
    );

    if (missingProps.length > 0) {
        try {
            const fetchedData = await getURLMetadata(conf.link);
            logger.debug("getURLMetadata:", { link: conf.link, fetchedData });
            if (!fetchedData) return;
            missingProps.forEach((prop) => {
                if (!conf.title && prop === "title") conf.title = fetchedData.title;
                if (!conf.description && prop === "description") conf.description = fetchedData.description;
                if (!conf.icon && prop === "icon") conf.icon = fetchedData.icon;
                if (!conf.author && prop === "author") conf.author = fetchedData.author;
                if (!conf.thumbnail && prop === "thumbnail") conf.thumbnail = fetchedData.thumbnail;
                if (!conf.publisher && prop === "publisher") conf.publisher = fetchedData.publisher;
            });
        } catch (error) {
            logger.error("Failed to fetch metadata for link:", { error });
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
                                                        conf.author
                                                            ? `<span class="kg-bookmark-author">${
                                                                  conf.author || ""
                                                              }</span>`
                                                            : ""
                                                    }
                                                    ${
                                                        conf.publisher
                                                            ? `<span class="kg-bookmark-publisher">${
                                                                  conf.publisher || ""
                                                              }</span>`
                                                            : ""
                                                    }
                                                </div>
                                            </div>
                                            ${
                                                conf.thumbnail
                                                    ? `<div class="kg-bookmark-thumbnail">
                                                    <img src="${conf.thumbnail || ""}" alt="Link thumbnail" />
                                                </div>`
                                                    : ""
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

export const toggleBookmarkCard = async (protyle: Protyle): Promise<void> => {
    protyle.insert(window.Lute.Caret);

    const currentBlock = getCurrentBlock();
    const id = currentBlock.dataset.nodeId;
    logger.debug("Toggling bookmark for block and ID:", { currentBlock, id });

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
            logger.error("Error converting to oembed:", { error });
        }
    } catch (error) {
        logger.error("Error toggling oembed link:", { error });
        throw error; // Re-throw to allow caller to handle the error
    }
};

export const convertToBookmarkCard = async (id: string, link: string): Promise<void> => {
    if (!id || !link) return;
    logger.debug("Converting bookmark for id and link:", { id, link });

    try {
        const dom = await generateBookmarkCard({ link });
        logger.debug("Generated bookmark card dom:", { dom });
        if (!dom) return;

        const success = await updateBlock("dom", dom, id);

        if (!success) {
            throw new Error("Failed to update block");
        }

        await setBlockAttrs(id, { [CUSTOM_ATTRIBUTE]: link });
        const element = getElementByBlockId(id);
        logger.debug("Element ID to focus on after converting:", { element });
        focusBlock(element);
        logger.info("Block successfully updated to bookmark card");
        showMessage("Link converted!");
    } catch (error) {
        logger.error("Failed to convert block to bookmark card:", { error });
        throw error;
    }
};

export const convertToOembed = async (id: string, link: string): Promise<void> => {
    if (!id || !link) return;
    logger.debug("Converting bookmark for id and link:", { id, link });

    try {
        const html = await getOembed(link);
        logger.debug("Generated oembed html:", { html });
        if (!html) return;

        const wrappedHtml = wrapInDiv(html);
        const success = await updateBlock("dom", wrappedHtml, id);

        if (!success) {
            throw new Error("Failed to update block");
        }

        await setBlockAttrs(id, { [CUSTOM_ATTRIBUTE]: link });
        const element = getElementByBlockId(id);
        logger.debug("Element ID to focus on after converting:", { element });
        focusBlock(element);
        logger.info("Block successfully updated with oembed content");
        showMessage("Link converted!");
    } catch (error) {
        logger.error("Failed to convert block to oembed:", { error });
        throw error;
    }
};

export const toggleOembed = async (protyle: Protyle): Promise<void> => {
    protyle.insert(window.Lute.Caret);

    const currentBlock = getCurrentBlock();
    const id = currentBlock.dataset.nodeId;
    logger.debug("Toggling oembed for block and ID:", { currentBlock, id });

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
            logger.error("Error converting to oembed:", { error });
        }
    } catch (error) {
        logger.error("Failed to toggle oembed:", { error });
        throw error; // Re-throw to allow caller to handle the error
    }
};

export const processSelectedBlocks = async (
    blocks: HTMLElement[],
    processor: (id: string, link: string) => Promise<void>
) => {
    let link: string = null;
    logger.debug("Processing blocks:", { blocks });
    try {
        const promises = blocks.map(async (item: HTMLElement) => {
            const id = item?.dataset.nodeId;
            if (!id) {
                throw new Error("No valid block ID found");
            }
            try {
                // if the block is empty, open the dialog to get the link
                if (isEmptyParagraphBlock(item)) {
                    logger.debug("Block is empty, opening a link for dialog");
                    link = (await openDialog()) as string;
                }
                // if the block is not empty,
                else {
                    // check if the block has our custom tag already (CUSTOM_ATTRIBUTE)
                    logger.debug("Block is not empty, checking if this is our link");
                    const isOembed = await isOembedLink(id);

                    if (isOembed) {
                        // toggle the link back if it had been previously converted
                        logger.debug("This is our link previously converted!");
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
                    } else {
                        // extract the link from the block
                        link = extractUrlFromBlock(item);
                        logger.debug("Link extracted from block:", { link });
                    }
                }

                if (!link || !regexp.url.test(link)) {
                    return;
                }

                try {
                    await processor(id, link);
                } catch (error) {
                    logger.error("Error using link processor:", { error });
                }
            } catch (error) {
                logger.error("Failed to process selected blocks:", { error });
                throw error; // Re-throw to allow caller to handle the error
            }
        });
        await Promise.all(promises);
    } catch (error) {
        logger.error("Error processing blocks:", { error });
    }
};

export const isOembedLink = async (blockId: string): Promise<boolean> => {
    const attrs = await getBlockAttrs(blockId);
    return !!(attrs?.[CUSTOM_ATTRIBUTE] && attrs[CUSTOM_ATTRIBUTE].trim() !== "");
};

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
        logger.error("Error fetching URL title:", { ex });
        return "";
    }
};
