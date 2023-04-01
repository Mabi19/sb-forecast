import { onCreatePanel, onPanelShift } from './marker';
import { Panel } from './panel';
import { panels } from "./panel-store";
import { settings } from './settings';
import { shouldAnimate } from './utils';
import { currentWeatherID } from './weather';

const currentEventBox = document.querySelector<HTMLDivElement>("#current")!;
const upcomingEventBox = document.querySelector<HTMLDivElement>("#upcoming")!;
const panelBox = document.querySelector<HTMLDivElement>("#panels")!;

let currentlyShifting = false;

// Range of panel indices that need to be updated
let startIdx = 0;
let endIdx = 40;

// Include some elements past the screen so their values don't seem jump while scrolling
// 15 is enough for most reasonable scrolling speeds
const UPDATE_BUFFER_ZONE = 15;

function updateActiveRegion() {
    const viewTop = window.visualViewport!.pageTop;
    const viewBottom = viewTop + window.visualViewport!.height;

    function cmpOnScreen(box: DOMRect) {
        const boxTop = box.top + window.scrollY;
        const boxBottom = box.bottom + window.scrollY;

        if (boxTop > viewTop) {
            if (boxTop < viewBottom) {
                return 0; // on screen
            } else {
                return 1; // below screen
            }
        }
        if (boxBottom < viewBottom) {
            if (boxBottom > viewTop) {
                return 0; // on screen
            } else {
                return -1; // above screen
            }
        }
        // if we're here, the element is bigger than the viewport
        return 0;
    }

    // binary search to find an element that is included inside
    const elements = upcomingEventBox.childNodes;
    let searchStart = 0;
    let searchEnd = elements.length - 1;

    let foundIndex = -1;
    while (searchStart <= searchEnd) {
        const middle = (searchStart + searchEnd) >> 1;

        const cmp = cmpOnScreen((elements.item(middle) as Element).getBoundingClientRect())
        if (cmp == 0) {
            foundIndex = middle;
            break;
        } else if (cmp > 0) {
            searchEnd = middle - 1;
        } else {
            searchStart = middle + 1;
        }
    }

    if (foundIndex < 0) {
        // no elements are visible on screen
        return;
    }

    let newStart = foundIndex;
    let newEnd = foundIndex;
    // search in both directions to see which elements are visible
    for (let i = newStart - 1; i >= 0; i--) {
        const elem = elements.item(i) as Element;
        if (cmpOnScreen(elem.getBoundingClientRect()) == 0) {
            newStart--;
        } else {
            break;
        }
    }

    for (let i = newEnd + 1; i < elements.length; i++) {
        const elem = elements.item(i) as Element;
        if (cmpOnScreen(elem.getBoundingClientRect()) == 0) {
            newEnd++;
        } else {
            break;
        }
    }

    startIdx = Math.max(0, newStart - UPDATE_BUFFER_ZONE);
    endIdx = Math.min(panels.length - 1, newEnd + UPDATE_BUFFER_ZONE);
}

// Get a panel that is guaranteed to be visible.
// Useful if you've changed an option that affects layout
// and want to scroll back to where you were.
export function getVisiblePanel() {
    return panels[(startIdx + endIdx) >> 1];
}

function loadNextPanels(count: number) {
    const lastID = panels[panels.length - 1].weather.id;
    const newPanels = [];
    for (let i = lastID + 1; i <= lastID + count; i++) {
        const newPanel = new Panel(i);
        newPanel.update(false);
        newPanels.push(newPanel);
        upcomingEventBox.appendChild(newPanel.mount());
        // update the markers
        onCreatePanel(newPanel);
    }
    panels.push(...newPanels);
}

