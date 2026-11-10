# Kaushik Formula + GT 3D prototype

A browser-based 3D Formula / GT racing prototype with car setup, AI opponents, rain, sector timing, and room-based multiplayer.

## Run locally

1. Install Node.js (LTS).
2. Extract this folder.
3. Open a terminal in this folder.
4. Run `npm install`.
5. Run `npm run import:tracks` (optional; downloads supported centreline data when available).
6. Run `npm start`.
7. Open `http://localhost:3000`.

## Deploy to Vercel

The Vercel deployment is a static build for solo and AI play. Vercel does not keep this app's Socket.IO server running, so multiplayer requires a separate persistent Node host.

1. Push the repository to GitHub and import it in Vercel.
2. Set the project root to `apex_formula_gt_3d` if this repository contains other apps.
3. Select **Other** as the framework preset, leave the build command empty, and set the output directory to `public`.
4. Deploy. The game detects the static Vercel host and keeps multiplayer offline while solo and AI sessions remain playable.

For multiplayer, deploy `server.js` to a persistent Node service such as Railway or Render. Open the Vercel game with `?socket=https%3A%2F%2FYOUR-NODE-SERVER` appended to its URL. The socket URL must be publicly reachable by every player.

## Multiplayer

- Both players must open the **same server address**, choose the same circuit, and enter the same room code.
- If both people run `localhost` on separate computers, they are connecting to two different servers and will not see one another. Host this Node app on a public server and share that public URL with the other player.
- Players are assigned separate starting grid positions so their cars do not spawn directly on top of each other. Their cars and name labels are synchronised while driving.
- The server keeps room state in memory; restarting the server clears rooms.

## Deploy to Vercel

Vercel can host the static game for solo and AI races. It does not host this app's persistent Socket.IO server, so multiplayer needs a separate Node host.

1. Push the repository to GitHub and import it into Vercel.
2. Set the project root to `apex_formula_gt_3d` if the repository contains other folders.
3. Choose **Other** as the framework preset, leave the build command empty, and set the output directory to `public`.
4. Deploy. The Vercel build supports solo qualifying and AI races; the multiplayer client safely stays offline.

For multiplayer, deploy `server.js` to a persistent Node service such as Railway or Render. Open the Vercel game with `?socket=https%3A%2F%2FYOUR-NODE-SERVER` appended to its URL. Keep the Node service running and use that same URL for every player.

## Race controls

- W / Up: accelerate
- S / Down: brake
- A / Left and D / Right: steer
- C: change camera
- P: pause / resume
- R: restart race
- Space: pit stop
- Esc: return to menu

## Race distance

Choose 1, 3, 5, or 10 laps before starting. The race ends when the selected lap count is completed.

## Current limitations

This remains a prototype: the circuits and vehicle physics are simplified, multiplayer is server-authoritative only for room membership (not full physics validation), and remote multiplayer requires hosting the server on a reachable public address. Imported circuit centreline data is not a laser-scanned track surface.
