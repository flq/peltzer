import { LRLanguage, LanguageSupport } from "@codemirror/language";
import { styleTags, tags } from "@lezer/highlight";
import { parser } from "./gremlin.grammar";

export const gremlinLanguage = LRLanguage.define({
  name: "gremlin",
  parser: parser.configure({
    props: [
      styleTags({
        String: tags.string,
        Number: tags.number,
        Boolean: tags.bool,
        Null: tags.null,
      }),
    ],
  }),
  languageData: {
    // Gremlin rarely needs [ or ' pairs, so only pair what we actually type a lot
    closeBrackets: { brackets: ["(", '"'] },
    commentTokens: { line: "//" },
  },
});

export function gremlin() {
  return new LanguageSupport(gremlinLanguage);
}
