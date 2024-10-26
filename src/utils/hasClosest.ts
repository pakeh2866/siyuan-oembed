export const hasClosestByAttribute = (element: Node, attr: string, value: string | null, top = false) => {
    if (!element) {
        return false;
    }
    console.log("🚀 ~ hasClosestByAttribute ~ element:", element)
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
