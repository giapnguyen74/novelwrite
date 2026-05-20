import { Node, mergeAttributes, InputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { BeatAnchorNodeView } from "./beat-anchor-node-view";
import type { BeatType } from "@/types/beats";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    beatAnchor: {
      insertBeatAnchor: (attrs?: {
        beatType?: BeatType;
        description?: string;
        status?: "pending" | "drafted" | "done";
      }) => ReturnType;
    };
  }
}

export const BeatAnchorExtension = Node.create({
  name: "beatAnchor",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      id: {
        default: "",
      },
      beatType: {
        default: "guide",
      },
      description: {
        default: "",
      },
      status: {
        default: "pending",
      },
      wordCount: {
        default: 400,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "beat",
        getAttrs: (element) => {
          if (typeof element === "string") return {};
          const htmlEl = element as HTMLElement;
          return {
            id: htmlEl.getAttribute("id") || `beat_${Date.now().toString(36)}`,
            beatType: (htmlEl.getAttribute("type") as BeatType) || "guide",
            status: htmlEl.getAttribute("status") || "pending",
            wordCount: Number(htmlEl.getAttribute("length") || "400"),
            description: htmlEl.textContent?.trim() || "",
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "beat",
      mergeAttributes(
        {
          type: node.attrs.beatType,
          id: node.attrs.id,
          status: node.attrs.status,
          length: node.attrs.wordCount || 400,
        },
        HTMLAttributes
      ),
      node.attrs.description,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BeatAnchorNodeView);
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const type = node.attrs.beatType || "guide";
          const id = node.attrs.id || `beat_${Date.now().toString(36)}`;
          const status = node.attrs.status || "pending";
          const wordCount = node.attrs.wordCount || 400;
          const desc = node.attrs.description || "";
          state.write(`<beat type="${type}" id="${id}" status="${status}" length="${wordCount}">`);
          state.write(desc);
          state.write(`</beat>\n\n`);
        },
      },
    };
  },

  addCommands() {
    return {
      insertBeatAnchor:
        (attrs) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                id: `beat_${Date.now().toString(36)}`,
                beatType: "guide",
                description: "",
                status: "pending",
                wordCount: 400,
                ...attrs,
              },
            })
            .run();
        },
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\/beat\s$/,
        handler: ({ state, range }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          tr.delete(start, end);

          const node = this.type.create({
            id: `beat_${Date.now().toString(36)}`,
            beatType: "guide",
            description: "",
            status: "pending",
          });

          tr.replaceWith(start, start, node);
        },
      }),
      new InputRule({
        find: /\/b\s$/,
        handler: ({ state, range }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          tr.delete(start, end);

          const node = this.type.create({
            id: `beat_${Date.now().toString(36)}`,
            beatType: "guide",
            description: "",
            status: "pending",
          });

          tr.replaceWith(start, start, node);
        },
      }),
    ];
  },
});
