import { bookmarkProcessor, oembedProcessor, processSelectedBlocks, toggleBookmarkCard, toggleOembed } from "./utils/utils";
import OembedPlugin from ".";
import { Protyle } from "siyuan";

export let plugin: OembedPlugin;

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

export const ToolbarCommands = {
    oembed: {
        name: "insert-oembed",
        icon: "iconOembed",
        hotkey: "⇧⌘O",
        tipPosition: "n",
        tip: plugin.i18n.toggleOembed,
        click: async (protyle: Protyle) => {
            await processSelectedBlocks(protyle, oembedProcessor);
        },
    },
    bookmarkCard: {
        name: "insert-bookmarkCard",
        icon: "iconLink",
        hotkey: "⇧⌘K",
        tipPosition: "n",
        tip: plugin.i18n.toggleBookmarkCard,
        click: async (protyle: Protyle) => {
            await processSelectedBlocks(protyle, bookmarkProcessor);
        },
    },
};