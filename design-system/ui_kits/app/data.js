window.SHIPMATE_DATA = {
  project: 'Go Ape Ship!',
  version: 'v1.4',
  platforms: {
    ios:      { steps: ['Content Rating','Data Privacy','Business','Product Page Preview','Age Ratings','Review Submission'], tracks: ['TestFlight — Internal','TestFlight — External','App Store'], live: 'v1.3' },
    android:  { steps: ['Content Rating','Data Safety','Store Listing Preview','Store Tags','Review Store Listing'], tracks: ['Internal testing','Closed testing','Open testing','Production'], live: 'v1.3' },
    steam:    { steps: ['Store Page Preview','Store Tags','Technical','Age Ratings','Review Submission'], tracks: ['Beta branch','Default branch'], live: null },
    psn:      { steps: ['Certification Requirements','Confirm Media & Key Art','Ratings (IARC)','Release Settings'], tracks: ['Production'], live: null },
    xbox:     { steps: ['Certification Requirements','Confirm Media','Age Ratings (IARC)','Release Settings'], tracks: ['Production'], live: null },
    nintendo: { steps: ['Certification Requirements','Confirm Media & Key Art','Ratings (IARC)','Release Settings'], tracks: ['Production'], live: null },
  },
  questions: [
    { q: 'Does your game contain depictions of violence against human-like characters?', a: 'NO', inferred: true },
    { q: 'Can players communicate with each other in-game (text, voice or emotes)?', a: 'YES', inferred: true },
    { q: 'Does your game include simulated gambling or loot boxes?', a: null, inferred: false },
    { q: 'Does your game display user-generated content to other players?', a: null, inferred: false },
  ],
};
