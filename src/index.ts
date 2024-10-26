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
import { escapeHtml, genHtmlBlock, getCurrentBlock } from "@/utils/utils"
import "@/index.scss";

import HelloExample from "@/hello.svelte";
import SettingExample from "@/setting-example.svelte";

import { SettingUtils } from "./libs/setting-utils";
import { svelteDialog } from "./libs/dialog";

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
        console.log("🚀 ~ OembedPlugin ~ handlePaste ~ detail:", detail)
        console.log("🚀 ~ OembedPlugin ~ handlePaste ~ detail.textPlain:", detail.textPlain)
    }

    private handleLink({ detail }: any) {
        console.log("🚀 ~ OembedPlugin ~ handleLink ~ detail:", detail)
    }

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
                    }
                });
            }
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
                        rect = document.querySelector("#barMore").getBoundingClientRect();
                    }
                    if (rect.width === 0) {
                        rect = document.querySelector("#barPlugins").getBoundingClientRect();
                    }
                    this.addMenu(rect);
                }
            }
        });

        // this.eventBus.on("paste", this.handlePaste);

        this.settingUtils = new SettingUtils({
            plugin: this, name: STORAGE_NAME
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
                }
            }
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
            console.error("Error loading settings storage, probably empty config json:", error);
        }


        this.protyleSlash = [{
            filter: ["oembed"],
            html: `<div class="b3-list-item__first"><span class="b3-list-item__text">oembed</span><span class="b3-list-item__meta">convert URLs in your markdown to the embedded version of those URLs</span></div>`,
            id: "oembed",
            callback(protyle: Protyle) {
                console.log(window.siyuan);
                console.log("🚀 ~ OembedPlugin ~ callback ~ getCurrentBlock:", getCurrentBlock())
                let lute = window.Lute.New();
                lute.Md2HTML('## Hello')
                protyle.insert(window.Lute.Caret);
                protyle.insert(lute.Md2HTML('## Hello'));
            }
        }];

        this.protyleOptions = {
            toolbar: [...builtinEditTools,
                {
                    name: "insert-oembed",
                    icon: "iconOembed",
                    hotkey: "⇧⌘L",
                    tipPosition: "n",
                    tip: this.i18n.insertOembed,
                    click: (protyle: Protyle) => {
                        // this.showDialog();
                        // protyle.insert("oembed");
                        console.log("🚀 ~ OembedPlugin ~ callback ~ getCurrentBlock:", getCurrentBlock())
                    }
                }],
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
            }
        });
        const panel = new SettingExample({
            target: dialog.element.querySelector("#SettingsPanel"),
        });
    }

    private eventBusPaste(event: any) {
        // 如果需异步处理请调用 preventDefault， 否则会进行默认处理
        event.preventDefault();
        // 如果使用了 preventDefault，必须调用 resolve，否则程序会卡死
        console.log(event)
        // TODO: catch pasted link and make an oembed instead
        event.detail.resolve({
            textPlain: event.detail.textPlain.trim(),
        });
    }

    private eventBusLog({ detail }: any) {
        console.log(detail);
    }

    private blockIconEvent({ detail }: any) {
        console.log("🚀 ~ OembedPlugin ~ blockIconEvent ~ detail:", detail)
        detail.menu.addItem({
            icon: "iconOembed",
            label: this.i18n.convertOembed,
            click: () => {
                const doOperations: IOperation[] = [];
                detail.blockElements.forEach(async (item: HTMLElement) => {
                    console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ item:", item)
                    console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ item.outerHTML:", item.outerHTML)
                    console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ item.index:", item.dataset.nodeIndex)
                    console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ item.updated:", item.getAttribute("updated"))
                    const editElement = item.querySelector('[contenteditable="true"]');
                    console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ editElement:", editElement)

                    if (editElement?.firstElementChild?.getAttribute("data-type") === "a" && editElement?.firstElementChild?.getAttribute("data-href")) {
                        const urlString = editElement.firstElementChild.getAttribute("data-href")

                        const html = await getOembed(urlString)
                        if (html) {
                            console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ html:", html)


                            console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ editElement:", editElement)

                            editElement.textContent = html.replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                            console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ textContent:", editElement.textContent)
                            console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ item.outerHTML:", item.outerHTML)
                            console.log("🚀 ~ OembedPlugin ~ detail.blockElements.forEach ~ genHtmlBlock:", genHtmlBlock({
                                    id: item.dataset.nodeId,
                                    index: item.dataset.nodeIndex,
                                    updated: item.getAttribute("updated"),
                                    content: html
                                }))
                            item.outerHTML = genHtmlBlock({
                                    id: item.dataset.nodeId,
                                    index: item.dataset.index,
                                    updated: item.dataset.updated,
                                    content: escapeHtml(html)
                                });
                            // item.dataset.type = "NodeHTMLBlock";
                            // item.dataset.class = "render-node protyle-wysiwyg--select";
                            // item.dataset.subtype = "block"

                            doOperations.push({
                                id: item.dataset.nodeId,
                                data: item.outerHTML,
                                action: "update"
                            });
                        }
                    }
                });
                detail.protyle.getInstance().transaction(doOperations);
            }
        });
    }



    private addMenu(rect?: DOMRect) {
        const menu = new Menu("topBarSample", () => {
            console.log(this.i18n.byeMenu);
        });
        // menu.addItem({
        //     icon: "iconInfo",
        //     label: "Dialog(open help first)",
        //     accelerator: this.commands[0].customHotkey,
        //     click: () => {
        //         this.showDialog();
        //     }
        // });
        // if (!this.isMobile) {
        //     menu.addItem({
        //         icon: "iconFace",
        //         label: "Open Custom Tab",
        //         click: () => {
        //             const tab = openTab({
        //                 app: this.app,
        //                 custom: {
        //                     icon: "iconFace",
        //                     title: "Custom Tab",
        //                     data: {
        //                         text: "This is my custom tab",
        //                     },
        //                     id: this.name + TAB_TYPE
        //                 },
        //             });
        //             console.log(tab);
        //         }
        //     });
        //     menu.addItem({
        //         icon: "iconImage",
        //         label: "Open Asset Tab(open help first)",
        //         click: () => {
        //             const tab = openTab({
        //                 app: this.app,
        //                 asset: {
        //                     path: "assets/paragraph-20210512165953-ag1nib4.svg"
        //                 }
        //             });
        //             console.log(tab);
        //         }
        //     });
        //     menu.addItem({
        //         icon: "iconFile",
        //         label: "Open Doc Tab(open help first)",
        //         click: async () => {
        //             const tab = await openTab({
        //                 app: this.app,
        //                 doc: {
        //                     id: "20200812220555-lj3enxa",
        //                 }
        //             });
        //             console.log(tab);
        //         }
        //     });
        //     menu.addItem({
        //         icon: "iconSearch",
        //         label: "Open Search Tab",
        //         click: () => {
        //             const tab = openTab({
        //                 app: this.app,
        //                 search: {
        //                     k: "SiYuan"
        //                 }
        //             });
        //             console.log(tab);
        //         }
        //     });
        //     menu.addItem({
        //         icon: "iconRiffCard",
        //         label: "Open Card Tab",
        //         click: () => {
        //             const tab = openTab({
        //                 app: this.app,
        //                 card: {
        //                     type: "all"
        //                 }
        //             });
        //             console.log(tab);
        //         }
        //     });
        //     menu.addItem({
        //         icon: "iconLayout",
        //         label: "Open Float Layer(open help first)",
        //         click: () => {
        //             this.addFloatLayer({
        //                 ids: ["20210428212840-8rqwn5o", "20201225220955-l154bn4"],
        //                 defIds: ["20230415111858-vgohvf3", "20200813131152-0wk5akh"],
        //                 x: window.innerWidth - 768 - 120,
        //                 y: 32
        //             });
        //         }
        //     });
        //     menu.addItem({
        //         icon: "iconOpenWindow",
        //         label: "Open Doc Window(open help first)",
        //         click: () => {
        //             openWindow({
        //                 doc: {id: "20200812220555-lj3enxa"}
        //             });
        //         }
        //     });
        // } else {
        //     menu.addItem({
        //         icon: "iconFile",
        //         label: "Open Doc(open help first)",
        //         click: () => {
        //             openMobileFileById(this.app, "20200812220555-lj3enxa");
        //         }
        //     });
        // }
        // menu.addItem({
        //     icon: "iconLock",
        //     label: "Lockscreen",
        //     click: () => {
        //         lockScreen(this.app);
        //     }
        // });
        menu.addItem({
            icon: "iconScrollHoriz",
            label: "Event Bus",
            type: "submenu",
            submenu: [{
                icon: "iconSelect",
                label: "On ws-main",
                click: () => {
                    this.eventBus.on("ws-main", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off ws-main",
                click: () => {
                    this.eventBus.off("ws-main", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On click-blockicon",
                click: () => {
                    this.eventBus.on("click-blockicon", this.blockIconEventBindThis);
                }
            }, {
                icon: "iconClose",
                label: "Off click-blockicon",
                click: () => {
                    this.eventBus.off("click-blockicon", this.blockIconEventBindThis);
                }
            }, {
                icon: "iconSelect",
                label: "On click-pdf",
                click: () => {
                    this.eventBus.on("click-pdf", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off click-pdf",
                click: () => {
                    this.eventBus.off("click-pdf", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On click-editorcontent",
                click: () => {
                    this.eventBus.on("click-editorcontent", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off click-editorcontent",
                click: () => {
                    this.eventBus.off("click-editorcontent", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On click-editortitleicon",
                click: () => {
                    this.eventBus.on("click-editortitleicon", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off click-editortitleicon",
                click: () => {
                    this.eventBus.off("click-editortitleicon", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On click-flashcard-action",
                click: () => {
                    this.eventBus.on("click-flashcard-action", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off click-flashcard-action",
                click: () => {
                    this.eventBus.off("click-flashcard-action", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-noneditableblock",
                click: () => {
                    this.eventBus.on("open-noneditableblock", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-noneditableblock",
                click: () => {
                    this.eventBus.off("open-noneditableblock", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On loaded-protyle-static",
                click: () => {
                    this.eventBus.on("loaded-protyle-static", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off loaded-protyle-static",
                click: () => {
                    this.eventBus.off("loaded-protyle-static", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On loaded-protyle-dynamic",
                click: () => {
                    this.eventBus.on("loaded-protyle-dynamic", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off loaded-protyle-dynamic",
                click: () => {
                    this.eventBus.off("loaded-protyle-dynamic", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On switch-protyle",
                click: () => {
                    this.eventBus.on("switch-protyle", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off switch-protyle",
                click: () => {
                    this.eventBus.off("switch-protyle", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On destroy-protyle",
                click: () => {
                    this.eventBus.on("destroy-protyle", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off destroy-protyle",
                click: () => {
                    this.eventBus.off("destroy-protyle", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-doctree",
                click: () => {
                    this.eventBus.on("open-menu-doctree", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-doctree",
                click: () => {
                    this.eventBus.off("open-menu-doctree", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-blockref",
                click: () => {
                    this.eventBus.on("open-menu-blockref", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-blockref",
                click: () => {
                    this.eventBus.off("open-menu-blockref", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-fileannotationref",
                click: () => {
                    this.eventBus.on("open-menu-fileannotationref", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-fileannotationref",
                click: () => {
                    this.eventBus.off("open-menu-fileannotationref", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-tag",
                click: () => {
                    this.eventBus.on("open-menu-tag", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-tag",
                click: () => {
                    this.eventBus.off("open-menu-tag", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-link",
                click: () => {
                    this.eventBus.on("open-menu-link", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-link",
                click: () => {
                    this.eventBus.off("open-menu-link", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-image",
                click: () => {
                    this.eventBus.on("open-menu-image", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-image",
                click: () => {
                    this.eventBus.off("open-menu-image", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-av",
                click: () => {
                    this.eventBus.on("open-menu-av", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-av",
                click: () => {
                    this.eventBus.off("open-menu-av", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-content",
                click: () => {
                    this.eventBus.on("open-menu-content", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-content",
                click: () => {
                    this.eventBus.off("open-menu-content", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-breadcrumbmore",
                click: () => {
                    this.eventBus.on("open-menu-breadcrumbmore", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-breadcrumbmore",
                click: () => {
                    this.eventBus.off("open-menu-breadcrumbmore", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-inbox",
                click: () => {
                    this.eventBus.on("open-menu-inbox", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-inbox",
                click: () => {
                    this.eventBus.off("open-menu-inbox", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On input-search",
                click: () => {
                    this.eventBus.on("input-search", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off input-search",
                click: () => {
                    this.eventBus.off("input-search", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On paste",
                click: () => {
                    this.eventBus.on("paste", this.eventBusPaste);
                }
            }, {
                icon: "iconClose",
                label: "Off paste",
                click: () => {
                    this.eventBus.off("paste", this.eventBusPaste);
                }
            }, {
                icon: "iconSelect",
                label: "On open-siyuan-url-plugin",
                click: () => {
                    this.eventBus.on("open-siyuan-url-plugin", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-siyuan-url-plugin",
                click: () => {
                    this.eventBus.off("open-siyuan-url-plugin", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-siyuan-url-block",
                click: () => {
                    this.eventBus.on("open-siyuan-url-block", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-siyuan-url-block",
                click: () => {
                    this.eventBus.off("open-siyuan-url-block", this.eventBusLog);
                }
            }]
        });
        menu.addSeparator();
        menu.addItem({
            icon: "iconSettings",
            label: "Official Setting Dialog",
            click: () => {
                this.openSetting();
            }
        });
        menu.addItem({
            icon: "iconSettings",
            label: "A custom setting dialog (by svelte)",
            click: () => {
                this.openDIYSetting();
            }
        });
        // menu.addItem({
        //     icon: "iconSparkles",
        //     label: this.data[STORAGE_NAME].readonlyText || "Readonly",
        //     type: "readonly",
        // });
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
