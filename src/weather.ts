import iconSun from "./assets/icon-sun.webp";
import iconRain from "./assets/icon-rain.webp";
import iconThunder from "./assets/icon-thunder.webp";

// Even weather IDs = rain
// Divisible by 8 weather IDs = thunder
// Odd weather IDs = sun

const firstTrackedThunderstorm = new Date(1678386756000);
const rainInterval = 4_850_000;
const rainLength = 1_000_000;

export const weatherConditions = [
    "sun",
    "rain",
    "thunder",
] as const;

export type WeatherCondition = typeof weatherConditions[number];

export const weatherNames: Record<WeatherCondition, string> = {
    "sun": "Sunny",
    "rain": "Rain",
    "thunder": "Thunderstorm",
}

export const weatherIcons: Record<WeatherCondition, string> = {
    sun: iconSun,
    rain: iconRain,
    thunder: iconThunder,
}

export interface WeatherEvent {
    type: WeatherCondition;
    id: number;
    start: Date;
    end: Date;
    length: number;
};

export function currentWeatherID() {
    return weatherIDAt(new Date());
}

export function weatherIDAt(date: Date) {
    const timeSinceFirstTracked = date.getTime() - firstTrackedThunderstorm.getTime();
    const precipitationCycle = Math.floor(timeSinceFirstTracked / rainInterval);
    const timeInCycle = timeSinceFirstTracked % rainInterval;
    if (timeInCycle < rainLength) {
        // downpour
        return precipitationCycle * 2;
    } else {
        // clear
        return precipitationCycle * 2 + 1;
    }
}

export function getWeatherEvent(weatherID: number): WeatherEvent {
    if (weatherID % 2 == 0) {
        // some kind of precipitation
        const startTime = firstTrackedThunderstorm.getTime() + rainInterval * weatherID / 2;
        const length = rainLength;
        const result: WeatherEvent = { type: "rain", id: weatherID, start: new Date(startTime), length, end: new Date(startTime + length - 1) };
        if (weatherID % 8 == 0) {
            result.type = "thunder";
        }
        return result;
    } else {
        const startTime = firstTrackedThunderstorm.getTime() + rainInterval * (weatherID - 1) / 2 + rainLength;
        const length = rainInterval - rainLength;
        return { type: "sun", id: weatherID, start: new Date(startTime), length, end: new Date(startTime + length - 1) };
    }
}
