import {
    Plugin,
    showMessage,
    Dialog,
    Menu,
    getFrontend,
    IModel,
    // Constants,
    IMenuItemOption,
    getBackend,
} from "siyuan";
import "@/index.scss";

import { BlockIconTemplate, createBlockIconConfig, SlashCommandTemplates, ToolbarCommandsTemplates } from "./config";
import { builtinEditTools } from "@/libs/const";
import { processSelectedBlocks } from "./convert";
import { setPlugin } from "@/utils/plugin";
import { logger } from "./utils/logger";
import { settings } from "./settings";
import { eventBus } from "@/utils/event-bus";
import Settings from "@/libs/components/Settings.svelte";

export default class OembedPlugin extends Plugin {
    customTab: () => IModel;
    private isMobile: boolean;
    private blockIconEventBindThis = this.blockIconEvent.bind(this);
    init() {
        setPlugin(this);
    }

    async onload() {
        this.init();

        logger.debug("Loading oembed plugin", this.i18n);
        let start = performance.now();

        const frontEnd = getFrontend();
        const backEnd = getBackend();
        logger.debug("Environment", { backEnd, frontEnd });
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        this.addIcons(`<symbol id="iconOembed" viewBox="0 0 32 32">
            <path d="M 16.0314 0.109395 C 7.2121 0.109396 0.0626228 7.25887 0.0626218 16.0782 C 0.062623 24.8975 7.2121 32.047 16.0314 32.047 C 24.8508 32.047 32.0002 24.8975 32.0002 16.0782 C 32.0002 7.25887 24.8508 0.109396 16.0314 0.109395 Z M 16.0314 3.99417 C 19.2364 3.99399 22.3101 5.26707 24.5763 7.5333 C 26.8426 9.79954 28.1156 12.8733 28.1155 16.0782 C 28.1156 19.2831 26.8426 22.3569 24.5763 24.6231 C 22.3101 26.8893 19.2364 28.1624 16.0314 28.1622 C 12.8265 28.1624 9.75276 26.8893 7.48653 24.6231 C 5.2203 22.3569 3.94722 19.2831 3.9474 16.0782 C 3.94722 12.8733 5.2203 9.79954 7.48653 7.5333 C 9.75276 5.26707 12.8265 3.99399 16.0314 3.99417 Z M 16.6056 7.47075 L 13.2697 24.4982 L 15.5002 24.9357 L 18.8361 7.90825 L 16.6056 7.47075 Z M 20.4006 9.86724 L 18.8342 11.4356 L 23.465 16.0684 L 18.8127 20.7208 L 20.3811 22.2872 L 25.0334 17.6348 L 25.0393 17.6407 L 26.6076 16.0743 L 20.4006 9.86724 Z M 11.7267 9.92974 L 7.07437 14.5841 L 7.06851 14.5782 L 5.50014 16.1446 L 11.7052 22.3497 L 13.2736 20.7833 L 8.64078 16.1505 L 13.2951 11.4981 L 11.7267 9.92974 Z" />
        </symbol>`);

        this.eventBus.on("click-blockicon", this.blockIconEventBindThis);

        settings.setPlugin(this);

        await Promise.all([settings.load()]);

        // const topBarElement = this.addTopBar({
        //     icon: "iconOembed",
        //     title: this.i18n.addTopBarIcon,
        //     position: "right",
        //     callback: () => {
        //         if (this.isMobile) {
        //             this.addMenu();
        //         } else {
        //             let rect = topBarElement.getBoundingClientRect();
        //             // 如果被隐藏，则使用更多按钮
        //             if (rect.width === 0) {
        //                 rect = document.querySelector("#barMore").getBoundingClientRect();
        //             }
        //             if (rect.width === 0) {
        //                 rect = document.querySelector("#barPlugins").getBoundingClientRect();
        //             }
        //             this.addMenu(rect);
        //         }
        //     },
        // });

        // this.eventBus.on("paste", this.handlePaste);

        this.protyleSlash = Object.values(SlashCommandTemplates).map((template) => {
            return {
                filter: template.filter,
                html: `<div class="b3-list-item__first"><svg class="b3-list-item__graphic"><use xlink:href="#${template.icon}"></use></svg><span class="b3-list-item__text">${template.name}</span><span class="b3-list-item__meta">${template.template}</span></div>`,
                id: template.name,
                callback: template.callback,
            };
        });

        this.protyleOptions = {
            toolbar: [...builtinEditTools, ...Object.values(ToolbarCommandsTemplates)],
        };

        let end = performance.now();
        logger.debug(`Loading oembed completed in ${end - start} ms`);
        logger.debug("Environment", { backEnd, frontEnd });
    }

    // handlePaste(arg0: string, handlePaste: any) {
    //     throw new Error("Method not implemented.");
    // }

    async onunload() {
        console.log(this.i18n.byePlugin);
        this.eventBus.on("click-blockicon", this.blockIconEventBindThis);
        showMessage("Unloading Siyuan-Oembed");
        console.log("onunload");
    }

    uninstall() {
        console.log("uninstall");
    }

    openSetting(): void {
        let dialog = new Dialog({
            //@ts-ignore
            title: `${this.i18n.settings.name}`,
            content: `<div id="SettingsPanel" style="height: 100%"></div>`,
            width: "50%",
            height: "32rem",
            destroyCallback: () => {
                panel.$destroy();
            },
        });
        let panel = new Settings({
            target: dialog.element.querySelector("#SettingsPanel"),
        });
    }
    // private eventBusPaste(event: any) {
    //     // 如果需异步处理请调用 preventDefault， 否则会进行默认处理
    //     event.preventDefault();
    //     // 如果使用了 preventDefault，必须调用 resolve，否则程序会卡死
    //     console.log(event);
    //     // TODO: catch pasted link and make an oembed instead
    //     event.detail.resolve({
    //         textPlain: event.detail.textPlain.trim(),
    //     });
    // }

    private attachClickHandler(template: BlockIconTemplate, blockElements: HTMLElement[]): IMenuItemOption {
        return {
            ...template,
            click: async () => {
                await processSelectedBlocks(blockElements, template.handler);
            },
        };
    }

    // Add block icon menu
    private blockIconEvent({
        detail,
    }: {
        detail: {
            blockElements: HTMLElement[];
            menu: { addItem: (item: IMenuItemOption) => void };
        };
    }) {
        const blockIconCommandTemplates = createBlockIconConfig();

        const submenus: IMenuItemOption[] = blockIconCommandTemplates.map((template) =>
            this.attachClickHandler(template, detail.blockElements)
        );

        detail.menu.addItem({
            icon: "iconOembed",
            label: this.i18n.name,
            type: "submenu",
            submenu: submenus,
        });
    }

    // Add Top Menu Items for Settings
    // private addMenu(rect?: DOMRect) {
    //     const menu = new Menu("topBarSample", () => {
    //         console.log(this.i18n.byeMenu);
    //     });
    //     menu.addSeparator();
    //     menu.addItem({
    //         icon: "iconSettings",
    //         label: "Official Setting Dialog",
    //         click: () => {
    //             this.openSetting();
    //         },
    //     });
    //     menu.addItem({
    //         icon: "iconSettings",
    //         label: "A custom setting dialog (by svelte)",
    //         click: () => {
    //             this.openDIYSetting();
    //         },
    //     });
    //     if (this.isMobile) {
    //         menu.fullscreen();
    //     } else {
    //         menu.open({
    //             x: rect.right,
    //             y: rect.bottom,
    //             isLeft: true,
    //         });
    //     }
    // }
}
