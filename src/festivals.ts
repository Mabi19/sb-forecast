import { WeatherEvent } from "./weather";

// this is mainly for fishing and spooky SCs can be caught Autumn 26 - Late Autumn 3
const firstTrackedSpooky = 1678415700000;
const spookyInterval = 446_400_000; // 1 SkyBlock Year (5 days 4 hours)
const spookyLength = 10_800_000; // 3 hours

export interface MarkerEvent {
    type: "spooky" | "fishing",
    id: number;
    start: Date;
    end: Date;
}

export function spookyIDAt(time: Date) {
    const timeSinceFirstTracked = time.getTime() - firstTrackedSpooky;
    const timeSinceLastSpooky = timeSinceFirstTracked % spookyInterval;
    if (timeSinceLastSpooky < spookyLength) {
        return Math.floor(timeSinceFirstTracked / spookyInterval);
    } else {
        return null;
    }
}

export function getSpookyEvent(id: number | null): MarkerEvent | null {
    if (id == null) return null;
    return {
        type: "spooky",
        id,
        start: new Date(firstTrackedSpooky + spookyInterval * id),
        end: new Date(firstTrackedSpooky + spookyInterval * id + spookyLength),
    };
}

const firstTrackedFishingFestival = 1679464500000;
const fishingFestivalInterval = 37_200_000; // 1 SkyBlock Month (10 hours 20 minutes)
const fishingFestivalLength = 3_600_000; // 1 hour

export function fishingIDAt(time: Date) {
    const timeSinceFirstTracked = time.getTime() - firstTrackedFishingFestival;
    const timeSinceLastFestival = timeSinceFirstTracked % fishingFestivalInterval;
    if (timeSinceLastFestival < fishingFestivalLength) {
        return Math.floor(timeSinceFirstTracked / fishingFestivalInterval);
    } else {
        return null;
    }
}

export function getFishingFestival(id: number | null): MarkerEvent | null {
    if (id == null) return null;
    return {
        type: "fishing",
        id,
        start: new Date(firstTrackedFishingFestival + fishingFestivalInterval * id),
        end: new Date(firstTrackedFishingFestival + fishingFestivalInterval * id + fishingFestivalLength),
    }
}

// The event that starts during the specified weather event.
export function eventDuringWeather(weather: WeatherEvent): MarkerEvent | null {
    const startTime = weather.start.getTime();
    const endTime = weather.end.getTime();

    // No more than 1 festival will start during a particular weather event
    const firstSpookyAfterStart = Math.ceil((startTime - firstTrackedSpooky) / spookyInterval);
    const lastSpookyBeforeEnd = Math.floor((endTime - firstTrackedSpooky) / spookyInterval);
    if (firstSpookyAfterStart == lastSpookyBeforeEnd) {
        return getSpookyEvent(firstSpookyAfterStart);
    }

    const firstFishingAfterStart = Math.ceil((startTime - firstTrackedFishingFestival) / fishingFestivalInterval);
    const lastFishingBeforeEnd = Math.floor((endTime - firstTrackedFishingFestival) / fishingFestivalInterval);
    if (firstFishingAfterStart == lastFishingBeforeEnd) {
        return getFishingFestival(firstFishingAfterStart);
    }

    return null;
}
