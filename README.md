# RPG Maker MV Gacha

A drop-in gacha / summon system for **RPG Maker MV** with banners, five rarities
(**N < R < SR < SSR < UR**), soft and hard pity, rate-up banners and guaranteed
multi-pulls. Pure ES5 JavaScript, so it runs on every MV version.

## Install

1. Copy `js/plugins/GachaSystem.js` and `js/plugins/GachaBanners.js` into your project's `js/plugins/` folder.
2. In the Plugin Manager enable both (file names must not change). Order doesn't matter.
3. Edit `GachaBanners.js` to point the sample banners at your own items, weapons, armors and actors.
4. Open the summon screen from the main menu ("Summon"), or with the plugin command `Gacha open`.

## Features

- **Banners** with their own pools, costs, rates, pity and currency. Hide them behind a switch, lock/unlock them from events, or cap total pulls (e.g. a one-time beginner banner).
- **Pull rewards**: items, weapons, armors, actors and gold. Pulling an actor you already have refunds gold by rarity instead.
- **Pity**: SSR+ and UR counters per banner (shareable via `pityGroup`), soft pity ramps the rate up, hard pity guarantees the drop. Stored in the save file.
- **Rate-up (50/50)**: mark pool entries `featured: true`. Losing the featured roll guarantees the next one.
- **Multi-pull guarantee**: a 10-pull always contains at least SR (configurable).
- **Currency**: gold, an item, or a game variable, per banner if you like.
- **Screens**: banner list, banner details (rates, pity progress, cost, balance), animated results with per-rarity sounds and flashes, a transparent rates screen listing the per-item chance, and a pull history.

## Default rates

Base rates are N 49.4 / R 30 / SR 14 / SSR 6 / UR 0.6 (%). With the default pity
(SSR soft 40 / hard 50, UR soft 70 / hard 90), simulated over 3M pulls, the real
averages are about **SSR+ 1 in 16 pulls** (SSR alone 6.2%) and **UR 1 in 60 pulls** (1.67%).
Everything is a plugin parameter.

## Plugin commands

| Command | Effect |
|---|---|
| `Gacha open [bannerId]` | Open the summon screen (optionally on a banner) |
| `Gacha pull bannerId N` | Pay and pull N times silently; rewards go to the party |
| `Gacha free bannerId N` | Same, but free (tutorials, login bonuses) |
| `Gacha unlock bannerId` / `Gacha lock bannerId` | Show / hide a banner |
| `Gacha resetpity bannerId` | Reset the pity counters |

Set the **Result Variable** parameter to read the best rarity of the last pull
(0=N, 1=R, 2=SR, 3=SSR, 4=UR, -1=couldn't pay).

Script calls: `Gacha.pull("standard", 10)`, `Gacha.pullBlocked(banner, 10)`, `Gacha.availableBanners()`.

## Banner format

See the comment block at the top of `GachaBanners.js` for every field. A minimal banner:

```js
{
    id: 'standard', name: 'Standard Summon', description: 'The everyday banner.',
    pool: {
        N:  [{ type: 'item',   id: 1, count: 3 }],
        R:  [{ type: 'weapon', id: 1 }],
        SR: [{ type: 'armor',  id: 2 }],
        SSR:[{ type: 'actor',  id: 2 }],
        UR: [{ type: 'actor',  id: 1, featured: true }, { type: 'actor', id: 3 }]
    }
}
```

A rarity with an empty pool never drops, and the remaining rates are rescaled to 100%.

## Tests

The pull engine (rates, pity, guarantees, rate-up, rewards) is tested outside the editor:

```
node tests/gacha.test.js
```

The tests stub the MV classes, so they cover the logic but **not the windows/scene**, which
need to be checked inside MV (Test Play -> open the menu -> Summon).
