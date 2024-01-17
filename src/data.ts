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

const fixKeys = (obj: Record<string, any>) => {
    // This function will take the keys of an object and correct them.
    // If one says $channels.dev, it will look up data.channels.dev and use that value instead.

    // Loop through the keys
    for (const key in obj) {
        // Check if the key starts with a $
        if (key.startsWith("$")) {
            // Remove the $, then find the value in the data
            const newKey = findDotSeparatedKey(key.slice(1));
            // If the value is a string, replace the key with it
            if (typeof newKey === "string") {
                obj[newKey] = obj[key];
                delete obj[key];
            }
        }
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
