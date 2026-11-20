# Design kit: the wedding site's look and behaviour

The fonts, colours and scroll effects of the wedding site, ready to copy into
another project (such as a portfolio). The wedding site itself doesn't use this
folder: it keeps its own copies under `src/styles` and `src/guest`.

To see everything working, serve this folder (for example `npx serve design-kit`)
and open `demo.html`. Opening the file directly won't run the script, because
browsers block `type="module"` imports from `file://`.

## Files

| File             | What it holds                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `tokens.css`     | Colours, fonts, spacing and corner sizes as CSS variables. Re-theme here.                                                |
| `base.css`       | Page reset, text styles, the light-on-dark and paper cards, the scroll fill-in effect, section dividers, reduced motion. |
| `components.css` | Buttons, the header that turns solid on scroll, the mobile menu, the hero, the swipeable card strip.                     |
| `kit.js`         | The behaviour in plain JavaScript: `initReveal`, `initSolidHeader`, `initMobileMenu`, `initStrip`.                       |
| `react/hooks.ts` | The same behaviour as React hooks: `useReveal`, `useSolidHeader`, `useMobileMenu`, `useStrip`.                           |
| `demo.html`      | A small one-page portfolio using all of it.                                                                              |

Load the CSS in this order: `tokens.css`, `base.css`, then `components.css`.

## Fonts

Paste this into `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Outfit:wght@300;400;500;600&family=Great+Vibes&family=Pinyon+Script&display=swap"
/>
```

| Role               | Font                           | Used for                                 |
| ------------------ | ------------------------------ | ---------------------------------------- |
| `--font-display`   | Cormorant Garamond, weight 500 | Titles (`.display`, `.h1`, `.h2`, `.h3`) |
| `--font-sans`      | Outfit, weight 400 and 500     | Body text, buttons, labels, menu         |
| `--font-script`    | Pinyon Script                  | Decorative words (`.script`)             |
| `--font-signature` | Great Vibes                    | Names and signatures (`.signature`)      |

The labels, menu links and buttons share one look: small uppercase sans with
wide letter-spacing (0.22em to 0.26em). The body uses `lining-nums` so numbers
are full height.

## Behaviour

- **Sections fill in on scroll.** Mark each section with `data-reveal`:
  `<section data-reveal id="about">`.
  - While a section is still below the screen, it waits ivory with its content hidden.
  - When its top passes 12% above the bottom of the screen, the background fills to navy over 0.9s.
  - 0.3s later, the content fades in while rising 16px.
  - It plays once per section. Sections already on screen at load show their final look straight away.
- **Section dividers.** Between two `data-reveal` sections there's a fading
  gold hairline with a small gold diamond. This comes from CSS alone.
- **Header turns solid.** The header sits transparent over the hero.
  - Past 80% of the screen height, it sticks to the top on the navy band, with tighter padding and a gold hairline underneath.
- **Smooth anchor scrolling.** Menu links glide to their section and stop
  below the fixed header (`--header-h`, 80px).
- **Mobile menu.** Below 900px, the menu opens as a full-screen panel.
  - Focus moves into it.
  - Escape or any link closes it.
  - The page behind stops scrolling while it's open.
- **Card strip.** Cards scroll sideways and snap into place, with the scrollbar hidden. People swipe on phones and use the arrows on computers.
  - Each arrow moves one card.
  - An arrow is disabled when there's nothing more to show that way.
- **Hover.** Buttons change colour over 0.2s, and menu links underline.
- **Reduced motion and print.**
  - When someone's system asks for less motion, every animation and transition is switched off and scrolling jumps instead of gliding.
  - Printing shows every section in its final look.

## Using it

**Plain HTML:**

```html
<script type="module">
  import { initReveal, initSolidHeader, initMobileMenu, initStrip } from './kit.js'
  initReveal()
  initSolidHeader(document.querySelector('.site-header'))
</script>
```

`demo.html` shows how to wire up the menu and the card strip too.

**React:** copy `react/hooks.ts`, then:

```tsx
useReveal() // once, in the page component
const solid = useSolidHeader()
<header className={`site-header ${solid ? 'solid' : ''}`}>…</header>
```

**Re-theming:** change the five brand colours at the top of `tokens.css`.
`--surface` is the dark page colour and `--reveal-from` is the colour each
section starts in. Keep text contrast at 4.5:1 or more against `--surface`.
In the wedding palette, gold on `--navy-soft` is 4.7:1 and ivory is 12:1.
