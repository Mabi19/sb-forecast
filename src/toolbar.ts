import "./assets/toolbar.scss"
import iconTop from "./assets/toolbar-top.svg";
import iconSettings from "./assets/toolbar-settings.svg";
import iconAbout from "./assets/toolbar-about.svg";
import { settingsDialog } from "./settings-dialog";
import { aboutDialog } from "./about";

export function initToolbar() {
    const toolbar = document.querySelector("#toolbar")!;

    const btnTop = document.createElement("button");
    btnTop.addEventListener("click", () => {
        window.scroll({ top: 0, behavior: "smooth" });
    });
    btnTop.innerHTML = `<img src="${iconTop}" alt="Go to top">`;
    toolbar.appendChild(btnTop);

    const btnSettings = document.createElement("button");
    btnSettings.addEventListener("click", () => {
        settingsDialog.open();
    });
    btnSettings.innerHTML = `<img src="${iconSettings}" alt="Settings">`;
    toolbar.appendChild(btnSettings);

    const btnAbout = document.createElement("button");
    btnAbout.addEventListener("click", () => {
        aboutDialog.open();
    });
    btnAbout.innerHTML = `<img src="${iconAbout}" alt="About">`;
    toolbar.appendChild(btnAbout);
}
