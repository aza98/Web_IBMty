# Events and ministries carousels

Mode: Operate. Targets: `index.html`, `pages/about.html`.

Preserve the shared slide cards, native horizontal scrolling and month timeline.
Center previous / position / next controls below both carousels at every width. Keep keyboard access.
Both tracks snap the active card to the center, including the first and last cards.
The active card and indicators follow scrolling without a settle debounce.
Mobile and installed mode show a card with horizontal arrows beside “Desliza para ver más”; hide it on interaction,
then restore it after 12 idle seconds without shifting layout. Keep English overlay
and reduced-motion behavior. Implementation contract: [DESIGN.md](../../DESIGN.md).
