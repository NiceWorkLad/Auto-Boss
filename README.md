# Boss Rush

An auto-battler where every hit pays. Your hero fights a boss on their own; you earn gold for every point of HP you knock off, win or lose, and a kill pays a big bonus (four times bigger the first time) and unlocks the next boss. Spend the gold on upgrades and gear, or turn on auto-buy and auto-fight and let it play out.

## Play

Open `index.html` in a browser, or serve the folder:

```bash
npm run serve        # http://localhost:8080
```

## Build

`index.html` is generated. Edit the source files, then:

```bash
npm run build        # writes index.html
npm run check        # build + JavaScript syntax check
```

| File | What it is |
|---|---|
| `rules.js` | Bosses, upgrades, gear, combat, payouts. Shared with `balance.js` |
| `render.js` | The canvas arena |
| `ui.js` | Save/load, fight loop, shop, result card |
| `template.html` | Markup and styles |
| `balance.js` | Plays the game with auto-buy on and reports fights per boss |

## Balance

```bash
node balance.js [bosses] [seed] [key=value ...]
node balance.js 16 1 hp=5 reward=4.5     # try other values from TUNE in rules.js
```

Two rules keep the economy from running away; both came out of balance runs:

- A boss's gold reward has its own growth curve instead of scaling with its HP. When gold scaled with HP, the hero outgrew every boss from about boss 4 onwards.
- Upgrades add a flat amount per level, and percentage stats approach a ceiling instead of hitting a hard cap. Gear tiers are the only multipliers. Hard caps all filled in mid-game at once, and the hero spiked far past the bosses.

The 12 named bosses take about 40 fights with auto-buy; after that they come back stronger ("Slime King II") and the curve turns into a wall, which is where a prestige layer would go.
