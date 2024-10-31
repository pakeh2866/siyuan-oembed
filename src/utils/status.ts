import { getFrontend } from "siyuan";

let statusTimeout: number;
export const progressStatus = (msg: string) => {
    const statusElement = document.querySelector("#status") as HTMLElement;
    const frontEnd = getFrontend();

    if (!statusElement) {
        return;
    }

    if (frontEnd === "mobile" || frontEnd === "browser-mobile") {
        if (!document.querySelector("#keyboardToolbar").classList.contains("fn__none")) {
            return;
        }
        clearTimeout(statusTimeout);
        statusElement.innerHTML = msg;
        statusElement.style.bottom = "0";
        statusTimeout = window.setTimeout(() => {
            statusElement.style.bottom = "";
        }, 7000);
    } else {
        const msgElement = statusElement.querySelector(".status__msg");
        if (msgElement) {
            clearTimeout(statusTimeout);
            msgElement.innerHTML = msg;
            statusTimeout = window.setTimeout(() => {
                msgElement.innerHTML = "";
            }, 7000);
        }
    }
};
