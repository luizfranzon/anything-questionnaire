import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sampleQuestion } from "../src/index";
import { createTestEngine } from "./helpers";

let ctx: Awaited<ReturnType<typeof createTestEngine>>;
beforeEach(async () => {
  ctx = await createTestEngine();
});
afterEach(async () => {
  await ctx.cleanup();
});

type Move = "right" | "wrong" | "dontknow" | "doubt";

async function studyWithTopics(names: string[]) {
  const study = await ctx.engine.createStudy({ name: "AWS SAA", goal: "Pass the SAA-C03 exam" });
  ctx.claude.whenExtractingTopics({ topics: names });
  await ctx.engine.requestTopicProposal(study.id);
  await ctx.engine.drainJobs();
  const topics = await ctx.engine.approveTopicProposal(study.id, names);
  return { study, topics };
}

/** Creates a Round, then answers all of it, one minute after the previous Answer. `move` decides per Topic name. */
async function play(studyId: string, count: number, move: (topic: string) => Move, topicIds?: string[]) {
  const round = await ctx.engine.createRound(studyId, { count, topicIds });
  await ctx.engine.drainJobs();
  for (;;) {
    const next = await ctx.engine.getNextQuestion(round.id);
    if (!next) return round;
    const { question } = next;
    const correct = question.alternatives.find((a) => a.text.endsWith("opção A"))!.id;
    const wrong = question.alternatives.find((a) => !a.text.endsWith("opção A"))!.id;
    const how = move(question.topic);
    ctx.clock.set(new Date(ctx.clock.now().getTime() + 60_000));
    await ctx.engine.answerQuestion(round.id, question.id, { choice: how === "dontknow" ? null : how === "wrong" ? wrong : correct });
    if (how === "doubt") await ctx.engine.setAnswerConfidence(round.id, question.id, "doubt");
  }
}

/** Successive draws; the last one repeats. */
const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};

const performanceOf = async (studyId: string, name: string) =>
  (await ctx.engine.listTopicPerformance(studyId)).find((t) => t.name === name)!;

describe("Desempenho", () => {
  it("is empty for a Topic never asked", async () => {
    const { study } = await studyWithTopics(["IAM"]);
    expect(await performanceOf(study.id, "IAM")).toMatchObject({ performance: null, trend: null, answers: 0 });
  });

  it("is the share of hits among the most recent Answers only", async () => {
    const { study } = await studyWithTopics(["IAM"]);
    await play(study.id, 10, () => "wrong");
    await play(study.id, 5, () => "right");

    // The window is 10: five old mistakes and five new hits. The first five mistakes fell out of it.
    expect(await performanceOf(study.id, "IAM")).toMatchObject({ performance: 0.5, answers: 15 });

    await play(study.id, 5, () => "right");
    expect(await performanceOf(study.id, "IAM")).toMatchObject({ performance: 1, answers: 20 });
  });

  it("values a hit in doubt less than a sure one", async () => {
    const { study } = await studyWithTopics(["IAM"]);
    await play(study.id, 4, () => "doubt");
    expect((await performanceOf(study.id, "IAM")).performance).toBe(0.5);
  });

  it("counts a hit with no Confidence declared as sure", async () => {
    const { study } = await studyWithTopics(["IAM"]);
    await play(study.id, 4, () => "right");
    expect((await performanceOf(study.id, "IAM")).performance).toBe(1);
  });

  it("counts \"Não sei\" as a mistake", async () => {
    const { study } = await studyWithTopics(["IAM"]);
    await play(study.id, 2, () => "right");
    await play(study.id, 2, () => "dontknow");
    expect((await performanceOf(study.id, "IAM")).performance).toBe(0.5);
  });

  it("is kept apart per Topic", async () => {
    const { study, topics } = await studyWithTopics(["IAM", "VPC"]);
    await play(study.id, 4, () => "right", [topics[0].id]);
    expect(await performanceOf(study.id, "IAM")).toMatchObject({ performance: 1, answers: 4 });
    expect(await performanceOf(study.id, "VPC")).toMatchObject({ performance: null, answers: 0 });
  });
});

