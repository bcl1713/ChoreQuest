import { FAMILY_EVALUATOR_REGISTRY } from "./family-evaluators";

function makeQueryChain() {
  const eqCalls: [string, unknown][] = [];
  // A thenable chain so the whole builder can be awaited at any point
  const chain: Record<string, unknown> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockImplementation((col: string, val: unknown) => {
    eqCalls.push([col, val]);
    return chain;
  });
  chain.or = jest.fn().mockResolvedValue({ count: 7, error: null });
  chain.then = (
    resolve: (v: { count: number; error: null }) => unknown,
    reject: (e: unknown) => unknown,
  ) => Promise.resolve({ count: 7, error: null }).then(resolve, reject);

  return {
    chain,
    eqCalls,
    client: { from: jest.fn().mockReturnValue(chain) },
  };
}

const memberPairs = [{ userId: "u-1", characterIds: [] }];
const config = { threshold: 5 };

describe("evaluateQuestDifficulty — uses configured difficulty", () => {
  const evaluator = FAMILY_EVALUATOR_REGISTRY.quest_difficulty;

  it("filters by HARD when no difficulty is configured (default)", async () => {
    const { eqCalls, client } = makeQueryChain();

    await evaluator(
      client as never,
      "fam-1",
      [],
      [],
      [],
      "sum",
      memberPairs,
      config,
    );

    expect(eqCalls).toContainEqual(["difficulty", "HARD"]);
  });

  it("filters by EASY when configured difficulty is EASY", async () => {
    const { eqCalls, client } = makeQueryChain();

    await evaluator(client as never, "fam-1", [], [], [], "sum", memberPairs, {
      ...config,
      difficulty: "EASY",
    });

    expect(eqCalls).toContainEqual(["difficulty", "EASY"]);
    expect(eqCalls).not.toContainEqual(["difficulty", "HARD"]);
  });

  it("filters by MEDIUM when configured difficulty is MEDIUM", async () => {
    const { eqCalls, client } = makeQueryChain();

    await evaluator(client as never, "fam-1", [], [], [], "sum", memberPairs, {
      ...config,
      difficulty: "MEDIUM",
    });

    expect(eqCalls).toContainEqual(["difficulty", "MEDIUM"]);
    expect(eqCalls).not.toContainEqual(["difficulty", "HARD"]);
  });
});
