<script lang="ts">
    import SettingPanel from "./libs/components/setting-panel.svelte";

    let groups: string[] = ["⚙ Settings"];
    let focusGroup = groups[0];

    const group1Items: ISettingItem[] = [
        {
            type: 'checkbox',
            title: 'Enable automatic embedding',
            description: 'Enable automatic embeddings of all links',
            key: 'a',
            value: true
        },
    ];

    /********** Events **********/
    interface ChangeEvent {
        group: string;
        key: string;
        value: any;
    }

    const onChanged = ({ detail }: CustomEvent<ChangeEvent>) => {
        if (detail.group === groups[0]) {
            // setting.set(detail.key, detail.value);
            //Please add your code here
            //Udpate the plugins setting data, don't forget to call plugin.save() for data persistence
        }
    };
</script>

<div class="fn__flex-1 fn__flex config__panel">
    <ul class="b3-tab-bar b3-list b3-list--background">
        {#each groups as group}
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <li
                data-name="editor"
                class:b3-list-item--focus={group === focusGroup}
                class="b3-list-item"
                on:click={() => {
                    focusGroup = group;
                }}
                on:keydown={() => {}}
            >
                <span class="b3-list-item__text">{group}</span>
            </li>
        {/each}
    </ul>
    <div class="config__tab-wrap">
        <SettingPanel
            group={groups[0]}
            settingItems={group1Items}
            display={focusGroup === groups[0]}
            on:changed={onChanged}
            on:click={({ detail }) => { console.debug("Click:", detail.key); }}
        >
            <div class="fn__flex b3-label">
                💡 This is our default settings.
            </div>
        </SettingPanel>
    </div>
</div>

<style lang="scss">
    .config__panel {
        height: 100%;
    }
    .config__panel > ul > li {
        padding-left: 1rem;
    }
</style>
