export type UserIntent =
  | "general_question"
  | "project_question"
  | "coding"
  | "prompt_generation"
  | "research";

export type TaskType =
  | "bug_fix"
  | "feature"
  | "ui_change"
  | "refactor"
  | "explanation"
  | "research"
  | "other";

export type IntentResult = {
  intent: UserIntent;
  taskType: TaskType;
  projectRelated: boolean;
  needsContext: boolean;
};

const projectPatterns = [
  /\bmy project\b/i,
  /\bthis project\b/i,
  /\bour project\b/i,
  /\bthe project\b/i,
  /\bin my app\b/i,
  /\bin this app\b/i,
  /\bin my application\b/i,
  /\bin this application\b/i,
  /\bmy code\b/i,
  /\bthis code\b/i,
  /\bmy website\b/i,
  /\bthis website\b/i,
  /\bmy application\b/i,
];

const promptPatterns = [
  /\bmake (a|an) prompt\b/i,
  /\bgenerate (a|an) prompt\b/i,
  /\bcreate (a|an) prompt\b/i,
  /\bwrite (a|an) prompt\b/i,
  /\bprompt for\b/i,
  /\bprompt to\b/i,
];

const codingPatterns = [
  /\bwrite code\b/i,
  /\bwrite the code\b/i,
  /\bimplement\b/i,
  /\bbuild\b/i,
  /\bfix\b/i,
  /\bdebug\b/i,
  /\bcode\b/i,
  /\bfunction\b/i,
  /\bcomponent\b/i,
  /\bapi\b/i,
  /\bdatabase\b/i,
  /\bsql\b/i,
  /\breact\b/i,
  /\bnext\.?js\b/i,
  /\bjavascript\b/i,
  /\btypescript\b/i,
];

const researchPatterns = [
  /\bcompare\b/i,
  /\bresearch\b/i,
  /\blatest\b/i,
  /\bcurrent\b/i,
  /\baccording to\b/i,
  /\bwhat are the latest\b/i,
];

function matchesAny(
  text: string,
  patterns: RegExp[]
) {
  return patterns.some((pattern) => pattern.test(text));
}

export function analyzeIntentFast(
  request: string
): IntentResult | null {
  const text = request.trim();

  if (!text) {
    return null;
  }

  const projectRelated = matchesAny(
    text,
    projectPatterns
  );

  if (matchesAny(text, promptPatterns)) {
    return {
      intent: "prompt_generation",
      taskType: "other",
      projectRelated,
      needsContext: projectRelated,
    };
  }

  if (projectRelated) {
    if (/\bfix\b|\bbug\b|\berror\b|\bbroken\b/i.test(text)) {
      return {
        intent: "coding",
        taskType: "bug_fix",
        projectRelated: true,
        needsContext: true,
      };
    }

    if (/\bui\b|\bdesign\b|\blayout\b|\bstyle\b/i.test(text)) {
      return {
        intent: "coding",
        taskType: "ui_change",
        projectRelated: true,
        needsContext: true,
      };
    }

    if (/\brefactor\b|\bclean up\b|\bcleanup\b/i.test(text)) {
      return {
        intent: "coding",
        taskType: "refactor",
        projectRelated: true,
        needsContext: true,
      };
    }

    if (
      matchesAny(text, codingPatterns) ||
      /\badd\b|\bcreate\b|\bimplement\b/i.test(text)
    ) {
      return {
        intent: "coding",
        taskType: "feature",
        projectRelated: true,
        needsContext: true,
      };
    }

    return {
      intent: "project_question",
      taskType: "explanation",
      projectRelated: true,
      needsContext: true,
    };
  }

  if (matchesAny(text, researchPatterns)) {
    return {
      intent: "research",
      taskType: "research",
      projectRelated: false,
      needsContext: false,
    };
  }

  if (matchesAny(text, codingPatterns)) {
    return {
      intent: "coding",
      taskType: "explanation",
      projectRelated: false,
      needsContext: false,
    };
  }

  return {
    intent: "general_question",
    taskType: "other",
    projectRelated: false,
    needsContext: false,
  };
}