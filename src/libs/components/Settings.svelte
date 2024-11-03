<script lang="ts">
    import { i18n } from "@/i18n";
    import { settings } from "@/settings";
    import { onDestroy, onMount } from "svelte";
    import Panels from "./SettingsPanels.svelte";
    import { logger } from "@/utils/logger";

    let contents = i18n.settings;

    let groups = [{
            name: "general",
            icon: "#iconSettings",
            items: [
                {
                    name: "CatchClipboard",
                    type: "checkbox",
                    direction: "column",
                },
                {
                    name: "ClipboardConverter",
                    type: "select",
                    direction: "column",
                },
                {
                    name: "EnableDebug",
                    type: "checkbox",
                    direction: "column",
                },
            ]},
        {
            name: "oembed",
            icon: "#iconOembed",
            items: [
                {
                    name: "OembedBlacklist",
                    type: "textarea",
                    direction: "row",
                },
            ]},
        {
            name: "bookmarkCard",
            icon: "#iconLink",
            items: [
                {
                    name: "BookmarkCustomCSS",
                    type: "textarea",
                    direction: "row",
                },
                {
                    name: "BookmarkCardBlacklist",
                    type: "textarea",
                    direction: "row",
                },
            ]},
        ];

    let allSettingsPanels: {
        name: string;
        icon: string;
        items: ISettingsItem[];
    }[] = [];

    for (let group of groups) {
        let items: ISettingsItem[] = [];
        for (let item of group.items) {
            items.push({
                type: item.type as TSettingItemType,
                key: item.name,
                value: settings.get(item.name as SettingsKey),
                title: contents[item.name]["title"],
                description: contents[item.name]["text"],
                placeholder: contents[item.name]["placeholder"],
                options: contents[item.name]["options"],
                direction: item.direction === "row" || item.direction === "column" ? item.direction : "column"
            });
        }
        allSettingsPanels.push({
            name: group.name,
            icon: group.icon,
            items: items,
        });
    }

    onMount(() => {
        logger.debug("Setting Svelte Mounted");
    });

    onDestroy(() => {
        logger.debug("Setting Svelte Destroyed");
        settings.save();
    });

    function onClick({ detail }) {
        logger.debug("Setting Svelte onClick:", detail);
    }
</script>

<Panels panels={allSettingsPanels} on:click={onClick}/>