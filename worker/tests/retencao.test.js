import test from "node:test";
import assert from "node:assert/strict";
import { purgeOldData } from "../src/agendado.js";

test("purges contact messages and chat feedback older than 30 days", async () => {
  const statements = [];
  const env = {
    DB: {
      prepare(sql) {
        return { sql };
      },
      async batch(queries) {
        statements.push(...queries.map(({ sql }) => sql));
        return [{ meta: { changes: 0 } }, { meta: { changes: 0 } }];
      },
    },
  };

  await purgeOldData(env);

  assert.deepEqual(statements, [
    "DELETE FROM messages WHERE created_at < datetime('now', '-30 days')",
    "DELETE FROM feedback WHERE created_at < datetime('now', '-30 days')",
  ]);
});
