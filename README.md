# The Tuesday Globe

[![Competition](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/bounty/news-image-20261124)
[![Rank](https://make.fun/badge/news-image-20261124/lerrboyy/news-image-20261124/rank.svg)](https://make.fun/bounty/news-image-20261124)
[![Reward](https://make.fun/badge/news-image-20261124/lerrboyy/news-image-20261124/reward.svg)](https://make.fun/bounty/news-image-20261124)

A single-page broadsheet front page for **Tuesday 24 November 2026**, drawn
entirely in code. No photographs, no downloaded art, no fonts from disk —
every letter comes from a hand-written 5×7 bitmap font and every picture
element (chip, jet, shield, plane, missile, globe, scales) is built from
rectangles, circles, lines and polygons.

## The front page

The masthead carries the date twice: huge in red under the title
**THE TUESDAY GLOBE**, and again in the footer. Below it, a full-width
banner lead tells the day's biggest story — **THE COMEBACK**: Jensen Huang
returns as Nvidia chief (reinstated Monday after President Trump pressed
the board), hours later the US blacklists Megaspeed, the firm at the heart
of the spy affair, Nvidia posts the largest one-day gain on record and the
S&P 500 jumps 4.7%. The banner scene is a computer chip riding a steeply
rising chart.

Under the banner, a three-column grid covers the rest of the world:

- **Korea** — Russian planes approach Ulleung Island; Seoul scrambles jets,
  islanders shelter, and the alert lifts in five minutes with no airspace
  violated (the first alerts had wrongly blamed North Korea).
- **CrowdStrike buys Zscaler** — a $43.9bn all-stock deal, the biggest
  cybersecurity takeover ever, at a 34% premium.
- **NATO / Ukraine** — NATO sends an AWACS early-warning aircraft to Poland
  after three Russian missiles landed there; Kyiv says sea drones sank a
  Russian corvette, as bombs hit central Kyiv.
- **Iran** — Tehran warns EU military bases are in range of missiles it
  says can fly 4,500 km, and vows to confront a US naval blockade.
- **Gaza** — Israeli strikes kill at least three, including an UNRWA
  worker; critically injured Gaza children are flown to Britain.
- **COP31** — the collapse of the Antalya climate talks draws anger in
  Australia and despair from Pacific nations.

A second row carries four shorter stories — Trump's hush-money lifeline
from a federal appeals court, a death sentence in China for revealing
state secrets, the detained governor of Murmansk, and cartel leader Chapo
Isidro heading to trial in Mexico — and the bottom band holds an
**IN BRIEF** column (supermoon meets the Pleiades, the UN chief's AI
safety call, Bangladesh garment unrest, Indian markets shut for Guru
Nanak Jayanti) beside a **MARKETS** box.

## How it is built

`main.ts` is a single self-contained Node program (standard library only).
It keeps a 1024×1024 RGB canvas in memory, draws the whole page with
hand-rolled primitives, and writes the PNG itself: IHDR/IDAT/IEND chunks,
a CRC32 computed in code, zlib deflate at level 9. There are no
timestamps, no randomness and no network access, so running it twice
produces byte-identical output.

```sh
node main.ts            # writes entry.png to $MAKEFUN_OUTPUT_DIR (or /output)
```

## Files

- `main.ts` — the whole generator: font, canvas, icons, layout, PNG encoder
- `entry.png` — the generated front page (1024×1024)
- `.makefun/owner.json` — entry owner wallet
- `LICENSE` — MIT
