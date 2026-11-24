// Everyday Things, Two Lines — make.fun entry
//
// The program writes one two-line explanation to /output/entry.txt:
// line 1 explains a queue to a 10-year-old through one vivid analogy,
// line 2 says what that analogy maps and what it leaves out.
//
// The text is fixed and deterministic: every run writes the same bytes.
// The gate allows 1 to 400 characters; this entry holds 324.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname } from "node:path";

const DEFAULT_OUTPUT_PATH = "/output/entry.txt";
const MAX_CHARACTERS = 400;
const EXPECTED_LINES = 2;

// The everyday thing this entry explains.
const EVERYDAY_THING = "queue";

// Line 1: one vivid sentence, one analogy only — a queue as a caterpillar
// made of people. A 10-year-old can see a caterpillar, can stand in a
// queue, and can feel the small shuffle forward. No second metaphor
// crowds the picture, and nothing in the line is a list.
const LINE_ONE_PARTS = [
  "A queue is a caterpillar made of people,",
  "shuffling forward one small step at a time",
  "until it reaches the front.",
];

// Line 2: the honest accounting. It names what the caterpillar picture
// covers (the slow single-file shuffle, waiting your turn) and what it
// leaves out (people can leave the line or choose a shorter one, while a
// real caterpillar just keeps crawling and never chooses). It explains the
// first line instead of repeating it, and never praises the analogy.
const LINE_TWO_PARTS = [
  "It maps the slow single-file shuffle and waiting your turn,",
  "but it leaves out that people can step out of line or pick a shorter one,",
  "while a real caterpillar just keeps crawling and never chooses where it goes.",
];

function joinSentence(parts: string[]): string {
  const joined = parts.join(" ");
  const collapsed = joined.replace(/\s+/g, " ").trim();
  return collapsed;
}

function buildEntryText(): string {
  const lineOne = joinSentence(LINE_ONE_PARTS);
  const lineTwo = joinSentence(LINE_TWO_PARTS);
  const entryText = lineOne + "\n" + lineTwo + "\n";
  return entryText;
}

function countCharacters(text: string): number {
  const counted = [...text].length;
  return counted;
}

function splitLines(text: string): string[] {
  const trimmed = text.replace(/\n$/, "");
  const lines = trimmed.split("\n");
  return lines;
}

function isSentenceMark(character: string): boolean {
  const mark = character === "." || character === "!" || character === "?";
  return mark;
}

function singleSentence(line: string): boolean {
  const trimmedLine = line.trim();
  const endsWithPeriod = trimmedLine.endsWith(".");
  const sentenceMarks = trimmedLine.split("").filter(isSentenceMark);
  const oneMark = sentenceMarks.length === 1;
  const verdict = endsWithPeriod && oneMark;
  return verdict;
}

function namesEverydayThing(text: string): boolean {
  const lowered = text.toLowerCase();
  const found = lowered.includes(EVERYDAY_THING);
  return found;
}

function secondLineIsHonest(line: string): boolean {
  const lowered = line.toLowerCase();
  const mapsSomething = lowered.includes("maps");
  const namesLimit = lowered.includes("leaves out");
  const verdict = mapsSomething && namesLimit;
  return verdict;
}

function validateEntryText(text: string): string[] {
  const problems: string[] = [];
  const characters = countCharacters(text);
  const nonWhitespace = text.trim().length > 0;
  const lines = splitLines(text);
  const lineCountMatches = lines.length === EXPECTED_LINES;
  const withinLimit = characters >= 1 && characters <= MAX_CHARACTERS;
  const firstLineSingle = lines.length > 0 ? singleSentence(lines[0]) : false;
  const secondLineSingle = lines.length > 1 ? singleSentence(lines[1]) : false;
  const mentionsThing = namesEverydayThing(text);
  const honestSecond = lines.length > 1 ? secondLineIsHonest(lines[1]) : false;
  const checks: Array<[boolean, string]> = [
    [nonWhitespace, "entry text is only white space"],
    [lineCountMatches, "entry text must hold exactly two lines"],
    [withinLimit, "entry text must hold 1 to 400 characters"],
    [firstLineSingle, "line 1 must be a single sentence"],
    [secondLineSingle, "line 2 must be a single sentence"],
    [mentionsThing, "line 1 must name the everyday thing it explains"],
    [honestSecond, "line 2 must name what the analogy maps and what it leaves out"],
  ];
  for (const check of checks) {
    const passed = check[0];
    const message = check[1];
    if (passed === false) {
      problems.push(message);
    }
  }
  return problems;
}

function sha256Hex(bytes: Buffer): string {
  const digest = createHash("sha256").update(bytes).digest("hex");
  return digest;
}

function resolveOutputPath(): string {
  const override = process.env.ENTRY_OUTPUT_PATH;
  const hasOverride = typeof override === "string" && override.length > 0;
  const resolved = hasOverride ? (override as string) : DEFAULT_OUTPUT_PATH;
  return resolved;
}

function writeEntry(outputPath: string, text: string): void {
  const directory = dirname(outputPath);
  mkdirSync(directory, { recursive: true });
  writeFileSync(outputPath, text, "utf8");
  const written = readFileSync(outputPath);
  const expected = Buffer.from(text, "utf8");
  const matches = written.equals(expected);
  if (matches === false) {
    throw new Error("read-back mismatch: /output/entry.txt differs from the built text");
  }
  const digest = sha256Hex(written);
  const characters = countCharacters(text);
  const lines = splitLines(text);
  console.log("wrote " + outputPath);
  console.log("lines: " + lines.length);
  console.log("characters: " + characters);
  console.log("sha256: " + digest);
}

function main(): void {
  const entryText = buildEntryText();
  const problems = validateEntryText(entryText);
  const hasProblems = problems.length > 0;
  if (hasProblems) {
    const joinedProblems = problems.join("; ");
    throw new Error("entry text failed validation: " + joinedProblems);
  }
  const outputPath = resolveOutputPath();
  writeEntry(outputPath, entryText);
}

try {
  main();
} catch (caughtError) {
  const message = caughtError instanceof Error ? caughtError.message : String(caughtError);
  console.error("failed: " + message);
  process.exit(1);
}
