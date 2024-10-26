import CircularJSON from "circular-json";
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
import { bookmarkAsString, convertToOembed, escapeHtml, genHtmlBlock, getAll, getCurrentBlock, isEmptyParagraphBlock, isHTMLBlock, isParagraphBlock, LinkData, microlinkScraper } from "@/utils/utils"
import "@/index.scss";
import { insertBlock, updateBlock } from "@/api";

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

    private generateCardHTML = async (config?: LinkData) => {
        let conf: LinkData = {
            title: "",
            description: "",
            icon: "",
            author: "",
            link: "",
            thumbnail: "",
            publisher: "",
        };
        if (config) {
            Object.assign(conf, config);
        }
        try {
            const url = await this.openDialog();
            // const url = inputDialog({
            //     title: "Oembed",
            // });
            // const url = this.showDialog();
            // const url = "https://anarion.dev";
            console.log("🚀 ~ OembedPlugin ~ generateCardHTML= ~ url:", url)
            if (url) {
                const newConf = await microlinkScraper(url);
                const { title, image, description } = newConf;
                return `<div
    style="
        border: 1px solid rgb(222, 222, 222);
        box-shadow: rgba(0, 0, 0, 0.06) 0px 1px 3px;
    "
    ><style>
    .kg-card {
    font-family:
        'Inter Variable',
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        Segoe UI,
        Roboto,
        Helvetica Neue,
        Arial,
        Noto Sans,
        sans-serif,
        Apple Color Emoji,
        Segoe UI Emoji,
        Segoe UI Symbol,
        Noto Color Emoji;
    }
    .kg-card {
        @extend %font-sans;
    }
    .kg-card:not(.kg-callout-card) {
        font-size: 1rem;
    }
    /* Add extra margin before/after any cards,
except for when immediately preceeded by a heading */
    .post-body :not(.kg-card):not([id]) + .kg-card {
        margin-top: 6vmin;
    }
    .post-body .kg-card + :not(.kg-card) {
        margin-top: 6vmin;
    }
    .kg-bookmark-card,
    .kg-bookmark-card * {
        box-sizing: border-box;
    }
    .kg-bookmark-card,
    .kg-bookmark-publisher {
        position: relative;
        /* width: 100%; */
    }
    .kg-bookmark-card a.kg-bookmark-container,
    .kg-bookmark-card a.kg-bookmark-container:hover {
        display: flex;
        background: var(--bookmark-background-color);
        text-decoration: none;
        border-radius: 6px;
        border: 1px solid var(--bookmark-border-color);
        overflow: hidden;
        color: var(--bookmark-text-color);
    }
    .kg-bookmark-content {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        flex-basis: 100%;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 20px;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
            'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    }
    .kg-bookmark-title {
        font-size: 15px;
        line-height: 1.4em;
        font-weight: 600;
    }
    .kg-bookmark-description {
        display: -webkit-box;
        font-size: 14px;
        line-height: 1.5em;
        margin-top: 3px;
        font-weight: 400;
        max-height: 44px;
        overflow-y: hidden;
        opacity: 0.7;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }
    .kg-bookmark-metadata {
        display: flex;
        align-items: center;
        margin-top: 22px;
        width: 100%;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
    }
    .kg-bookmark-metadata > *:not(img) {
        opacity: 0.7;
    }
    .kg-bookmark-icon {
        width: 20px;
        height: 20px;
        margin-right: 6px;
    }
    .kg-bookmark-author,
    .kg-bookmark-publisher {
        display: inline;
    }
    .kg-bookmark-publisher {
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 240px;
        white-space: nowrap;
        display: block;
        line-height: 1.65em;
    }
    .kg-bookmark-metadata > span:nth-of-type(2) {
        font-weight: 400;
    }
    .kg-bookmark-metadata > span:nth-of-type(2):before {
        content: '•';
        margin: 0 6px;
    }
    .kg-bookmark-metadata > span:last-of-type {
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .kg-bookmark-thumbnail {
        position: relative;
        flex-grow: 1;
        min-width: 33%;
    }
    .kg-bookmark-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover; /* or contain */
        position: absolute;
        top: 0;
        left: 0;
        border-radius: 0 2px 2px 0;
    }
</style><div>
            <figure class="kg-card kg-bookmark-card">
                <a class="kg-bookmark-container" href="${conf.link}"
                    ><div class="kg-bookmark-content">
                        <div class="kg-bookmark-title">${
                            conf.title || title
                        }</div>
                        <div class="kg-bookmark-description">${
                            conf.description || description
                        }</div>
                        <div class="kg-bookmark-metadata">
                            <img class="kg-bookmark-icon" src="${
                                conf.icon
                            }" alt="Link icon" />
                            <span class="kg-bookmark-author">${
                                conf.author
                            }</span>
                            <span class="kg-bookmark-publisher">${
                                conf.publisher
                            }</span>
                        </div>
                    </div><div class="kg-bookmark-thumbnail">
                                <img src="${
                                    conf.thumbnail || image
                                }" alt="Link thumbnail" />
                            </div>
                </a>
            </figure></div></div>
            `;
            }
        } catch (e) {
            console.error(e);
            return;
        }
    };

    private openDialog = (args?: {
        title: string;
        placeholder?: string;
        defaultText?: string;
        confirm?: (text: string) => void;
        cancel?: () => void;
        width?: string;
        height?: string;
    }) => {
        return new Promise((resolve, reject) => {
            const dialog = new Dialog({
                title: this.i18n.insertURLDialogTitle,
                content: `<div class="b3-dialog__content"><textarea class="b3-text-field fn__block" placeholder="Please enter the URL"></textarea></div>
                    <div class="b3-dialog__action">
                    <button class="b3-button b3-button--cancel">${this.i18n.cancel}</button><div class="fn__space"></div>
                    <button class="b3-button b3-button--text">${this.i18n.save}</button>
                    </div>`,
                width: "520px",
            });
            const inputElement = dialog.element.querySelector("textarea");
            const btnsElement = dialog.element.querySelectorAll(".b3-button");
            dialog.bindInput(inputElement, () => {
                (btnsElement[1] as HTMLElement).click();
            });
            inputElement.focus();
            btnsElement[0].addEventListener("click", () => {
                dialog.destroy();
                reject();
            });
            btnsElement[1].addEventListener("click", () => {
                dialog.destroy();
                resolve(inputElement.value);
            });
            // const target: HTMLTextAreaElement = dialog.element.querySelector(
            //     ".b3-dialog__content>textarea"
            // );
            // console.log("🚀 ~ OembedPlugin ~ returnnewPromise ~ target:", target)
            // const btnsElement = dialog.element.querySelectorAll(".b3-button");
            // btnsElement[0].addEventListener("click", () => {
            //     if (args?.cancel) {
            //         args.cancel();
            //     }
            //     dialog.destroy();
            //     reject();
            // });
            // btnsElement[1].addEventListener("click", () => {
            //     if (args?.confirm) {
            //         args.confirm(target.value);
            //     }
            //     dialog.destroy();
            //     resolve(target.value);
            // });
        });
    };

    private showDialog() {
        // let dialog = new Dialog({
        //     title: `SiYuan ${Constants.SIYUAN_VERSION}`,
        //     content: `<div id="helloPanel" class="b3-dialog__content"></div>`,
        //     width: this.isMobile ? "92vw" : "720px",
        //     destroyCallback() {
        //         // hello.$destroy();
        //     },
        // });
        // new HelloExample({
        //     target: dialog.element.querySelector("#helloPanel"),
        //     props: {
        //         app: this.app,
        //     }
        // });
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
                callback: async (protyle: Protyle) => {
                    protyle.insert(window.Lute.Caret);
                    try {
                        const id = getCurrentBlock()?.dataset.nodeId;
                        if (id) {
                            const dom = await this.generateCardHTML();
                            const res = await updateBlock("dom", dom, id);
                            if (res) {
                                console.log("Update block success");
                            } else {
                                console.error("Update block failed:", res);
                            }
                        }
                    } catch (error) {
                        console.error("Error calling updateBlock:", error);
                    }
                },
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
                    click: (protyle: Protyle) => {
                        // this.showDialog();
                        // protyle.insert("oembed");
                        const test = getAll("div.p.protyle-wysiwyg--select");
                        console.log("🚀 ~ OembedPlugin ~ onload ~ test:", test);
                        console.log(
                            "🚀 ~ OembedPlugin ~ callback ~ getCurrentBlock:",
                            getCurrentBlock()
                        );
                        console.log(
                            "🚀 ~ OembedPlugin ~ callback ~ isEmptyParagraphBlock:",
                            isEmptyParagraphBlock()
                        );
                        console.log(
                            "🚀 ~ OembedPlugin ~ callback ~ isParagraphBlock:",
                            isParagraphBlock()
                        );
                        console.log(
                            "🚀 ~ OembedPlugin ~ callback ~ isHTMLBlock:",
                            isHTMLBlock()
                        );
                        convertToOembed(getCurrentBlock(), protyle);
                    },
                },
            ],
        };

        console.log(this.i18n.helloPlugin);
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
                const promises = detail.blockElements.map(
                    async (item: HTMLElement) => {
                        await convertToOembed(
                            item,
                            detail.protyle.getInstance()
                        );
                    }
                );
                // Promise.all(promises).then(() => {
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
