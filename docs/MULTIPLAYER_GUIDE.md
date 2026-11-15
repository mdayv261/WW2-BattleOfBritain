# Multiplayer: a guide for players

Battle of Britain 1940 lets 2-4 people fly fighters against each other, RAF against the Luftwaffe, in a private room
joined with a code. You need Chrome or Firefox on a computer. There are no accounts and nothing to install.

## Where to play
- **The live site:** https://mdayv261.github.io/WW2-BattleOfBritain/ (connected to the server on 15 Nov 2026, D246).
- **The test copy:** https://bob1940-mp.dawn-patrol-mp-server.workers.dev/. It's the whole game, served by the
  multiplayer server itself. Both use the same server, so a room's code works from either.

It's simplest if everyone uses the live site. If the two ever differ in version, the game asks the older page to reload.

## Making a room and joining it
1. **One person (the host)** clicks **Multiplayer**, types a name, and clicks **Create a room**. The room's
   six-character code appears at the top. **Copy the code** and send it to the others.
2. **Everyone else** clicks **Multiplayer**, types a name and the code, and clicks **Join the room**.
3. **In the room,** each player picks a **side** (RAF or Luftwaffe) and a **fighter**, then clicks **I am ready**:
   - RAF: Hurricane Mk I or Spitfire Mk I;
   - Luftwaffe: Bf 109 E-4 or Bf 110 C-4.
4. **The host** chooses the match settings (where you start, where you come back, the time of day, the score and time
   limits, friendly fire, structural damage), then clicks **Start the match**.

## In the match
- **The score line** at the top shows the score, the time left and the score to win.
- **Names** float over the other aircraft within 2 km: white for your side, red for the enemy, with the distance.
- **Being shot down:** the last enemy to hit you in the last 15 s gets the kill. You are back in the air 10 s later.
- **Bailing out:** hold **Backspace** for 1 second. The crew jump and the parachute opens.
- **The Bf 110:** **Tab** swaps you between the pilot's seat and the rear gun. An AI flies while you are on the gun, and
  an AI mans the gun while you fly. Nothing else in a match is flown by the computer.
- **Esc** opens the match menu: Resume, Settings, End the match (host only) and Leave the room. **The match doesn't
  pause.**
- **Reloading the page** (or a dropped connection) puts you back in the room within 60 s, in a fresh aircraft. If the
  host reloads, the host role passes to another player.
- **The end:** the results show the winner and each pilot's kills, times down and hits. Everyone is back in the room
  after 20 s.

## The F3 numbers
**F3** opens a panel of numbers. In a match its last two lines start with `net`:
- **`ping`:** how long a message takes to reach the server and come back. The game is built for up to 150 ms. Most
  homes get 20-80 ms.
- **`corrections`:** how often your own aircraft was nudged to match the server, and the size of the last nudge. A few
  small ones are normal. One at the very start is normal too. A nudge of several metres while flying steadily is
  worth reporting.
- **`others ... ms behind`:** the other aircraft are drawn this far in the past (about 100-200 ms), so they move
  smoothly.

## Testing with family on different home networks
This checks the real thing: different houses, different internet.

1. **Agree a time.** The organiser creates a room on the live site and sends everyone the address and the code.
2. **Everyone joins,** picks a side and a fighter, and clicks **I am ready**. The organiser starts the match.
3. **Fly together for 5-10 minutes:**
   - fly towards each other and have a fight;
   - get shot down and come back;
   - try a bail-out;
   - if someone has a Bf 110, try Tab to the rear gun.
4. **Press F3 now and then** and note the `net` lines.
5. **Report back to the organiser:**
   - your ping, the largest correction you saw, and your kind of internet (broadband, Wi-Fi far from the router, a
     phone hotspot);
   - whether the other aircraft moved smoothly or jumped;
   - whether your hits counted when your sight was on the target;
   - anything that went wrong, and what you were doing at the time.
6. **If someone can't join:**
   - check the code (it never uses I, O, 0 or 1);
   - ask them to reload the page (an old copy is asked to reload anyway);
   - very strict work or school networks can block the game's connection. A home network or a phone hotspot should
     work.

## Good to know
- **Don't update the server during a game.** A new deployment ends every room that's open.
- **The server is on Cloudflare's free plan,** shared with Dawn Patrol's. It allows about 4½ hours of four-player
  flying a day in all, which resets at midnight UTC (midnight UK time in winter, 01:00 in summer). Beyond that, rooms fail with an error until the reset. Nothing is
  ever charged.
- **Privacy:** there are no accounts. Your name is kept only in the room's memory while it's open. The server keeps no
  logs.
