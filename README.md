# Auto-Boss

A run-based auto-battler in an 80s-arcade style against pixel-art brainrot enemies. Fights play themselves; every decision between them (route, weapon, targeting, loot) is yours.

Work in progress: the combat engine and the fight lab are in (`index.html#debug`); the run map, loot and the full zone are being built.

## Build

`index.html` is generated. Edit the source files, then:

```bash
npm run build        # writes index.html
npm run check        # build + JavaScript syntax check
node balance.js      # weapon x encounter matrix
```
