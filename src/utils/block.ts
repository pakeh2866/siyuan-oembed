import { regexp } from "./strings";

export const isSiyuanBlock = (element: any): boolean => {
    return !!(
        element &&
        element instanceof HTMLElement &&
        element.dataset.type &&
        element.dataset.nodeId &&
        regexp.id.test(element.dataset.nodeId)
    );
};

export const getBlocks = (): HTMLElement[] => {
    const selectedBlocks = getSelectedBlocks();

    // Check if selectedBlocks has elements
    if (selectedBlocks.length > 0) {
        return selectedBlocks;
    }

    // Get current block and return it as a single-element array
    const currentBlock = getCurrentBlock();
    return currentBlock ? [currentBlock] : [];
};

export const getCurrentBlock = (): HTMLElement | null | undefined => {
    const selection = document.getSelection();
    let element: HTMLElement | null | undefined = selection?.focusNode as HTMLElement;
    while (element && !isSiyuanBlock(element)) {
        element = element.parentElement as HTMLElement;
    }
    return element;
};

export const getSelectedBlocks = (): Array<HTMLElement> => {
    return Array.from(getProtyle().querySelectorAll(".protyle-wysiwyg--select")) as HTMLElement[];
};

export const getProtyle = (): HTMLElement => {
    return document.querySelector(`.protyle`);
};

export const getElementByBlockId = (nodeId: string): HTMLElement => {
    return document.querySelector(`div[data-node-id="${nodeId}"]`);
};

export const isParagraphBlock = (): boolean => {
    const selection = document.getSelection();
    let element: Node | null = selection?.focusNode;
    while (element && (!(element instanceof HTMLElement) || !isSiyuanBlock(element))) {
        element = element.parentElement;
    }
    return element instanceof HTMLElement && element.dataset.type === "NodeParagraph";
};

export const isHTMLBlock = (): boolean => {
    const selection = document.getSelection();
    let element: Node | null = selection?.focusNode;
    while (element && (!(element instanceof HTMLElement) || !isSiyuanBlock(element))) {
        element = element.parentElement;
    }
    return element instanceof HTMLElement && element.dataset.type === "NodeHTMLBlock";
};

export const isSelectionEmpty = (): boolean => {
    const selection = document.getSelection();
    let element: Node | null = selection?.focusNode;
    while (element && (!(element instanceof HTMLElement) || !isSiyuanBlock(element))) {
        element = element.parentElement;
    }
    return (
        element instanceof HTMLElement &&
        element.dataset.type === "NodeParagraph" &&
        element.querySelector('[contenteditable="true"]')?.textContent.trim() === ""
    );
};

export const isEmptyParagraphBlock = (element: HTMLElement): boolean => {
    while (element && (!(element instanceof HTMLElement) || !isSiyuanBlock(element))) {
        element = element.parentElement;
    }
    return (
        element instanceof HTMLElement &&
        element.dataset.type === "NodeParagraph" &&
        element.querySelector('[contenteditable="true"]')?.textContent.trim() === ""
    );
};

export const extractUrlFromBlock = (block: HTMLElement): string | null => {
    const editElement = block.querySelector<HTMLElement>('[contenteditable="true"]');
    if (!editElement) return null;

    const linkElement = editElement.firstElementChild;
    if (!linkElement) return null;

    return linkElement.getAttribute("data-type") === "a" ? linkElement.getAttribute("data-href") : null;
};

export const isNotEditBlock = (element: Element) => {
    return (
        [
            "NodeBlockQueryEmbed",
            "NodeThematicBreak",
            "NodeMathBlock",
            "NodeHTMLBlock",
            "NodeIFrame",
            "NodeWidget",
            "NodeVideo",
            "NodeAudio",
        ].includes(element.getAttribute("data-type")) ||
        (element.getAttribute("data-type") === "NodeCodeBlock" && element.classList.contains("render-node"))
    );
};

export const focusByRange = (range: Range) => {
    if (!range) {
        return;
    }

    const startNode = range.startContainer.childNodes[range.startOffset] as HTMLElement;
    if (startNode && startNode.nodeType !== 3 && ["INPUT", "TEXTAREA"].includes(startNode.tagName)) {
        startNode.focus();
        return;
    }
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
};

