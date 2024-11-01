import { convertToBookmarkCard, convertToOembed, processSelectedBlocks, toggleBookmarkCard, toggleOembed } from "./convert";
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
        template: `Ctrl+Shift+O`,
        callback: toggleOembed,
    },
    bookmarkCard: {
        filter: ["card", "bookmark", "bk"],
        icon: "iconLink",
        name: "Bookmark card",
        template: `Ctrl+Shift+C`,
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