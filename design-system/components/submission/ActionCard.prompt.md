The core unit of the Improve Your Submission flow — one card per thing worth fixing.

```jsx
<ActionCard title="Localize into English" impact="medium" page={1} pages={2}>
  <ActionCardSection label="Game localization">
    ~100M potential players in your selected markets speak English as their primary
    language. Games localized into the local language see 30–50% more revenue on
    average vs. English-only releases.
  </ActionCardSection>
  <SuggestionCompare
    current="Don't add English Language Localization"
    suggestion="Add English Language Localization"
    caveat="This will require a new build" />
</ActionCard>

<ActionCard title="Store page" impact="medium" resolved page={1} pages={5}>…</ActionCard>
```

Pick the impact honestly: `high` (red) means the platform will reject the build, `medium` (orange) means it costs reach or revenue, `notice` (yellow) is optional. A resolved card turns green with a check — Shipmate never re-nags.
