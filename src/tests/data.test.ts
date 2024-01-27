import { expect, test } from '@jest/globals';

// Load the "data.ts" module
import data, { rules, contentRestrictions } from '../data';


const hasNullKeys = (data: Record<string, unknown>) => {
    const nullKeyIdentifier = "/Key not found/";
    // The value could be an object, array, or string.
    const keys = Object.keys(data);
    if (keys.includes(nullKeyIdentifier)) return true;
    for (const key of keys) {
        const value = data[key];
        if (typeof value === "object") {
            if (hasNullKeys(value as Record<string, unknown>)) return true;
        }
    }
    if (Array.isArray(data)) {
        for (const element of data) {
            if (typeof element === "object") {
                if (hasNullKeys(element as Record<string, unknown>)) return true;
            }
        }
    }
    return false;
}

test("data.ts: All data keys are valid", () => {
    expect(hasNullKeys(data)).toBe(false);
    expect(hasNullKeys(rules)).toBe(false);
    expect(hasNullKeys(contentRestrictions)).toBe(false);
});
