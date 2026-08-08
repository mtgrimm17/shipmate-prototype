Every overlay in Shipmate — onboarding, step editors, confirms — is this shell.

```jsx
<ModalScrim>
  <Modal>
    <ModalHeader eyebrow="Shipmate" title="Let's get your game ready"
      subtitle="We'll collect the essentials once — then you focus on each platform." />
    <ModalBody>…</ModalBody>
    <ModalFooter><Button variant="ghost">← Back</Button><Button>Next →</Button></ModalFooter>
  </Modal>
</ModalScrim>
```

Titles are Inter; body text stays JetBrains Mono.