async function uncollapsePanel(panel: Panel) {
    const measureSource = panels[0];
    const { wrapper: measuredWrapper, timing: measuredTiming } = measureSource.html;
    const measuredWrapperBox = measuredWrapper.getBoundingClientRect();

    const { wrapper: newWrapper, timing: newTiming } = panel.html;
    const newWrapperBox = newWrapper.getBoundingClientRect();

    const promises: Promise<any>[] = [];

    function transitionImpl(
        measuredEl: HTMLElement, target: HTMLElement,
        extraProps: [Record<string, string>, Record<string, string>] = [{}, {}],
        options = {
            anchorProps: ["top", "left"] as ["top" | "bottom", "left" | "right"]
        }
    ) {
        const measuredElBox = measuredEl.getBoundingClientRect();
        const anch1 = options.anchorProps[0];
        const anch2 = options.anchorProps[1]

        const newAnch1 = Math.abs(measuredElBox[anch1] - measuredWrapperBox[anch1]);
        const newAnch2 = Math.abs(measuredElBox[anch2] - measuredWrapperBox[anch2]);

        const targetBox = target.getBoundingClientRect();
        const targetAnch1 = Math.abs(targetBox[anch1] - newWrapperBox[anch1]);
        const targetAnch2 = Math.abs(targetBox[anch2] - newWrapperBox[anch2]);

        const keyframes = [
            Object.assign({ [anch1]: `${targetAnch1}px`, [anch2]: `${targetAnch2}px` }, extraProps[0]),
            Object.assign({ [anch1]: `${newAnch1}px`, [anch2]: `${newAnch2}px` }, extraProps[1])
        ];
        // return a function so all the animations can be executed at once
        // without messing each other up
        return async () => {
            target.style.position = "absolute";
            await target.animate(keyframes, {
                duration: 300,
                easing: "ease-in-out",
            }).finished.then(() => {
                target.style.removeProperty("position");
            });
        };
    }

    // stop overflow to reduce the potential layout shifting
    newWrapper.style.overflow = "hidden";
    // this is required to make position: absolute work
    newWrapper.style.position = "relative";

    const heightAnim = newWrapper.animate([
        { height: `${newWrapper.offsetHeight}px` },
        { height: `${measuredWrapperBox.height}px` },
    ], {
        duration: 200,
        easing: "ease-in",
    });
    promises.push(heightAnim.finished.then(() => {
        newWrapper.style.height = `${measuredWrapperBox.height}px`
    }));

    const progressBar = newWrapper.querySelector<HTMLDivElement>(".progress-bar")!;
    const measuredBar = measuredWrapper.querySelector(".progress-bar")!;
    const measuredBarBox = measuredBar.getBoundingClientRect();
    progressBar.style.position = "absolute";
    progressBar.style.bottom = "8px";
    progressBar.style.right = "8px";
    progressBar.style.width = `${measuredBarBox.width}px`;

    // store the animations to be executed all at once
    const anims = [];

    const oldIcon = measuredWrapper.querySelector<HTMLElement>(".panel-icon")!;
    const newIcon = newWrapper.querySelector<HTMLElement>(".panel-icon")!;
    anims.push(transitionImpl(oldIcon, newIcon, [
        { height: "1rem" },
        { height: "2.5rem" },
    ]));

    const oldTitle = measuredWrapper.querySelector<HTMLElement>(".panel-title")!;
    const newTitle = newWrapper.querySelector<HTMLElement>(".panel-title")!;
    anims.push(transitionImpl(oldTitle, newTitle, [
        { fontSize: "1rem" },
        { fontSize: "1.5rem" },
    ]));

    const smallLayout = window.matchMedia("(max-width: 600px)").matches;

    // TODO: fade in if these are invisible
    let extraProps: [Record<string, string>, Record<string, string>] = [{}, {}];
    if (smallLayout) {
        newTiming.dateRange.style.display = "block";
        // set it now so it doesn't mess with others' positioning
        newTiming.dateRange.style.position = "absolute";
        extraProps = [
            { opacity: "0" },
            { opacity: "1" },
        ];
    }
    anims.push(transitionImpl(measuredTiming.dateRange, newTiming.dateRange, extraProps));

    anims.push(transitionImpl(measuredTiming.relative, newTiming.relative, [{}, {}], {
        anchorProps: smallLayout ? ["top", "left"] : ["top", "right"]
    }));

    promises.push(...anims.map((func) => func()));

    await Promise.all(promises).then(() => {
        newWrapper.style.removeProperty("overflow");
        newWrapper.style.removeProperty("position");
        newWrapper.style.removeProperty("height");

        progressBar.style.removeProperty("position");
        progressBar.style.removeProperty("bottom");
        progressBar.style.removeProperty("right");
        progressBar.style.removeProperty("width");
    });
}

