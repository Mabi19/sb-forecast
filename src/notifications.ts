import { settings } from "./settings";
import { currentWeatherID, getWeatherEvent, WeatherEvent, weatherIcons } from "./weather";

const durations = {
    "5min": 300_000,
    "2min": 120_000,
    "1min": 60_000,
    "10s": 10_000,
} as const;

const weatherLabels = {
    "sun": "It will be sunny",
    "rain": "It will rain",
    "thunder": "There will be a thunderstorm"
};

const timeLabels = {
    "5min": "5 minutes",
    "2min": "2 minutes",
    "1min": "1 minute",
    "10s": "10 seconds",
}

let nextWeatherID: number;
let nextWeather: WeatherEvent;
let displayedThisCycle: boolean;

export let hasNotificationPermission: boolean;

export function initNotifications() {
    nextWeatherID = currentWeatherID() + 1;
    nextWeather = getWeatherEvent(nextWeatherID);

    const notifPeriod = settings[`notifications.${nextWeather.type}`];
    if (notifPeriod != "off") {
        const timeDiff = nextWeather.start.getTime() - new Date().getTime();
        displayedThisCycle = timeDiff < durations[notifPeriod];
    } else {
        displayedThisCycle = false;
    }

    hasNotificationPermission = Notification.permission == "granted";
}

export async function askNotificationPermission(): Promise<boolean> {
    return Notification.requestPermission().then((result) => {
        hasNotificationPermission = result == "granted";
        return hasNotificationPermission;
    });
}

export function updateNotifications() {
    const timeDiff = nextWeather.start.getTime() - new Date().getTime();
    const notificationPeriod = settings[`notifications.${nextWeather.type}`];
    if (!displayedThisCycle && notificationPeriod != "off" && timeDiff < durations[notificationPeriod]) {
        displayedThisCycle = true;
        new Notification("SkyBlock Spider's Den Forecast", {
            body: `${weatherLabels[nextWeather.type]} in ${timeLabels[notificationPeriod]}!`,
            icon: weatherIcons[nextWeather.type],
        });
    }

    const testID = currentWeatherID() + 1;
    if (testID == nextWeatherID) {
        return;
    }
    nextWeatherID = testID;
    nextWeather = getWeatherEvent(nextWeatherID);
    displayedThisCycle = false;
}
