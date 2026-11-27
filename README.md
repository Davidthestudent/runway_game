# Runway: the startup game

[![tests](https://github.com/Davidthestudent/runway_game/actions/workflows/test.yml/badge.svg)](https://github.com/Davidthestudent/runway_game/actions/workflows/test.yml)

A 60-second browser game about the one number that kills startups: cash runway.

You start with an idea and six months of money. Seven decisions follow, each a real trade-off founders face: build the full product or test an MVP with ten customers, interview people about past behaviour or send a survey, undercut a competitor or price for profit, hire an expensive sales lead or a cheap generalist, take the big order or the small ones that pay today, accept investor money with growth conditions, and what to cut when a crisis halves demand. Every choice adds or removes months of runway and ends with a one-line lesson (an MVP is the cheapest way to learn, profit and cash are different things, capital buys time).

Play it: https://davidthestudent.github.io/runway_game/

## Why

I wanted a tiny, shareable way to explain unit economics and cash flow to non-founders without a deck. No framework, no build step, no dependencies.

## How it is put together

| File | What it does |
| --- | --- |
| `index.html` | The page shell: fonts, meta tags, one `<main>` element. |
| `scenarios.js` | The seven rounds as data. Each round has two options, a `play(pick, state)` function that returns the change in months, and a lesson. Rounds can set flags (`profitable`, `expanded`) that later rounds read, so the same choice can cost more or less depending on what came before. |
| `game.js` | The engine: start screen, rounds, the animated runway strip, the end screen with the decision log. |
| `style.css` | Light and dark palettes via CSS variables, mobile-first layout. |
| `test/` | Unit tests for the scenario logic, run with Node's built-in test runner. |

Features: keyboard play (A, B, Enter), remembered team name and personal best, copy-the-result button for workshop groups, light/dark switch, works offline once loaded.

## Run locally

Open `index.html` in a browser, or serve the folder:

```sh
npm start        # python3 -m http.server 8000
npm test         # node --test
```

## Adding a round

Append an object to `ROUNDS` in `scenarios.js`:

```js
{
  title: 'The office',
  text: 'Your team of four works from a café. A landlord offers a five-year lease.',
  a: { label: 'Sign the lease', sub: 'Looks serious. Fixed cost for five years.' },
  b: { label: 'Stay flexible', sub: 'Coworking, month to month.' },
  play: function (pick, s) {
    if (pick === 'a') { s.expanded = true; return { delta: -1, text: '...' }; }
    return { delta: 0, text: '...' };
  },
  lesson: 'Fixed costs are a bet that revenue will not fall.'
}
```

The tests check that every round is well formed and that the game still has both winning and losing paths, so run `npm test` after editing.
