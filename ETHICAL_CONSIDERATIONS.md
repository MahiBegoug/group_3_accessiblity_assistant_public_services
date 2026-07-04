# Ethical Considerations

An honest accounting of the ethical considerations taken into account when
building **EzAccess**. Some considerations were actively baked in; there are
also gaps worth naming so they can be addressed before the app reaches real
users.

## Considerations that were actively addressed

### Accessibility & inclusion (the core purpose)

- **Multiple interaction modes** so the app doesn't privilege one ability: type
  or speak input, read or listen to output. This directly serves users with
  visual, motor, or literacy-related needs.
- **Semantic HTML and ARIA** — labels/roles (`aria-live`, `role="switch"`,
  `aria-pressed`), keyboard-focusable controls with visible focus outlines.
- **`prefers-reduced-motion`** media query disables the microanimations for
  users with vestibular sensitivities — important given the emphasis on "many
  microanimations."
- **Accessibility metadata from the dataset** (wheelchair access, ramps,
  accessible toilets) is surfaced prominently with badges and factored into
  results.

### Language equity

- **Multi-language translation** so non-English speakers can use public-service
  information in their preferred language — relevant for a diverse city like
  Montréal.

### Data provenance & transparency

- Every place preserves a **`sourceDataset` and `sourceUrl`** back to the
  official Montréal open data, so information is traceable and users aren't
  shown unattributed claims.
- Uses an **official open government dataset** (licensed for reuse) rather than
  scraped or proprietary data.

### Privacy (by architecture, somewhat incidentally)

- **No user accounts, no login, no persistent storage** of conversations —
  history lives only in the browser session.
- **Speech-to-text and text-to-speech run in the browser** (Web Speech API), so
  the app itself never stores or transmits your audio to our backend.

## Gaps and caveats that were not fully resolved (and should be flagged)

- **Machine translation:** translations come from Google Translate's free
  endpoint. For safety-relevant info (accessibility, hours) a mistranslation
  could mislead someone — and we saw proper nouns get mangled. There's no
  "this is machine-translated, verify original" disclaimer in the UI yet.
- **Third-party data flow:** although we don't store audio, Chrome's Web Speech
  API and the translation endpoint send data to Google. That isn't disclosed to
  the user, which is a transparency/consent gap.
- **Data accuracy & staleness:** the app presents dataset info (open/closed
  status, accessibility) as current, but the CSV is a snapshot; relying on it
  for a trip could disappoint a user with mobility needs if it's outdated.
- **No content/consent notices:** no privacy notice, no attribution shown for
  the translation/speech providers, no rate-limiting or abuse handling.

## Summary

The design leans genuinely toward **accessibility, inclusion, transparency of
data source, and minimal data retention**, but the **honesty of
machine-translated safety information** and **disclosure of third-party (Google)
data processing** are the areas most in need of follow-up if this were to go to
real users.
