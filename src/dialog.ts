import { shouldAnimate } from "./utils";

let currentlyActive = -1;
let nextID = 0;

export function makeDialog(darkenator: HTMLDivElement) {
    let dialogState = false;
    let changingState = false;
    const id = nextID;
    nextID++;

    const dialog = darkenator.querySelector(".dialog")!;

    return {
        async open() {
            if (changingState) return;

            if (currentlyActive != -1) return;
            currentlyActive = id;

            if (!dialogState) {
                dialogState = true;
                darkenator.style.display = "grid";
                // animation
                if (shouldAnimate()) {
                    changingState = true;
                    const animDark = darkenator.animate([
                        { opacity: "0" },
                        { opacity: "1" },
                    ], {
                        duration: 150,
                        easing: "ease-in",
                    });
                    const animDialog = dialog.animate([
                        { transform: "scale(0%)" },
                        { transform: "scale(100%)" },
                    ], {
                        duration: 250,
                        easing: "ease-in-out",
                    });
                    await Promise.all([animDark.finished, animDialog.finished]);
                    changingState = false;
                }
            }
        },

        async close() {
            if (changingState) return;

            if (currentlyActive != id) return;
            currentlyActive = -1;

            if (dialogState) {
                dialogState = false;
                if (shouldAnimate()) {
                    changingState = true;
                    await darkenator.animate([
                        { opacity: "1" },
                        { opacity: "0" },
                    ], {
                        duration: 250,
                        easing: "ease-in",
                    }).finished;
                    changingState = false;
                }
                darkenator.style.display = "none";
            }
        },

        async toggle() {
            if (dialogState) {
                await this.close();
            } else {
                await this.open();
            }
        }
    }
}