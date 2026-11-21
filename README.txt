CARNIVAL CLASH - STAGE 4E: SHARED BOARD MOVEMENT

This is a movement-only online multiplayer test. The current local game remains separate.

1. Back up your existing carnival-clash folder.
2. In Supabase SQL Editor, run stage4e.sql once.
3. Copy lobby.html, lobby.js, lobby.css, board.html, board.css, board.js into your existing project.
4. KEEP your existing configured supabase-config.js. The ZIP includes a placeholder
   example; do not overwrite your working configured file unless you re-enter the values.
5. KEEP your existing index.html, style.css, game.js, and cards.js.
6. Upload the changed/new website files to GitHub and wait for GitHub Pages deployment.
7. Open lobby.html, create a NEW room, and join from a second browser/device.
8. Host clicks Start Game. Both browsers should navigate to board.html?room=XXXXXX.
9. Host clicks Initialize Board. Only the active player can Roll to Move.
10. Verify that pawn positions and turns update on both screens within ~1.5 seconds.

NOT YET IMPLEMENTED: attractions, cards, scoring, full round limits, winners.
A new room is required for each test because this version has no game reset.
Existing rooms that already started cannot accept new players.

SECURITY: The website must use only your Supabase publishable/anon key, NEVER
service-role or secret keys. Server functions validate membership and turns.
