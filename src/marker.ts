import { Panel } from "./panel";
import { eventDuringWeather, MarkerEvent } from "./festivals";
import { dateRangeFormatter } from "./calendar";
import { currentWeatherID } from "./weather";
import { panels } from "./panel-store";
import { shouldAnimate } from "./utils";
import "./marker.css";
import spookyIcon from "./assets/spooky.webp";
import fishingIcon from "./assets/fishing-festival.webp";

export interface Marker {
    type: "spooky" | "fishing";
    start: Date;
    end: Date;
    elem: HTMLDivElement;

    singlePanel: boolean;
    cutsOff: boolean;

    position: {
        firstPanelID: number;
        lastPanelID: number;
        top: number;
        bottom: number;
    }
};

function setMarkerTop(marker: Marker, top: number) {
    marker.position.top = top;
    marker.elem.style.setProperty("--top", `${top}px`);
}

function setMarkerBottom(marker: Marker, bottom: number) {
    marker.position.bottom = bottom;
    marker.elem.style.setProperty("--bottom", `${bottom}px`);
}

async function moveMarkerBounds(marker: Marker, top: number, bottom: number) {
    if (shouldAnimate()) {
        await marker.elem.animate([
            { top: `${marker.position.top}px`, height: `${marker.position.bottom - marker.position.top}px` },
            { top: `${top}px`, height: `${bottom - top}px` }
        ], {
            duration: 300,
            easing: "ease-in-out",
        }).finished;
    }
    setMarkerTop(marker, top);
    setMarkerBottom(marker, bottom);
}

// const leftMarkerBox = document.querySelector("#left-markers")!;
const rightMarkerBox = document.querySelector("#right-markers")!;

const rightMarkers: Marker[] = [];

function addMarker(panel: Panel, event: MarkerEvent) {
    // panel bounds
    const panelRect = panel.html.wrapper.getBoundingClientRect();
    const panelTop = panelRect.top + window.scrollY;
    const panelBottom = panelRect.bottom + window.scrollY;

    // create the DOM nodes

    const elem = document.createElement("div");
    elem.classList.add("marker");
    elem.classList.add(event.type);

    const label = document.createElement("div");
    label.classList.add("label");

    const labelIcon = document.createElement("img");
    labelIcon.classList.add("icon");
    labelIcon.src = event.type == "spooky" ? spookyIcon : fishingIcon;
    labelIcon.role = "presentation";

    const labelContent = document.createElement("span");
    if (event.type == "spooky") {
        labelIcon.src = spookyIcon;
        labelContent.textContent = `Spooky Festival`;
    } else {
        labelIcon.src = fishingIcon;
        if (event.id % 12 == 8) {
            // overlap
            labelContent.textContent = `Spooky + Fishing Festival`;
            elem.classList.add("overlap");
        } else {
            labelContent.textContent = `Fishing Festival`;
        }
    }

    label.appendChild(labelIcon);
    label.appendChild(labelContent);

    label.title = dateRangeFormatter.formatRange(event.start, event.end);
    elem.appendChild(label);

    const marker = {
        type: event.type,
        start: event.start,
        end: event.end,
        elem,
        singlePanel: false,
        cutsOff: false,
        position: {
            firstPanelID: panel.weather.id,
            lastPanelID: panel.weather.id,
            top: -1,
            bottom: -1,
        },
    }

    // place the marker accordingly
    if (event.end <= panel.weather.end) {
        // event is entirely contained within the weather
        setMarkerTop(marker, panelTop);
        marker.singlePanel = true;
    } else if (event.start == panel.weather.start) {
        // event starts at the start of the weather
        setMarkerTop(marker, panelTop);
    } else {
        // event starts somewhere in the middle
        setMarkerTop(marker, (panelTop + panelBottom + 4) / 2);
    }

    // extend it until the bottom of this panel
    setMarkerBottom(marker, panelBottom);

    // if there's an event about to be overridden, extend it until here
    const lastMarker = rightMarkers[rightMarkers.length - 1];
    if (lastMarker != undefined && lastMarker.end >= event.start) {
        setMarkerBottom(lastMarker, marker.position.top);
        lastMarker.position.lastPanelID = panel.weather.id;
        marker.cutsOff = true;
    }

    rightMarkers.push(marker);

    rightMarkerBox.appendChild(elem);
}

