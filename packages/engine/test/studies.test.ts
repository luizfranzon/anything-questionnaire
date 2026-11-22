import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DomainError } from "../src/index";
import { createTestEngine } from "./helpers";

let ctx: Awaited<ReturnType<typeof createTestEngine>>;
beforeEach(async () => {
  ctx = await createTestEngine();
});
afterEach(async () => {
  await ctx.cleanup();
});

const MISSING_ID = "00000000-0000-0000-0000-000000000000";

describe("Study", () => {
  it("creates a Study with a name and a goal and lists it", async () => {
    const created = await ctx.engine.createStudy({ name: "AWS SAA", goal: "Pass the SAA-C03 exam" });
    expect(created).toMatchObject({ name: "AWS SAA", goal: "Pass the SAA-C03 exam" });

    const list = await ctx.engine.listStudies();
    expect(list.map((s) => s.name)).toEqual(["AWS SAA"]);
  });

  it("lists the most recent Study first", async () => {
    await ctx.engine.createStudy({ name: "First", goal: "a" });
    await ctx.engine.createStudy({ name: "Second", goal: "b" });
    expect((await ctx.engine.listStudies()).map((s) => s.name)).toEqual(["Second", "First"]);
  });

  it("rejects an empty name or goal and stores nothing", async () => {
    await expect(ctx.engine.createStudy({ name: "  ", goal: "x" })).rejects.toMatchObject({
      code: "NAME_REQUIRED",
    });
    await expect(ctx.engine.createStudy({ name: "x", goal: "" })).rejects.toMatchObject({
      code: "GOAL_REQUIRED",
    });
    expect(await ctx.engine.listStudies()).toEqual([]);
  });

  it("rejects a name or goal that is too long", async () => {
    await expect(ctx.engine.createStudy({ name: "n".repeat(121), goal: "x" })).rejects.toMatchObject({
      code: "NAME_TOO_LONG",
    });
    await expect(ctx.engine.createStudy({ name: "x", goal: "g".repeat(601) })).rejects.toMatchObject({
      code: "GOAL_TOO_LONG",
    });
  });

  it("edits the name and goal", async () => {
    const { id } = await ctx.engine.createStudy({ name: "Rust", goal: "ownership" });
    const updated = await ctx.engine.updateStudy(id, { name: "Advanced Rust", goal: "async" });
    expect(updated).toMatchObject({ id, name: "Advanced Rust", goal: "async" });
    expect(await ctx.engine.getStudy(id)).toMatchObject({ name: "Advanced Rust", goal: "async" });
  });

  it("returns null for an unknown Study and fails to edit it", async () => {
    expect(await ctx.engine.getStudy(MISSING_ID)).toBeNull();
    const failure = ctx.engine.updateStudy(MISSING_ID, { name: "x", goal: "y" });
    await expect(failure).rejects.toBeInstanceOf(DomainError);
    await expect(failure).rejects.toMatchObject({ code: "STUDY_NOT_FOUND" });
  });

  it("treats a malformed id as an unknown Study", async () => {
    expect(await ctx.engine.getStudy("not-a-uuid")).toBeNull();
    await expect(ctx.engine.updateStudy("not-a-uuid", { name: "x", goal: "y" })).rejects.toMatchObject({
      code: "STUDY_NOT_FOUND",
    });
  });

  it("deletes a Study", async () => {
    const { id } = await ctx.engine.createStudy({ name: "Delete me", goal: "x" });
    await ctx.engine.deleteStudy(id);
    expect(await ctx.engine.getStudy(id)).toBeNull();
    expect(await ctx.engine.listStudies()).toEqual([]);
  });
});
