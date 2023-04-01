import { getVisiblePanel } from "./main-view";
import { reflowMarkers } from "./marker";
import { askNotificationPermission, hasNotificationPermission } from "./notifications";
import { Panel } from "./panel";
import { makeDialog } from "./dialog";
import { settings } from "./settings";

const darkenator: HTMLDivElement = document.querySelector("#settings-darkenator")!;
const upcomingPanels = document.querySelector<HTMLDivElement>("#upcoming")!;

const dialog = makeDialog(darkenator);

export function initSettingsDialog() {
    // keybinds
    window.addEventListener("keyup", (ev) => {
        if (ev.key == "Escape") {
            dialog.toggle();
        }
    });

    // close button
    document.querySelector("#settings-close")!.addEventListener("click", () => {
        dialog.close();
    });

    // hook up all the elements to their settings options
    function connectSelect<T extends keyof typeof settings>(selector: string, key: T, onchange: (val: typeof settings[T], initial: boolean) => void = () => {}) {
        const el = darkenator.querySelector<HTMLSelectElement>(selector)!;
        const val = settings[key];
        if (typeof val == "boolean") {
            throw new TypeError("Bad settings key");
        }
        el.value = val;
        onchange(val, true);

        el.addEventListener("change", () => {
            (settings[key] as any) = el.value;
            onchange(el.value as typeof settings[T], false);
        })
    }

    function toggleCollapsed(val: "full" | "collapsed", collapseType: "sun" | "rain" | "thunderstorm", initial: boolean) {
        const className = `collapse-${collapseType}`;

        const newState = val == "collapsed";
        const currentState = upcomingPanels.classList.contains(className);

        let visiblePanel: Panel;
        if (!initial) {
            // Get the panel now before we reflow
            visiblePanel = getVisiblePanel();

        }

        if (newState != currentState) {
            upcomingPanels.classList.toggle(className);
            // Don't reflow instantly after loading
            if (!initial) {
                reflowMarkers();
            }
        }

        // Don't scroll instantly after loading
        if (!initial) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    visiblePanel.html.wrapper.scrollIntoView({
                        block: "center",
                        behavior: "auto",
                    });
                });
            });
        }
    }

    connectSelect("#display-sun", "display.sun", (val, initial) => toggleCollapsed(val, "sun", initial));
    connectSelect("#display-rain", "display.rain", (val, initial) => toggleCollapsed(val, "rain", initial));
    connectSelect("#display-thunder", "display.thunder", (val, initial) => toggleCollapsed(val, "thunderstorm", initial));

    connectSelect("#notifications-sun", "notifications.sun");
    connectSelect("#notifications-rain", "notifications.rain");
    connectSelect("#notifications-thunder", "notifications.thunder");

    const notifButton = document.querySelector("#notifications-enable")!;
    const notifBox = document.querySelector("#notifications-box")!;

    if (hasNotificationPermission) {
        notifButton.classList.add("hidden");
    } else {
        notifBox.classList.add("hidden");
        notifButton.addEventListener("click", async () => {
            const result = await askNotificationPermission();
            if (result) {
                notifButton.classList.add("hidden");
                notifBox.classList.remove("hidden");
            }
        });
    }
}

export { dialog as settingsDialog };
