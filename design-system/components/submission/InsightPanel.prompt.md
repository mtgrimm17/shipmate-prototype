Context rail for a questionnaire category.

```jsx
<InsightPanel onBack={close}>
  <InsightSection label="Category Name">What the platform expects here, and what it costs you to get wrong.</InsightSection>
  <InsightSection label="Category Technical Info">
    Brief summary of technical info. <a href="#">Documentation Website ↗</a>
  </InsightSection>
  <InsightSection label="Shipmate Insight" shipmate>
    Recommended action for better results.
  </InsightSection>
  <FixItButton />
</InsightPanel>
```

Platform fact is grey. Shipmate's opinion is purple. Keep those apart — the developer needs to know which is which.
