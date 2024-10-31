import { convertToBookmarkCard, convertToOembed, processSelectedBlocks, toggleBookmarkCard, toggleOembed } from "@/utils/utils";

import { i18n } from "./i18n";
import { getBlocks } from "./utils/block";

export interface BlockIconTemplate {
    id: string;
    icon: string;
    label: string;
    handler: (id: string, link: string) => Promise<void>;
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
        name: "toggle-oembed",
        icon: "iconOembed",
        hotkey: "⇧⌘O",
        tipPosition: "n",
        tip: i18n.toggleOembed,
        click: async () => {
            await processSelectedBlocks(getBlocks(), convertToOembed);
        },
    },
    bookmarkCard: {
        name: "toggle-bookmarkCard",
        icon: "iconLink",
        hotkey: "⇧⌘C",
        tipPosition: "n",
        tip: i18n.toggleBookmarkCard,
        click: async () => {
            await processSelectedBlocks(getBlocks(), convertToBookmarkCard);
        },
    },
};

export const createBlockIconConfig = (): BlockIconTemplate[] => [
    {
        id: "toggle-oembed",
        icon: "iconOembed",
        label: i18n.toggleOembed,
        handler: convertToOembed,
    },
    {
        id: "toggle-bookmarkCard",
        icon: "iconLink",
        label: i18n.toggleBookmarkCard,
        handler: convertToBookmarkCard,
    },
];