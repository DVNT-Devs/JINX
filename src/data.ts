// Load data.json
import data from "./data.json";

const findDotSeparatedKey = (key: string) => {
    const keys = key.split(".");
    let value: any = data;
    for (const key of keys) {
        if (key in value) {
            value = value[key];
        } else {
            return "";
        }
    }
    return value;
};

const newName = (s: string) => {
    // Replace any instances of ${...} with findDotSeparatedKey(...)
    const regex = /\${(.*?)}/g;
    const matches = s.match(regex);
    if (!matches) return s;
    for (const match of matches) {
        const key = match.slice(2, -1);
        const value = findDotSeparatedKey(key);
        s = s.replace(match, value);
    }
    return s;
};

const fixKeys = (obj: Record<string, any>) => {
    // This function will take the keys of an object and correct them.
    // If one says $channels.dev, it will look up data.channels.dev and use that value instead.

    // Loop through the keys
    for (const key in obj) {
        // Both the key or value (if it's a string) could be a dot-separated key, formatted as ${key.a.b.c}
        // If the key is a dot-separated key, replace it with the value. It may not be at the start, and there could be multiple.
        const newKey = newName(key);
        const newValue = typeof obj[key] === "string" ? newName(obj[key]) : obj[key];

        // Replace the key and value
        delete obj[key];
        obj[newKey] = newValue;

        // If the value is an object, run this function on it
        if (typeof obj[key] === "object") {
            obj[key] = fixKeys(obj[key]);
        }
    }

    // Return the object
    return obj;
};

const fixedData = fixKeys(data);

export default fixedData as typeof data;