async function shiftPanels() {
    // Doing it twice at once glitches it out, so don't
    if (currentlyShifting) return;
    currentlyShifting = true;

    console.log("shifting");

    // shift the markers BEFORE the new one is added
    const panelShift = panels[0].html.wrapper.getBoundingClientRect().height;
    // the panel may enlarge; in effect the markers should shift by the 2nd panel's height
    const markerShift = panels[1].html.wrapper.getBoundingClientRect().height;
    onPanelShift(markerShift);

    const newCurrent = upcomingEventBox.firstElementChild as HTMLDivElement | null;
    if (newCurrent == null) {
        throw new Error("Something went terribly wrong");
    }

    const animate = shouldAnimate();
    if (animate) {
        // animate the main column
        const mainAnim = panelBox.animate([
            { transform: "translateY(0)" },
            { transform: `translateY(-${panelShift}px)` },
        ], {
            duration: 300,
            iterations: 1,
            easing: "ease-in-out",
        });

        // animate progress bar
        const progressBar = newCurrent.querySelector<HTMLDivElement>(".progress-bar")!;
        progressBar.style.setProperty("display", "block");
        const progressAnim = progressBar.animate([
            { height: "0px" },
            { height: "4px" },
        ], {
            duration: 300,
            easing: "ease-in"
        });

        const promises: Promise<any>[] = [mainAnim.finished, progressAnim.finished];

        if (settings[`display.${panels[1].weather.type}`] == "collapsed") {
            promises.push(uncollapsePanel(panels[1]));
        }

        await Promise.all(promises);

        // remove the lingering display (though it technically doesn't do anything)
        progressBar.style.removeProperty("display");
    }

    // pop the first panel off since it's no longer relevant
    panels.shift();
    loadNextPanels(1);

    // move the first event from the upcoming box into the current box
    upcomingEventBox.removeChild(newCurrent);
    currentEventBox.replaceChildren(newCurrent);

    currentlyShifting = false;
}

// debug: put it into the window
// @ts-ignore
window._debug_shift = () => shiftPanels();

// @ts-ignore
window._debug_uncollapse = () => uncollapsePanel(panels[1]);

export const enum UpdateFlags {
    None = 0,
    Timers = 1,
    Shifts = 2,
    Both = Timers | Shifts
};

export function update(type: UpdateFlags = UpdateFlags.Both) {
    if (type & UpdateFlags.Shifts) {
        const currentID = currentWeatherID();
        if (currentID > panels[0].weather.id && !currentlyShifting) {
            shiftPanels();
        }
    }

    if (type & UpdateFlags.Timers) {
        for (let i = startIdx; i <= endIdx; i++) {
            panels[i].update(i == 0);
        }
    }
}


export function init() {
    // 250 is enough to at least get to the next Spooky Festival
    // (loading one prevents later layout shifts on tablet)
    const currentID = currentWeatherID();
    for (let i = 0; i < 250; i++) {
        panels.push(new Panel(currentID + i));
    };

    // update all the panels once
    update();

    // mount the panels into the DOM
    currentEventBox.appendChild(panels[0].mount());
    upcomingEventBox.append(...panels.slice(1).map((panel) => panel.mount()));

    // Adding markers requires the panels to be mounted into the DOM, so do it now
    // HACK: we need to wait for a reflow; it usually doesn't take half a second, but
    // being conservative here is better
    setTimeout(() => {
        for (const panel of panels) {
            onCreatePanel(panel);
        }

        // we can only accurately measure this after the elements are mounted
        window.visualViewport!.addEventListener("scroll", updateActiveRegion);
        window.visualViewport!.addEventListener("resize", updateActiveRegion, { passive: true });

        // load more if we scroll to the bottom
        const observer = new IntersectionObserver((entries) => {
            if (!entries[0].isIntersecting) return;
            loadNextPanels(50);
        }, {
            rootMargin: "300px",
        });

        observer.observe(document.querySelector("#loading")!);
    }, 500);
}
