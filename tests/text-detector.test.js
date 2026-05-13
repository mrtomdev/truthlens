/**
 * Plain-Node smoke tests for the text detector.
 * Run with:  node tests/text-detector.test.js
 *
 * These are not exhaustive — they're a tripwire so future edits don't
 * silently break the scoring direction.
 */

import { analyzeText } from "../detectors/text-detector.js";

const HUMAN_SAMPLE = `
I almost missed my train. There was a woman on the platform with a parrot
on her shoulder — actual parrot, green, talking. She said its name was Bruce.
Bruce did not look like a Bruce. Anyway, I got on, found a seat, and spent the
whole ride wondering whether she'd named the parrot or whether the parrot had,
in some uncanny avian way, named itself. The conductor punched my ticket.
He didn't ask about Bruce. I think about Bruce a lot, actually.
`;

const LLM_SAMPLE = `
In the ever-evolving landscape of modern technology, it is important to note
that artificial intelligence plays a crucial role in shaping our future.
Furthermore, the rich tapestry of innovations available today allows us to
delve into a multifaceted understanding of these complex systems. Moreover,
navigating the complexities of digital transformation requires a holistic
approach. Additionally, it is worth mentioning that organizations must
embark on a journey to unlock the potential of cutting-edge solutions.
In conclusion, fostering a culture of innovation is a testament to our
commitment to progress.
`;

let passed = 0;
let failed = 0;

function assert(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ok  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name} ${detail}`);
  }
}

console.log("text-detector smoke tests");

const tooShort = analyzeText("Hi there.");
assert("rejects too-short input", tooShort.verdict === "insufficient");

const human = analyzeText(HUMAN_SAMPLE);
const llm = analyzeText(LLM_SAMPLE);

console.log(`  human score: ${human.score}  verdict: ${human.verdict}`);
console.log(`  llm   score: ${llm.score}  verdict: ${llm.verdict}`);

assert(
  "LLM-style sample scores higher than human-style sample",
  llm.score > human.score,
  `(llm=${llm.score}, human=${human.score})`
);

assert(
  "LLM-style sample is flagged (likely-ai or possibly-ai)",
  llm.verdict === "likely-ai" || llm.verdict === "possibly-ai",
  `(got ${llm.verdict})`
);

assert(
  "Human-style sample is not flagged as likely-ai",
  human.verdict !== "likely-ai",
  `(got ${human.verdict})`
);

assert(
  "phrase fingerprint signal fires on heavy LLM text",
  llm.signals.phraseFingerprint >= 0.7,
  `(got ${llm.signals.phraseFingerprint})`
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
