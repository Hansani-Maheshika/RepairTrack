interface SequenceClient {
  codeSequence: {
    upsert(args: {
      where: { key: string };
      create: { key: string; value: number };
      update: { value: { increment: number } };
      select: { value: true };
    }): Promise<{ value: number }>;
  };
}

export async function nextCode(
  client: SequenceClient,
  key: string,
  prefix: string,
  minimumDigits = 4,
): Promise<string> {
  const sequence = await client.codeSequence.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
    select: { value: true },
  });
  return `${prefix}${String(sequence.value).padStart(minimumDigits, "0")}`;
}
