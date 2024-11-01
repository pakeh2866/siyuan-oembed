<script lang="ts">
    import { i18n } from "@/i18n";
    import { settings } from "@/settings";
    import { onDestroy, onMount } from "svelte";
    import Panels from "./SettingsPanels.svelte";

    let contents = i18n.settings;

    let groups = {
        general: [
            {
                name: "CatchClipboard",
                type: "checkbox",
            },
            {
                name: "ClipboardConverter",
                type: "select",
            },
            {
                name: "EnableDebug",
                type: "checkbox",
            },
        ],
        oembed: [
            {
                name: "OembedBlacklist",
                type: "textarea",
                direction: "row",
            },
        ],
        bookmarkCard: [
            {
                name: "BookmarkCardBlacklist",
                type: "textarea",
                direction: "row",
            },
        ],
    };

    let allSettingPanels: {
        name: string;
        items: ISettingsItem[];
    }[] = [];

    for (let key in groups) {
        let items: ISettingsItem[] = [];
        for (let item of groups[key]) {
            items.push({
                type: item.type,
                key: item.name,
                value: settings.get(item.name),
                title: contents[item.name]["title"],
                description: contents[item.name]["text"],
                placeholder: contents[item.name]["placeholder"],
                options: contents[item.name]["options"],
                direction: item.direction
            });
        }
        allSettingPanels.push({
            name: key,
            items: items,
        });
    }

    onMount(() => {
        console.log("Setting Svelte Mounted");
    });

    onDestroy(() => {
        console.log("Setting Svelte Destroyed");
        settings.save();
    });

    function onClick({ detail }) {
        console.log(detail);
    }
</script>

<Panels panels={allSettingPanels} on:click={onClick}/>