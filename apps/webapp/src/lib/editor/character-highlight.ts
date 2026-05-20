import { Node } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { CharacterIndex } from "./character-index";

export const characterHighlightKey = new PluginKey("characterHighlight");

export function buildDecorations(doc: Node, index: CharacterIndex | null): DecorationSet {
  const decorations: Decoration[] = [];
  if (!index || !index.regex) {
    return DecorationSet.empty;
  }
  const regexVal = index.regex;

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const text = node.text;
      const regex = new RegExp(regexVal.source, regexVal.flags);
      let match;

      while ((match = regex.exec(text)) !== null) {
        const from = pos + match.index;
        const to = from + match[0].length;
        const matchedText = match[0].toLowerCase();

        const charInfo = index.lookup.get(matchedText);
        if (charInfo) {
          decorations.push(
            Decoration.inline(
              from,
              to,
              {
                class: "character-mark",
                "data-char-name": charInfo.canonicalName,
                title: `${charInfo.canonicalName} · Click to view in Story Bible`,
              },
              {
                charName: charInfo.canonicalName,
              }
            )
          );
        }
      }
    }
    return true;
  });

  return DecorationSet.create(doc, decorations);
}

export function characterHighlightPlugin(
  getIndex: () => CharacterIndex | null,
  getEnabled: () => boolean
) {
  return new Plugin({
    key: characterHighlightKey,
    state: {
      init: (_, state) => {
        if (!getEnabled()) return DecorationSet.empty;
        return buildDecorations(state.doc, getIndex());
      },
      apply(tr, oldSet, _oldState, newState) {
        if (!getEnabled()) return DecorationSet.empty;
        if (!tr.docChanged && !tr.getMeta(characterHighlightKey)) {
          return oldSet.map(tr.mapping, tr.doc);
        }
        return buildDecorations(newState.doc, getIndex());
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
      handleClickOn(view, pos, _node, _nodePos, event) {
        if (!getEnabled()) return false;
        const state = characterHighlightKey.getState(view.state);
        if (!state) return false;
        
        const deco = state.find(pos, pos)[0];
        if (!deco) return false;
        
        const charName = (deco.spec as { charName?: string }).charName;
        if (!charName) return false;

        // Dispatch a custom event to notify the application layer to jump to character
        window.dispatchEvent(
          new CustomEvent("novelwrite:openCharacter", { detail: { charName } })
        );
        event.preventDefault();
        return true;
      },
    },
  });
}
