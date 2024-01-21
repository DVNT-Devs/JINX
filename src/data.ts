// Load data.json
import data from "./data/data.json";
// import rules from "./data/rules.json";
import contentRestrictions from "./data/contentRestrictions.json";

export const Colours = {
    Danger: 0xF27878,
    Warning: 0xF2D478,
    Success: 0x68D49E
};


type dataEntries = string | object | undefined;
type detailedDataEntries = dataEntries | dataEntries[] | Record<string, dataEntries> | Record<string, dataEntries>[];
type detailedData = Record<string, detailedDataEntries>;


const findDotSeparatedKey = (key: string, d: detailedData) => {
    const keys = key.split(".");
    let value: any = d;
    for (const key of keys) {
        if (key in value) {
            value = value[key];
        } else {
            return "";
        }
    }
    return value;
};

const newName = (s: string, d: detailedData) => {
    // Replace any instances of ${...} with findDotSeparatedKey(...)
    const regex = /\${(.*?)}/g;
    const matches = s.match(regex);
    if (!matches) return s;
    for (const match of matches) {
        const key = match.slice(2, -1);
        const value = findDotSeparatedKey(key, d);
        s = s.replace(match, value);
    }
    return s;
};


const fixKeys = (obj: detailedData, baseObj?: detailedData) => {
    baseObj = baseObj || obj;
    // This function will take the keys of an object and correct them.
    // If one says $channels.dev, it will look up data.channels.dev and use that value instead.

    // Loop through the keys
    for (const key in obj) {
        // Both the key or value (if it's a string) could be a dot-separated key, formatted as ${key.a.b.c}
        // If the key is a dot-separated key, replace it with the value. It may not be at the start, and there could be multiple.
        const newKey = newName(key, baseObj);
        let newValue = obj[key];
        if (typeof newValue === "string") {
            newValue = newName(newValue, baseObj);
        } else if (Array.isArray(newValue)) {
            newValue = newValue.map((element: dataEntries) => {
                if (typeof element === "string") {
                    return newName(element, baseObj!);
                } else if (typeof element === "object") {
                    return fixKeys(element as detailedData, baseObj);
                } else {
                    return element;
                }
            });
        } else if (typeof newValue === "object") {
            newValue = fixKeys(newValue as detailedData, baseObj);
        }

        // Replace the key and value
        delete obj[key];
        obj[newKey] = newValue;
    }

    // Return the object
    return obj;
};

const fixedData = fixKeys(data);
const fixedContentRestrictions = fixKeys(contentRestrictions) as typeof contentRestrictions;

export default fixedData as typeof data;
export { fixedContentRestrictions as contentRestrictions };