export const hasPreviousSibling = (element: Node) => {
    let previousSibling = element.previousSibling;
    while (previousSibling) {
        if (previousSibling.textContent === "" && previousSibling.nodeType === 3) {
            previousSibling = previousSibling.previousSibling;
        } else {
            return previousSibling;
        }
    }
    return false;
};

export const hasNextSibling = (element: Node) => {
    let nextSibling = element.nextSibling;
    while (nextSibling) {
        if (nextSibling.textContent === "" && nextSibling.nodeType === 3) {
            nextSibling = nextSibling.nextSibling;
        } else {
            return nextSibling;
        }
    }
    return false;
};

export const getEditorRange = (element: Element) => {
    let range: Range;
    if (getSelection().rangeCount > 0) {
        range = getSelection().getRangeAt(0);
        if (element.isSameNode(range.startContainer) || element.contains(range.startContainer)) {
            return range;
        }
    }
    // 代码块过长，在代码块的下一个块前删除，代码块会滚动到顶部，因粗需要 preventScroll
    (element as HTMLElement).focus({ preventScroll: true });
    let targetElement;
    if (element.classList.contains("table")) {
        // 当光标不在表格区域中时表格无法被复制 https://ld246.com/article/1650510736504
        targetElement = element.querySelector("th") || element.querySelector("td");
    } else {
        targetElement = getContenteditableElement(element);
        if (!targetElement) {
            targetElement = element;
        } else if (targetElement.tagName === "TABLE") {
            // 文档中开头为表格，获取错误 https://ld246.com/article/1663408335459?r=88250
            targetElement = targetElement.querySelector("th") || element.querySelector("td");
        }
    }
    range = targetElement.ownerDocument.createRange();
    range.setStart(targetElement || element, 0);
    range.collapse(true);
    return range;
};

export const getContenteditableElement = (element: Element) => {
    if (
        !element ||
        (element.getAttribute("contenteditable") === "true" && !element.classList.contains("protyle-wysiwyg"))
    ) {
        return element;
    }
    return element.querySelector('[contenteditable="true"]');
};

export const getAllProtyles = () => {
    let protyles = [];
    const getProtyle = (layout) => {
        if (layout.model && layout.model.editor && layout.model.editor.protyle) {
            protyles.push(layout.model.editor.protyle);
        }
        if (layout.children) {
            layout.children.forEach((child) => getProtyle(child));
        }
    };
    getProtyle(window.top.siyuan.layout.layout);
    return protyles;
};

