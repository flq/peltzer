import { insertBracket, type Completion, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";
import { SOURCE_STEPS, STEPS, type StepInfo } from "./gremlinSteps";

const NO_COMPLETION_INSIDE = new Set(["String", "LineComment"]);

/**
 * Completes Gremlin step names after a "." and at the start of an argument
 * (anonymous traversals like where(out(...))). onParenOpened is called when the
 * cursor is left between fresh parens, so the dot-after-( rule applies there too.
 */
export function gremlinStepCompletion(onParenOpened?: () => void) {
  const sourceOptions = SOURCE_STEPS.map((step) => toCompletion(step, onParenOpened));
  const stepOptions = STEPS.map((step) => toCompletion(step, onParenOpened));

  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[\w$]*/)!;
    if (NO_COMPLETION_INSIDE.has(syntaxTree(context.state).resolveInner(context.pos, -1).name)) return null;

    const options = optionsFor(context, word.from, word.text, sourceOptions, stepOptions);
    return options && { from: word.from, options, validFor: /^[\w$]*$/ };
  };
}

function optionsFor(
  context: CompletionContext,
  wordFrom: number,
  wordText: string,
  sourceOptions: Completion[],
  stepOptions: Completion[]
): Completion[] | null {
  const before = context.state.sliceDoc(Math.max(0, wordFrom - 200), wordFrom);

  if (before.endsWith(".")) {
    const receiver = /([\w$]+|\))\s*\.$/.exec(before)?.[1];
    if (receiver === "g") return sourceOptions;
    // T.label, P.gt, Order.desc: enum and class members, not steps.
    // A digit means a decimal number like 0.5
    if (receiver && /^[A-Z0-9]/.test(receiver)) return null;
    return stepOptions;
  }

  // Start of an argument, e.g. where(ou — only once something is typed, so
  // opening "(" for a plain value doesn't pop up a list
  if ((wordText || context.explicit) && /[(,]\s*$/.test(before)) return stepOptions;

  return null;
}

function toCompletion(step: StepInfo, onParenOpened?: () => void): Completion {
  return {
    label: step.name,
    detail: step.description,
    type: "function",
    apply: (view, _completion, from, to) => applyStep(view, step, from, to, onParenOpened),
  };
}

function applyStep(view: EditorView, step: StepInfo, from: number, to: number, onParenOpened?: () => void) {
  view.dispatch({
    changes: { from, to, insert: step.name },
    selection: { anchor: from + step.name.length },
    userEvent: "input.complete",
  });

  // Renaming a step that already has its arguments
  const end = from + step.name.length;
  if (view.state.sliceDoc(end, end + 1) === "(") return;

  // Going through closeBrackets lets a typed ")" step over the inserted one
  const parens = insertBracket(view.state, "(") ?? view.state.update({
    changes: { from: end, insert: "()" },
    selection: { anchor: end + 1 },
    userEvent: "input.type",
  });
  view.dispatch(parens);

  if (step.args === "none") {
    view.dispatch({ selection: { anchor: end + 2 } });
  } else {
    onParenOpened?.();
  }
}
