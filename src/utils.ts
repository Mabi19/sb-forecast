
let visibilityState = document.visibilityState;
document.addEventListener("visibilitychange", () => {
    visibilityState = document.visibilityState;
})

// This should only govern the live timers. They're safe to stop updating when the tab is hidden
export function shouldUpdateUI() {
    return visibilityState != "hidden";
}

export function shouldAnimate() {
    return shouldUpdateUI() && !window.matchMedia("(prefers-reduced-motion)").matches;
}