export const focusBlock = (element: Element, parentElement?: HTMLElement, toStart = true): false | Range => {
    if (!element) {
        return false;
    }

    // hr、嵌入块、数学公式、iframe、音频、视频、图表渲染块等，删除段落块后，光标位置矫正 https://github.com/siyuan-note/siyuan/issues/4143
    if (
        element.classList.contains("render-node") ||
        element.classList.contains("iframe") ||
        element.classList.contains("hr") ||
        element.classList.contains("av")
    ) {
        const range = document.createRange();
        const type = element.getAttribute("data-type");
        let setRange = false;
        if (type === "NodeThematicBreak") {
            range.selectNodeContents(element.firstElementChild);
            setRange = true;
        } else if (type === "NodeBlockQueryEmbed") {
            if (element.lastElementChild.previousElementSibling?.firstChild) {
                range.selectNodeContents(element.lastElementChild.previousElementSibling.firstChild);
                range.collapse(true);
            } else {
                // https://github.com/siyuan-note/siyuan/issues/5267
                range.selectNodeContents(element);
                range.collapse(true);
            }
            setRange = true;
        } else if (["NodeMathBlock", "NodeHTMLBlock"].includes(type)) {
            if (element.lastElementChild.previousElementSibling?.lastElementChild?.firstChild) {
                // https://ld246.com/article/1655714737572
                range.selectNodeContents(element.lastElementChild.previousElementSibling.lastElementChild.firstChild);
                range.collapse(true);
            } else if (element.lastElementChild.previousElementSibling) {
                range.selectNodeContents(element.lastElementChild.previousElementSibling);
                range.collapse(true);
            }
            setRange = true;
        } else if (type === "NodeIFrame" || type === "NodeWidget") {
            range.setStart(element, 0);
            setRange = true;
        } else if (type === "NodeVideo") {
            range.setStart(element.firstElementChild, 0);
            setRange = true;
        } else if (type === "NodeAudio") {
            range.setStart(element.firstElementChild.lastChild, 0);
            setRange = true;
        } else if (type === "NodeCodeBlock") {
            range.selectNodeContents(element);
            range.collapse(true);
            setRange = true;
        } else if (type === "NodeAttributeView") {
            /// #if !MOBILE
            const cursorElement = element.querySelector(".av__cursor");
            if (cursorElement) {
                range.setStart(cursorElement.firstChild, 0);
                setRange = true;
            } else {
                return false;
            }
            /// #else
            return false;
            /// #endif
        }
        if (setRange) {
            focusByRange(range);
            return range;
        } else {
            focusSideBlock(element);
            return false;
        }
    }
    let cursorElement;
    if (toStart) {
        cursorElement = getContenteditableElement(element);
    } else {
        Array.from(element.querySelectorAll('[contenteditable="true"]'))
            .reverse()
            .find((item) => {
                if (item.getBoundingClientRect().width > 0) {
                    cursorElement = item;
                    return true;
                }
            });
    }
    if (cursorElement) {
        if (cursorElement.tagName === "TABLE") {
            if (toStart) {
                cursorElement = cursorElement.querySelector("th, td");
            } else {
                const cellElements = cursorElement.querySelectorAll("th, td");
                cursorElement = cellElements[cellElements.length - 1];
            }
        }
        let range;
        if (toStart) {
            // 需要定位到第一个 child https://github.com/siyuan-note/siyuan/issues/5930
            range = setFirstNodeRange(cursorElement, getEditorRange(cursorElement));
            range.collapse(true);
        } else {
            let focusHljs = false;
            // 定位到末尾 https://github.com/siyuan-note/siyuan/issues/5982
            if (cursorElement.classList.contains("hljs")) {
                // 代码块末尾定位需在 /n 之前 https://github.com/siyuan-note/siyuan/issues/9141，https://github.com/siyuan-note/siyuan/issues/9189
                let lastNode = cursorElement.lastChild;
                if (!lastNode) {
                    // 粘贴 ``` 报错
                    cursorElement.innerHTML = "\n";
                    lastNode = cursorElement.lastChild;
                }
                if (lastNode.textContent === "" && lastNode.nodeType === 3) {
                    lastNode = hasPreviousSibling(cursorElement.lastChild) as HTMLElement;
                }
                if (lastNode && lastNode.textContent.endsWith("\n")) {
                    // https://github.com/siyuan-note/siyuan/issues/11362
                    if (lastNode.nodeType === 1) {
                        lastNode = lastNode.lastChild;
                        while (lastNode && lastNode.textContent.indexOf("\n") === -1) {
                            lastNode = lastNode.previousSibling;
                        }
                    }
                    range = getEditorRange(cursorElement);
                    range.setStart(lastNode, lastNode.textContent.length - 1);
                    focusHljs = true;
                }
            }
            if (!focusHljs) {
                range = setLastNodeRange(cursorElement, getEditorRange(cursorElement));
            }
            range.collapse(false);
        }
        focusByRange(range);
        return range;
    } else if (parentElement) {
        parentElement.focus();
    } else {
        // li 下面为 hr、嵌入块、数学公式、iframe、音频、视频、图表渲染块等时递归处理
        if (element.classList.contains("li")) {
            return focusBlock(element.querySelector("[data-node-id]"), parentElement, toStart);
        }
    }
    return false;
};

export const focusSideBlock = (updateElement: Element) => {
    if (updateElement.getAttribute("data-node-id")) {
        let sideBlockElement;
        let collapse;
        if (
            updateElement.nextElementSibling &&
            !updateElement.nextElementSibling.classList.contains("protyle-attr") // 用例 https://ld246.com/article/1661928364696
        ) {
            collapse = true;
            sideBlockElement = getNextBlock(updateElement) as HTMLElement;
        } else if (updateElement.previousElementSibling) {
            collapse = false;
            sideBlockElement = getPreviousBlock(updateElement) as HTMLElement;
        }
        if (!sideBlockElement) {
            sideBlockElement = updateElement;
        }
        focusBlock(sideBlockElement, undefined, collapse);
        return;
    }
    const range = getEditorRange(updateElement);
    if (updateElement.nextSibling) {
        range.selectNodeContents(updateElement.nextSibling);
        range.collapse(true);
    } else if (updateElement.previousSibling) {
        range.selectNodeContents(updateElement.previousSibling);
        range.collapse(false);
    }
    focusByRange(range);
};

