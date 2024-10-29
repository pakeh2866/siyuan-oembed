import { bookmarkProcessor, getBlocks, oembedProcessor, processSelectedBlocks, toggleBookmarkCard, toggleOembed } from "./utils/utils";
import { Protyle } from "siyuan";

import { i18n } from "./i18n";

export interface BlockIconTemplate {
    id: string;
    icon: string;
    label: string;
}

export const SlashCommandTemplates = {
    oembed: {
        filter: ["oembed", "Oembed", "oe"],
        icon: "iconOembed",
        name: "Oembed",
        template: `Convert URLs in your markdown to the embedded version of those URLs`,
        callback: toggleOembed,
    },
    bookmarkCard: {
        filter: ["card", "bookmark", "bk"],
        icon: "iconLink",
        name: "Bookmark card",
        template: `Convert URLs in your markdown to bookmark cards`,
        callback: toggleBookmarkCard,
    },
};

export const ToolbarCommandsTemplates = {
    oembed: {
        name: "insert-oembed",
        icon: "iconOembed",
        hotkey: "⇧⌘O",
        tipPosition: "n",
        tip: i18n.toggleOembed,
        click: async (protyle: Protyle) => {
            const selectedBlock = getBlocks(protyle);
            await processSelectedBlocks(selectedBlock, oembedProcessor);
        },
    },
    bookmarkCard: {
        name: "insert-bookmarkCard",
        icon: "iconLink",
        hotkey: "⇧⌘K",
        tipPosition: "n",
        tip: i18n.toggleBookmarkCard,
        click: async (protyle: Protyle) => {
            const selectedBlock = getBlocks(protyle);
            await processSelectedBlocks(selectedBlock,bookmarkProcessor);
        },
    },
};

export const createBlockIconConfig = (): BlockIconTemplate[] => [
    {
        id: "oembed",
        icon: "iconOembed",
        label: i18n.toggleOembed,
    },
    {
        id: "bookmarkCard",
        icon: "iconLink",
        label: i18n.toggleBookmarkCard,
    },
];