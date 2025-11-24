import { Extension } from '@tiptap/core'

export const BetterSpace = Extension.create({
  name: 'betterSpace',

  addKeyboardShortcuts() {
    return {
      'Space': ({ editor }) => {
        const { state, view } = editor
        const { selection } = state
        const { $from } = selection

        const prevChar = $from.nodeBefore?.text?.slice(-1)

        if (prevChar === ' ') {
          view.dispatch(view.state.tr.insertText('\u00A0'))
          return true
        } 
        return false 
      },
    }
  },
})