export const setFirstNodeRange = (editElement: Element, range: Range) => {
    if (!editElement) {
        return range;
    }
    let firstChild = editElement.firstChild as HTMLElement;
    while (firstChild && firstChild.nodeType !== 3 && !firstChild.classList.contains("render-node")) {
        if (firstChild.classList.contains("img")) {
            // https://ld246.com/article/1665360254842
            range.setStartBefore(firstChild);
            return range;
        }
        firstChild = firstChild.firstChild as HTMLElement;
    }
    if (!firstChild) {
        range.selectNodeContents(editElement);
        return range;
    }
    if (firstChild.nodeType !== 3 && firstChild.classList.contains("render-node")) {
        range.setStartBefore(firstChild);
    } else {
        range.setStart(firstChild, 0);
    }
    return range;
};

export const setLastNodeRange = (editElement: Element, range: Range, setStart = true) => {
    if (!editElement) {
        return range;
    }
    let lastNode = editElement.lastChild as Element;
    while (lastNode && lastNode.nodeType !== 3) {
        if (lastNode.nodeType !== 3 && lastNode.tagName === "BR") {
            // 防止单元格中 ⇧↓ 全部选中
            return range;
        }
        // https://github.com/siyuan-note/siyuan/issues/12792
        if (!lastNode.lastChild) {
            break;
        }
        // 最后一个为多种行内元素嵌套
        lastNode = lastNode.lastChild as Element;
    }
    // https://github.com/siyuan-note/siyuan/issues/12753
    if (!lastNode) {
        lastNode = editElement;
    }
    if (setStart) {
        if (lastNode.nodeType !== 3 && lastNode.classList.contains("render-node") && lastNode.innerHTML === "") {
            range.setStartAfter(lastNode);
        } else {
            range.setStart(lastNode, lastNode.textContent.length);
        }
    } else {
        if (lastNode.nodeType !== 3 && lastNode.classList.contains("render-node") && lastNode.innerHTML === "") {
            range.setStartAfter(lastNode);
        } else {
            range.setEnd(lastNode, lastNode.textContent.length);
        }
    }
    return range;
};

export const getNextBlock = (element: Element) => {
    let parentElement = element;
    while (parentElement) {
        if (parentElement.nextElementSibling && !parentElement.nextElementSibling.classList.contains("protyle-attr")) {
            return parentElement.nextElementSibling as HTMLElement;
        }
        const pElement = hasClosestBlock(parentElement.parentElement);
        if (pElement) {
            parentElement = pElement;
        } else {
            return false;
        }
    }
    return false;
};

export const getPreviousBlock = (element: Element) => {
    let parentElement = element;
    while (parentElement) {
        if (parentElement.previousElementSibling && parentElement.previousElementSibling.getAttribute("data-node-id")) {
            return parentElement.previousElementSibling;
        }
        const pElement = hasClosestBlock(parentElement.parentElement);
        if (pElement) {
            parentElement = pElement;
        } else {
            return false;
        }
    }
};

export const hasClosestByAttribute = (element: Node, attr: string, value: string | null, top = false) => {
    if (!element) {
        return false;
    }
    if (element.nodeType === 3) {
        element = element.parentElement;
    }
    let e = element as HTMLElement;
    let isClosest = false;
    while (e && !isClosest && (top ? e.tagName !== "BODY" : !e.classList.contains("protyle-wysiwyg"))) {
        if (typeof value === "string" && e.getAttribute(attr)?.split(" ").includes(value)) {
            isClosest = true;
        } else if (typeof value !== "string" && e.hasAttribute(attr)) {
            isClosest = true;
        } else {
            e = e.parentElement;
        }
    }
    return isClosest && e;
};

export const hasClosestBlock = (element: Node) => {
    const nodeElement = hasClosestByAttribute(element, "data-node-id", null);
    if (nodeElement && nodeElement.tagName !== "BUTTON" && nodeElement.getAttribute("data-type")?.startsWith("Node")) {
        return nodeElement;
    }
    return false;
};