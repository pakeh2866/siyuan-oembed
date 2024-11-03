<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import SettingsPanel from "./SettingsPanel.svelte";
    import { i18n } from "@/i18n";

    export let panels: {
        name: string;
        icon: string;
        items: ISettingsItem[];
    }[];

    let groups = panels.map((panel) => ({
        name: panel.name,
        icon: panel.icon
    }));

    let focusName = groups[0].name;

    const dispatch = createEventDispatcher();

    function onClick( {detail}) {
        dispatch("click", detail);
    }

</script>

<div class="fn__flex-1 fn__flex config__panel">
    <ul class="b3-tab-bar b3-list b3-list--background">
        {#each groups as group}
            <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
            <li
                data-name="editor"
                class:b3-list-item--focus={group.name === focusName}
                class="b3-list-item"
                role="button"
                on:click={() => {focusName = group.name}} on:keydown={() => {}}
            >
                {#if group.icon}
                    <svg class="b3-list-item__graphic">
                        <use xlink:href={group.icon} />
                    </svg>
                {/if}
                <span class="b3-list-item__text">{i18n.SettingGroups[group.name]}</span>
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
    @media (max-width: 750px) {
        .config__panel>ul>li {
            padding: 1rem 1.5rem 1rem 1rem ;
        }
        .b3-list-item {
            padding: 0
        }
    }
</style>