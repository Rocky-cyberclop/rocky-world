# Rocky's World

My portfolio as a pixel-art game world. Phase 1: the landing scene, a 1:1 interview in a manager's office.

## Stack
Vite + TypeScript + Phaser 4. Static site. Docker optional.

## Structure
```
content/scenes/       room layouts as data (what goes where)
public/assets/limezu/ LimeZu sprite sheets (see README there)
src/config.ts         tile size, asset paths
src/scenes/           Boot (loading) → InterviewRoom
src/world/            RoomRenderer: builds a room from a scene JSON
```

## Run
- With Docker: `docker compose up dev` → http://localhost:5173
- With Node 22+: `npm install` then `npm run dev`
- Production check: `docker compose --profile prod up --build web` → http://localhost:8080

## Controls
- Click / any key on the start screen (this also unlocks sound).
- Intro plays (about 5 s, cannot be skipped; controls unlock when it ends).
- WASD or arrow keys move the interviewer. Top-right button mutes sound.
- Add `?debug` to the URL to see collision boxes.

## Intro cutscene
Edit `content/cutscenes/intro.json`: `speech.lines` (one entry per sentence; the bubble's Next button
shows the next one, OK closes it; Enter = Next, Esc = OK), typing speed (`charsPerSecond`), fade timings,
`blipEvery` (2 = blip every 2nd letter). Typing sound: `public/assets/sfx/blip.wav`
(if missing, a beep is generated in code).

## Editing the room
Move furniture by changing `x` / `y` in `content/scenes/interview-room.json` (pixels, 16 px = 1 tile).
Order in `objects` = drawing order (first = back, last = front).