function tryAddMarker(panel: Panel) {
    const event = eventDuringWeather(panel.weather);
    if (event != null) {
        addMarker(panel, event);
    }
}

function reflowMarker(marker: Marker, cutOffMarker: Marker | null, idOffset: number, rects: { firstRect: DOMRect, lastRect: DOMRect }) {
    // anchor the start
    let topPanelIdx = marker.position.firstPanelID - idOffset;
    const topPanel = panels[topPanelIdx];
    // panel bounds
    const topPanelTop = rects.firstRect.top + window.scrollY;
    const topPanelBottom = rects.firstRect.bottom + window.scrollY;

    if (marker.start == topPanel.weather.start || marker.singlePanel) {
        // event starts at the start of the weather
        setMarkerTop(marker, topPanelTop);
    } else {
        // event starts somewhere in the middle
        setMarkerTop(marker, (topPanelTop + topPanelBottom + 4) / 2);
    }

    // anchor the end
    let bottomPanelIdx = marker.position.lastPanelID - idOffset;
    const bottomPanel = panels[bottomPanelIdx];
    // panel bounds
    const bottomPanelTop = rects.lastRect.top + window.scrollY;
    const bottomPanelBottom = rects.lastRect.bottom + window.scrollY;

    if (marker.singlePanel) {
        setMarkerBottom(marker, topPanelBottom);
    } else if (marker.end >= bottomPanel.weather.end) {
        // event ends at the end of the weather or later
        setMarkerBottom(marker, bottomPanelBottom);
    } else {
        // event ends somewhere in the middle
        setMarkerBottom(marker, (bottomPanelTop + bottomPanelBottom - 4) / 2);
    }

    if (cutOffMarker != null) {
        setMarkerBottom(cutOffMarker, marker.position.top);
    }
}

export function reflowMarkers() {
    const panelIDOffset = currentWeatherID();
    rightMarkers.map((marker) => {
        return {
            marker,
            firstRect: panels[marker.position.firstPanelID - panelIDOffset].html.wrapper.getBoundingClientRect(),
            lastRect: panels[marker.position.lastPanelID - panelIDOffset].html.wrapper.getBoundingClientRect(),
        }
    }).forEach((markerData, idx) => {
        const prevMarker = rightMarkers[idx - 1] ?? null;
        reflowMarker(markerData.marker, markerData.marker.cutsOff ? prevMarker : null, panelIDOffset, {
            firstRect: markerData.firstRect,
            lastRect: markerData.lastRect,
        });
    });
}

export function onCreatePanel(panel: Panel) {
    // right markers

    tryAddMarker(panel);

    const lastMarker = rightMarkers.length ? rightMarkers[rightMarkers.length - 1] : null;
    if (lastMarker != null && !lastMarker.singlePanel) {
        if (lastMarker.end > panel.weather.start) {
            // panel bounds
            const panelRect = panel.html.wrapper.getBoundingClientRect();
            const panelTop = panelRect.top + window.scrollY;
            const panelBottom = panelRect.bottom + window.scrollY;

            // extend the existing marker...
            if (lastMarker.end < panel.weather.end) {
                // up to half of this panel
                setMarkerBottom(lastMarker, (panelTop + panelBottom - 4) / 2);
            } else {
                // up to the end of this panel
                setMarkerBottom(lastMarker, panelBottom);
            }
            // set the bottom anchored panel
            lastMarker.position.lastPanelID = panel.weather.id;
        }
    }
}

export function onPanelShift(shiftAmount: number) {
    // shift all the markers up
    for (let i = 0; i < rightMarkers.length; i++) {
        const marker = rightMarkers[i];
        const newTop = Math.max(0, marker.position.top - shiftAmount);
        const newBottom = Math.max(0, marker.position.bottom - shiftAmount);

        if (newTop == 0 && newBottom == 0) {
            // delete this marker
            if (shouldAnimate()) {
                // animate and then delete
                marker.elem.style.overflowY = "hidden";
                marker.elem.animate([
                    { "height": `${marker.elem.offsetHeight}px` },
                    { "height": "0px" },
                ], {
                    duration: 300,
                }).finished.then(() => {
                    rightMarkerBox.removeChild(marker.elem);
                    rightMarkers.splice(i, 1);
                });
            } else {
                // just delete
                rightMarkerBox.removeChild(marker.elem);
                rightMarkers.splice(i, 1);
            }
        } else {
            moveMarkerBounds(marker, newTop, newBottom);
        }
    }
}