describe("Trend", () => {
  it("rises when the recent Answers are better than the older ones", async () => {
    const { study } = await studyWithTopics(["IAM"]);
    await play(study.id, 4, () => "wrong");
    await play(study.id, 4, () => "right");
    expect(await performanceOf(study.id, "IAM")).toMatchObject({ trend: "up", delta: 100 });
  });

  it("falls when the recent Answers are worse", async () => {
    const { study } = await studyWithTopics(["IAM"]);
    await play(study.id, 4, () => "right");
    await play(study.id, 4, () => "wrong");
    expect(await performanceOf(study.id, "IAM")).toMatchObject({ trend: "down", delta: -100 });
  });

  it("stays steady when nothing changed, and is unknown with too few Answers", async () => {
    const { study } = await studyWithTopics(["IAM", "VPC"]);
    await play(study.id, 8, () => "right", [(await ctx.engine.listTopicPerformance(study.id))[0].topicId]);
    expect(await performanceOf(study.id, "IAM")).toMatchObject({ trend: "steady", delta: 0 });

    const vpc = (await ctx.engine.listTopicPerformance(study.id)).find((t) => t.name === "VPC")!;
    await play(study.id, 2, () => "right", [vpc.topicId]);
    expect(await performanceOf(study.id, "VPC")).toMatchObject({ trend: null, delta: null });
  });
});

describe("Study page listing", () => {
  it("lists never-asked Topics first, then from the weakest to the strongest", async () => {
    const { study, topics } = await studyWithTopics(["Forte", "Fraco", "Novo"]);
    await play(study.id, 4, () => "right", [topics[0].id]);
    await play(study.id, 4, () => "wrong", [topics[1].id]);

    const listed = await ctx.engine.listTopicPerformance(study.id);

    expect(listed.map((t) => [t.name, t.performance, t.answers])).toEqual([
      ["Novo", null, 0],
      ["Fraco", 0, 4],
      ["Forte", 1, 4],
    ]);
  });

  it("rejects an unknown Study", async () => {
    await expect(ctx.engine.listTopicPerformance("00000000-0000-0000-0000-000000000000")).rejects.toMatchObject({
      code: "STUDY_NOT_FOUND",
    });
  });
});

