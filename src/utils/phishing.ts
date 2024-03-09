// We're going to be using sinking.yachts to detect phishing sites

import { join } from "path";
import { existsSync, writeFileSync, readFileSync } from "fs";

interface PhishingJSON {
    lastUpdated: number,  // Unix timestamp
    domains: string[]
}


const updatePhishing = async (): Promise<string[]> => {
    console.log("Fetching phishing domains");
    const phishingPath = join(__dirname, "..", "..", "globals", "phishing.json");
    // Check if the file exists
    if (!existsSync(phishingPath)) {
        writeFileSync(phishingPath, JSON.stringify({
            lastUpdated: 0,
            domains: []
        } as PhishingJSON, null, 2));
    }

    const phishing: PhishingJSON = JSON.parse(readFileSync(phishingPath, "utf-8"));
    const lastUpdated = phishing.lastUpdated;
    // Importantly, we need to fetch every domain if it was last checked more than a week ago
    if (Date.now() - lastUpdated > 7 * 24 * 60 * 60 * 1000) {
        console.log("JSON file was stale - Fetching all domains");
        // Fetch the domains
        const res = await fetch("https://phish.sinking.yachts/v2/all");
        if (res.ok) {
            const domains = await res.json() as string[];
            phishing.domains = domains;
            phishing.lastUpdated = Date.now();
            writeFileSync(phishingPath, JSON.stringify(phishing, null, 2));
        }
    } else if (Date.now() - lastUpdated > 60 * 60 * 1000) {
        console.log("JSON file was old - Updating database list");
        // delta must be in seconds, and at most 604800 (7 days)
        const delta = Math.min(Math.floor((Date.now() - lastUpdated) / 1000), 604800);
        // Fetch the domains
        const res = await fetch(`https://phish.sinking.yachts/v2/recent/${delta}`);
        if (res.ok) {
            const domains = await res.json() as {type: "add" | "remove", domains: string[]}[];
            for (const {type, domains: newDomains} of domains) {
                if (type === "add") {
                    phishing.domains.push(...newDomains);
                } else if (type === "remove") {
                    for (const domain of newDomains) {
                        const index = phishing.domains.indexOf(domain);
                        if (index !== -1) {
                            phishing.domains.splice(index, 1);
                        }
                    }
                }
            }
            phishing.lastUpdated = Date.now();
            writeFileSync(phishingPath, JSON.stringify(phishing, null, 2));
        }
    } else {
        console.log("JSON file was recent - Using cached list");
    }
    // And lastly, return the domains
    return phishing.domains;
};

export { updatePhishing };
