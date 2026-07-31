import { nextCode } from "./codeSequence.js";

export async function generateRepairNumber(
  client: Parameters<typeof nextCode>[0],
): Promise<string> {
  const year = new Date().getUTCFullYear();
  return nextCode(client, `repair-${year}`, `REP-${year}-`);
}
