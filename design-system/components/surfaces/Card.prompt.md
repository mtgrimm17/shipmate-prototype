Platform card. 12px radius, hairline border, no resting shadow.

```jsx
<Card ready>
  <CardHeader>
    <div style={{display:'flex',alignItems:'center',gap:12}}>
      <PlatformIcon platform="ios" /><div>App Store</div>
    </div>
    <Toggle checked onChange={() => {}} />
  </CardHeader>
  <CardSection><StepRow index={1} name="Content Rating" done /></CardSection>
</Card>
```

Grid them at `repeat(auto-fill, minmax(320px, 1fr))` with a 16px gap.
