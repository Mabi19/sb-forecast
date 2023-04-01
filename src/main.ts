import './style.css'
import { init, update as updateMainView, UpdateFlags } from "./main-view";
import { reflowMarkers } from './marker';
import { initBackground, updateBackground } from './background';
import { initSettingsDialog } from "./settings-dialog";
import { initNotifications, updateNotifications } from './notifications';
import { shouldUpdateUI } from './utils';
import { initToolbar } from './toolbar';
import { initAbout } from './about';

initBackground();
initNotifications();
initSettingsDialog();
initAbout();
initToolbar();

function update() {
    // we do not need to update the timers when the tab is hidden
    updateMainView(shouldUpdateUI() ? UpdateFlags.Both : UpdateFlags.Shifts);
    updateBackground();
    updateNotifications();
}

// Since we don't update the timers when the tab is hidden, do a quick update
// when the tab becomes visible
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState == "visible") {
        updateMainView(UpdateFlags.Timers);
    }
})

// we want everything to be fully done
// (even though this is loaded via <script type="module">, that can still be
// before the document is 100% ready (and readyState is complete)
if (document.readyState == "complete") {
    init();
    // set up further updates
    setInterval(update, 251);
} else {
    document.addEventListener("readystatechange", () => {
        if (document.readyState == "complete") {
            init();
            // set up further updates
            setInterval(update, 251);
        }
    });
}

// reflow markers when necessary
window.matchMedia("(max-width: 600px)").addEventListener("change", () => {
    // wait for the styles to be recomputed;
    // this entails waiting until *after* the next repaint,
    // so two requestAnimationFrame calls
    // This is not a perfect solution, but it doesn't hurt
    // and usually does improve things
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            reflowMarkers();
        });
    });
});
