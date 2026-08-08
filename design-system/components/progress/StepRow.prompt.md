The workhorse row of the dashboard.

```jsx
<StepRow index={1} name="Content Rating" done />
<StepRow index={2} name="Data Privacy" state="risk-warn" risk="medium" />
<StepRow index={7} name="Submit" right={<Pill tone="ready">TestFlight — External</Pill>} />
```

Completed steps recede rather than celebrate: opacity 0.6, no colour change to the label.
