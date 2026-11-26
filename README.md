# Free World multiplayer server (Phase 2)

1. `npm install`
2. `npm test` (optional, runs without a network)
3. `npm start` (listens on `$PORT`, default 2567)

Host it anywhere that runs Node 18+ and supports WebSockets (Colyseus Cloud, Render, Railway, Fly.io). Use the `wss://` address.

In the browser, either set `var FW_SERVER = "wss://your-server"` near the top of `freeworld.js`, or test with
`localStorage.wb_fw_server = "ws://localhost:2567"` in the console and re-enter Free World.

Player names: if `SUPABASE_URL` and `SUPABASE_KEY` (your public anon key) are set as environment variables on the server, players who are signed in to Wrestling Buzz join as verified accounts. They get a check mark next to their name and only one session per account at a time. Everyone else joins as a guest. Duplicate names get a number added.

`fw-core.js` here must match the one on your site (`npm run sync` copies it from the parent folder).