describe("Weighted draw of the new Questions", () => {
  /** Topic 0 is strong (Desempenho 1), topic 1 is weak (0), topic 2 was never asked. */
  async function strongWeakNew() {
    const { study, topics } = await studyWithTopics(["Forte", "Fraco", "Novo"]);
    await play(study.id, 4, () => "right", [topics[0].id]);
    await play(study.id, 4, () => "wrong", [topics[1].id]);
    ctx.claude.calls.generateQuestions.length = 0;
    return { study, topics };
  }

  const askedCounts = () => {
    const counts: Record<string, number> = {};
    for (const call of ctx.claude.calls.generateQuestions) counts[call.topic.name] = (counts[call.topic.name] ?? 0) + call.count;
    return counts;
  };

  it("serves the never-asked Topics before anything is drawn", async () => {
    const { study } = await strongWeakNew();
    ctx.random.use(() => 0.999); // would favour the last Topic with weight anyway; the point is the Novo guarantee
    await ctx.engine.createRound(study.id, { count: 1 });
    await ctx.engine.drainJobs();
    expect(askedCounts()).toEqual({ Novo: 1 });
  });

  it("gives the never-asked Topics one Question each and draws the rest by weight", async () => {
    const { study, topics } = await studyWithTopics(["Forte", "Fraco", "Novo A", "Novo B"]);
    await play(study.id, 4, () => "right", [topics[0].id]);
    await play(study.id, 4, () => "wrong", [topics[1].id]);
    ctx.claude.calls.generateQuestions.length = 0;
    ctx.random.use(() => 0.3);

    await ctx.engine.createRound(study.id, { count: 5 });
    await ctx.engine.drainJobs();

    // Weights are Forte 0.1, Fraco 1, Novo 1, Novo 1: a draw of 0.3 (point 0.93 of 3.1) lands on Fraco.
    expect(askedCounts()).toEqual({ "Novo A": 1, "Novo B": 1, Fraco: 3 });
  });

  it("favours the weak Topics", async () => {
    const { study } = await strongWeakNew();
    ctx.random.use(() => 0.3);
    await ctx.engine.createRound(study.id, { count: 6 });
    await ctx.engine.drainJobs();
    // Novo takes one; Forte (0.1) is never reached by a draw of 0.3 against weights 0.1 / 1 / 1.
    expect(askedCounts()).toEqual({ Novo: 1, Fraco: 5 });
  });

  it("keeps a minimum weight for a strong Topic, so it still shows up", async () => {
    const { study } = await strongWeakNew();
    // 0 falls inside the first weight, which is Forte's. With a weight of zero it would be impossible to pick.
    ctx.random.use(() => 0);
    await ctx.engine.createRound(study.id, { count: 4 });
    await ctx.engine.drainJobs();
    expect(askedCounts().Forte).toBe(3);
  });

  it("restricts the draw to the chosen Topics", async () => {
    const { study, topics } = await strongWeakNew();
    ctx.random.use(sequence(0, 0.999));
    await ctx.engine.createRound(study.id, { count: 2, topicIds: [topics[0].id, topics[1].id] });
    await ctx.engine.drainJobs();
    expect(Object.keys(askedCounts()).sort()).toEqual(["Forte", "Fraco"]);
  });

  it("keeps the same plan when the generation is retried", async () => {
    const { study } = await strongWeakNew();
    let failed = false;
    let serial = 0;
    ctx.claude.whenGeneratingQuestions((request) => {
      if (!failed) {
        failed = true;
        throw ctx.claude.overloaded();
      }
      return { questions: Array.from({ length: request.count }, () => sampleQuestion(`${request.topic.name} ${++serial}`)) };
    });
    ctx.random.use(() => 0.3); // Novo 1, Fraco 2
    const round = await ctx.engine.createRound(study.id, { count: 3 });
    ctx.random.use(() => 0); // a redraw on retry would now favour Forte
    await ctx.engine.drainJobs();

    const topicsAsked: string[] = [];
    for (let next = await ctx.engine.getNextQuestion(round.id); next; next = await ctx.engine.getNextQuestion(round.id)) {
      topicsAsked.push(next.question.topic);
      await ctx.engine.answerQuestion(round.id, next.question.id, { choice: null });
    }
    expect(topicsAsked.sort()).toEqual(["Fraco", "Fraco", "Novo"]);
  });
});

describe("Dificuldade", () => {
  it("asks harder Questions for stronger Topics and keeps medium for the never-asked ones", async () => {
    const { study, topics } = await studyWithTopics(["Forte", "Médio", "Fraco", "Novo"]);
    await play(study.id, 4, () => "right", [topics[0].id]);
    await play(study.id, 4, () => "right", [topics[1].id]);
    await play(study.id, 4, () => "wrong", [topics[1].id]);
    await play(study.id, 4, () => "wrong", [topics[2].id]);
    ctx.claude.calls.generateQuestions.length = 0;
    // Weights Forte 0.1, Médio 0.5, Fraco 1 (Novo takes its own Question first): one draw lands on each.
    ctx.random.use(sequence(0, 0.1, 0.4));

    await ctx.engine.createRound(study.id, { count: 4 });
    await ctx.engine.drainJobs();

    const byTopic = new Map(ctx.claude.calls.generateQuestions.map((c) => [c.topic.name, c.difficulty]));
    expect(byTopic.get("Forte")).toBe("hard"); // Desempenho 1
    expect(byTopic.get("Médio")).toBe("medium"); // Desempenho 0.5
    expect(byTopic.get("Fraco")).toBe("easy"); // Desempenho 0
    expect(byTopic.get("Novo")).toBe("medium"); // never asked
  });
});
