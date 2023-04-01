import { makeDialog } from "./dialog";

const darkenator: HTMLDivElement = document.querySelector("#about-darkenator")!;
const dialog = makeDialog(darkenator);

export function initAbout() {
    const button = darkenator.querySelector("#about-close")!;
    button.addEventListener("click", () => {
        dialog.close();
    });

    window.addEventListener("keyup", (ev) => {
        if (ev.key == "Escape") {
            dialog.close();
        }
    });
}

export {
    dialog as aboutDialog
};
