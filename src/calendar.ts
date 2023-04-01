export const dateRangeFormatter = new Intl.DateTimeFormat(undefined, { timeStyle: "short", dateStyle: "short" });
export const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { style: "long" });

export const enum SkyBlockMonth {
    EarlySpring = 0,
    Spring,
    LateSpring,
    EarlySummer,
    Summer,
    LateSummer,
    EarlyAutumn,
    Autumn,
    LateAutumn,
    EarlyWinter,
    Winter,
    LateWinter
};

export const monthNames = [
    "Early Spring",
    "Spring",
    "Late Spring",
    "Early Summer",
    "Summer",
    "Late Summer",
    "Early Autumn",
    "Autumn",
    "Late Autumn",
    "Early Winter",
    "Winter",
    "Late Winter",
] as const;

export const epoch = new Date(1560275700000);

export interface SkyBlockDate {
    year: number;
    month: SkyBlockMonth;
    day: number;
    hour: number;
    minute: number;
};

function ordinalAbbreviation(n: number) {
    const lastDigit = n % 10;
    switch (lastDigit) {
        case 1:
            return "st";
        case 2:
            return "nd";
        case 3:
            return "rd";
        default:
            return "th";
    }
}

export function formatSkyBlockDate(sbDate: SkyBlockDate) {
    const wrapHour = sbDate.hour > 12;
    const wrappedHour = wrapHour ? sbDate.hour - 12 : sbDate.hour;
    const wrappedSuffix = wrapHour ? "PM" : "AM";

    return `${wrappedHour}:${Math.floor(sbDate.minute).toString().padStart(2, "0")} ${wrappedSuffix} ${sbDate.day}${ordinalAbbreviation(sbDate.day)} of ${monthNames[sbDate.month]}, Year ${sbDate.year}`
}

export function formatDuration(duration: number) {
    let seconds = Math.max(0, Math.floor(duration / 1000));
    let minutes = Math.floor(seconds / 60);
    seconds %= 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function formatRelative(date: Date) {
    const now = new Date();
    const diffSeconds = (date.getTime() - now.getTime()) / 1000;
    // only format with big units if larger than 28 days
    if (diffSeconds > 2_419_200) {
        // try years
        const diffYear = date.getFullYear() - now.getFullYear();
        if (diffYear > 0) {
            return relativeFormatter.format(diffYear, "years");
        }
        // try months
        const diffMonth = date.getMonth() - now.getMonth();
        if (diffMonth > 0) {
            return relativeFormatter.format(diffMonth, "months");
        }
    }

    let unit: Intl.RelativeTimeFormatUnit = "seconds";
    let diffInUnit: number | undefined = undefined;
    const unitBrackets: { unit: Intl.RelativeTimeFormatUnit, length: number }[] = [
        { unit: "weeks", length: 604800 },
        { unit: "days", length: 86400 },
        { unit: "hours", length: 3600 },
        { unit: "minutes", length: 60 },
        { unit: "seconds", length: 1 },
    ];
    for (const bracket of unitBrackets) {
        if (diffSeconds > bracket.length) {
            unit = bracket.unit;
            diffInUnit = Math.round(diffSeconds / bracket.length);
            break;
        }
    }

    if (diffInUnit == undefined) {
        diffInUnit = Math.max(0, Math.ceil(diffSeconds));
    }

    return relativeFormatter.format(diffInUnit, unit);
}

export function jsDateToSkyBlock(jsDate: Date) {
    let timeLeft = jsDate.getTime() - epoch.getTime();
    const result: Partial<SkyBlockDate> = {};
    // year
    result.year = Math.floor(timeLeft / 446_400_000) + 1;
    timeLeft = timeLeft % 446_400_000;
    // month
    result.month = Math.floor(timeLeft / 37_200_000);
    timeLeft = timeLeft % 37_200_000;
    // day
    result.day = Math.floor(timeLeft / 1_200_000) + 1;
    timeLeft = timeLeft % 1_200_000;
    // hour
    result.hour = Math.floor(timeLeft / 50_000);
    timeLeft = timeLeft % 50_000;
    // minute
    result.minute = timeLeft / 833.33333333;
    return result as SkyBlockDate;
}

export function skyblockToJSDate(sbDate: SkyBlockDate) {
    let result = epoch.getTime();
    result += (sbDate.year - 1) * 446_400_000; // 5 days 4 hours
    result += sbDate.month * 37_200_000; // 10 hours 20 minutes
    result += (sbDate.day - 1) * 1_200_000; // 20 minutes
    result += sbDate.hour * 50_000; // 50 seconds
    result += sbDate.minute * 833.33333333; // 833 ms
    return new Date(result);
}
