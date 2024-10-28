import {
    Plugin,
    showMessage,
    confirm,
    Dialog,
    Menu,
    openTab,
    adaptHotkey,
    getFrontend,
    getBackend,
    IModel,
    Protyle,
    openWindow,
    IOperation,
    Constants,
    openMobileFileById,
    lockScreen,
    ICard,
    ICardData,
    IMenuItemOption,
    IToolbarItem,
    Lute
} from "siyuan";
import { hasClosestByAttribute } from "./utils/hasClosest";
import { getOembed } from "./oembed";
import {
    addBookmark,
    bookmarkAsString,
    convertToOembed,
    escapeHtml,
    genHtmlBlock,
    getAll,
    getCurrentBlock,
    isEmptyParagraphBlock,
    isHTMLBlock,
    isParagraphBlock,
    LinkData,
    microlinkScraper,
    wrapInDiv,
    extractUrlFromBlock,
    handleBookmarkUpdate,
    setPlugin,
    openDialog,
} from "@/utils/utils";
import "@/index.scss";
import { getBlockByID, insertBlock, setBlockAttrs, updateBlock } from "@/api";

import HelloExample from "@/hello.svelte";
import SettingExample from "@/setting-example.svelte";

import { SettingUtils } from "./libs/setting-utils";
import { svelteDialog, inputDialog, inputDialogSync } from "./libs/dialog";

const STORAGE_NAME = "menu-config";

const builtinEditTools: Array<string | IToolbarItem> = [
    "block-ref",
    "a",
    "|",
    "text",
    "strong",
    "em",
    "u",
    "s",
    "mark",
    "sup",
    "sub",
    "clear",
    "|",
    "code",
    "kbd",
    "tag",
    "inline-math",
    "inline-memo",
    "|"
]

export default class OembedPlugin extends Plugin {
    customTab: () => IModel;
    private isMobile: boolean;
    private blockIconEventBindThis = this.blockIconEvent.bind(this);
    private settingUtils: SettingUtils;
    init() {
        setPlugin(this);
    }

    private handlePaste({ detail }: any) {
        console.log("🚀 ~ OembedPlugin ~ handlePaste ~ detail:", detail);
        console.log(
            "🚀 ~ OembedPlugin ~ handlePaste ~ detail.textPlain:",
            detail.textPlain
        );
    }

    private handleLink({ detail }: any) {
        console.log("🚀 ~ OembedPlugin ~ handleLink ~ detail:", detail);
    }

    private showDialog() {
        svelteDialog({
            title: `SiYuan ${Constants.SIYUAN_VERSION}`,
            width: this.isMobile ? "92vw" : "720px",
            constructor: (container: HTMLElement) => {
                return new HelloExample({
                    target: container,
                    props: {
                        app: this.app,
                    },
                });
            },
        });
    }

