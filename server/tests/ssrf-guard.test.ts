import assert from "node:assert/strict";
import test from "node:test";
import { safeDnsLookup } from "../src/lib/ssrf-guard.js";

test("safeDnsLookup returns validated records for all:true callers", async () => {
  const result = await new Promise<unknown>((resolve, reject) => {
    safeDnsLookup("8.8.8.8", { all: true }, (error, address) => {
      if (error) reject(error);
      else resolve(address);
    });
  });

  assert.deepEqual(result, [{ address: "8.8.8.8", family: 4 }]);
});

test("safeDnsLookup returns a scalar address for ordinary callers", async () => {
  const result = await new Promise<{ address: string | object; family?: number }>((resolve, reject) => {
    safeDnsLookup("8.8.8.8", {}, (error, address, family) => {
      if (error) reject(error);
      else resolve({ address: address as string | object, family });
    });
  });

  assert.deepEqual(result, { address: "8.8.8.8", family: 4 });
});

test("safeDnsLookup rejects private addresses for all:true callers", async () => {
  const result = await new Promise<{ error: NodeJS.ErrnoException | null; address: unknown }>((resolve) => {
    safeDnsLookup("127.0.0.1", { all: true }, (error, address) => resolve({ error, address }));
  });

  assert.match(result.error?.message ?? "", /private\/internal address/);
  assert.deepEqual(result.address, []);
});
