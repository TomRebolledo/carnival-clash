CARNIVAL CLASH - STAGE 4C MULTIPLAYER LOBBY

1. Keep your existing index.html, style.css, game.js and cards.js unchanged.
2. Copy lobby.html, lobby.css, lobby.js, supabase-config.js into the same carnival-clash folder.
3. Edit supabase-config.js to insert your Supabase Project URL and publishable key.
   Never use a service_role key, secret key, or database password.
4. Confirm Anonymous Sign-Ins is enabled in Supabase Authentication settings.
5. Open Terminal in the carnival-clash folder and run:
       python3 -m http.server 8000
6. Open http://localhost:8000/lobby.html in your browser.
7. Create a room with a player name. Open an incognito/private browser window,
   visit the same URL, and join using the code with a different name.
8. Verify both names appear. As host, click Start Game.

IMPORTANT: Invitation links using localhost only work on your own computer.
To invite people on other computers, publish these files to a public HTTPS site
(e.g. GitHub Pages). We will do this before remote team testing.

This stage is ONLY a multiplayer lobby. Starting the game updates the shared
room status but does not launch synchronized board gameplay yet.

The lobby refreshes every 2.5 seconds. There is no leave-seat/remove-player
feature yet. Use a new room if you need to reset player membership.

Note: Supabase Anonymous Sign-Ins creates authenticated guest users.
Browser sessions are kept locally by Supabase's client library.