    async onload() {
        this.init();
        this.data[STORAGE_NAME] = { readonlyText: "Readonly" };

        console.log("loading oembed plugin", this.i18n);

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        this.addIcons(`<symbol id="iconOembed" viewBox="0 0 32 32">
            <path d="M 16.0314 0.109395 C 7.2121 0.109396 0.0626228 7.25887 0.0626218 16.0782 C 0.062623 24.8975 7.2121 32.047 16.0314 32.047 C 24.8508 32.047 32.0002 24.8975 32.0002 16.0782 C 32.0002 7.25887 24.8508 0.109396 16.0314 0.109395 Z M 16.0314 3.99417 C 19.2364 3.99399 22.3101 5.26707 24.5763 7.5333 C 26.8426 9.79954 28.1156 12.8733 28.1155 16.0782 C 28.1156 19.2831 26.8426 22.3569 24.5763 24.6231 C 22.3101 26.8893 19.2364 28.1624 16.0314 28.1622 C 12.8265 28.1624 9.75276 26.8893 7.48653 24.6231 C 5.2203 22.3569 3.94722 19.2831 3.9474 16.0782 C 3.94722 12.8733 5.2203 9.79954 7.48653 7.5333 C 9.75276 5.26707 12.8265 3.99399 16.0314 3.99417 Z M 16.6056 7.47075 L 13.2697 24.4982 L 15.5002 24.9357 L 18.8361 7.90825 L 16.6056 7.47075 Z M 20.4006 9.86724 L 18.8342 11.4356 L 23.465 16.0684 L 18.8127 20.7208 L 20.3811 22.2872 L 25.0334 17.6348 L 25.0393 17.6407 L 26.6076 16.0743 L 20.4006 9.86724 Z M 11.7267 9.92974 L 7.07437 14.5841 L 7.06851 14.5782 L 5.50014 16.1446 L 11.7052 22.3497 L 13.2736 20.7833 L 8.64078 16.1505 L 13.2951 11.4981 L 11.7267 9.92974 Z" />
        </symbol>`);

        this.eventBus.on("click-blockicon", this.blockIconEventBindThis);

        const topBarElement = this.addTopBar({
            icon: "iconOembed",
            title: this.i18n.addTopBarIcon,
            position: "right",
            callback: () => {
                if (this.isMobile) {
                    this.addMenu();
                } else {
                    let rect = topBarElement.getBoundingClientRect();
                    // 如果被隐藏，则使用更多按钮
                    if (rect.width === 0) {
                        rect = document
                            .querySelector("#barMore")
                            .getBoundingClientRect();
                    }
                    if (rect.width === 0) {
                        rect = document
                            .querySelector("#barPlugins")
                            .getBoundingClientRect();
                    }
                    this.addMenu(rect);
                }
            },
        });

        // this.eventBus.on("paste", this.handlePaste);

        this.settingUtils = new SettingUtils({
            plugin: this,
            name: STORAGE_NAME,
        });
        this.settingUtils.addItem({
            key: "Check",
            value: true,
            type: "checkbox",
            title: "Enable automatic embedding",
            description: "Enable automatic embedding of every link",
            action: {
                callback: () => {
                    // Return data and save it in real time
                    let value = !this.settingUtils.get("Check");
                    this.settingUtils.set("Check", value);
                    console.log(value);
                },
            },
        });
        this.settingUtils.addItem({
            key: "Hint",
            value: "",
            type: "hint",
            title: this.i18n.hintTitle,
            description: this.i18n.hintDesc,
        });

        try {
            this.settingUtils.load();
        } catch (error) {
            console.error(
                "Error loading settings storage, probably empty config json:",
                error
            );
        }

        this.protyleSlash = [
            {
                filter: ["oembed", "Oembed"],
                html: `<div class="b3-list-item__first"><span class="b3-list-item__text">Oembed</span><span class="b3-list-item__meta">Convert URLs in your markdown to the embedded version of those URLs</span></div>`,
                id: "oembed",
                callback: handleBookmarkUpdate,
            },
        ];

        this.protyleOptions = {
            toolbar: [
                ...builtinEditTools,
                {
                    name: "insert-oembed",
                    icon: "iconOembed",
                    hotkey: "⇧⌘L",
                    tipPosition: "n",
                    tip: this.i18n.toggleOembed,
                    click: async () => {
                        const block = getCurrentBlock();
                        const id = block?.dataset.nodeId;
                        let link = null;
                        if (!block) return;

                        try {
                            if (isEmptyParagraphBlock()) {
                                // For empty blocks, prompt for link URL
                                link = (await openDialog()) as string;
                            } else {
                                // For blocks with content, try to convert existing link
                                // Get URL either from block content
                                link = extractUrlFromBlock(block);
                            }
                            if (link) {
                                await convertToOembed(id, link);
                            }
                        } catch (error) {
                            console.error("Error converting to oembed:", error);
                        }
                    },
                },
            ],
        };
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

    /**
     * A custom setting panel provided by svelte
     */
    openDIYSetting(): void {
        const dialog = new Dialog({
            title: "Settings Panel",
            content: `<div id="SettingsPanel" style="height: 100%;"></div>`,
            width: "800px",
            destroyCallback: (options) => {
                console.log("destroyCallback", options);
                //You'd better destroy the component when the dialog is closed
                panel.$destroy();
            },
        });
        const panel = new SettingExample({
            target: dialog.element.querySelector("#SettingsPanel"),
        });
    }

    private eventBusPaste(event: any) {
        // 如果需异步处理请调用 preventDefault， 否则会进行默认处理
        event.preventDefault();
        // 如果使用了 preventDefault，必须调用 resolve，否则程序会卡死
        console.log(event);
        // TODO: catch pasted link and make an oembed instead
        event.detail.resolve({
            textPlain: event.detail.textPlain.trim(),
        });
    }

    private blockIconEvent({ detail }: any) {
        console.log("🚀 ~ OembedPlugin ~ blockIconEvent ~ detail:", detail);
        detail.menu.addItem({
            icon: "iconOembed",
            label: this.i18n.convertOembed,
            click: () => {
                console.log(
                    "🚀 ~ OembedPlugin ~ click ~ detail:",
                    detail.blockElements
                );
                try {
                    const promises = detail.blockElements.map(
                        async (item: HTMLElement) => {
                            const id = item?.dataset.nodeId
                            const link = extractUrlFromBlock(item);
                            if (link) {
                                await convertToOembed(id, link);
                            }
                        }
                    );
                } catch (error) {
                    console.error("Error converting to oembed:", error);
                }
1                // Promise.all(promises).then(() => {
                //     detail.protyle.getInstance().reload()
                // });
            },
        });
    }

    private addMenu(rect?: DOMRect) {
        const menu = new Menu("topBarSample", () => {
            console.log(this.i18n.byeMenu);
        });
        menu.addSeparator();
        menu.addItem({
            icon: "iconSettings",
            label: "Official Setting Dialog",
            click: () => {
                this.openSetting();
            },
        });
        menu.addItem({
            icon: "iconSettings",
            label: "A custom setting dialog (by svelte)",
            click: () => {
                this.openDIYSetting();
            },
        });
        if (this.isMobile) {
            menu.fullscreen();
        } else {
            menu.open({
                x: rect.right,
                y: rect.bottom,
                isLeft: true,
            });
        }
    }
}
