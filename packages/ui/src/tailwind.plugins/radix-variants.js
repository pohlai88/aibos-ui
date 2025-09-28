// packages/ui/src/tailwind.plugins/radix-variants.js
/* eslint-env node */
const plugin = require('tailwindcss/plugin');

module.exports = plugin(({ addVariant }) => {
  // Element state variants
  addVariant('state-open', '&[data-state="open"]');
  addVariant('state-closed', '&[data-state="closed"]');
  addVariant('state-checked', '&[data-state="checked"]');
  addVariant('state-unchecked', '&[data-state="unchecked"]');
  addVariant('state-active', '&[data-state="active"]');
  addVariant('state-disabled', '&[data-disabled]');
  addVariant('side-top', '&[data-side="top"]');
  addVariant('side-bottom', '&[data-side="bottom"]');
  addVariant('side-left', '&[data-side="left"]');
  addVariant('side-right', '&[data-side="right"]');

  // Toast swipe states
  addVariant('swipe-move', '&[data-swipe="move"]');
  addVariant('swipe-end', '&[data-swipe="end"]');
  addVariant('swipe-cancel', '&[data-swipe="cancel"]');

  // Group + destructive context (no arbitrary group selector)
  // .group.destructive .child  => 'group-destructive:*'
  addVariant('group-destructive', '.group.destructive &');
});
