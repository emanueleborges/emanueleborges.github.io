import test from "node:test";
import assert from "node:assert/strict";
import { purgeOldData } from "../src/agendado.js";

test("purges daily chat-rating, regional, score, click and image aggregates", async () => {
  const statements = [];
  const env = {
    DB: {
      prepare(sql) {
        return { sql };
      },
      async batch(queries) {
        statements.push(...queries.map(({ sql }) => sql));
        return queries.map(() => ({ meta: { changes: 0 } }));
      },
    },
  };

  await purgeOldData(env);

  assert.deepEqual(statements, [
    "DELETE FROM feedback_daily WHERE feedback_date <= date('now', '-29 days')",
    "DELETE FROM regional_visits WHERE access_date <= date('now', '-29 days')",
    "DELETE FROM score_daily WHERE score_date <= date('now', '-29 days')",
    "DELETE FROM click_daily WHERE click_date <= date('now', '-29 days')",
    "DELETE FROM image_daily WHERE image_date <= date('now', '-29 days')",
  ]);
});
