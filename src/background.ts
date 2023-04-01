import { currentWeatherID, getWeatherEvent, WeatherCondition } from "./weather";
import { formatDuration } from "./calendar";
import bgSun from "./assets/bg-sun.webp";
import bgRain from "./assets/bg-rain.webp";
import bgThunder from "./assets/bg-thunder.webp";
import { shouldAnimate } from "./utils";

const backgrounds: Record<WeatherCondition, string> = {
    sun: bgSun,
    rain: bgRain,
    thunder: bgThunder,
};

const background = document.querySelector<HTMLDivElement>("#background")!;
const backgroundOverlay = document.querySelector<HTMLDivElement>("#background-overlay")!;
const iconTag = document.querySelector<HTMLLinkElement>("#icon-tag")!;
let preloadedThisCycle = false;
let preloadLinkTag: HTMLLinkElement;

export function initBackground() {
    const weatherType = getWeatherEvent(currentWeatherID()).type;
    // set the background
    background.style.setProperty("--image", `url(${backgrounds[weatherType]})`);
    // ... and the icon
    iconTag.href = `/sb-forecast/favicon-${weatherType}.png`;
}

async function setBackground(type: WeatherCondition) {
    iconTag.href = `/sb-forecast/favicon-${type}.png`;
    if (shouldAnimate()) {
        // fancy transition
        backgroundOverlay.style.setProperty("--image", `url(${backgrounds[type]})`);
        backgroundOverlay.classList.add("visible");
        await backgroundOverlay.animate([
            { opacity: "0" },
            { opacity: "1" },
        ], {
            duration: 500,
            easing: "ease",
        }).finished;
        background.style.setProperty("--image", `url(${backgrounds[type]})`);
        backgroundOverlay.classList.remove("visible");
    } else {
        // just change the image
        background.style.setProperty("--image", `url(${backgrounds[type]})`);
    }
}

// @ts-ignore
window._debug_setBackground = (type) => setBackground(type);

let currentID = currentWeatherID();
let lastID = currentID;
export function updateBackground() {
    currentID = currentWeatherID();
    const weather = getWeatherEvent(currentID);
    // background
    if (currentID != lastID) {
        const weatherType = weather.type;
        setBackground(weatherType);
        preloadedThisCycle = false;
    }
    const timeUntilNext = weather.end.getTime() - new Date().getTime();

    // title (this technically shouldn't be in this file, but I don't have anywhere else to put it)
    document.title = `(${formatDuration(timeUntilNext)}) SkyBlock Spider's Den Forecast`;

    // preload the next background just a little before it's needed
    if (!preloadedThisCycle && timeUntilNext < 8_000) {
        preloadedThisCycle = true;
        if (preloadLinkTag) {
            document.head.removeChild(preloadLinkTag);
        }
        preloadLinkTag = document.createElement("link");
        preloadLinkTag.rel = "preload";
        preloadLinkTag.as = "image";
        preloadLinkTag.href = backgrounds[getWeatherEvent(currentID + 1).type];
        document.head.appendChild(preloadLinkTag);
        console.log("preloaded", preloadLinkTag.href);
    }

    lastID = currentID;
}
