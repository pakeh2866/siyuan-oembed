<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import SettingsPanel from "./SettingsPanel.svelte";
    import { i18n } from "@/i18n";

    export let panels: {
        name: string;
        items: ISettingsItem[];
    }[];
    let names = panels.map((panel) => panel.name);

    let focusName = names[0];

    const dispatch = createEventDispatcher();

    function onClick( {detail}) {
        dispatch("click", detail);
    }

</script>

<div class="fn__flex-1 fn__flex config__panel">
    <ul class="b3-tab-bar b3-list b3-list--background">
        {#each names as name}
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <li
                data-name="editor"
                class:b3-list-item--focus={name === focusName}
                class="b3-list-item"
                on:click={() => {focusName = name}} on:keydown={() => {}}
            >
                <span class="b3-list-item__text">{i18n.SettingGroups[name]}</span>
            </li>
        {/each}
    </ul>
    <div class="config__tab-wrap">
        {#each panels as panel}
            <SettingsPanel
                group={panel.name}
                settingItems={panel.items}
                display={panel.name === focusName}
                on:click={onClick}
            >
            </SettingsPanel>
        {/each}
    </div>
</div>

<style>
    .config__panel {
        height: 100%;
    }
    .config__panel>ul>li {
        padding-left: 1rem;
    }
</style>