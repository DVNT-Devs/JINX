import { expect, test } from "@jest/globals";
import { responseFrom } from "../actions/randomResponses";
import { GuildMember } from "discord.js";

// Ensure a response is returned for "praise", "degrade", and "mean"

const exampleMember = {
    id: "438733159748599813",
    roles: { cache: [{id: "1150453458047078540"}] }
} as unknown as GuildMember;

test("randomResponses.ts: responseFrom() must return a string", () => {
    const praise = responseFrom(exampleMember, "praise");
    const degrade = responseFrom(exampleMember, "degrade");
    const mean = responseFrom(exampleMember, "mean");

    expect(typeof praise).toBe("string");
    expect(typeof degrade).toBe("string");
    expect(typeof mean).toBe("string");
});
