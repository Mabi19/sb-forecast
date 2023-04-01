// This settings system is way too powerful for this but I wanted to make a cool settings system

function load<K extends ConstantString, T>(key: K, defaultValue: T, validator: (val: any) => boolean = () => true): [K, T] {
    const item = localStorage.getItem(key);
    let parsed;
    if (!item) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        parsed = defaultValue;
    } else {
        parsed = JSON.parse(item);
        if (!validator(parsed)) {
            localStorage.setItem(key, JSON.stringify(defaultValue));
            parsed = defaultValue;
        }
    }
    return [key, parsed];
}

type ConstantString = (readonly string[])[number];

function choice<K extends ConstantString, T extends ConstantString>(key: K, defaultValue: typeof vals[number], vals: readonly T[]): [K, T] {
    return load(key, defaultValue, (v) => typeof v == "string" && vals.includes(v as T));
}

type SettingsObject<Parts extends [keyof any, any][]> = {
    [K in Parts[number][0]]: Extract<Parts[number], [K, any]>[1]
}

function makeSettings<Types extends [keyof any, any][]>(...vals: Types): SettingsObject<Types> {
    return new Proxy(Object.fromEntries(vals) as SettingsObject<Types>, {
        set(target, prop, value) {
            if (!Object.hasOwn(target, prop)) {
                return false;
            }
            localStorage.setItem(prop as string, JSON.stringify(value));
            (target as any)[prop] = value;
            return true;
        }
    });
}

export const settings = makeSettings(
    choice("display.sun", "collapsed", ["full", "collapsed"] as const),
    choice("display.rain", "full", ["full", "collapsed"] as const),
    choice("display.thunder", "full", ["full", "collapsed"] as const),
    choice("notifications.sun", "off", ["off", "5min", "2min", "1min", "10s"] as const),
    choice("notifications.rain", "off", ["off", "5min", "2min", "1min", "10s"] as const),
    choice("notifications.thunder", "off", ["off", "5min", "2min", "1min", "10s"] as const),
);
