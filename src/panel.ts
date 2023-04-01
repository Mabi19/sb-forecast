import { getWeatherEvent, weatherIcons, weatherNames } from "./weather";
import { dateRangeFormatter, formatDuration, formatRelative } from "./calendar";
import "./panel.scss";

export class Panel {
    weather: ReturnType<typeof getWeatherEvent>;
    // Only includes elements that will need to be updated
    // and other relevant ones
    html: {
        wrapper: HTMLDivElement;
        timing: {
            dateRange: HTMLSpanElement;
            relative: HTMLSpanElement;
        }
        progressFill: HTMLDivElement;
    };

    // You will need to call update() after creating the object
    // to actually fill in the values.
    constructor(weatherID: number) {
        this.weather = getWeatherEvent(weatherID);
        const wrapper = document.createElement("div");
        wrapper.classList.add("panel");
        wrapper.classList.add(this.weather.type);

        const icon = document.createElement("img");
        icon.src = weatherIcons[this.weather.type];
        icon.alt = weatherNames[this.weather.type];
        icon.classList.add("panel-icon");
        wrapper.appendChild(icon);

        const contentWrapper = document.createElement("div");
        contentWrapper.classList.add("panel-content");

        const title = document.createElement("div");
        title.classList.add("panel-title");
        title.textContent = weatherNames[this.weather.type];

        const timing = document.createElement("div");
        timing.classList.add("panel-timing");

        const dateRange = document.createElement("span");
        dateRange.classList.add("panel-timing-daterange");
        dateRange.textContent = dateRangeFormatter.formatRange(this.weather.start, this.weather.end);

        const relative = document.createElement("span");
        relative.classList.add("panel-timing-relative");

        timing.append(dateRange, relative);

        const progress = document.createElement("div");
        progress.classList.add("progress-bar")
        const progressFill = document.createElement("div");
        progressFill.classList.add("progress-bar-fill");
        progressFill.style.setProperty("--amount", "0%");
        progress.appendChild(progressFill);

        contentWrapper.append(title, timing, progress);

        wrapper.appendChild(contentWrapper);

        this.html = {
            wrapper,
            timing: {
                dateRange,
                relative
            },
            progressFill
        };
    }

    update(isFirst: boolean) {
        if (isFirst) {
            const maxTime = this.weather.length;
            const elapsedTime = new Date().getTime() - this.weather.start.getTime();
            const timeRemaining = maxTime - elapsedTime;

            // relative time should be a countdown
            this.html.timing.relative.textContent = `${formatDuration(timeRemaining)}`;

            // also progress bar
            // first 100 is for percentages, second is for 2 decimal places
            const fill = `${Math.round(elapsedTime / maxTime * 100 * 100) / 100}%`;
            this.html.progressFill.style.setProperty("--amount", fill);
        } else {
            // relative time should be a localized expression
            this.html.timing.relative.textContent = formatRelative(this.weather.start);

            // also no progress bar
        }
    }

    mount() {
        return this.html.wrapper;
    }
}
