/* ============================================================
   STATE — single source of truth
   ============================================================ */

/* ── Language → ISO 3166-1 numeric country codes ────── */
// Used by the world map to highlight countries where each language is primary
const LANG_COUNTRY_CODES = {
  // English: official language in English-speaking countries (S. Korea excluded)
  en:  [36, 84, 124, 288, 328, 356, 372, 376, 388, 404, 426, 454, 516, 524, 554,
        566, 694, 706, 710, 716, 800, 826, 834, 840, 894],
  fr:  [56, 108, 120, 140, 178, 180, 204, 250, 262, 266, 324, 384, 442, 450, 466,
        492, 562, 646, 686, 756, 768, 854],
  es:  [32, 68, 152, 170, 188, 192, 214, 218, 222, 320, 484, 558, 591, 600, 604,
        724, 740, 858, 862],
  pt:  [24, 76, 132, 508, 620, 624, 626, 678],
  de:  [40, 276, 438, 442, 756],
  ja:  [392],
  // Chinese: mainland + HK + Macau + Singapore (Taiwan excluded)
  zh:  [156, 344, 446, 702],
  // Korean: South Korea only (N. Korea excluded)
  ko:  [410],
  ru:  [51, 112, 398, 417, 643, 762],
  ar:  [12, 48, 174, 262, 275, 368, 400, 414, 422, 434, 478, 504, 512, 634, 682,
        706, 729, 760, 784, 818, 887],
  it:  [380, 674, 756],
  nl:  [528, 740],
};

/* ── Compliance Questions ────────────────────────────── */

const QUESTIONS = [
  {
    id: 'violence',
    title: 'Violence or Combat',
    label: 'Does your game contain violence or combat?',
    desc: 'Includes fighting, weapons, blood, or characters being harmed.',
    keywords: ['fight','combat','shoot','war','battle','gun','weapon','blood','kill',
               'death','violent','violence','sword','attack','enemy','enemies','shooter',
               'fps','rpg','arena','warrior','soldier'],
  },
  {
    id: 'sexualContent',
    title: 'Sexual or Mature Content',
    label: 'Does your game contain sexual or mature content?',
    desc: 'Includes nudity, sexual themes, or suggestive material.',
    keywords: ['adult','sexual','nude','nudity','erotic','mature content','18+'],
  },
  {
    id: 'strongLanguage',
    title: 'Strong Language',
    label: 'Does your game contain strong language?',
    desc: 'Includes profanity, slurs, or offensive language in dialogue, text, or audio.',
    keywords: ['profanity','crude language','explicit language','strong language','adult language'],
  },
  {
    id: 'dataCollection',
    title: 'Data Collection',
    label: 'Does your game collect data from users?',
    desc: 'Includes accounts, analytics, gameplay data, device info, or third-party SDKs.',
    keywords: ['account','sign in','sign up','login','analytics','leaderboard',
               'online multiplayer','multiplayer','social','cloud save','achievements'],
  },
  {
    id: 'inAppPurchases',
    title: 'In-App Purchases',
    label: 'Does your game include in-app purchases?',
    desc: 'Includes upgrades, cosmetics, subscriptions, or virtual currency.',
    keywords: ['purchase','buy','shop','store','premium','subscription','dlc','paid',
               'currency','coins','gems','credits','unlock','upgrade','microtransaction'],
  },
];

/* ── Consolidated Questionnaire Questions ────────────── */
// Platform tags: ios=[Apple], android+egs=[IARC], steam=[Steam]
// Each question: { id, section, text, platforms[], type, options[], parent, parentIs, parentHas, indent, subsection, placeholder }

const CQ_QUESTIONS = [

  // ── Blood, Violence, or Gory Images ──────────────────
  { id:'cq_violence', section:'Blood, Violence, or Gory Images',
    text:'Does the game contain inferences of, references to, or depictions of violence, blood, or gory images? This includes violence directed at the players\' character. (Does not refer to user-generated content.)',
    platforms:['ios','android','egs','steam'], type:'yn' },

  { id:'cq_violence_types', section:'Blood, Violence, or Gory Images',
    text:'Please select all that the game includes:',
    platforms:['ios','android','egs','steam'], type:'multi',
    options:['Violence or implied violence against humans',
             'Violence against anything other than humans (e.g., animals, fantasy creatures, robots, vehicles)',
             'Disturbing or gory images','Blood'],
    parent:'cq_violence', parentIs:'yes' },

  { id:'cq_violence_setting', section:'Blood, Violence, or Gory Images',
    text:'In what kind of setting (context, storyline) does the violence occur?',
    platforms:['ios','android','egs','steam'], type:'multi',
    options:['Fantastical','Realistic'],
    parent:'cq_violence_types',
    parentHas:['Violence or implied violence against humans',
               'Violence against anything other than humans (e.g., animals, fantasy creatures, robots, vehicles)'],
    indent:1 },

  { id:'cq_violence_pixelated', section:'Blood, Violence, or Gory Images',
    text:'Does the game have a pixelated or childlike style?',
    platforms:['android','egs'], type:'single',
    options:['Yes, it has a childlike style (e.g., likely to appeal to younger children)',
             'Yes, it has a pixelated style','No'],
    parent:'cq_violence_types',
    parentHas:['Violence or implied violence against humans',
               'Violence against anything other than humans (e.g., animals, fantasy creatures, robots, vehicles)'],
    indent:1 },

  { id:'cq_violence_steam_types', section:'Blood, Violence, or Gory Images',
    text:'Select all that apply:',
    platforms:['steam'], type:'multi',
    options:['The display of weapons, bones/skeletons, or anguish',
             'Accidental death, bodily injury, corpses, or violence description',
             'Killing','Glamorization of or incitement to violence','Suicide'],
    parent:'cq_violence_types',
    parentHas:['Violence or implied violence against humans',
               'Violence against anything other than humans (e.g., animals, fantasy creatures, robots, vehicles)'],
    indent:1 },

  // Violence Against Humans
  { id:'cq_vh_reactions', section:'Blood, Violence, or Gory Images',
    text:'How would you describe the reactions to violence?',
    platforms:['ios','android','egs'], type:'multi',
    options:['Unrealistic','Realistic'],
    parent:'cq_violence_types', parentHas:['Violence or implied violence against humans'],
    indent:1, subsection:'Violence Against Humans' },

  { id:'cq_vh_presentation', section:'Blood, Violence, or Gory Images',
    text:'How is this violence presented in the game?',
    platforms:['android','egs'], type:'single',
    options:['Referred to','Implied but not seen',
             'Rarely depicted from a distant perspective','Often depicted from a distant perspective',
             'Rarely depicted from a close-up perspective','Often depicted from a close-up perspective'],
    parent:'cq_violence_types', parentHas:['Violence or implied violence against humans'],
    indent:1, subsection:'Violence Against Humans' },

  { id:'cq_vh_gore_level', section:'Blood, Violence, or Gory Images',
    text:'What is the level of blood and/or gore associated with this violence?',
    platforms:['ios','android','egs','steam'], type:'single',
    options:['None','Mild/Limited','Moderate','High'],
    parent:'cq_violence_types', parentHas:['Violence or implied violence against humans'],
    indent:1, subsection:'Violence Against Humans' },

  { id:'cq_vh_war', section:'Blood, Violence, or Gory Images',
    text:'Does the game take place in a realistic or historical war setting?',
    platforms:['android','egs'], type:'yn',
    parent:'cq_violence_types', parentHas:['Violence or implied violence against humans'],
    indent:1, subsection:'Violence Against Humans' },

  { id:'cq_vh_innocents', section:'Blood, Violence, or Gory Images',
    text:'Can innocent or defenseless characters be seriously injured or killed?',
    platforms:['android','egs'], type:'single',
    options:['No','Yes, with penalties','Yes, without penalties'],
    parent:'cq_violence_types', parentHas:['Violence or implied violence against humans'],
    indent:1, subsection:'Violence Against Humans' },

  { id:'cq_vh_minorities', section:'Blood, Violence, or Gory Images',
    text:'Does the game involve violence against minorities or vulnerable groups?',
    platforms:['steam'], type:'yn',
    parent:'cq_violence_types', parentHas:['Violence or implied violence against humans'],
    indent:1, subsection:'Violence Against Humans' },

  { id:'cq_vh_fierce', section:'Blood, Violence, or Gory Images',
    text:'Are there any fierce sounds, sinister or intimidating characters, or dark overtones associated with this violence?',
    platforms:['android','egs'], type:'yn',
    parent:'cq_violence_types', parentHas:['Violence or implied violence against humans'],
    indent:1, subsection:'Violence Against Humans' },

  // Violence Against Non-Humans
  { id:'cq_vnh_reactions', section:'Blood, Violence, or Gory Images',
    text:'How would you describe the reactions to violence?',
    platforms:['ios','android','egs'], type:'multi',
    options:['Unrealistic','Realistic'],
    parent:'cq_violence_types',
    parentHas:['Violence against anything other than humans (e.g., animals, fantasy creatures, robots, vehicles)'],
    indent:1, subsection:'Violence Against Non-Humans' },

  { id:'cq_vnh_gore_level', section:'Blood, Violence, or Gory Images',
    text:'What is the level of blood and/or gore associated with this violence?',
    platforms:['ios','android','egs','steam'], type:'single',
    options:['None','Mild/Limited','Moderate','High'],
    parent:'cq_violence_types',
    parentHas:['Violence against anything other than humans (e.g., animals, fantasy creatures, robots, vehicles)'],
    indent:1, subsection:'Violence Against Non-Humans' },

  { id:'cq_vnh_human_like', section:'Blood, Violence, or Gory Images',
    text:'Do any of these creatures behave or respond like humans?',
    platforms:['android','egs'], type:'yn',
    parent:'cq_violence_types',
    parentHas:['Violence against anything other than humans (e.g., animals, fantasy creatures, robots, vehicles)'],
    indent:1, subsection:'Violence Against Non-Humans' },

  { id:'cq_vnh_real_animals', section:'Blood, Violence, or Gory Images',
    text:'Is any of this violence against real-world animals?',
    platforms:['android','egs'], type:'yn',
    parent:'cq_violence_types',
    parentHas:['Violence against anything other than humans (e.g., animals, fantasy creatures, robots, vehicles)'],
    indent:1, subsection:'Violence Against Non-Humans' },

  // Disturbing or Gory Images
  { id:'cq_gore_assoc', section:'Blood, Violence, or Gory Images',
    text:'Are these disturbing or gory images associated with a violent act that is shown?',
    platforms:['ios','android','egs','steam'], type:'yn',
    parent:'cq_violence_types', parentHas:['Disturbing or gory images'],
    indent:1, subsection:'Disturbing or Gory Images' },

  { id:'cq_gore_explicitness', section:'Blood, Violence, or Gory Images',
    text:'How explicitly depicted are these disturbing or gory images?',
    platforms:['ios','android','egs','steam'], type:'single',
    options:['Limited detail','Moderate detail','Graphic detail'],
    parent:'cq_violence_types', parentHas:['Disturbing or gory images'],
    indent:1, subsection:'Disturbing or Gory Images' },

  // Blood
  { id:'cq_blood_color', section:'Blood, Violence, or Gory Images',
    text:'Is the color of the blood realistic?',
    platforms:['steam'], type:'yn',
    parent:'cq_violence_types', parentHas:['Blood'],
    indent:1, subsection:'Blood' },

  { id:'cq_blood_violent', section:'Blood, Violence, or Gory Images',
    text:'Is the blood related to violent acts?',
    platforms:['android','egs'], type:'yn',
    parent:'cq_violence_types', parentHas:['Blood'],
    indent:1, subsection:'Blood' },

  { id:'cq_blood_amount', section:'Blood, Violence, or Gory Images',
    text:'What best describes this type of blood in the game?',
    platforms:['android','egs'], type:'single',
    options:['Small and infrequent','Large or frequent'],
    parent:'cq_violence_types', parentHas:['Blood'],
    indent:1, subsection:'Blood' },

  // ── Fear ─────────────────────────────────────────────
  { id:'cq_fear', section:'Fear',
    text:'Does the game contain pictures or sounds likely to be scary, horrifying, or disturbing? (Does not refer to user-generated content.)',
    platforms:['ios','android','egs','steam'], type:'yn' },

  { id:'cq_fear_types', section:'Fear',
    text:'Please select all that the game includes:',
    platforms:['android','egs','steam'], type:'multi',
    options:['Scary elements','Horrifying elements'],
    parent:'cq_fear', parentIs:'yes' },

  { id:'cq_fear_scary_freq', section:'Fear',
    text:'How frequent are the scary elements?',
    platforms:['ios','android','egs'], type:'single',
    options:['Rare','Often'],
    parent:'cq_fear_types', parentHas:['Scary elements'], indent:1 },

  { id:'cq_fear_horror_freq', section:'Fear',
    text:'How frequent are the horrifying elements?',
    platforms:['ios','android','egs'], type:'single',
    options:['Rare','Often'],
    parent:'cq_fear_types', parentHas:['Horrifying elements'], indent:1 },

  { id:'cq_fear_imminent', section:'Fear',
    text:'Is there an intense and unrelenting sense of imminent threat?',
    platforms:['android','egs'], type:'yn',
    parent:'cq_fear_horror_freq', parentIs:'Often', indent:2 },

  // ── Language ──────────────────────────────────────────
  { id:'cq_language', section:'Language',
    text:'Does the game contain any potentially offensive language? (Does not refer to user-generated content.)',
    platforms:['ios','android','egs','steam'], type:'yn' },

  { id:'cq_language_types', section:'Language',
    text:'Please select all that the game includes:',
    platforms:['android','egs','steam'], type:'multi',
    options:['Minor profanities (e.g., "go to hell")',
             'Moderate swearing or other language or gestures that could be considered moderately or significantly offensive',
             'Discriminatory language (against race, religion, sex, etc.)','Sexual expletives'],
    parent:'cq_language', parentIs:'yes' },

  { id:'cq_lang_minor_freq', section:'Language',
    text:'How frequently do minor profanities occur?',
    platforms:['ios','android','egs'], type:'single', options:['Rarely','Often'],
    parent:'cq_language_types', parentHas:['Minor profanities (e.g., "go to hell")'], indent:1 },

  { id:'cq_lang_moderate_freq', section:'Language',
    text:'How frequently does moderate swearing occur?',
    platforms:['ios','android','egs'], type:'single', options:['Rarely','Often'],
    parent:'cq_language_types',
    parentHas:['Moderate swearing or other language or gestures that could be considered moderately or significantly offensive'],
    indent:1 },

  { id:'cq_lang_discrim_freq', section:'Language',
    text:'How frequently does discriminatory language occur?',
    platforms:['ios','android','egs'], type:'single', options:['Rarely','Often'],
    parent:'cq_language_types', parentHas:['Discriminatory language (against race, religion, sex, etc.)'], indent:1 },

  { id:'cq_lang_sexual_freq', section:'Language',
    text:'How frequently do sexual expletives occur?',
    platforms:['ios','android','egs'], type:'single', options:['Rarely','Often'],
    parent:'cq_language_types', parentHas:['Sexual expletives'], indent:1 },

  // ── Crude Humor ───────────────────────────────────────
  { id:'cq_crude', section:'Crude Humor',
    text:'Please select all crude humor that the game includes:',
    platforms:['ios','android','egs','steam'], type:'multi',
    options:['Adult humor: Comedic references to death, killing, crime, mental health, substance abuse, social and/or political issues including racial and personal beliefs',
             'Adult humor with sexual connotations',
             'Bodily functions (e.g., belching, flatulence, or vomiting) for humorous purposes',
             'None'] },

  { id:'cq_crude_bodily', section:'Crude Humor',
    text:'What bodily functions are used for humorous purposes in the game? Please check all that apply.',
    platforms:['android','egs'], type:'multi',
    options:['Mucus, belching, flatulence sounds',
             'Flatulence (with depiction of "flatulence cloud"), whimsical depictions of feces ("poo coils"), vomiting',
             'Urination, urine, realistically depicted feces',
             'Act of human defecation visually depicted'],
    parent:'cq_crude',
    parentHas:['Bodily functions (e.g., belching, flatulence, or vomiting) for humorous purposes'],
    indent:1 },

  // ── Nudity or Sexual Content ──────────────────────────
  { id:'cq_sexual', section:'Nudity or Sexual Content',
    text:'Does the game contain inferences of, references to, or depictions of sexuality, sexual violence, suggestiveness, dating games, revealing attire, or nudity? (Does not refer to user-generated content.)',
    platforms:['ios','android','egs','steam'], type:'yn' },

  { id:'cq_sexual_types', section:'Nudity or Sexual Content',
    text:'Please select all that the game includes:',
    platforms:['ios','android','egs','steam'], type:'multi',
    options:['Sexual activity (including both moving and still images of sexual activity)',
             'Suggestive/sexual themes or references',
             'Dating games (interactive dating, marriage, or other romantic relationships between game characters)',
             'Nudity or revealing outfits',
             'Depictions of or references to sexual violence'],
    parent:'cq_sexual', parentIs:'yes' },

  { id:'cq_sex_act_freq', section:'Nudity or Sexual Content',
    text:'How often do sexual acts occur?',
    platforms:['ios','android','egs'], type:'single', options:['Rarely','Often'],
    parent:'cq_sexual_types',
    parentHas:['Sexual activity (including both moving and still images of sexual activity)'],
    indent:1, subsection:'Sexual Activity' },

  { id:'cq_sex_act_depiction', section:'Nudity or Sexual Content',
    text:'How would you describe the depiction of these scenes? Please check all that apply.',
    platforms:['ios','android','egs','steam'], type:'multi',
    options:['Obscured/innuendo: Sex act is entirely off-camera or completely blocked from view',
             'Shown with no nudity: Characters are depicted in a sexual act but no nudity is shown',
             'Shown with partial nudity: Breasts, buttocks',
             'Shown with full frontal nudity'],
    parent:'cq_sexual_types',
    parentHas:['Sexual activity (including both moving and still images of sexual activity)'],
    indent:1, subsection:'Sexual Activity' },

  { id:'cq_sex_act_minors', section:'Nudity or Sexual Content',
    text:'Do any of these sex acts feature characters that appear to be younger than 18?',
    platforms:['android','egs','steam'], type:'yn',
    parent:'cq_sexual_types',
    parentHas:['Sexual activity (including both moving and still images of sexual activity)'],
    indent:1, subsection:'Sexual Activity' },

  { id:'cq_sex_suggestive_desc', section:'Nudity or Sexual Content',
    text:'How would you describe the suggestive/sexual themes contained in the game? Please check all that apply.',
    platforms:['ios','android','egs','steam'], type:'multi',
    options:['Suggestive references and innuendo in text, dialogue, or heard',
             'Overtly sexual situations or visually depicted innuendo',
             'References to sexual activity without descriptive detail',
             'References to sexual activity with descriptive detail',
             'Suggestion of minors involved in a sexual context',
             'Depictions of minors in sexually arousing poses, including where clothed'],
    parent:'cq_sexual_types', parentHas:['Suggestive/sexual themes or references'],
    indent:1, subsection:'Suggestive/Sexual Themes' },

  { id:'cq_sex_dating_focus', section:'Nudity or Sexual Content',
    text:'Are these games prominently featured or a strong focus of the product?',
    platforms:['android','egs'], type:'yn',
    parent:'cq_sexual_types',
    parentHas:['Dating games (interactive dating, marriage, or other romantic relationships between game characters)'],
    indent:1, subsection:'Dating Games' },

  { id:'cq_sex_nudity_types', section:'Nudity or Sexual Content',
    text:'Please select all that the game includes:',
    platforms:['ios','android','egs','steam'], type:'multi',
    options:['Revealing outfits','Nudity'],
    parent:'cq_sexual_types', parentHas:['Nudity or revealing outfits'],
    indent:1, subsection:'Nudity or Revealing Outfits' },

  { id:'cq_sex_violence_pres', section:'Nudity or Sexual Content',
    text:'How is the sexual violence in the game presented?',
    platforms:['android','egs','steam'], type:'multi',
    options:['Visually depicted','Referred to only'],
    parent:'cq_sexual_types', parentHas:['Depictions of or references to sexual violence'],
    indent:1, subsection:'Sexual Violence' },

  // ── Controlled Substances ─────────────────────────────
  { id:'cq_substances', section:'Controlled Substances',
    text:'Does the game contain any reference to or use of drugs, alcohol, or tobacco? (Does not refer to user-generated content.)',
    platforms:['ios','android','egs','steam'], type:'yn' },

  { id:'cq_sub_types', section:'Controlled Substances',
    text:'Please select all that the game includes:',
    platforms:['android','egs','steam'], type:'multi',
    options:['Illegal or recreational drugs','Fantasy drugs','Medical drugs','Alcohol','Tobacco'],
    parent:'cq_substances', parentIs:'yes' },

  { id:'cq_sub_drugs', section:'Controlled Substances',
    text:'How are illegal or recreational drugs present in the game?',
    platforms:['android','egs','steam'], type:'multi',
    options:['Reference','Use','Encourages/glamorizes','Detailed instruction for use'],
    parent:'cq_sub_types', parentHas:['Illegal or recreational drugs'], indent:1 },

  { id:'cq_sub_fantasy', section:'Controlled Substances',
    text:'How are fantasy drugs present in the game?',
    platforms:['ios','android','egs'], type:'multi',
    options:['Reference','Use','Encourages/glamorizes'],
    parent:'cq_sub_types', parentHas:['Fantasy drugs'], indent:1 },

  { id:'cq_sub_medical', section:'Controlled Substances',
    text:'How are medical drugs present in the game?',
    platforms:['android','egs','steam'], type:'multi',
    options:['Reference','Use','Encourages/glamorizes'],
    parent:'cq_sub_types', parentHas:['Medical drugs'], indent:1 },

  { id:'cq_sub_alcohol', section:'Controlled Substances',
    text:'How is alcohol present in the game?',
    platforms:['android','egs','steam'], type:'multi',
    options:['Reference','Use','Encourages/glamorizes'],
    parent:'cq_sub_types', parentHas:['Alcohol'], indent:1 },

  { id:'cq_sub_tobacco', section:'Controlled Substances',
    text:'How is tobacco present in the game?',
    platforms:['android','egs','steam'], type:'multi',
    options:['Reference','Use','Encourages/glamorizes'],
    parent:'cq_sub_types', parentHas:['Tobacco'], indent:1 },

  // ── Gambling & Speculative Acts ───────────────────────
  { id:'cq_gambling', section:'Gambling & Speculative Acts',
    text:'Does the game contain gambling, simulations of casino gambling/bingo, or gambling themes? (Does not refer to user-generated content.)',
    platforms:['ios','android','egs','steam'], type:'yn' },

  { id:'cq_gamb_types', section:'Gambling & Speculative Acts',
    text:'Please select all that the game includes:',
    platforms:['ios','android','egs','steam'], type:'multi',
    options:['Gambling themes','Playable bingo games',
             'Playable casino games, lotteries, or racetrack betting',
             'Any other games that use in-game currency/tokens to play and can reward the same currency through gameplay'],
    parent:'cq_gambling', parentIs:'yes' },

  { id:'cq_gamb_themes_focus', section:'Gambling & Speculative Acts',
    text:'Are these gambling themes prominently featured or a strong focus of the product?',
    platforms:['android','egs'], type:'yn',
    parent:'cq_gamb_types', parentHas:['Gambling themes'], indent:1 },

  { id:'cq_gamb_steam_refs', section:'Gambling & Speculative Acts',
    text:'Does the game include references to real-world gambling games or environments, not visible on screen?',
    platforms:['steam'], type:'yn',
    parent:'cq_gamb_types', parentHas:['Gambling themes'], indent:1 },

  { id:'cq_gamb_steam_env', section:'Gambling & Speculative Acts',
    text:'Does the game include depiction of an environment that resembles a real-world, age-restricted betting or gambling service?',
    platforms:['steam'], type:'yn',
    parent:'cq_gamb_types', parentHas:['Gambling themes'], indent:1 },

  { id:'cq_gamb_bingo_cash', section:'Gambling & Speculative Acts',
    text:'Can playing these bingo games reward cash payouts or rewards of significant monetary value?',
    platforms:['ios','android','egs','steam'], type:'yn',
    parent:'cq_gamb_types', parentHas:['Playable bingo games'], indent:1 },

  { id:'cq_gamb_casino_cash', section:'Gambling & Speculative Acts',
    text:'Can playing these casino games, lotteries, or racetrack betting games reward cash payouts or rewards of significant monetary value?',
    platforms:['ios','android','egs','steam'], type:'yn',
    parent:'cq_gamb_types', parentHas:['Playable casino games, lotteries, or racetrack betting'], indent:1 },

  // ── Digital Purchases, Cash Convertible Rewards, or NFTs ──
  { id:'cq_digital', section:'Digital Purchases, Cash Convertible Rewards, or NFTs',
    text:'Does the game include the purchase or sale of digital goods, cash rewards, gift cards, play-to-earn features, convertible cryptocurrency rewards, or the issuance of transferable digital assets (e.g., NFTs)?',
    platforms:['android','egs'], type:'yn' },

  { id:'cq_digital_types', section:'Digital Purchases, Cash Convertible Rewards, or NFTs',
    text:'Please select all that the game includes:',
    platforms:['android','egs'], type:'multi',
    options:['Purchases of digital goods',
             'Cash convertible rewards (e.g., cash rewards, real-world items of monetary value, convertible cryptocurrency rewards, or other play-to-earn mechanics)',
             'Issuance (e.g., minting) of transferable digital assets (e.g., NFTs)'],
    parent:'cq_digital', parentIs:'yes' },

  { id:'cq_digital_lootbox', section:'Digital Purchases, Cash Convertible Rewards, or NFTs',
    text:'Can these purchases include random items where the purchaser doesn\'t know what specific items or features they will receive (e.g., loot boxes), or any other chance-based purchases?',
    platforms:['android','egs'], type:'yn',
    parent:'cq_digital_types', parentHas:['Purchases of digital goods'], indent:1 },

  // ── Mature Content (Steam only) ───────────────────────
  { id:'cq_mature', section:'Mature Content',
    text:'Please indicate if your game has content included in the major categories of mature content:',
    platforms:['steam'], type:'multi',
    options:['General mature content: Content that deals with mature topics and may not be appropriate for all audiences',
             'Frequent violence or gore: Contains extremely violent or gory content',
             'Some nudity or sexual content: Contains occasional nudity or sexual content',
             'Frequent nudity or sexual content: Primarily about explicit or frequent nudity or sexual content',
             'Adult only sexual content: Contains sexual content that is explicit or graphic and intended for adults only'] },

  { id:'cq_mature_desc', section:'Mature Content',
    text:'What should customers know about any mature content in your game? (Visible on store page.)',
    platforms:['steam'], type:'text',
    placeholder:'Describe the mature content in your game — depictions of violence, sexual acts, or other topics players should know about…',
    parent:'cq_mature',
    parentHas:['General mature content: Content that deals with mature topics and may not be appropriate for all audiences'],
    indent:1 },

  { id:'cq_mature_access', section:'Mature Content',
    text:'How do we access the mature content in your game? (For review only, not visible to customers.)',
    platforms:['steam'], type:'text',
    placeholder:'Is the content only on a certain map or scene? Does the player need to reach a certain level?',
    parent:'cq_mature',
    parentHas:['General mature content: Content that deals with mature topics and may not be appropriate for all audiences'],
    indent:1 },

  // ── Generative Artificial Intelligence (Steam only) ───
  { id:'cq_ai', section:'Generative Artificial Intelligence',
    text:'Does this game use generative artificial intelligence to generate content for the game, either pre-rendered or live-generated? This includes the game itself, the store page, and any Steam community assets or marketing materials.',
    platforms:['steam'], type:'yn' },

  { id:'cq_ai_desc', section:'Generative Artificial Intelligence',
    text:'Please enter a message to players describing how this game uses generative artificial intelligence.',
    platforms:['steam'], type:'text',
    placeholder:'Describe how AI is used in your game…',
    parent:'cq_ai', parentIs:'yes' },

  { id:'cq_ai_live', section:'Generative Artificial Intelligence',
    text:'Does this game use artificial intelligence to generate content or code during gameplay?',
    platforms:['steam'], type:'yn',
    parent:'cq_ai', parentIs:'yes' },

  { id:'cq_ai_third_party', section:'Generative Artificial Intelligence',
    text:'Does this game connect to an external, third party AI service during gameplay?',
    platforms:['steam'], type:'yn',
    parent:'cq_ai', parentIs:'yes' },

  { id:'cq_ai_live_types', section:'Generative Artificial Intelligence',
    text:'Please tell us about the types of live-generated content created by AI:',
    platforms:['steam'], type:'multi',
    options:['Code','Text','Textures','3D Models','Sound Effects','Music','Voice','Other'],
    parent:'cq_ai_live', parentIs:'yes', indent:1 },

  { id:'cq_ai_code_desc', section:'Generative Artificial Intelligence',
    text:'Please tell us about the code generated in your game. What type of code? How are you using it? What guard rails are in place to prevent malicious or illegal use?',
    platforms:['steam'], type:'text',
    placeholder:'Describe the code generation and safeguards…',
    parent:'cq_ai_live', parentIs:'yes', indent:1 },

  // ── Interactive Elements ───────────────────────────────
  { id:'cq_location', section:'Interactive Elements',
    text:'Does the game share the user\'s current and precise physical location with other users?',
    platforms:['android','egs'], type:'yn' },

  { id:'cq_user_interact', section:'Interactive Elements',
    text:'Does the game natively allow users to interact or exchange content with other users through voice communication, text, or sharing images or audio?',
    platforms:['ios','android','egs','steam'], type:'yn' },

  { id:'cq_interact_types', section:'Interactive Elements',
    text:'Select all that the game includes:',
    platforms:['android','egs','steam'], type:'multi',
    options:['The ability to block users or user-generated content',
             'The ability to report users or user-generated content',
             'Chat moderation',
             'A system to filter in-game text chat (e.g., curse words, slurs, and sexual terms for the languages supported by the game)',
             'The ability to limit interactions to invited friends only'],
    parent:'cq_user_interact', parentIs:'yes' },

  // ── Elements of Extremism ─────────────────────────────
  { id:'cq_extremism', section:'Elements of Extremism',
    text:'Select all that the game contains:',
    platforms:['android','egs','steam'], type:'multi',
    options:['Any swastikas, other Nazi symbols, or propaganda deemed unconstitutional in Germany',
             'Any glorification, denial, or gross trivialization of the Holocaust or other events of genocide',
             'Any content that can substantially erode the national identity of the Republic of Korea by describing anti-national acts or distorting historical facts',
             'Disparaging or hateful messages directed at certain population groups',
             'Advocacy for committing acts of terrorism',
             'None of the above'] },
];

/* ── Google Play Content Questions (IARC) ────────────────
   Full IARC questionnaire tree for Android/Google Play, sourced from
   Google Play's official IARC content-question spreadsheet. This is
   deliberately a SEPARATE data structure from CQ_QUESTIONS above —
   CQ_QUESTIONS is shared across ios/android/egs/steam with a more
   collapsed/simplified view of these same topics, and this tree is
   considerably more granular (95 questions vs. Android's ~40 CQ_QUESTIONS
   entries). Keeping it separate means the other platforms' content-rating
   flows are untouched.

   Each question:
     key          — unique id, namespaced "google.content.*" (also used as
                    the state.cqAnswers key — no collision risk with the
                    cq_* ids above)
     title        — short label shown on the question card
     tooltip      — full official question text, shown via the (?) icon
     depth        — nesting depth (1 = top-level, used for progress count)
     data_type    — 'radio' (single-select) | 'picklist_multi' (multi-select)
     option{N}_text / option{N}_child — up to 6 options; option{N}_child is a
                    newline-separated list of question keys that option
                    reveals as follow-ups (or null for none)

   Answers are stored in state.cqAnswers[key] as a 1-based option index
   (radio) or an array of 1-based option indices (picklist_multi) — see
   the giarc* helper functions below. */
const GOOGLE_IARC_QUESTIONS = [{"key":"google.content.bloodviolencegore","title":"Blood, Violence, or Gory Images","tooltip":"Does the game contain inferences of, references to, or depictions of violence, blood, or gory images? This includes violence directed at the players' character. Please note that this question does not refer to user-generated content.","depth":1,"data_type":"radio","option1_text":"Yes","option1_child":"google.content.bloodviolencegoretypes","option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.bloodviolencegoretypes","title":"Blood, Violence, or Gory Images: Types","tooltip":"Please select all that the game includes.","depth":2,"data_type":"picklist_multi","option1_text":"Violence or implied violence against humans","option1_child":"google.content.humansetting\ngoogle.content.humanstyle\ngoogle.content.humanreactions\ngoogle.content.humanpresented\ngoogle.content.humanbloodlevel\ngoogle.content.humanwarsetting\ngoogle.content.humaninnocents\ngoogle.content.humanovertones","option2_text":"Violence against anything other than humans (e.g., animals, fantasy creatures, robots, vehicles)","option2_child":"google.content.nonhumansetting\ngoogle.content.nonhumanstyle\ngoogle.content.nonhumanreactions\ngoogle.content.nonhumanpresented\ngoogle.content.nonhumanbloodlevel\ngoogle.content.nonhumanbehavior\ngoogle.content.nonhumananimal\ngoogle.content.nonhumanovertones","option3_text":"Disturbing or gory images without a violent act shown","option3_child":"google.content.nonviolentgore","option4_text":"Blood that isn't directly related to a violent act (e.g., blood on clothing, blood in the background)","option4_child":"google.content.nonviolentblood","option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.humansetting","title":"Violence Against Humans: Setting","tooltip":"In what kind of setting (context, storyline) does the violence occur?","depth":3,"data_type":"radio","option1_text":"Fantastical","option1_child":null,"option2_text":"Realistic","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.humanstyle","title":"Violence Against Humans: Pixelated or Childlike Style","tooltip":"Does the game have a pixelated or childlike style?","depth":3,"data_type":"radio","option1_text":"Yes, it has a childlike style (e.g., likely to appeal to younger children)","option1_child":null,"option2_text":"Yes, it has a pixelated style","option2_child":null,"option3_text":"No","option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.humanreactions","title":"Violence Against Humans: Reactions","tooltip":"How would you describe the reactions to violence?","depth":3,"data_type":"radio","option1_text":"Unrealistic","option1_child":null,"option2_text":"Realistic","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.humanpresented","title":"Violence Against Humans: Presentation","tooltip":"How is this violence presented in the game?","depth":3,"data_type":"picklist_multi","option1_text":"Referred to","option1_child":null,"option2_text":"Implied but not seen","option2_child":null,"option3_text":"Rarely depicted from a distant perspective","option3_child":null,"option4_text":"Often depicted from a distant perspective","option4_child":null,"option5_text":"Rarely depicted from a close-up perspective","option5_child":null,"option6_text":"Often depicted from a close-up perspective","option6_child":null},{"key":"google.content.humanbloodlevel","title":"Violence Against Humans: Level of Blood and/or Gore","tooltip":"What is the level of blood and/or gore associated with this violence?","depth":3,"data_type":"radio","option1_text":"None","option1_child":null,"option2_text":"Mild/Limited","option2_child":null,"option3_text":"Moderate","option3_child":null,"option4_text":"High","option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.humanwarsetting","title":"Violence Against Humans: Realistic or Historical War Setting","tooltip":"Does the game take place in a realistic or historical war setting?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.humaninnocents","title":"Violence Against Humans: Innocent or Defenseless Characters Can Be Seriously Injured or Killed","tooltip":"Can innocent or defenseless characters be seriously injured or killed?","depth":3,"data_type":"radio","option1_text":"No","option1_child":null,"option2_text":"Yes, with penalties","option2_child":null,"option3_text":"Yes, without penalties","option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.humanovertones","title":"Violence Against Humans: Fierce Sounds, Sinister or Intimidating Characters, or Dark Overtones Associated with Violence","tooltip":"Are there any fierce sounds, sinister or intimidating characters, or dark overtones associated with this violence?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.nonhumansetting","title":"Violence Against Non-Humans: Setting","tooltip":"In what kind of setting (context, storyline) does the violence occur?","depth":3,"data_type":"radio","option1_text":"Fantastical","option1_child":null,"option2_text":"Realistic","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.nonhumanstyle","title":"Violence Against Non-Humans: Pixelated or Childlike Style","tooltip":"Does the game have a pixelated or childlike style?","depth":3,"data_type":"radio","option1_text":"Yes, it has a childlike style (e.g., likely to appeal to younger children)","option1_child":null,"option2_text":"Yes, it has a pixelated style","option2_child":null,"option3_text":"No","option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.nonhumanreactions","title":"Violence Against Non-Humans: Reactions","tooltip":"How would you describe the reactions to violence?","depth":3,"data_type":"radio","option1_text":"Unrealistic","option1_child":null,"option2_text":"Realistic","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.nonhumanpresented","title":"Violence Against Non-Humans: Presentation","tooltip":"How is this violence presented in the game?","depth":3,"data_type":"picklist_multi","option1_text":"Referred to","option1_child":null,"option2_text":"Implied but not seen","option2_child":null,"option3_text":"Rarely depicted from a distant perspective","option3_child":null,"option4_text":"Often depicted from a distant perspective","option4_child":null,"option5_text":"Rarely depicted from a close-up perspective","option5_child":null,"option6_text":"Often depicted from a close-up perspective","option6_child":null},{"key":"google.content.nonhumanbloodlevel","title":"Violence Against Non-Humans: Level of Blood and/or Gore","tooltip":"What is the level of blood and/or gore associated with this violence?","depth":3,"data_type":"radio","option1_text":"None","option1_child":null,"option2_text":"Mild/Limited","option2_child":null,"option3_text":"Moderate","option3_child":null,"option4_text":"High","option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.nonhumanbehavior","title":"Violence Against Non-Humans: Creatures Behave or Respond Like Humans","tooltip":"Do any of these creatures behave or respond like humans?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.nonhumananimal","title":"Violence Against Non-Humans: Violence Against Real-World Animals","tooltip":"Is any of this violence against real-world animals?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.nonhumanovertones","title":"Violence Against Non-Humans: Fierce Sounds, Sinister or Intimidating Characters, or Dark Overtones Associated with Violence","tooltip":"Are there any fierce sounds, sinister or intimidating characters, or dark overtones associated with this violence?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.nonviolentgore","title":"Disturbing or Gory Images Without a Violent Act Shown: Level of Detail","tooltip":"How explicitly depicted are these disturbing or gory images?","depth":3,"data_type":"radio","option1_text":"Limited detail","option1_child":null,"option2_text":"Moderate detail","option2_child":null,"option3_text":"Graphic detail","option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.nonviolentblood","title":"Blood Unrelated to Violent Acts","tooltip":"What best describes this type of blood in the game?","depth":3,"data_type":"radio","option1_text":"Small and infrequent","option1_child":null,"option2_text":"Large or frequent","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.fear","title":"Pictures or Sounds Likely to be Scary, Horrifying, or Disturbing","tooltip":"Does the game contain pictures or sounds likely to be scary, horrifying, or disturbing? Please note that this question does not refer to user-generated content.","depth":1,"data_type":"radio","option1_text":"Yes","option1_child":"google.content.feartypes","option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.feartypes","title":"Fear Types","tooltip":"Please select all that the game includes.","depth":2,"data_type":"picklist_multi","option1_text":"Scary elements","option1_child":"google.content.scaryfreq","option2_text":"Horrifying elements","option2_child":"google.content.horrifyingfreq","option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.scaryfreq","title":"Scary Element Frequency","tooltip":"How frequent are the scary elements?","depth":3,"data_type":"radio","option1_text":"Rare","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.horrifyingfreq","title":"Horrifying Element Frequency","tooltip":"How frequent are the horrifying elements?","depth":3,"data_type":"radio","option1_text":"Rare","option1_child":null,"option2_text":"Often","option2_child":"google.content.imminentthreat","option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.imminentthreat","title":"Intense and Unrelenting Sense of Imminent Threat","tooltip":"Is there an intense and unrelenting sense of imminent threat?","depth":4,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.sexsuggestdate","title":"Sexuality, Suggestiveness, or Dating Games","tooltip":"Does the game contain inferences of, references to, or depictions of sexuality, sexual violence, suggestiveness, dating games, revealing attire, or nudity? Please note that this question does not refer to user-generated content.","depth":1,"data_type":"radio","option1_text":"Yes","option1_child":"google.content.sexsuggestdatetypes","option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.sexsuggestdatetypes","title":"Sexuality, Suggestiveness, or Dating Games: Types","tooltip":"Please select all that the game includes.","depth":2,"data_type":"picklist_multi","option1_text":"Sexual activity (including both moving and still images of sexual activity)","option1_child":"google.content.sexfreq\ngoogle.content.sexlength\ngoogle.content.sexdepiction\ngoogle.content.sexminor","option2_text":"Suggestive/sexual themes or references","option2_child":"google.content.suggestivetypes","option3_text":"Dating games (interactive dating, marriage, or other romantic relationships between game characters)","option3_child":"google.content.datingfocus","option4_text":"Nudity or revealing outfits","option4_child":"google.content.revealnudity","option5_text":"Depictions of or references to sexual violence","option5_child":"google.content.sexualviolence","option6_text":null,"option6_child":null},{"key":"google.content.sexfreq","title":"Sexual Activity: Frequency","tooltip":"How often do sexual acts occur?","depth":3,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.sexlength","title":"Sexual Activity: Duration","tooltip":"What is the duration of these scenes?","depth":3,"data_type":"radio","option1_text":"Brief","option1_child":null,"option2_text":"Prolonged","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.sexdepiction","title":"Sexual Activity: Depiction","tooltip":"How would you describe the depiction of these scenes? Please check all that apply.","depth":3,"data_type":"picklist_multi","option1_text":"Obscured/innuendo: Sex act is either entirely off-camera or completely blocked from view","option1_child":null,"option2_text":"Shown with no nudity: Characters are depicted in a sexual act but no nudity is shown","option2_child":null,"option3_text":"Shown with partial nudity: Breasts, buttocks","option3_child":null,"option4_text":"Shown with full frontal nudity","option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.sexminor","title":"Sexual Activity: Minors","tooltip":"Do any of these sex acts feature characters that appear to be younger than 18?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.suggestivetypes","title":"Suggestive/Sexual Themes: Types","tooltip":"How would you describe the suggestive/sexual themes contained in the game? Please check all that apply.","depth":3,"data_type":"picklist_multi","option1_text":"Suggestive references and innuendo in text, dialogue, or heard","option1_child":null,"option2_text":"Overtly sexual situations or visually depicted innuendo","option2_child":null,"option3_text":"References to sexual activity without descriptive detail","option3_child":null,"option4_text":"References to sexual activity with descriptive detail","option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.datingfocus","title":"Dating Games: Featured or Strong Focus","tooltip":"Are these games prominently featured or a strong focus of the product?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.revealnudity","title":"Nudity or Revealing Outfits","tooltip":"Please select all that the game includes.","depth":3,"data_type":"picklist_multi","option1_text":"Revealing outfits","option1_child":"google.content.revealfreq\ngoogle.content.revealcontext\ngoogle.content.revealstrange","option2_text":"Nudity","option2_child":"google.content.nuditytypes\ngoogle.content.nuditycontext","option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.revealfreq","title":"Revealing Outfits: Frequency","tooltip":"How frequently are revealing outfits depicted?","depth":4,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.revealcontext","title":"Revealing Outfits: Erotic/Provocative Setting or Context","tooltip":"Are these revealing outfits ever depicted in an erotic or provocative setting or context?","depth":4,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.revealstrange","title":"Revealing Outfits: Out-of-Place","tooltip":"Do these outfits ever appear to be out-of-place, such as a bikini worn on the battlefield or solely wearing undergarments in public?","depth":4,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.nuditytypes","title":"Nudity: Types","tooltip":"Please select all that the game includes.","depth":4,"data_type":"picklist_multi","option1_text":"Human buttocks","option1_child":"google.content.butts","option2_text":"Nipple-less breasts or breasts with minimal coverage (e.g., pasties, long hair)","option2_child":"google.content.nonipbreasts","option3_text":"Female fantasy creatures' breasts (e.g., harpies)","option3_child":"google.content.fantasybreasts","option4_text":"Female human breasts with nipples","option4_child":"google.content.nipbreasts","option5_text":"Genitalia","option5_child":"google.content.genitalia","option6_text":null,"option6_child":null},{"key":"google.content.butts","title":"Human Buttocks: Frequency","tooltip":"How frequently do the human buttocks appear?","depth":5,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.nonipbreasts","title":"Nipple-less Breasts: Frequency","tooltip":"How frequently do the nipple-less breasts appear?","depth":5,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.fantasybreasts","title":"Female Fantasy Creatures' Breasts: Frequency","tooltip":"How frequently do the fantasy creatures' breasts appear?","depth":5,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.nipbreasts","title":"Female Human Breasts with Nipples: Frequency","tooltip":"How frequently do the female human breasts with nipples appear?","depth":5,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.genitalia","title":"Genitalia: Frequency","tooltip":"How frequently does the genitalia appear?","depth":5,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.nuditycontext","title":"Nudity: Erotic/Provocative Setting or Context","tooltip":"Is any of this content in an erotic, provocative setting or context?","depth":4,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.sexualviolence","title":"Sexual Violence: Presentation","tooltip":"How is the sexual violence in the game presented?","depth":3,"data_type":"radio","option1_text":"Visually depicted","option1_child":null,"option2_text":"Referred to only","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.gambling","title":"Gambling Themes, Simulations of Casino Gambling/Bingo, or Real Gambling","tooltip":"Does the game contain gambling, simulations of casino gambling/bingo, or gambling themes? Please note that this question does not refer to user-generated content.","depth":1,"data_type":"radio","option1_text":"Yes","option1_child":"google.content.gamblingtypes","option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.gamblingtypes","title":"Gambling: Types","tooltip":"Please select all that the game includes.","depth":2,"data_type":"picklist_multi","option1_text":"Gambling themes","option1_child":"google.content.gamblingthemes","option2_text":"Playable bingo games","option2_child":"google.content.bingorewards","option3_text":"Playable casino games, lotteries, or racetrack betting","option3_child":"google.content.casinorewards","option4_text":"Any other games that use in-game currency/tokens to play and can reward the same currency through gameplay","option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.gamblingthemes","title":"Gambling Themes: Prominently Featured or Strong Focus","tooltip":"Are these gambling themes prominently featured or a strong focus of the product?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.bingorewards","title":"Bingo Games: Cash Payouts or Rewards of Significant Monetary Value","tooltip":"Can playing these bingo games reward cash payouts or rewards of significant monetary value?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":"google.content.bingopurchases","option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.bingopurchases","title":"Bingo Games: Purchases","tooltip":"Does the game include the ability or requirement to wager, purchase entrance fees, additional chances to win, or any other purchases potentially related to winning cash payouts or rewards of significant monetary value from these bingo games?","depth":4,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.casinorewards","title":"Casino Games, Lotteries, or Racetrack Betting: Cash Payouts or Rewards of Significant Monetary Value","tooltip":"Can playing these casino games, lotteries, or racetrack betting games reward cash payouts or rewards of significant monetary value?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":"google.content.casinopurchases","option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.casinopurchases","title":"Casino Games, Lotteries, or Racetrack Betting: Purchases","tooltip":"Does the game include the ability or requirement to wager, purchase entrance fees, additional chances to win, or any other purchases potentially related to winning cash payouts or rewards of significant monetary value from these casino games, lotteries, or racetrack betting games?","depth":4,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.offlang","title":"Potentially Offensive Language","tooltip":"Does the game contain any potentially offensive language? Please note that this question does not refer to user-generated content.","depth":1,"data_type":"radio","option1_text":"Yes","option1_child":"google.content.offlangtypes","option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.offlangtypes","title":"Offensive Language: Types","tooltip":"Please select all that the game includes.","depth":2,"data_type":"picklist_multi","option1_text":"Minor profanities (e.g., \"go to hell\")","option1_child":"google.content.profanities","option2_text":"Moderate swearing or other language or gestures that could be considered moderately or significantly offensive","option2_child":"google.content.swearing","option3_text":"Discriminatory language (against race, religion, sex, etc.)","option3_child":"google.content.discrimlang","option4_text":"Sexual expletives","option4_child":"google.content.sexexpletives","option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.profanities","title":"Minor Profanities: Frequency","tooltip":"How frequently do minor profanities occur?","depth":3,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.swearing","title":"Moderate Swearing: Frequency","tooltip":"How frequently does moderate swearing occur?","depth":3,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.discrimlang","title":"Discriminatory Language: Frequency","tooltip":"How frequently does discriminatory language occur?","depth":3,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.sexexpletives","title":"Sexual Expletives: Frequency","tooltip":"How frequently do sexual expletives occur?","depth":3,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.drugs","title":"Drugs, Alcohol, or Tobacco","tooltip":"Does the game contain any reference to or use of drugs, alcohol, or tobacco? Please note that this question does not refer to user-generated content.","depth":1,"data_type":"radio","option1_text":"Yes","option1_child":"google.content.drugtypes","option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.drugtypes","title":"Controlled Substances: Types","tooltip":"Please select all that the game includes.","depth":2,"data_type":"picklist_multi","option1_text":"Illegal or recreational drugs","option1_child":"google.content.illegaldrugs","option2_text":"Fantasy drugs","option2_child":"google.content.fantdrugs\ngoogle.content.fantdrugsfreq","option3_text":"Medical drugs","option3_child":"google.content.meddrugs\ngoogle.content.meddrugsfreq","option4_text":"Alcohol","option4_child":"google.content.alcohol\ngoogle.content.alcoholfreq","option5_text":"Tobacco","option5_child":"google.content.tobacco\ngoogle.content.tobaccofreq","option6_text":null,"option6_child":null},{"key":"google.content.illegaldrugs","title":"Illegal or Recreational Drugs: Presentation","tooltip":"How are illegal or recreational drugs present in the game?","depth":3,"data_type":"picklist_multi","option1_text":"Reference","option1_child":null,"option2_text":"Use","option2_child":"google.content.illegaldrugsinteract\ngoogle.content.illegaldrugsrewards","option3_text":"Encourages/glamorizes","option3_child":null,"option4_text":"Detailed instruction for us","option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.illegaldrugsinteract","title":"Illegal or Recreational Drugs: Interactivity","tooltip":"Is the use of illegal or recreational drugs interactive?","depth":4,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.illegaldrugsrewards","title":"Illegal or Recreational Drugs: Incentives or Rewards","tooltip":"Is the use of illegal or recreational drugs related to incentives or rewards?","depth":4,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.fantdrugs","title":"Fantasy Drugs: Presentation","tooltip":"How are fantasy drugs present in the game?","depth":3,"data_type":"picklist_multi","option1_text":"Reference","option1_child":null,"option2_text":"Use","option2_child":null,"option3_text":"Encourages/glamorizes","option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.fantdrugsfreq","title":"Fantasy Drugs: Frequency","tooltip":"How frequently do fantasy drugs occur?","depth":3,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.meddrugs","title":"Medical Drugs: Presentation","tooltip":"How are medical drugs present in the game?","depth":3,"data_type":"picklist_multi","option1_text":"Reference","option1_child":null,"option2_text":"Use","option2_child":null,"option3_text":"Encourages/glamorizes","option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.meddrugsfreq","title":"Medical Drugs: Frequency","tooltip":"How frequently do medical drugs occur?","depth":3,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.alcohol","title":"Alcohol: Presentation","tooltip":"How is alcohol present in the game?","depth":3,"data_type":"picklist_multi","option1_text":"Reference","option1_child":null,"option2_text":"Use","option2_child":"google.content.alcoholfpp","option3_text":"Encourages/glamorizes","option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.alcoholfpp","title":"Alcohol Use: First-Person Perspective","tooltip":"Can the player ever use alcohol in a first-person perspective?","depth":4,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.alcoholfreq","title":"Alcohol: Frequency","tooltip":"How frequently does this alcohol content occur?","depth":3,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.tobacco","title":"Tobacco: Presentation","tooltip":"How is tobacco present in the game?","depth":3,"data_type":"picklist_multi","option1_text":"Reference","option1_child":null,"option2_text":"Use","option2_child":"google.content.tobaccofpp","option3_text":"Encourages/glamorizes","option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.tobaccofpp","title":"Tobacco Use: First-Person Perspective","tooltip":"Can the player ever use tobacco in a first-person perspective?","depth":4,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.tobaccofreq","title":"Tobacco: Frequency","tooltip":"How frequently does this tobacco content occur?","depth":3,"data_type":"radio","option1_text":"Rarely","option1_child":null,"option2_text":"Often","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.crude","title":"Bodily Functions Used for Humorous Purposes (Belching, Flatulence, Vomiting, etc.)","tooltip":"Does the game contain any bodily functions such as belching, flatulence, or vomiting when used for humorous purposes? Please note that this question does not refer to user-generated content.","depth":1,"data_type":"radio","option1_text":"Yes","option1_child":"google.content.crudetypes","option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.crudetypes","title":"Bodily Functions Used for Humorous Purposes: Types","tooltip":"What bodily functions are used for humorous purposes in the game? Please check all that apply.","depth":2,"data_type":"picklist_multi","option1_text":"Mucus, belching, flatulence sounds","option1_child":null,"option2_text":"Flatulence (with depiction of \"flatulence cloud\"), whimsical depictions of feces (\"poo coils\"), vomiting","option2_child":null,"option3_text":"Urination, urine, realistically depicted feces","option3_child":null,"option4_text":"Act of human defecation visually depicted","option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.crypto","title":"Digital Purchases, Cash Convertible Rewards, or NFTs","tooltip":"Does the game include the purchase or sale of digital goods, cash rewards, gift cards, play-to-earn features, convertible cryptocurrency rewards, or the issuance of transferable digital assets (e.g., NFTs)?","depth":1,"data_type":"radio","option1_text":"Yes","option1_child":"google.content.cryptotypes","option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.cryptotypes","title":"Digital Purchases, Cash Convertible Rewards, or NFTs: Types","tooltip":"Please select all that the game includes.","depth":2,"data_type":"picklist_multi","option1_text":"Purchases of digital goods","option1_child":"google.content.digitalchance\ngoogle.content.digitaltrade","option2_text":"Cash convertible rewards (e.g., cash rewards, real-world items of monetary value, convertible cryptocurrency rewards, or other play-to-earn mechanics)","option2_child":"google.content.cashpurchases","option3_text":"Issuance (e.g., minting) of transferable digital assets (e.g., NFTs)","option3_child":"google.content.issuancesignificant\ngoogle.content.issuancemarket\ngoogle.content.issuancepurchases","option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.digitalchance","title":"Purchases of Digital Goods: Chance-Based Purchases","tooltip":"Can these purchases include random items where the purchaser doesn't know what specific items or features they will receive (e.g., loot boxes), the purchase of items that will be used to create or unlock an unknown item or feature (e.g., a key to unlock a loot box, material used to craft a random item), items that can improve the rate of earning random items (e.g., random drop boosts), or any other chance-based purchases?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.digitaltrade","title":"Purchases of Digital Goods: Trading","tooltip":"Does the game have a system for players to trade items with each other using real money or in-game currency purchased with real money (e.g., auction house, item exchange)?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.cashpurchases","title":"Cash Convertible Rewards: Purchases","tooltip":"Does the game include the ability to wager, purchase entrance fees, additional chances to win, boosts, or any other purchases potentially related to earning or winning cash rewards or rewards of significant monetary value?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.issuancesignificant","title":"Issuance of Transferable Digital Assets: Significant or Promoted Aspect of Product","tooltip":"Is the issuance of these digital assets a significant or promoted aspect of the product?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.issuancemarket","title":"Issuance of Transferable Digital Assets: Marketplace(s)","tooltip":"Does the game contain an integrated marketplace for these assets or promote/feature a particular marketplace for these assets?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.issuancepurchases","title":"Issuance of Transferable Digital Assets: Purchases","tooltip":"Does the game include the ability or requirement to make any purchases related to the issuance or earning of these digital assets?","depth":3,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.interact","title":"User Interaction: Voice Communication, Text, Shared Images/Audio","tooltip":"Does the game natively allow users to interact or exchange content with other users through voice communication, text, or sharing images or audio?","depth":1,"data_type":"radio","option1_text":"Yes","option1_child":"google.content.interactblock\ngoogle.content.interactreport\ngoogle.content.interactmoderate\ngoogle.content.interactfriends","option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.interactblock","title":"User Interaction: Ability to Block Users or User-Generated Content","tooltip":"Does the game include the ability to block users or user-generated content?","depth":2,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.interactreport","title":"User Interaction: Ability to Report Users or User-Generated Content","tooltip":"Does the game include the ability to report users or user-generated content?","depth":2,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.interactmoderate","title":"User Interaction: Chat Moderation","tooltip":"Does the game include chat moderation?","depth":2,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.interactfriends","title":"User Interaction: Invited Friends Only","tooltip":"Can interactions in the game be limited to invited friends only?","depth":2,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.location","title":"User Location Sharing","tooltip":"Does the game share the user's current and precise physical location with other users?","depth":1,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.nazi","title":"Nazi Symbols or Propaganda","tooltip":"Does the game contain any swastikas or other Nazi symbols or propaganda deemed unconstitutional in Germany?","depth":1,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.korea","title":"Content That Can Erode the National Identity of the Republic of Korea","tooltip":"Does the game contain any content that can substantially erode the national identity of the Republic of Korea by describing anti-national acts or distorting historical facts?","depth":1,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.terrorism","title":"Advocacy for Committing Acts of Terrorism","tooltip":"Does the game advocate committing acts of terrorism?","depth":1,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.crimes","title":"Realistic Descriptions of Crimes or Techniques That Can Be Used in Criminal Offenses","tooltip":"Does the game contain realistic descriptions of crimes (e.g., robbery, kidnapping) or techniques that can be used in criminal offenses?","depth":1,"data_type":"radio","option1_text":"Yes","option1_child":"google.content.crimekids\ngoogle.content.crimetech","option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.crimekids","title":"Crimes or Criminal Techniques Likely to Be Imitated by Children or Youths","tooltip":"Are these crimes or criminal techniques likely to be imitated by children or youths?","depth":2,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null},{"key":"google.content.crimetech","title":"Detailed Descriptions of Techniques That Could be Used in Criminal Offenses","tooltip":"Are there detailed descriptions of techniques that could be used in criminal offenses?","depth":2,"data_type":"radio","option1_text":"Yes","option1_child":null,"option2_text":"No","option2_child":null,"option3_text":null,"option3_child":null,"option4_text":null,"option4_child":null,"option5_text":null,"option5_child":null,"option6_text":null,"option6_child":null}];

const GOOGLE_IARC_BY_KEY = {};
GOOGLE_IARC_QUESTIONS.forEach(q => { GOOGLE_IARC_BY_KEY[q.key] = q; });
const GOOGLE_IARC_TOP_LEVEL_KEYS = GOOGLE_IARC_QUESTIONS.filter(q => q.depth === 1).map(q => q.key);
const GOOGLE_IARC_MAX_OPTIONS = 6;

function giarcOptionEntries(q) {
  const out = [];
  for (let i = 1; i <= GOOGLE_IARC_MAX_OPTIONS; i++) {
    const text = q['option' + i + '_text'];
    if (text) out.push({ index: i, text, child: q['option' + i + '_child'] || null });
  }
  return out;
}

function giarcChildKeysForOption(child) {
  if (!child) return [];
  return child.split('\n').map(s => s.trim()).filter(Boolean);
}

function giarcIsAnswered(key) {
  const a = state.cqAnswers[key];
  if (Array.isArray(a)) return a.length > 0;
  return a !== undefined && a !== null;
}

function giarcActiveChildKeys(key) {
  const q = GOOGLE_IARC_BY_KEY[key];
  const a = state.cqAnswers[key];
  if (!q || a === undefined || a === null) return [];
  const opts = giarcOptionEntries(q);
  const selectedIndices = Array.isArray(a) ? a : [a];
  let keys = [];
  selectedIndices.forEach(idx => {
    const opt = opts.find(o => o.index === idx);
    if (opt) keys = keys.concat(giarcChildKeysForOption(opt.child));
  });
  return keys;
}

function giarcIsSubtreeComplete(key) {
  if (!giarcIsAnswered(key)) return false;
  return giarcActiveChildKeys(key).every(giarcIsSubtreeComplete);
}

function giarcTruncateText(text, max) {
  return text.length > max ? text.slice(0, max).replace(/[;,]?\s*$/, '') + '…' : text;
}

/* One-line summary of the current answer(s), shown on a collapsed row */
function giarcAnswerSummaryText(key) {
  const q = GOOGLE_IARC_BY_KEY[key];
  const a = state.cqAnswers[key];
  if (!q) return '';
  const opts = giarcOptionEntries(q);
  let text;
  if (Array.isArray(a)) {
    const texts = a.map(idx => (opts.find(o => o.index === idx) || {}).text).filter(Boolean);
    if (!texts.length) return '';
    text = texts.length <= 2 ? texts.join(', ') : texts.length + ' selected';
  } else {
    const opt = opts.find(o => o.index === a);
    text = opt ? opt.text : '';
  }
  return giarcTruncateText(text, 60);
}


/* ── CQ helper functions ─────────────────────────────── */

function cqIsVisible(q) {
  // Platform check — at least one of question's platforms must be activated
  if (!q.platforms.some(p => state.activePlatforms.has(p))) return false;
  // No parent = always visible
  if (!q.parent) return true;
  // Find parent
  const parentQ = CQ_QUESTIONS.find(x => x.id === q.parent);
  if (!parentQ) return false;
  // Parent must itself be visible
  if (!cqIsVisible(parentQ)) return false;
  const parentAns = state.cqAnswers[q.parent];
  if (q.parentIs !== undefined) return parentAns === q.parentIs;
  if (q.parentHas !== undefined) {
    if (!Array.isArray(parentAns)) return false;
    return q.parentHas.some(v => parentAns.includes(v));
  }
  return true;
}

function cqProgress() {
  const visible  = CQ_QUESTIONS.filter(q => cqIsVisible(q));
  const answered = visible.filter(q => {
    const a = state.cqAnswers[q.id];
    if (q.type === 'yn' || q.type === 'single') return a != null && a !== '';
    if (q.type === 'multi')  return Array.isArray(a) && a.length > 0;
    if (q.type === 'text')   return typeof a === 'string' && a.trim() !== '';
    return false;
  });
  return { total: visible.length, answered: answered.length };
}

/* ── THE CHECK MARK, one definition ──────────────────────────
   This path is the nav prototype's (shipmate-nav-prototype-v2.html, STEP_DONE):
   `M7.4 12.3l3 3 6.2-6.6` on a 24 viewBox at stroke 2.2, round caps and joins.
   It lived as a local `const checkSVG` in seven different functions across
   render.js and app.js, and six of those seven still held an older, unrelated
   glyph (`M2 6l3 3 5-5` on a 12 viewBox at 1.8) — which is why the platform
   cards and the Shippy guide never quite agreed on what a tick looks like.
   One function, called from all of them, so the next change lands everywhere.

   `px` is the box the mark fills, and the stroke scales with it: the prototype
   draws into a 22px disc for an effective 2.02px stroke, so any other size has
   to keep that ratio or the tick reads thinner as the disc shrinks. */
function smCheckSVG(px, sw) {
  const s = px || 20;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" aria-hidden="true">`
       + `<path d="M7.4 12.3l3 3 6.2-6.6" stroke="currentColor" stroke-width="${sw || 2.2}"`
       + ` stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/* ── AND THE CROSS, its opposite number ──────────────────────
   Same 24 viewBox, same 2.2 stroke, same round caps — because it goes in the
   SAME SLOT as the tick and has to read as that slot's other value rather than
   as a second kind of mark.

   **THE EXTENT IS SOLVED AGAINST THE CHECK, AND IN THE RIGHT UNITS.** Jaco:
   *"que la x del check circular mida lo mismo que el check, para que no
   parezcan desbalanceados."* It shipped at 7.5 → 16.5 on the claim that its ink
   "matches the check's own extent" — which was eyeballed from the WIDTH, and
   width is the wrong measure for a mark in a round disc.

   The disc is a circle, so what the eye compares is how far the ink reaches
   from the CENTRE. The check's own path (`M7.4 12.3 l3 3 6.2-6.6`) has three
   points, and its furthest — (16.6, 8.7) — sits **5.661** units from (12,12).
   A cross's furthest points are its corners, so at 7.5 → 16.5 they landed at
   √(4.5² + 4.5²) = **6.364**: 12.4% further out, which is exactly the
   "desbalanceado". A cross is also 9 × 9 against a check that is 9.2 × 6.6, so
   matching the two by width guarantees mismatching them by radius.

   So the half-extent is `5.661 / √2` = **4.003**, and the cross runs 8 → 16.
   Both marks now reach 5.661 from the centre, to three decimals, and the round
   caps extend both by the same `sw/2` radially outward — so matching the path
   endpoints matches the painted ink too.

   It exists for the pinned nav's disc, where a section that is answered but
   INVALID cannot wear a tick and must not fall back to the empty pending
   socket. Anything else that needs an × in a state disc should call this rather
   than inline one, for `smCheckSVG`'s own reason: seven local copies, six of
   them stale. */
function smCrossSVG(px, sw) {
  const s = px || 20;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" aria-hidden="true">`
       + `<path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" stroke-width="${sw || 2.2}"`
       + ` stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/* THE STEP ROW'S CHEVRON, one definition, for the same reason as the check
   above: it was pasted into three card builders and left out of the fourth,
   which is how the Web card ended up with a text '›' while every other card
   had the prototype's glyph. Rotated -90° by CSS (.ios-step-arrow svg), so
   the path here points down. */
/* The glyph on its own, for callers that need their own wrapper (the release
   block's track pill). SM_STEP_CHEVRON below is this plus the step row's span,
   so there is still one path in one place. */
const SM_CHEVRON_DOWN =
  `<svg class="sm-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor"`
  + ` stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`
  + `<polyline points="6 9 12 15 18 9"/></svg>`;

const SM_STEP_CHEVRON = `<span class="ios-step-arrow">${SM_CHEVRON_DOWN}</span>`;

/* THE INFO GLYPH — an outlined ⓘ, the shape Apple uses for info.circle: a
   ring, a dot, and a stem. It replaces the filled "!" disc the tip boxes used
   to carry, and the difference is the point: a filled disc with an exclamation
   mark is the universal shape for "something is wrong", and these boxes are
   just prose. Neutral by default; it inherits currentColor, so a caller that
   really is warning about something can still colour it. */
const SM_INFO_ICON =
  `<svg class="sm-info-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">`
  + `<circle cx="12" cy="12" r="9.1" stroke="currentColor" stroke-width="1.5"/>`
  + `<circle cx="12" cy="7.7" r="1.1" fill="currentColor"/>`
  + `<path d="M12 11.2v5.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`
  + `</svg>`;

/* ── Platform Icons (SVG paths, viewBox="0 0 24 24") ─── */

const PLATFORM_ICONS = {
  ios:      'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11',
  // Mac App Store — deliberately the SAME Apple glyph as `ios` above (per
  // request: same icon, just different accompanying text — see PLATFORMS.macos'
  // own label below). platformIcon(pid) just does a straight PLATFORM_ICONS[pid]
  // lookup, so this can't be a shared reference — it needs its own literal
  // copy of the same path data.
  macos:    'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11',
  // Mac App Store Full — same Apple glyph again, same reasoning as macos above.
  macos_full: 'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11',
  android:  'M3.18 23.76c.35.2.8.19 1.22-.05l13.32-7.73-3.37-3.47zM.3 1.05C.1 1.39 0 1.8 0 2.24v19.53c0 .44.1.85.3 1.19l.07.07 10.94-10.94v-.26L.37.98zm22.44 9.47l-3.01-1.75-3.71 3.71 3.72 3.72 3.02-1.76c.86-.5.86-1.32-.02-1.92zM4.4.29L17.72 8.02l-3.37 3.47L4.4.29z',
  steam:    'M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.663 0-3.015 1.353-3.015 3.015 0 1.663 1.352 3.015 3.015 3.015 1.663 0 3.015-1.352 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z',
  egs:      'M0 0v16.021h6.241v2.088H12V24h12V0zm19.017 19.818h-4.776v-4.06H9.225V24H4.449V4.182h4.776v4.06h5.016V4.182h4.776z',
  // psn/xbox/nintendo (replaced): the previous three paths here weren't
  // actually those brands' logos at all — psn's path was some other PS
  // artifact (rendered as an unrelated "1D"-like glyph), xbox's was a
  // circle-of-diamonds mark with no relation to the Xbox sphere, and
  // nintendo's was the NES-era rounded-square "N" company logo, not the
  // Switch controller mark the app actually needs (Basic Info/Submission
  // show Nintendo as a current-gen platform). Replaced by request with the
  // real logos, sourced as plain monochrome path data (single currentColor
  // fill, viewBox 0 0 24 24, matching every other entry here) from the
  // simple-icons "PlayStation" glyph and the MDI "microsoft-xbox" /
  // "nintendo-switch" glyphs (MDI carries these two; simple-icons has
  // dropped both). Verified by rendering all three standalone and comparing
  // against the official brand marks pixel-for-pixel.
  psn:      'M8.984 2.596v17.547l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.18.76.814.76 1.505v5.875c2.441 1.193 4.362-.002 4.362-3.152 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.39-1.502zm4.656 16.241l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5V14.98l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.04 1.472 1.576 2.072-.465.6-1.622 1.036-1.622 1.036l-8.544 3.107V18.86zM1.807 18.6c-1.9-.545-2.214-1.668-1.352-2.32.801-.586 2.16-1.052 2.16-1.052l5.615-2.013v2.313L4.205 17c-.705.271-.825.632-.239.826.586.195 1.637.15 2.343-.12L8.247 17v2.074c-.12.03-.256.044-.39.073-1.939.331-3.996.196-6.038-.479z',
  xbox:     'M6.43,3.72C6.5,3.66 6.57,3.6 6.62,3.56C8.18,2.55 10,2 12,2C13.88,2 15.64,2.5 17.14,3.42C17.25,3.5 17.54,3.69 17.7,3.88C16.25,2.28 12,5.7 12,5.7C10.5,4.57 9.17,3.8 8.16,3.5C7.31,3.29 6.73,3.5 6.46,3.7M19.34,5.21C19.29,5.16 19.24,5.11 19.2,5.06C18.84,4.66 18.38,4.56 18,4.59C17.61,4.71 15.9,5.32 13.8,7.31C13.8,7.31 16.17,9.61 17.62,11.96C19.07,14.31 19.93,16.16 19.4,18.73C21,16.95 22,14.59 22,12C22,9.38 21,7 19.34,5.21M15.73,12.96C15.08,12.24 14.13,11.21 12.86,9.95C12.59,9.68 12.3,9.4 12,9.1C12,9.1 11.53,9.56 10.93,10.17C10.16,10.94 9.17,11.95 8.61,12.54C7.63,13.59 4.81,16.89 4.65,18.74C4.65,18.74 4,17.28 5.4,13.89C6.3,11.68 9,8.36 10.15,7.28C10.15,7.28 9.12,6.14 7.82,5.35L7.77,5.32C7.14,4.95 6.46,4.66 5.8,4.62C5.13,4.67 4.71,5.16 4.71,5.16C3.03,6.95 2,9.35 2,12A10,10 0 0,0 12,22C14.93,22 17.57,20.74 19.4,18.73C19.4,18.73 19.19,17.4 17.84,15.5C17.53,15.07 16.37,13.69 15.73,12.96Z',
  nintendo: 'M10.04,20.4H7.12C6.19,20.4 5.3,20 4.64,19.36C4,18.7 3.6,17.81 3.6,16.88V7.12C3.6,6.19 4,5.3 4.64,4.64C5.3,4 6.19,3.62 7.12,3.62H10.04V20.4M7.12,2A5.12,5.12 0 0,0 2,7.12V16.88C2,19.71 4.29,22 7.12,22H11.65V2H7.12M5.11,8C5.11,9.04 5.95,9.88 7,9.88C8.03,9.88 8.87,9.04 8.87,8C8.87,6.96 8.03,6.12 7,6.12C5.95,6.12 5.11,6.96 5.11,8M17.61,11C18.72,11 19.62,11.89 19.62,13C19.62,14.12 18.72,15 17.61,15C16.5,15 15.58,14.12 15.58,13C15.58,11.89 16.5,11 17.61,11M16.88,22A5.12,5.12 0 0,0 22,16.88V7.12C22,4.29 19.71,2 16.88,2H13.65V22H16.88Z',
  web:      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
};

/* ── Platforms ───────────────────────────────────────── */

const PLATFORMS = {
  steam: {
    id: 'steam', label: 'Steam', color: '#4c6b8a',
    steps: [
      { id: 'uploadBuild',            label: 'Upload Build'                            },
      { id: 'contentRating',          label: 'Content Rating',        hasInference: true },
      /* DATA SAFETY AND LOCALIZATIONS ARE STUBS HERE, and deliberately so —
         see buildSteamDataSafetySection / buildSteamLocalizationsSection
         (render.js), which render a heading and a Shipmate Tip through the
         shared buildStepStubSection and nothing else.

         They exist as STEPS rather than as nothing because the row is the
         thing being asked for: every other store in this prototype walks
         ratings -> data -> localizations -> store page, and Steam walking
         ratings -> store page made it the one platform whose checklist
         silently skipped two of the four questions a submission has to
         answer. A stub row states the question and admits it has no answer
         yet; an absent row states neither.

         Both mark complete on first visit (isSteamSectionComplete, below),
         which is the same visit-based gate storePreviewPrototype and
         improveSubmission already use — honest for a placeholder, because
         "you have seen this" is the only claim a stub can truthfully make.
         When either grows real questions, that arm is what changes. */
      { id: 'dataSafety',             label: 'Data Safety'                             },
      { id: 'localizations',          label: 'Localizations'                           },
      { id: 'storePreviewPrototype',  label: 'Store Page Preview'                      },
      { id: 'improveSubmission',      label: 'Improve Your Submission'                 },
    ],
  },
  // No 'gameCenter' step here — same "reached via Product Page Preview's
  // Achievements card, not its own Submission step" treatment as Mac App
  // Store's own steps list just below (see that array's own comment for
  // the full reasoning). buildIosGameCenterSection (render.js) still
  // renders it, openStepModal('ios','gameCenter') still opens it (exactly
  // what the Achievements card calls — buildStorePreviewSection's own
  // achievementsHtml, render.js), and isIOSSectionComplete('gameCenter')
  // still answers `true` for it.
  ios: {
    id: 'ios', label: 'App Store', color: '#007AFF',
    steps: [
      { id: 'uploadBuild',       label: 'Upload Build'                                 },
      { id: 'contentRating',     label: 'Content Rating',            hasInference: true },
      /* DATA SAFETY IS A STEP NOW, not only a face of the Product Page Preview.
         The questions were always here — isIOSSectionComplete('privacy'), the
         same ones Mac App Store Full has carried as its own 'App Privacy' row
         all along — but the only door was flipping the preview over, which is
         why the Shippy Checklist's own row had to ask each preview directly
         (see CHK_DATA_DONE, render.js) instead of asking a card step like every
         other row does.

         Immediately after Content Rating, which is what "after Content Rating
         and before Product Page Preview" resolves to once you notice
         Localizations sits between those two: this is the order the checklist
         already walks (ratings -> data safety -> localizations -> store pages)
         and the order Mac App Store Full already lists. The preview keeps its
         own "Answer Data Collection Questions" element — a second door, exactly
         as Content Rating has had both a step and a preview cell for as long as
         both have existed. */
      { id: 'privacy',           label: 'Data Safety'                                  },
      { id: 'localizations',    label: 'Localizations'                                },
      { id: 'storePreview',      label: 'Product Page Preview'                         },
      { id: 'improveSubmission', label: 'Improve Your Submission'                      },
    ],
  },
  // Mac App Store — a full, independent copy of the App Store (ios) platform
  // above: same icon (PLATFORM_ICONS.macos), same step shape/labels, same
  // "App Store Connect" login. Its own dedicated state (macSubmitAnswers,
  // macAnswerMeta, macAppStoreListing, etc. — see their definitions further
  // below) keeps its Upload Build / Product Page Preview / Business /
  // Content Rating / Privacy / IAP responses entirely separate from ios's —
  // answering a question or editing the listing text for one never affects
  // the other. Only the label differs ("Mac App Store" vs "App Store").
  macos: {
    id: 'macos', label: 'Mac App Store', color: '#007AFF',
    // No 'gameCenter' step here (same now true of macos_full's own steps
    // list below too) — removed as its own Submission step per request, now
    // that Product Page Preview's Achievements card (buildMacStorePreviewSection,
    // render.js) links straight into it. The step's content/id are otherwise fully
    // intact and still reachable exactly as before: buildMacGameCenterSection
    // (render.js) still renders it, openStepModal('macos','gameCenter') still
    // opens it (that's exactly what the Achievements card calls), and
    // isMacSectionComplete('gameCenter') (state.js) still answers `true` for
    // it (Achievements were always optional/non-blocking) — none of that
    // reasoning changes, it's just no longer counted as one of this
    // platform's own steps (platformStepCount, and every step-card list
    // that maps over PLATFORMS.macos.steps).
    steps: [
      { id: 'uploadBuild',       label: 'Upload Build'                                 },
      { id: 'contentRating',     label: 'Content Rating',            hasInference: true },
      /* DATA SAFETY IS A STEP NOW, not only a face of the Product Page Preview.
         The questions were always here — isIOSSectionComplete('privacy'), the
         same ones Mac App Store Full has carried as its own 'App Privacy' row
         all along — but the only door was flipping the preview over, which is
         why the Shippy Checklist's own row had to ask each preview directly
         (see CHK_DATA_DONE, render.js) instead of asking a card step like every
         other row does.

         Immediately after Content Rating, which is what "after Content Rating
         and before Product Page Preview" resolves to once you notice
         Localizations sits between those two: this is the order the checklist
         already walks (ratings -> data safety -> localizations -> store pages)
         and the order Mac App Store Full already lists. The preview keeps its
         own "Answer Data Collection Questions" element — a second door, exactly
         as Content Rating has had both a step and a preview cell for as long as
         both have existed. */
      { id: 'privacy',           label: 'Data Safety'                                  },
      { id: 'localizations',    label: 'Localizations'                                },
      { id: 'storePreview',      label: 'Product Page Preview'                         },
      { id: 'improveSubmission', label: 'Improve Your Submission'                      },
    ],
  },
  // Mac App Store Full — a from-scratch, fully independent copy of the Mac
  // App Store platform above, extended to cover every field an actual App
  // Store Connect submission asks for (see this project's own field-gap
  // research). Every one of its steps below is named after, and ordered to
  // match, the real App Store Connect section it corresponds to — Content
  // Rating is Apple's Age Rating questionnaire (still its own step, same as
  // every other platform, since it's a whole multi-part flow in its own
  // right). Nothing here is shared with ios/macos's own fields — see
  // macFullSubmitAnswers/macFullAnswerMeta/macFullAppStoreListing further
  // below, and _appStoreAnswers (app.js), which resolves macos_full to its
  // own answer objects the same way it already does for macos.
  //
  // No 'gameCenter' step here (same convention as macos's own steps list
  // above) — removed as its own Submission step per request, now that
  // Product Page Preview's Achievements card (buildMacFullStorePreviewSection,
  // render.js) links straight into it. The step's content/id are otherwise
  // fully intact and still reachable exactly as before:
  // buildMacFullGameCenterSection (render.js) still renders it,
  // openStepModal('macos_full','gameCenter') still opens it (that's exactly
  // what the Achievements card calls), and isMacFullSectionComplete('gameCenter')
  // (state.js) still answers `true` for it (Leaderboards are optional/
  // non-blocking) — none of that reasoning changes, it's just no longer
  // counted as one of this platform's own steps.
  macos_full: {
    id: 'macos_full', label: 'Mac App Store Full', color: '#007AFF',
    steps: [
      { id: 'uploadBuild',     label: 'Upload Build'                                  },
      { id: 'appInfo',         label: 'App Information Full'                         },
      { id: 'versionInfo',     label: 'App Review'                                    },
      { id: 'contentRating',   label: 'Age Rating',                hasInference: true },
      { id: 'privacy',         label: 'App Privacy'                                   },
      { id: 'versionRelease',  label: 'Version Release'                               },
      { id: 'storePreview',    label: 'Product Page Preview'                          },
      { id: 'localizations',   label: 'Localizations'                                 },
      { id: 'improveSubmission', label: 'Improve Your Submission'                     },
    ],
  },
  android: {
    id: 'android', label: 'Google Play', color: '#34A853',
    steps: [
      { id: 'uploadBuild',       label: 'Upload Build'                                 },
      { id: 'contentRating',     label: 'Content Rating',            hasInference: true },
      /* DATA SAFETY IS BACK AS A STEP, and nothing had to be built for it —
         which is the tell that it was only ever missing its row.
         buildAndroidDataSafetySection (render.js), the dispatch arm that
         calls it (_stepBodyFor), isAndroidSectionComplete('dataSafety'),
         computeAndroidSectionRisk('dataSafety') and the ANDROID_DATA_TYPES
         taxonomy were all live the whole time; the only door was flipping
         the Store Listing Preview over to its "Answer Data Collection
         Questions" face.

         That asymmetry was visible in two places and both now resolve by
         themselves. CHK_GLOW_STEPS.dataSafety (app.js) already listed
         'dataSafety' ahead of the preview steps and carried a comment
         saying Google Play has no such row and falls through to a flip —
         with the row back it stops flipping and points at the step, like
         every other checklist entry. And the Shippy Checklist's own
         CHK_DATA_DONE (render.js) had to ask each preview directly rather
         than asking a card step.

         Same position as the App Store's: immediately after Content Rating,
         which is the order the checklist already walks.

         LOCALIZATIONS IS A STUB (buildAndroidLocalizationsSection,
         render.js) — see the Steam steps above for why a placeholder row
         beats an absent one, and for what its visit-based completeness
         arm is admitting. */
      { id: 'dataSafety',        label: 'Data Safety'                                  },
      { id: 'localizations',     label: 'Localizations'                                },
      { id: 'storePreview',      label: 'Store Listing Preview'                        },
      { id: 'improveSubmission', label: 'Improve Your Submission'                      },
    ],
  },
  // egs/psn/xbox/nintendo below are also in COMING_SOON_PLATFORMS (render.js,
  // near buildInactiveCard) — the Submission dashboard's "+ Add platform"
  // picker (renderDashboard, render.js) greys these four out and shows a
  // lock instead of "+ Add", mirroring the Basic Info platform grid's own
  // locked-tile treatment (PLATFORMS_OB, buildObPlatTilesHTML). Reusing that
  // existing Set rather than adding a parallel comingSoon field here, since
  // it's already the single source of truth two other call sites (auto-
  // activation from a title-search picklist match) filter against.
  egs: {
    id: 'egs', label: 'Epic Games Store', color: '#313131',
    steps: [
      { id: 'reviewStoreListing', label: 'Review Store Listing' },
      { id: 'confirmMedia',       label: 'Confirm Media & Key Art' },
      { id: 'ratings',            label: 'Ratings (IARC)' },
      { id: 'releaseSettings',    label: 'Release Settings' },
      { id: 'storePreview',       label: 'Store Page Preview' },
      { id: 'reviewSubmission',   label: 'Review Submission',     isReview: true },
      { id: 'submit',             label: 'Submit',                isSubmit: true },
    ],
  },
  psn: {
    id: 'psn', label: 'PlayStation Store', color: '#003791',
    steps: [
      { id: 'reviewStoreListing', label: 'Review Store Listing' },
      { id: 'confirmMedia',       label: 'Confirm Media & Key Art' },
      { id: 'ageRatings',         label: 'Age Ratings' },
      { id: 'releaseSettings',    label: 'Release Settings' },
      { id: 'storePreview',       label: 'Store Page Preview' },
      { id: 'reviewSubmission',   label: 'Review Submission',     isReview: true },
      { id: 'submit',             label: 'Submit to PlayStation', isSubmit: true },
    ],
  },
  xbox: {
    id: 'xbox', label: 'XBOX | Microsoft Store', color: '#107C10',
    steps: [
      { id: 'reviewStoreListing', label: 'Review Store Listing' },
      { id: 'confirmMedia',       label: 'Confirm Media' },
      { id: 'ageRatings',         label: 'Age Ratings (IARC)' },
      { id: 'certRequirements',   label: 'Certification Requirements' },
      { id: 'storePreview',       label: 'Store Page Preview' },
      { id: 'reviewSubmission',   label: 'Review Submission',     isReview: true },
      { id: 'submit',             label: 'Submit to Xbox',        isSubmit: true },
    ],
  },
  nintendo: {
    id: 'nintendo', label: 'Nintendo eShop', color: '#E4000F',
    steps: [
      { id: 'reviewStoreListing', label: 'Review Store Listing' },
      { id: 'confirmMedia',       label: 'Confirm Media & Key Art' },
      { id: 'ageRatings',         label: 'Age Ratings' },
      { id: 'releaseSettings',    label: 'Release Settings' },
      { id: 'storePreview',       label: 'Store Page Preview' },
      { id: 'reviewSubmission',   label: 'Review Submission',     isReview: true },
      { id: 'submit',             label: 'Submit to Nintendo',    isSubmit: true },
    ],
  },
  web: {
    id: 'web', label: 'Web', color: '#0EA5A4',
    steps: [
      { id: 'storePreview',       label: 'Preview Website' },
      { id: 'submit',             label: 'Deploy',                isSubmit: true },
    ],
  },
};

/* ── Platform developer credentials (prototype-only) ─────────────────────────
   Drives the login face shown when a platform card is first activated. These
   fields are faked: any non-empty values are accepted and nothing is stored or
   transmitted. Each entry describes the developer portal the studio signs into
   and the credential fields that portal asks for. Falls back to GENERIC_LOGIN. */
const PLATFORM_LOGIN = {
  ios: {
    portal: 'App Store Connect', provider: 'Apple',
    userLabel: 'Apple ID', userType: 'email', userPlaceholder: 'you@studio.com',
  },
  // Same portal as ios — Mac App Store submissions also go through App
  // Store Connect with an Apple ID.
  macos: {
    portal: 'App Store Connect', provider: 'Apple',
    userLabel: 'Apple ID', userType: 'email', userPlaceholder: 'you@studio.com',
  },
  // Same portal/credentials as macos — Mac App Store Full submits through
  // the exact same App Store Connect, it just covers more of it.
  macos_full: {
    portal: 'App Store Connect', provider: 'Apple',
    userLabel: 'Apple ID', userType: 'email', userPlaceholder: 'you@studio.com',
  },
  android: {
    portal: 'Google Play Console', provider: 'Google',
    userLabel: 'Google Account', userType: 'email', userPlaceholder: 'you@studio.com',
  },
  steam: {
    portal: 'Steamworks', provider: 'Steam',
    userLabel: 'Steam Account', userType: 'text', userPlaceholder: 'account name or email',
  },
  egs: {
    portal: 'Epic Developer Portal', provider: 'Epic',
    userLabel: 'Epic Account', userType: 'email', userPlaceholder: 'you@studio.com',
  },
  psn: {
    portal: 'PlayStation Partners', provider: 'Sony',
    userLabel: 'Partner Sign-In ID', userType: 'email', userPlaceholder: 'you@studio.com',
  },
  xbox: {
    portal: 'Partner Center', provider: 'Microsoft',
    userLabel: 'Microsoft Account', userType: 'email', userPlaceholder: 'you@studio.com',
  },
  nintendo: {
    portal: 'Nintendo Developer Portal', provider: 'Nintendo',
    userLabel: 'NDID', userType: 'text', userPlaceholder: 'developer ID',
  },
};
const GENERIC_LOGIN = {
  portal: 'the developer portal', provider: 'Platform',
  userLabel: 'Email', userType: 'email', userPlaceholder: 'you@studio.com',
};
function platformLoginConfig(pid) { return PLATFORM_LOGIN[pid] || GENERIC_LOGIN; }

/* ── Connect flow (prototype onboarding wizard) ──────────────────────────────
   Per-platform account-connection flow used by the Connect wizard. Mirrors the
   headless-auth model: install the extension, sign in on the *real* portal
   (credentials only where the platform needs them), approve Shipmate's bot
   account, then Shipmate provisions a key / grant. Google Play uses OAuth and
   skips the extension. All faked — nothing is stored or sent. */
const CONNECT_FLOWS = {
  steam:   { needsExtension: true,  auth: 'password', twofa: 'Steam Guard code',        role: 'Partner',          mintsKey: false, oauth: false },
  ios:     { needsExtension: true,  auth: 'apple',    twofa: 'Apple verification code', role: 'App Manager',      mintsKey: true,  oauth: false },
  macos:   { needsExtension: true,  auth: 'apple',    twofa: 'Apple verification code', role: 'App Manager',      mintsKey: true,  oauth: false },
  macos_full: { needsExtension: true, auth: 'apple',  twofa: 'Apple verification code', role: 'App Manager',      mintsKey: true,  oauth: false },
  android: { needsExtension: false, auth: 'google',   twofa: null,                      role: 'Service account',  mintsKey: false, oauth: true  },
};
function connectFlowConfig(pid) { return CONNECT_FLOWS[pid] || CONNECT_FLOWS.steam; }

// Ordered step ids for a platform's connect wizard. The extension step drops
// out once the extension is installed; Google Play uses a single OAuth step.
function connectStepList(pid) {
  const f = connectFlowConfig(pid);
  if (f.oauth) return ['intro', 'google', 'done'];
  const s = ['intro'];
  if (f.needsExtension && !state.extensionInstalled) s.push('extension');
  s.push('login', 'approve');
  if (f.mintsKey) s.push('mint');
  s.push('done');
  return s;
}

// The Shipmate bot account address shown during the approve step.
function shipmateBotEmail() { return 'shipmate-7864124@sound.games'; }

/* ── Helpers ─────────────────────────────────────────── */

function makeEmptyPlatformSteps() {
  const out = {};
  for (const [pid, p] of Object.entries(PLATFORMS)) {
    out[pid] = {};
    for (const s of p.steps) out[pid][s.id] = 'not_started';
  }
  return out;
}

// Returns a platform's steps array, filtering out steps that are
// conditionally hidden right now. Currently only 'localizations' is
// conditional — it's an App Store/Mac App Store/Mac App Store Full-only
// step that only shows once one or more supported languages have been
// added in Game Details - Localization (state.formData.localizations).
// Every render/count/numbering call site that walks a platform's steps
// list (buildIOSActiveCard, platformStepCount, _paintStepRow,
// updateIOSCard) must use this instead of the raw PLATFORMS[pid].steps so
// the step disappears/reappears and renumbers consistently everywhere.
/* ── WHAT A STORE TAKES AS A BUILD ───────────────────────────────────────────
   In state.js, which loads before everything that reads it, because the accept
   list was written twice — once on the Improve step's binary chip and once on
   the build pill — and two copies of a validation rule is the shape this file
   keeps a section about. They already agreed; they had no mechanism to go on
   agreeing.

   The lists are the stores' own, and the Mac one is the one people trip on:
   Apple takes a signed **.pkg** for Mac App Store distribution. A `.app` and an
   `.xcarchive` are directory BUNDLES, not files — a browser file input cannot
   accept either, whatever we put in this list — and an `.ipa` is iOS. That is
   the whole reason `note` exists: without it the control silently refuses three
   things a Mac developer would reasonably try first and explains none of them. */
/* `hint` IS AN INSTRUCTION, NOT A FORMAT LIST. "Accepts PKG or ZIP" tells you
   what the control will swallow; "Export a signed .pkg from Xcode" tells you
   what to go and do, which is the actual question someone staring at an empty
   Upload Build has. It names the TOOL only where one extension is the real
   answer — Apple's two stores both want a signed .pkg or .ipa out of Xcode, so
   Xcode is named; Android and Steam accept a genuine either/or produced by any
   number of pipelines, so naming one would be wrong more often than right.
   `accept` stays the full list: what we recommend and what we permit are two
   different things, and the file dialog should keep permitting both. */
const SM_BUILD_ACCEPT = {
  ios:        { accept: '.ipa',      hint: 'Export a signed .ipa from Xcode',
                note: '.app and .xcarchive are folders, not files.' },
  macos:      { accept: '.pkg,.zip', hint: 'Export a signed .pkg from Xcode',
                note: '.app and .xcarchive are folders, not files.' },
  macos_full: { accept: '.pkg,.zip', hint: 'Export a signed .pkg from Xcode',
                note: '.app and .xcarchive are folders, not files.' },
  android:    { accept: '.apk,.aab', hint: 'Upload an .aab or .apk' },
  steam:      { accept: '.exe,.zip', hint: 'Upload an .exe or .zip' },
};
const SM_BUILD_ACCEPT_DEFAULT = { accept: '.exe,.zip', hint: 'Upload an .exe or .zip' };

function smBuildAccept(pid) { return SM_BUILD_ACCEPT[pid] || SM_BUILD_ACCEPT_DEFAULT; }

/* IS UPLOAD BUILD FINISHED? — one answer, five callers.

   It was written out five times, once per platform's isXxxSectionComplete, as
   "there is a build and it is not still being analysed". Identical copies, so
   they agreed; no mechanism to keep agreeing, which is the shape this file has
   a section about.

   AND A BUILD WITH NO DESTINATION IS NOT A FINISHED STEP. Shape 4 moved the
   track picker into the release block precisely so choosing a destination sits
   beside the build it routes — and v6.29 folded that block into Upload Build's
   own body, so the step now literally contains the question. Answering "which
   build" and leaving "where does it go" blank is half a step, and it used to
   count as a whole one: the disc went green, the tab's dash went green, and the
   only thing that still knew a track was missing was submitStepClick's third
   gate, discovered at the very end by pressing Submit and being refused.

   Platforms with no PLATFORM_TRACKS entry (Web, the consoles) are finished as
   soon as the binary is in — there is no destination to choose, and requiring
   one would deadlock them.

   **AND THE SAME SENTENCE IS FALSE IN THE CARD GRID, BECAUSE THE PICKER IS NOT
   IN THE STEP THERE.** Read the paragraph above closely: every word of its
   argument rests on "v6.29 folded that block into Upload Build's own body, so
   the step now literally contains the question". In `submission.layout ===
   'modal'` it does not — the release block is the card's own chrome, two rows
   ABOVE the step list, and shape 4 put it there on purpose. So the predicate
   was holding a step to a control that is nowhere inside it.

   **A step disc answers for what the step CONTAINS.** That is the rule, and the
   layout test is not a special case for one arm — it is how this expression
   asks where the picker currently lives. Jaco: *"en el flag modal dudo que eso
   tenga que ser así? quizás debería marcarse el check sí o sí."*

   Measured, the card contradicted itself twice over. The Upload Build row holds
   the build pill, which draws a green check and the filename — `build-pill
   has-build` — while its own disc beside it stayed a bare `ios-step-num`: one
   row, two answers. And pressing Submit never even reached the destination
   gate: with Upload Build incomplete, gate 2 fired first and spotlighted that
   row, so the app answered "finish this step" by pointing at the one row that
   looks finished.

   **The destination did not stop being required — it stopped being a CHECKLIST
   item and became a property of the press.** Where the build goes is the
   question the act of submitting asks, and `submitStepClick`'s gate 3 is where
   it is asked: press Submit with no track and the card dims to the chip. That
   is Jaco's other half — *"sólo si doy a submit y falta elegir el track, se
   oscurezca todo para elegir el track"* — and it needed its own fix to work
   here at all (see that gate).

   The cost, stated rather than hidden: on a card the Submit row now goes green
   with no destination chosen, and the first press refuses. That is the exact
   failure the paragraph above complains about — and it is the right trade HERE
   and only here, because the picker is permanently on screen saying "Select
   track" and the refusal points straight at it. It also happens at most once:
   choosing a track is one press and it is remembered. In the pane the picker is
   inside the step body, where a green disc over an unanswered control really
   would be the step lying about its own contents, so that arm is untouched. */
function _uploadBuildComplete(pid) {
  if (!state.platformBuilds?.[pid]) return false;
  if (state.platformBuildProcessing?.[pid]) return false;
  if (state.submission?.layout === 'modal') return true;
  const tracks = (typeof PLATFORM_TRACKS !== 'undefined') ? PLATFORM_TRACKS[pid] : null;
  if (!tracks || !tracks.length) return true;
  return !!(state.selectedTracks || {})[pid];
}

/* ONE PLACE THAT STAMPS "YOU HAVE SEEN THIS", AND THERE WERE TWO.

   Several steps are complete on first visit rather than on any answer —
   Product Page Preview, Localizations, and now Steam's two stubs — so the
   openers have to stamp a flag on the way in. That stamping was written out
   longhand in BOTH openers (openStepModal and the inline pane's own opener),
   and the two copies had already drifted: one ended `else if (pid === 'ios')`
   and the other ended in a bare `else`, i.e. a catch-all that wrote
   `iosLocalizationsSeen` for whatever platform was passed.

   That catch-all was harmless only for as long as ios/macos/macos_full were
   the only platforms with a Localizations step. They are not any more, and it
   would have had Google Play's Localizations row silently tick the App
   Store's flag — a step on one platform completing a step on another.

   So the stamping is one function and the openers call it. Adding a
   visit-based step means one arm here rather than two edits that can
   disagree, which is this file's standing argument against an inventory.

   It writes and returns nothing; the callers already render after it. */
function _markStepVisited(pid, stepId) {
  if (stepId === 'storePreview') {
    if (pid === 'web') { if (state.platformStepStatus?.web) state.platformStepStatus.web.storePreview = 'complete'; }
    else if (pid === 'macos')      state.macStorePreviewSeen     = true;
    else if (pid === 'macos_full') state.macFullStorePreviewSeen = true;
    else if (pid === 'ios')        state.iosStorePreviewSeen     = true;
    else if (pid === 'android')    state.androidSubmitAnswers.storePreviewSeen = true;
  }
  if (stepId === 'storePreviewPrototype' && pid === 'steam') {
    state.steamSubmitAnswers.storePreviewPrototypeSeen = true;
  }
  if (stepId === 'localizations') {
    if (pid === 'macos')           state.macLocalizationsSeen     = true;
    else if (pid === 'macos_full') state.macFullLocalizationsSeen = true;
    else if (pid === 'android')    state.androidSubmitAnswers.localizationsSeen = true;
    else if (pid === 'steam')      state.steamSubmitAnswers.localizationsSeen   = true;
    else                           state.iosLocalizationsSeen     = true;
  }
  if (stepId === 'dataSafety' && pid === 'steam') {
    state.steamSubmitAnswers.dataSafetySeen = true;
  }
}

/* THE LOCALIZATIONS RULE IS ABOUT THE STEP, NOT ABOUT APPLE.

   This used to name ios/macos/macos_full explicitly, because those were the
   only three platforms with a 'localizations' step. Steam and Google Play
   have one now, and the reason the row hides has nothing to do with which
   store it belongs to: a Localizations step is ABOUT the languages you chose
   in Game Details, so with none chosen there is nothing for it to be about —
   on any store. Naming the platforms would have been a list that goes stale
   the next time a platform gains the step, which is this file's own recurring
   lesson about inventories.

   So the pid check is gone and the condition is the one that was always
   doing the work. It is a no-op for a platform with no such step, since the
   filter then removes nothing. */
function _visiblePlatformSteps(pid) {
  const p = PLATFORMS[pid];
  if (!p) return [];
  if (!(state.formData.localizations || []).length) {
    return p.steps.filter(s => s.id !== 'localizations');
  }
  return p.steps;
}

/* THE SELECTED SUBMISSION TAB, HEALED ON EVERY READ.

   `state.submission.tab` is a platform id and platform ids come and go —
   deactivatePlatform can remove the one you are looking at, and switching
   project rebuilds activePlatforms wholesale. A stale id there renders an empty
   pane under a strip of tabs that all look fine, which is the failure mode this
   exists to make impossible: every read validates against activePlatforms and
   falls back to the first active platform in PLATFORM_ORDER.

   It does NOT write back. A getter that repairs state is a getter that mutates
   during render, which this codebase separates on purpose (render reads, app.js
   writes) — and there is nothing to persist anyway, since the same fallback
   runs again on the next read. selectPlatformTab (app.js) is the only writer. */
function submissionTab() {
  const t = state.submission?.tab;
  if (t && state.activePlatforms.has(t)) return t;
  return PLATFORM_ORDER.find(pid => state.activePlatforms.has(pid)) || null;
}

/* The steps a pane draws, for ANY platform, in one expression.

   The four card builders each walked their own list and they had drifted into
   three shapes: ios/macos/macos_full through _visiblePlatformSteps (so a hidden
   'localizations' renumbers the rest), android/steam straight off
   PLATFORMS[pid].steps, and the generic builder off p.steps with an
   `isSubmit` filter because only egs/psn/xbox/nintendo/web carry that entry.

   All three are the same list once you say it properly: visible steps, minus
   the submit row, which every builder appends separately through
   buildSubmitStepCard. _visiblePlatformSteps already returns p.steps untouched
   for the platforms with no conditional step, so it is safe for all of them —
   the filter is what the generic arm was really doing. */
function _paneSteps(pid) {
  return _visiblePlatformSteps(pid).filter(s => !s.isSubmit);
}

/* ── "The developer actually opened this" ─────────────────────────────────
   Some steps can read as finished purely from their answers, which is wrong
   for a questionnaire whose answers Shipmate INFERRED on the developer's
   behalf: every question can carry a confident machine answer nobody has
   looked at, and the card would go green announcing work that hasn't been
   reviewed. STEP_REQUIRES_VISIT names the steps that additionally need the
   section to have been opened at least once.

   Deliberately keyed per PLATFORM as well as per step, not per step alone —
   but a platform's visit can COUNT FOR ITS TWIN, which is what
   SHARED_VISIT_PLATFORMS below says and why this stayed per-platform rather
   than collapsing to a bare step id.

   This used to read "two separate cards, two separate confirmations", and that
   was the wrong unit. Mac App Store does not have its own content-rating
   questionnaire to confirm: isMacSectionComplete('contentRating') delegates
   straight to the App Store's, and IOS_MAC_SHARED_ANSWER_FIELDS routes every
   write to the same state.iosSubmitAnswers. There is ONE questionnaire, so
   asking the developer to open it twice asks them to confirm the same answers
   a second time and tells them nothing new — it just left "Set content
   ratings" unticked with no visible reason, since both cards were already
   showing the rating those answers produced.

   Set by markStepSectionSeen from the two places a step can be opened —
   openStepModal and toggleStepSection (app.js) — and read here rather than
   inside isIOSSectionComplete and friends, which stay purely about answers:
   Product Page Preview's own completeness reads those same functions (see
   the 'storePreview' arms), and it was never asked to wait on a visit. */
const STEP_REQUIRES_VISIT = new Set(['contentRating']);

/* WHOSE VISIT COUNTS. Platforms listed together in one group answer a step
   from the SAME stored answers, so opening it on any one of them is the review
   for all of them. Keyed by step rather than declared globally because sharing
   is a property of the answers, not of the platforms: ios/macos share content
   rating (isMacSectionComplete delegates) and nothing else here.

   macos_full is deliberately absent. Per PLATFORMS.macos_full's "fully
   independent" decision, isMacFullSectionComplete never delegates to the App
   Store's answers — it reads state.macFullSubmitAnswers — so its content-rating
   questionnaire really is a second one and really does need its own look. */
const SHARED_VISIT_PLATFORMS = {
  contentRating: [['ios', 'macos']],
};

function _stepVisitPeers(pid, stepId) {
  const groups = SHARED_VISIT_PLATFORMS[stepId];
  if (!groups) return [pid];
  return groups.find(g => g.includes(pid)) || [pid];
}

function isStepSectionSeen(pid, stepId) {
  return !!(state.stepSectionSeen && state.stepSectionSeen[pid] && state.stepSectionSeen[pid][stepId]);
}

function markStepSectionSeen(pid, stepId) {
  if (!pid || !stepId) return;
  if (!state.stepSectionSeen) state.stepSectionSeen = {};
  if (!state.stepSectionSeen[pid]) state.stepSectionSeen[pid] = {};
  state.stepSectionSeen[pid][stepId] = true;
}

/* IS THIS PLATFORM'S STEP DONE? — one answer, and now genuinely one.
   The per-platform isXxxSectionComplete switch was written out twice, here
   and as _paneComplete (render.js), and the two had already drifted apart on
   which platforms they special-cased. They are the same question, so this is
   the one that answers it: _paneComplete now delegates here, and
   platformStepCount below uses it instead of calling each isXxx directly —
   which also means the visit gate above can't be satisfied on the card while
   being ignored by the Submit button's own allRequired count. */
function platformSectionComplete(pid, stepId) {
  if (!stepVisitSatisfied(pid, stepId)) return false;
  return _platformAnswersComplete(pid, stepId);
}

function stepVisitSatisfied(pid, stepId) {
  if (!STEP_REQUIRES_VISIT.has(stepId)) return true;
  return _stepVisitPeers(pid, stepId).some(p => isStepSectionSeen(p, stepId));
}

function _platformAnswersComplete(pid, stepId) {
  if (pid === 'android')    return isAndroidSectionComplete(stepId);
  if (pid === 'steam')      return isSteamSectionComplete(stepId);
  if (pid === 'macos_full') return isMacFullSectionComplete(stepId);
  if (pid === 'macos')      return isMacSectionComplete(stepId);
  if (pid === 'ios')        return isIOSSectionComplete(stepId);
  return state.platformStepStatus?.[pid]?.[stepId] === 'complete';
}

/* ── THE UNNUMBERED STEP ──────────────────────────────────────────────────
   "Connect account to publish" is a real requirement and the only one on the
   card with no numbered row: it lives on the gear (_platformHeadActions,
   render.js), which is why it was missed. The card went green —
   `.submit-ready`, whose whole sentence is "this can go" — with nothing on the
   other end to send it to, while submitStepClick's own first gate refused the
   press and shook the gear. Two surfaces, two answers, and the card was the one
   making the promise.

   So it joins `allRequired` rather than being tested again at the outline.
   Every reader of that flag is asking the same question — the card's border,
   the Submit row's lock, and the submit button's title — and none of them ever
   meant "the numbered ones are done".

   IT IS DELIBERATELY NOT ADDED TO `total`/`complete`. Those two count the
   numbered rows the card draws; they feed the "N / M steps" label and the
   progress bar, so an unnumbered requirement in that fraction would print a
   total the card does not show. Readiness is a conjunction, not a bigger count.

   Web is exempt, the same exemption submitStepClick already makes: it has no
   developer-portal credentials to connect (see showAccountFace, render.js), so
   requiring one there would be a gate with no door.

   The raw read stays in ONE place. `isPlatformConnected` (render.js) is the
   question "is this connected"; this is the question "does this platform still
   need connecting", which is that one plus the web exemption. render.js loads
   after this file but every call happens at runtime, so the delegation is
   always live; the fallback is only for a call during load. */
function platformAccountReady(pid) {
  if (pid === 'web') return true;
  if (typeof isPlatformConnected === 'function') return isPlatformConnected(pid);
  return !!state.platformAuth?.[pid]?.loggedIn;
}

function platformStepCount(platformId) {
  const p = PLATFORMS[platformId];
  // Binary build upload is required for submit unlock on iOS/Android/Steam
  const hasBuild = !!(state.platformBuilds?.[platformId]);
  // iOS: completion is computed from submission answers, not manual task status
  if (platformId === 'ios') {
    const steps = _visiblePlatformSteps(platformId);
    const complete = steps.filter(s => platformSectionComplete(platformId, s.id)).length;
    // uploadBuild step completion already requires hasBuild, so no separate hasBuild check needed
    return { total: steps.length, complete, submitDone: false,
             allRequired: complete === steps.length && platformAccountReady(platformId) };
  }
  // Mac App Store: completion is computed from its own macSubmitAnswers,
  // exactly like iOS above — without this branch it would silently fall
  // through to the generic platformStepStatus-based default below, which
  // nothing ever actually sets for Mac App Store's steps, permanently
  // showing 0 of N complete on its dashboard card.
  if (platformId === 'macos') {
    const steps = _visiblePlatformSteps(platformId);
    const complete = steps.filter(s => platformSectionComplete(platformId, s.id)).length;
    return { total: steps.length, complete, submitDone: false,
             allRequired: complete === steps.length && platformAccountReady(platformId) };
  }
  // Mac App Store Full: completion is computed from its own
  // macFullSubmitAnswers, same reasoning as the 'macos' branch above —
  // without this branch it would silently fall through to the generic
  // platformStepStatus-based default below, which nothing ever sets for
  // this platform's steps either.
  if (platformId === 'macos_full') {
    const steps = _visiblePlatformSteps(platformId);
    const complete = steps.filter(s => platformSectionComplete(platformId, s.id)).length;
    return { total: steps.length, complete, submitDone: false,
             allRequired: complete === steps.length && platformAccountReady(platformId) };
  }
  // Android: completion is computed from androidSubmitAnswers
  if (platformId === 'android') {
    const complete = p.steps.filter(s => platformSectionComplete(platformId, s.id)).length;
    return { total: p.steps.length, complete, submitDone: false,
             allRequired: complete === p.steps.length && platformAccountReady(platformId) };
  }
  // Steam: completion is computed from steamSubmitAnswers
  if (platformId === 'steam') {
    const complete = p.steps.filter(s => platformSectionComplete(platformId, s.id)).length;
    return { total: p.steps.length, complete, submitDone: false,
             allRequired: complete === p.steps.length && platformAccountReady(platformId) };
  }
  const required = p.steps.filter(s => !s.isSubmit);
  const statuses = state.platformStepStatus[platformId] || {};
  const complete = required.filter(s => statuses[s.id] === 'complete').length;
  return {
    total:      required.length,
    complete,
    submitDone: statuses['submit'] === 'complete',
    allRequired: complete === required.length && platformAccountReady(platformId),
  };
}

/* ── iOS Submit Questionnaire ────────────────────────── */

// Full Apple App Privacy data type taxonomy (matches App Store Connect questionnaire)
const IOS_DATA_TYPES = [
  { group: 'Contact Info', types: [
    { id: 'name',            label: 'Name',                   desc: 'Including first or last name', common: true },
    { id: 'email',           label: 'Email Address',          desc: 'Including but not limited to a hashed email address', common: true },
    { id: 'phone',           label: 'Phone Number',           desc: 'Including but not limited to a hashed phone number' },
    { id: 'address',         label: 'Physical Address',       desc: 'Such as a home address, physical address, or mailing address' },
    { id: 'other_contact',   label: 'Other Contact Info',     desc: 'Any other information that can be used to contact the user outside the app' },
  ]},
  { group: 'Health & Fitness', types: [
    { id: 'health',          label: 'Health',                 desc: 'Health and medical data, including but not limited to from the Clinical Health Records API, HealthKit API, or user provided health data' },
    { id: 'fitness',         label: 'Fitness',                desc: 'Fitness and exercise data, including but not limited to the Motion and Fitness API' },
  ]},
  { group: 'Financial Info', types: [
    { id: 'payment_info',    label: 'Payment Info',           desc: 'Such as form of payment, payment card number, or bank account number' },
    { id: 'credit_info',     label: 'Credit Info',            desc: 'Such as credit score' },
    { id: 'other_financial', label: 'Other Financial Info',   desc: 'Such as salary, income, assets, debts, or any other financial information' },
  ]},
  { group: 'Location', types: [
    { id: 'precise_loc',     label: 'Precise Location',       desc: 'Location with the same or greater resolution as latitude/longitude with three or more decimal places' },
    { id: 'coarse_loc',      label: 'Coarse Location',        desc: 'Approximate location, such as city-level or approximate location services' },
  ]},
  { group: 'Sensitive Info', types: [
    { id: 'sensitive',       label: 'Sensitive Info',         desc: 'Such as racial or ethnic data, sexual orientation, religious beliefs, political opinion, biometric data, or similar' },
  ]},
  { group: 'Contacts', types: [
    { id: 'contacts',        label: 'Contacts',               desc: "Such as a list of contacts in the user's phone, address book, or social graph" },
  ]},
  { group: 'User Content', types: [
    { id: 'messages',        label: 'Emails or Messages',     desc: 'Including subject line, sender, recipients, and contents of the email or message' },
    { id: 'photos_videos',   label: 'Photos or Videos',       desc: "The user's photos or videos" },
    { id: 'audio',           label: 'Audio Data',             desc: "The user's voice or sound recordings" },
    { id: 'gameplay',        label: 'Gameplay Content',       desc: 'Such as user-generated content in-game', common: true },
    { id: 'customer_support',label: 'Customer Support',       desc: 'Data generated by the user during a customer support request' },
    { id: 'other_uc',        label: 'Other User Content',     desc: 'Any other user-generated content' },
  ]},
  { group: 'Browsing History', types: [
    { id: 'browsing',        label: 'Browsing History',       desc: 'Information about content the user has viewed outside the app, such as websites' },
  ]},
  { group: 'Search History', types: [
    { id: 'search',          label: 'Search History',         desc: 'Information about searches performed in the app' },
  ]},
  { group: 'Identifiers', types: [
    { id: 'user_id',         label: 'User ID',                desc: 'Such as screen name, account ID, customer number, or other user-level ID', common: true },
    { id: 'device_id',       label: 'Device ID',              desc: "Such as the device's advertising identifier or other device-level ID", common: true },
  ]},
  { group: 'Purchases', types: [
    { id: 'purchases',       label: 'Purchase History',       desc: "An account's or individual's purchases or purchase tendencies", common: true },
  ]},
  { group: 'Usage Data', types: [
    { id: 'product_use',     label: 'Product Interaction',    desc: 'Such as app launches, taps, clicks, scrolling, saved place in a game, or other interaction data', common: true },
    { id: 'ad_data',         label: 'Advertising Data',       desc: 'Such as information about the advertisements the user has seen', common: true },
    { id: 'other_usage',     label: 'Other Usage Data',       desc: 'Any other data about user activity in the app' },
  ]},
  { group: 'Diagnostics', types: [
    { id: 'crash',           label: 'Crash Data',             desc: 'Such as crash logs', common: true },
    { id: 'performance',     label: 'Performance Data',       desc: 'Such as launch time, hang rate, or energy use', common: true },
    { id: 'other_diag',      label: 'Other Diagnostic Data',  desc: 'Any other data collected for measuring technical diagnostics' },
  ]},
  { group: 'Surroundings', types: [
    { id: 'env_scan',        label: 'Environment Scanning',   desc: "Such as mesh, planes, scene classification, and/or image detection of the user's surroundings" },
  ]},
  { group: 'Body', types: [
    { id: 'hands',           label: 'Hands',                  desc: "The user's hand structure and hand movements" },
    { id: 'head',            label: 'Head',                   desc: "The user's head movement" },
  ]},
  { group: 'Other Data', types: [
    { id: 'other',           label: 'Other Data',             desc: 'Any other data types not mentioned' },
  ]},
];

// Flat type lookup: typeId → { id, label, desc, group }
const IOS_DATA_TYPE_LOOKUP = {};
IOS_DATA_TYPES.forEach(g => g.types.forEach(t => { IOS_DATA_TYPE_LOOKUP[t.id] = { ...t, group: g.group }; }));

// How each collected data type is used (per-type selection)
/* `head` IS THE COLUMN HEADING, BROKEN WHERE WE CHOOSE (v6.49).
   Jaco, looking at a mockup of the row: *"mola que casi todos tengan 2 lineas,
   queda más ordenado."* He is right, and the reason is worth stating: a header
   row that breaks in the same place in every cell reads as ONE BAND, where a
   ragged mix of one and two lines reads as eight separate captions sitting
   above a table. Same argument as the metadata strip's equal tiles.

   IT HAS TO BE EXPLICIT, not a width that happens to wrap there. Sized so the
   natural wrap lands right, the break is luck: one more character in a
   translation, or a font that falls back, and a column silently becomes one
   line or three while its neighbours do not. Stating the lines is also what
   lets the column be sized by the longest WORD rather than by the longest
   label — which is the whole reason this row can be narrow at all.

   `label` STAYS FLAT because it is not only a heading: `_triggerPrivacyAI`
   (app.js) builds its prompt out of `${p.id}: ${p.label} — ${p.desc}`, and a
   `<br>` or a newline in there would be sent to the model. One field per job.

   Personalization takes Apple's own full name now — "Product Personalization" —
   which costs nothing once the heading is two lines, and the second word was
   already the widest thing in this row either way. */
/* `head` IS TWO LINES, ALWAYS — AND TWO OF THEM ARE ABBREVIATED (v6.52).
   The heading row is ONE BAND, which is v6.49's argument and is unchanged: a
   row that breaks in the same place in every cell reads as one object, where a
   ragged mix of one and two lines reads as eight captions sitting over a table.
   What changed is that the band now has to hold EIGHT columns in a 748px table
   rather than in an 870px one, and at 79px a column the full names do not fit.

   SO THE ABBREVIATION IS THE COLUMN'S FLOOR SPEAKING, not a style choice.
   Measured, the two words that decided the old 98px column were
   "Personalization" (84.0) and "Functionality" (79.2) — the longest WORD is the
   floor because everything else wraps. Shortened to "Personaliz." and
   "Functional." the longest line in any purpose is 66px, which sits inside the
   75 a 79px column leaves after its 2px of padding each side. Nothing else in
   the row had to move.

   NOTHING IS LOST, because the heading is not the only place the name is
   printed: the `<th>` is a tooltip anchor carrying `label` AND `desc` in full,
   so Apple's own wording is one hover away. An abbreviation that hides a name
   with no way back would not be worth 40px of modal; one with the full name
   attached is just the column being honest about its width.

   ANALYTICS KEEPS AN EMPTY FIRST LINE for the same band argument, printed as a
   non-breaking space by the builder. It is one word and cannot break, so
   centred it floated between its neighbours' two lines and read as misplaced.

   `label` STAYS FLAT AND FULL, and that is load-bearing twice over:
   `_triggerPrivacyAI` (app.js) builds its prompt out of
   `${p.id}: ${p.label} — ${p.desc}`, so an abbreviation here would be sent to
   the model, and `PRIVACY_PRESETS[].description` names these purposes in
   Apple's own words for the same reader. The heading is a drawing; the label is
   the fact. */
const IOS_PURPOSES = [
  { id: 'first_party_ads',  label: 'Ads & Marketing',          head: ['Ads &', 'Marketing'],           desc: "Displaying first-party ads, sending marketing communications, or sharing data with entities who will display your ads" },
  { id: 'third_party_ads',  label: '3rd-Party Advertising',    head: ['3rd-Party', 'Advertising'],     desc: "Displaying third-party ads in your app, or sharing data with entities who display third-party ads" },
  { id: 'analytics',        label: 'Analytics',                head: ['', 'Analytics'],                desc: "Evaluating user behavior, including to understand effectiveness of existing features, plan new features, or measure audience size" },
  { id: 'personalization',  label: 'Product Personalization',  head: ['Product', 'Personaliz.'],       desc: "Customizing what the user sees, such as a list of recommended products, posts, or suggestions" },
  { id: 'app_function',     label: 'App Functionality',        head: ['App', 'Functional.'],           desc: "Such as to authenticate the user, enable features, prevent fraud, implement security measures, or perform customer support" },
  { id: 'other_purpose',    label: 'Other Purposes',           head: ['Other', 'Purposes'],            desc: "Any other purpose not listed" },
];

const IOS_INTENSITY_QUESTIONS = [
  // Step 2: Mature Themes
  { id: 'profanity',         label: 'Profanity or Crude Humor',
    tooltip: 'Offensive or vulgar language considered rude, obscene, or inappropriate. Includes swearing, slurs, insult-based humor, or jokes about bodily functions.' },
  { id: 'horrorFear',        label: 'Horror/Fear Themes',
    tooltip: 'Content evoking anxiety, dread, or terror. Includes supernatural elements, body horror, or fear of isolation and death.' },
  { id: 'substancesAlcohol', label: 'Alcohol, Tobacco, or Drug Use',
    tooltip: 'Depictions of alcohol, tobacco, or drug use. Includes drunken behavior, smoking, or illegal drug consumption.' },
  // Step 3: Medical or Wellness
  { id: 'medicalTreatment',  label: 'Medical or Treatment Information',
    tooltip: 'Diagnoses or guidance on medical conditions or health. Includes medication guidance, emergency care, or treatment information.' },
  // Step 4: Sexuality or Nudity
  { id: 'matureSuggestive',  label: 'Mature or Suggestive Themes',
    tooltip: 'Implicit sexual references or mature topics for older audiences. Includes innuendo, suggestive imagery, implied nudity, trauma, or political strife.' },
  { id: 'sexualContent',     label: 'Sexual Content or Nudity',
    tooltip: 'Non-explicit depictions of sexual behavior or partial nudity. Includes mild romantic intimacy, implied sexual activity, or sensual dialog.' },
  { id: 'graphicSexual',     label: 'Graphic Sexual Content and Nudity',
    tooltip: 'Explicit depictions of sexual activity or nudity. Includes full-frontal nudity or pornographic portrayals of sex.' },
  // Step 5: Violence
  { id: 'cartoonViolence',   label: 'Cartoon or Fantasy Violence',
    tooltip: 'Exaggerated or fantastical conflict easily distinguished from real life. Includes animated combat, magic used to cause harm, or cartoon violence.' },
  { id: 'realisticViolence', label: 'Realistic Violence',
    tooltip: 'Physical conflict or harm involving humans in lifelike situations. Includes injuries from punches, shoot-outs, or combat between characters.' },
  { id: 'extendedViolence',  label: 'Extended Graphic or Sadistic Violence',
    tooltip: 'Prolonged realistic depictions of physical conflict. Includes extreme gore, human injury, or death.' },
  { id: 'gunsWeapons',       label: 'Guns or Other Weapons',
    tooltip: 'References to or depictions of guns, weapons, or objects that may cause bodily harm. Includes guns, swords, or knives.' },
  // Step 6: Chance-Based Activities
  { id: 'simulatedGambling', label: 'Simulated Gambling',
    tooltip: 'Wagering without real money. Includes simulated casino games, sports betting, or other wagering with no monetary value.' },
  { id: 'contests',          label: 'Contests',
    tooltip: 'Users compete for rankings or rewards. Includes skill-based competitions, trivia quizzes, or sport and fitness challenges.' },
];

const IOS_CONTENT_YN_QUESTIONS = [
  // Step 1: In-App Controls
  { id: 'parentalControls',    label: 'Parental Controls',
    tooltip: 'Tools allowing parents to monitor or restrict a child\'s in-app access. Includes content filtering, usage limits, or purchase restrictions.' },
  { id: 'ageAssurance',        label: 'Age Assurance',
    tooltip: 'Confirms a user\'s age meets requirements for specific content. Includes API checks, age estimation, or government ID verification.' },
  // Step 1: Capabilities
  { id: 'unrestrictedInternet', label: 'Unrestricted Web Access',
    tooltip: 'Users can navigate to any webpage or freely browse the web. Includes embedded browser functionality or browser app.' },
  { id: 'userGenContent',      label: 'User-Generated Content',
    tooltip: 'User-created content broadly distributed as part of the app experience. Includes videos, photos, text, or audio shared by users.' },
  { id: 'messagingChat',       label: 'Messaging and Chat',
    tooltip: 'Direct user-to-user communication within the app. Includes text, voice, or video chat, group messaging, or public posting.' },
  { id: 'advertising',         label: 'Advertising',
    tooltip: 'Paid promotion of products or services within the app. Includes banner ads, video ads, rich media, or native ad formats.' },
  // Step 3: Medical or Wellness
  { id: 'healthWellness',      label: 'Health or Wellness Topics',
    tooltip: 'Self-care or lifestyle recommendations. Includes calorie tracking, dieting advice, or exercise recommendations.' },
  // Step 6: Chance-Based Activities (Yes/No)
  { id: 'realMoneyGambling',   label: 'Gambling',
    tooltip: 'Wagering using real money or currency exchangeable for real money. Includes casino games, sports betting, lotteries, and raffles.' },
  { id: 'lootBoxes',           label: 'Loot Boxes',
    tooltip: 'Randomized virtual item containers available for purchase. Includes randomized functional cards or cosmetic items.' },
];

// Content Rating + Data Privacy fields that Mac App Store SHARES with the
// App Store — literally the same answer, stored once in state.iosSubmitAnswers/
// iosAnswerMeta regardless of which platform's UI you answered it from. See
// _appStoreAnswers/_appStoreAnswerMeta (app.js), the single choke point that
// routes a (pid, fieldId) pair to the correct backing object. Business
// Questions fields (hasIAP, usesEncryption, taxCategory, iapProducts, etc.)
// are deliberately NOT in this set — those stay fully independent per
// platform (state.macSubmitAnswers), unchanged from the original Mac App
// Store feature. Title/Subtitle are a separate, listing-text-specific
// sharing concern (see MAS_SHARED_LISTING_FIELDS, app.js) — they don't live
// in *SubmitAnswers at all, so they're not part of this set either.
const IOS_MAC_SHARED_ANSWER_FIELDS = new Set([
  ...IOS_INTENSITY_QUESTIONS.map(q => q.id),
  ...IOS_CONTENT_YN_QUESTIONS.map(q => q.id),
  'ageCategory', 'kidsAgeRange', 'overrideRating', 'ageSuitabilityUrl',
  'privacyPolicyUrl', 'collectsData', 'privacyDescription', 'dataPerType',
]);

// Apple-distributable countries, sorted by approximate iOS user count (millions)
// gamers = estimated total gamers (all platforms: mobile, PC, console) in
// millions (2024, approx). Sorted descending so the first entry is the max.
const IOS_COUNTRIES = [
  { code: 'CN', name: 'China',            lang: 'zh', num: 156, gamers: 700 },
  { code: 'IN', name: 'India',            lang: 'en', num: 356, gamers: 450 },
  { code: 'US', name: 'United States',    lang: 'en', num: 840, gamers: 215 },
  { code: 'ID', name: 'Indonesia',        lang: 'id', num: 360, gamers: 170 },
  { code: 'BR', name: 'Brazil',           lang: 'pt', num: 76,  gamers: 100 },
  { code: 'RU', name: 'Russia',           lang: 'ru', num: 643, gamers: 90  },
  { code: 'MX', name: 'Mexico',           lang: 'es', num: 484, gamers: 76  },
  { code: 'JP', name: 'Japan',            lang: 'ja', num: 392, gamers: 75  },
  { code: 'VN', name: 'Vietnam',          lang: 'vi', num: 704, gamers: 55  },
  { code: 'DE', name: 'Germany',          lang: 'de', num: 276, gamers: 50  },
  { code: 'PK', name: 'Pakistan',         lang: 'ur', num: 586, gamers: 50  },
  { code: 'TR', name: 'Turkey',           lang: 'tr', num: 792, gamers: 48  },
  { code: 'EG', name: 'Egypt',            lang: 'ar', num: 818, gamers: 45  },
  { code: 'PH', name: 'Philippines',      lang: 'en', num: 608, gamers: 43  },
  { code: 'GB', name: 'United Kingdom',   lang: 'en', num: 826, gamers: 40  },
  { code: 'NG', name: 'Nigeria',          lang: 'en', num: 566, gamers: 40  },
  { code: 'FR', name: 'France',           lang: 'fr', num: 250, gamers: 39  },
  { code: 'TH', name: 'Thailand',         lang: 'th', num: 764, gamers: 35  },
  { code: 'IT', name: 'Italy',            lang: 'it', num: 380, gamers: 35  },
  { code: 'KR', name: 'South Korea',      lang: 'ko', num: 410, gamers: 33  },
  { code: 'ES', name: 'Spain',            lang: 'es', num: 724, gamers: 30  },
  { code: 'ZA', name: 'South Africa',     lang: 'en', num: 710, gamers: 30  },
  { code: 'AR', name: 'Argentina',        lang: 'es', num: 32,  gamers: 28  },
  { code: 'CO', name: 'Colombia',         lang: 'es', num: 170, gamers: 25  },
  { code: 'CA', name: 'Canada',           lang: 'en', num: 124, gamers: 23  },
  { code: 'SA', name: 'Saudi Arabia',     lang: 'ar', num: 682, gamers: 23  },
  { code: 'MY', name: 'Malaysia',         lang: 'ms', num: 458, gamers: 22  },
  { code: 'PL', name: 'Poland',           lang: 'pl', num: 616, gamers: 20  },
  { code: 'UA', name: 'Ukraine',          lang: 'uk', num: 804, gamers: 20  },
  { code: 'PE', name: 'Peru',             lang: 'es', num: 604, gamers: 17  },
  { code: 'AU', name: 'Australia',        lang: 'en', num: 36,  gamers: 17  },
  { code: 'IQ', name: 'Iraq',             lang: 'ar', num: 368, gamers: 15  },
  { code: 'TW', name: 'Taiwan',           lang: 'zh', num: 158, gamers: 13  },
  { code: 'CL', name: 'Chile',            lang: 'es', num: 152, gamers: 13  },
  { code: 'NL', name: 'Netherlands',      lang: 'nl', num: 528, gamers: 12  },
  { code: 'RO', name: 'Romania',          lang: 'ro', num: 642, gamers: 12  },
  { code: 'KZ', name: 'Kazakhstan',       lang: 'ru', num: 398, gamers: 8   },
  { code: 'AE', name: 'UAE',              lang: 'ar', num: 784, gamers: 7   },
  { code: 'SE', name: 'Sweden',           lang: 'sv', num: 752, gamers: 7   },
  { code: 'BE', name: 'Belgium',          lang: 'fr', num: 56,  gamers: 7   },
  { code: 'CZ', name: 'Czech Republic',   lang: 'cs', num: 203, gamers: 7   },
  { code: 'PT', name: 'Portugal',         lang: 'pt', num: 620, gamers: 7   },
  { code: 'GR', name: 'Greece',           lang: 'el', num: 300, gamers: 6   },
  { code: 'HU', name: 'Hungary',          lang: 'hu', num: 348, gamers: 6   },
  { code: 'HK', name: 'Hong Kong',        lang: 'zh', num: 344, gamers: 6   },
  { code: 'AT', name: 'Austria',          lang: 'de', num: 40,  gamers: 6   },
  { code: 'SG', name: 'Singapore',        lang: 'en', num: 702, gamers: 5   },
  { code: 'CH', name: 'Switzerland',      lang: 'de', num: 756, gamers: 5   },
  { code: 'IL', name: 'Israel',           lang: 'he', num: 376, gamers: 5   },
  { code: 'DK', name: 'Denmark',          lang: 'da', num: 208, gamers: 4   },
  { code: 'FI', name: 'Finland',          lang: 'fi', num: 246, gamers: 4   },
  { code: 'NO', name: 'Norway',           lang: 'no', num: 578, gamers: 4   },
  { code: 'NZ', name: 'New Zealand',      lang: 'en', num: 554, gamers: 3   },
  { code: 'KW', name: 'Kuwait',           lang: 'ar', num: 414, gamers: 3   },
  { code: 'QA', name: 'Qatar',            lang: 'ar', num: 634, gamers: 2   },
];

const IOS_SECTIONS = [
  { id: 'privacy',       label: 'Data Privacy'      },
  { id: 'contentRating', label: 'Content Rating'    },
  { id: 'business',      label: 'Business'          },
  { id: 'storePreview',  label: 'Store Page Preview'},
];

function makeBlankIOSAnswers() {
  return {
    // Privacy
    privacyPolicyUrl:       '',
    collectsData:           null,   // 'yes' / 'no'
    privacyDescription:     '',     // plain-language description → AI translates to privacy labels
    // dataPerType: { [typeId]: { purposes: [], identity: null, tracking: null } }
    dataPerType:            {},
    // Content Rating — Step 1: Features (Yes/No)
    parentalControls:       null,
    ageAssurance:           null,
    unrestrictedInternet:   null,
    userGenContent:         null,
    messagingChat:          null,
    advertising:            null,
    // Content Rating — Step 2: Mature Themes (intensity: null / 'none' / 'infrequent' / 'frequent')
    profanity:              null,
    horrorFear:             null,
    substancesAlcohol:      null,
    // Content Rating — Step 3: Medical or Wellness (pre-populated for most games)
    /* THE ONLY TWO CONTENT-RATING QUESTIONS THAT SHIP PRE-ANSWERED, and they
       are Shipmate's answers, not the developer's. Every other question in
       IOS_CR_CATEGORIES starts null. Left as-is they read as work someone had
       already done — which, before _platformAIClass was inverted, painted them
       the SELECTION BLUE that means "you confirmed this", on two legal
       declarations nobody had looked at. They now render violet like any other
       answer Shipmate provides. If either default goes away, nothing else has
       to change: violet follows "not humanConfirmed", not this line. */
    medicalTreatment:       'none',
    healthWellness:         'no',
    // Content Rating — Step 4: Sexuality or Nudity (intensity)
    matureSuggestive:       null,
    sexualContent:          null,
    graphicSexual:          null,
    // Content Rating — Step 5: Violence (intensity)
    cartoonViolence:        null,
    realisticViolence:      null,
    extendedViolence:       null,
    gunsWeapons:            null,
    // Content Rating — Step 6: Chance-Based Activities
    simulatedGambling:      null,
    contests:               null,
    realMoneyGambling:      null,
    lootBoxes:              null,
    // Content Rating — Step 7: Additional Information
    ageCategory:            null,   // 'not_applicable' / 'made_for_kids' / 'override_higher'
    kidsAgeRange:           null,   // 'under5' / '6to8' / '9to11'
    overrideRating:         null,   // '9' / '13' / '16' / '18'
    ageSuitabilityUrl:      '',
    // Export Compliance
    usesEncryption:         null,
    encryptionExempt:       null,
    hasERN:                 null,
    ernNumber:              '',
    // Business
    hasIAP:                 null,
    // iapTypes is no longer settable via the UI (the "Which IAP types does
    // your app include?" question was removed — see buildIapSection,
    // render.js) but is left in place since claude.js's inference pipeline
    // can still populate it as background/legacy metadata.
    iapTypes:               [],
    // hasFreeTrial is likewise no longer settable via the UI (the
    // section-level "Does any subscription include a free trial?" question
    // was removed — each product's own "Free trial?" row in
    // buildIapProductRow, render.js, covers this per-product instead) but
    // is left in place for the same reason as iapTypes above.
    hasFreeTrial:           null,
    // IAP Products — the individual named SKUs shown in the Business
    // section's "IAP Products" list (see buildIapProductRow, render.js;
    // addIapProduct/removeIapProduct/setIapProductField/setIapProductType/
    // setIapProductTrial/saveIapProduct/expandIapProduct, app.js). Each:
    // { id, name, desc, price, type, trial, collapsed }. Purely additive
    // — an empty list never blocks Business section completion (see
    // isIOSSectionComplete below), same as a developer who's declared they
    // have IAP but hasn't named individual products yet.
    iapProducts:            [],
    taxCategory:            'games',
    // Distribution
    selectedCountries:      [],
    distPreset:             'everywhere',
    // Improve Your Submission — marks complete on first view
    improveSubmissionSeen:  false,
  };
}

/* Mac App Store Full's blank-answers shape — starts from the exact same
   Content Rating/Privacy/Export Compliance/IAP Products question set as
   makeBlankIOSAnswers() above (spread in first), then adds every field
   needed to cover the rest of a real App Store Connect submission end to
   end, per this project's own field-gap research
   (build_mas_fields_steam_equivalents_v2.py) and the "fully independent"
   design decision: none of this is shared with iosSubmitAnswers or
   macSubmitAnswers — see PLATFORMS.macos_full's comment and
   _appStoreAnswers/_appStoreAnswerMeta (app.js), which resolve 'macos_full'
   to state.macFullSubmitAnswers/macFullAnswerMeta the same way 'macos'
   already resolves to their own objects. Fields are grouped below by the
   App Store Connect section they belong to, matching PLATFORMS.macos_full's
   own step order. Complex ASC constructs (Price Schedule, Subscription
   Groups, Game Center) are deliberately simplified per the "simplified but
   functional" design decision — flat repeatable lists capturing the
   essential data points, not a replica of Apple's exact multi-screen flows. */
function makeBlankMacFullAnswers() {
  return {
    ...makeBlankIOSAnswers(),

    // App Information — Primary Category is hard-set to Games (Shipmate only
    // handles game submissions) and Bundle ID is a locked instructional
    // placeholder rather than real user input; see buildMacFullAppInfoSection,
    // render.js, for both.
    category:                { primary: 'Games', secondary: '', subcategory1: '', subcategory2: '' },
    contentRights:            null,   // 'yes' / 'no' — "Does your app contain, show, or access third-party content?"
    bundleId:                 'Must match the Bundle ID used in Xcode.',
    sku:                      '',

    // Pricing and Availability — base Price is deliberately NOT duplicated
    // here; it stays shared game-wide via state.formData.price, same
    // "shared by every store that bills in a single base price" design
    // already used by ios/macos (see buildBusinessSection's comment,
    // render.js). Tax Category is likewise not read from state for this
    // pid — buildBusinessSection('macos_full') renders a fixed, locked
    // "Games" field directly rather than the shared taxCategory value
    // inherited from makeBlankIOSAnswers above (that value still defaults
    // to 'games' too, for parity with ios/macos, but nothing ever reads
    // it here).
    availability:             { mode: 'all', countries: [] },  // mode: 'all' | 'select'

    // App Review Information
    reviewContact:            { firstName: '', lastName: '', phone: '', email: '' },
    demoAccount:              { required: null, username: '', password: '' },  // required: 'yes' / 'no'
    reviewNotes:              '',
    reviewAttachment:         null,   // { name, size }

    // Version Release
    releaseOption:            'automatic',  // 'automatic' / 'manual' / 'scheduled'
    scheduledReleaseDate:     '',
    phasedRelease:            false,

    // Subscriptions — repeatable groups, each with repeatable tiers
    subscriptionGroups:       [],   // { id, name, tiers: [{ id, refName, productId, duration, price, hasIntroOffer }] }

    // Game Center
    gameCenter: {
      leaderboards: [],   // { id, name, gcId, scoreFormat, collapsed, saved } — collapsed/saved drive the same collapse-on-save, one-expanded-at-a-time, drag-to-reorder presentation as macFullGameCenterAchievements (see addMacFullLeaderboard/saveMacFullLeaderboard, app.js)
      achievements: [],   // { id, name, description, points, hidden }
      multiplayer:  { enabled: false, minPlayers: null, maxPlayers: null },
    },
  };
}

function computeIOSSectionRisk(sectionId) {
  if (sectionId === 'questionnaire') {
    const risks = ['privacy','contentRating','business'].map(computeIOSSectionRisk);
    if (risks.includes('HIGH'))   return 'HIGH';
    if (risks.includes('MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }
  const a    = state.iosSubmitAnswers;
  const meta = state.iosAnswerMeta;

  function fieldStatus(fieldId) {
    if (a[fieldId] === null || a[fieldId] === undefined) return 'missing';
    const m = meta[fieldId];
    if (!m) return 'human';
    if (m.humanConfirmed) return 'human';
    if (m.confidence >= 90) return 'certain';
    return 'confident';
  }

  function evalFields(fieldIds) {
    const statuses = fieldIds.map(fieldStatus);
    if (statuses.includes('missing'))   return 'HIGH';
    if (statuses.includes('confident')) return 'MEDIUM';
    return 'LOW';
  }

  if (sectionId === 'privacy') {
    // Privacy URL completeness is surfaced via required-field alerts (after Save & Close),
    // not via the risk dot — so we only evaluate the data-collection answer here.
    return evalFields(['collectsData']);
  }

  if (sectionId === 'contentRating') {
    const fields = [
      ...IOS_INTENSITY_QUESTIONS.map(q => q.id),
      ...IOS_CONTENT_YN_QUESTIONS.map(q => q.id),
      'ageCategory',
    ];
    return evalFields(fields);
  }

  if (sectionId === 'business') {
    if (a.usesEncryption === null) return 'HIGH';
    const fields = ['hasIAP', 'usesEncryption'];
    if (a.usesEncryption === 'yes') fields.push('encryptionExempt');
    return evalFields(fields);
  }

  if (sectionId === 'distribution') {
    if (a.selectedCountries.length === 0) return 'NONE';
    if (a.selectedCountries.includes('CN')) return 'MEDIUM';
    return 'LOW';
  }

  return 'NONE';
}

/* ── "Every required element on the page", not four of the eight ──────────
   Product Page Preview draws its own required-elements list (ALL_ELEMENTS,
   render.js) and it has eight entries: Title, Subtitle, Business, Content,
   Adjust Screenshots, Description, Achievements (optional) and Data
   Collection. The step's completeness only ever asked FOUR of them — the
   sections you flip to — so a listing with no Subtitle at all reported the
   step done, the card went green, and the preview underneath it was still
   glowing at an empty field. The Submission checklist inherits that answer
   through _chkEveryPlatformComplete, so "Build store pages" ticked too.

   The three plain text fields are the missing half, and they are read through
   the SAME accessors the preview reads (_iasFieldValue / _masFieldValue, which
   route Title/Subtitle to the App Store's shared storage via
   MAS_SHARED_LISTING_FIELDS) so the tick and the glow cannot disagree about
   what is filled in. Primary language only: a supporting language's
   translation is the Localizations step's business, not this one's.

   Guarded because state.js loads before app.js — on the very first call
   during boot the accessors may not exist yet, and the raw formData fields are
   the same answer for the primary language. */
const STORE_LISTING_REQUIRED_FIELDS = ['title', 'subtitle', 'description'];

function _storeListingTextComplete(pid) {
  const fd   = state.formData || {};
  const lang = fd.primaryLanguage || 'en';
  const read = (pid === 'macos' && typeof _masFieldValue === 'function') ? _masFieldValue
             : (typeof _iasFieldValue === 'function') ? _iasFieldValue
             : null;
  return STORE_LISTING_REQUIRED_FIELDS.every(f => {
    const v = read ? read(f, lang) : fd[f];
    return !!(v || '').trim();
  });
}

function isIOSSectionComplete(sectionId) {
  // Upload Build step is complete when a build is uploaded and not processing
  if (sectionId === 'uploadBuild') return _uploadBuildComplete('ios');

  // Screenshots (now embedded inside storePreview flow). Optional-once-present:
  // the preview pre-populates from the Game Details screenshots and those already
  // display, so any available screenshot is sufficient to submit — the developer
  // only opens "Adjust Screenshots" if they want to curate. Not a hard gate.
  if (sectionId === 'screenshots') {
    /* EMPTYING THE LISTING IS AN ANSWER, AND IT IS "NOT DONE". This used to
       read the two POOLS — anything selected, anything uploaded — which is the
       right question while the only thing a developer can do is pick. Now that
       the Screenshots editor can take shots OUT of a listing, a platform whose
       every screenshot has been removed still had an upload in the pool and
       still reported complete, with nothing in the store row underneath it.
       `platformStoreShots` is what the preview draws, so it is what the tick
       has to agree with. Guarded because state.js loads before render.js;
       identical to the old expression on an untouched listing. */
    if (typeof platformStoreShots === 'function') return platformStoreShots('ios').length > 0;
    const ps = state.platformScreenshots?.ios;
    if (ps && (ps.selected.length > 0 || ps.custom.length > 0)) return true;
    return (state.uploads?.screenshots || []).length > 0;
  }
  if (sectionId === 'improveSubmission') return !!state.iosSubmitAnswers.improveSubmissionSeen;

  // Game Center Achievements are purely additive, same as Mac App Store's
  // own (isMacSectionComplete's own comment) — an empty list never blocks
  // submission. Not one of PLATFORMS.ios.steps (see that array's own
  // comment, further above) — reached instead via Product Page Preview's
  // Achievements card — but isIOSSectionComplete('gameCenter') is still
  // asked for by the shared step-modal chrome (renderStepModal, render.js),
  // so it needs an answer.
  if (sectionId === 'gameCenter') return true;

  // Localizations is a unified editing surface over Store Page/IAPs/
  // Achievements' own already-tracked localization data — it never gates on
  // any field of its own, but (like storePreview below) still requires the
  // developer to have actually opened and reviewed it at least once before
  // counting as done, so a step nothing's forced them to look at doesn't
  // silently show as complete.
  if (sectionId === 'localizations') return !!state.iosLocalizationsSeen;

  // storePreview is complete when every required element on the page is —
  // the four sub-sections you flip to AND the three text fields you type in
  // (see _storeListingTextComplete above for why those were the missing half).
  if (sectionId === 'storePreview') {
    return isIOSSectionComplete('contentRating') &&
           isIOSSectionComplete('privacy') &&
           isIOSSectionComplete('business') &&
           isIOSSectionComplete('screenshots') &&
           _storeListingTextComplete('ios');
  }

  // Questionnaire (legacy — kept for backward compat)
  if (sectionId === 'questionnaire') {
    return isIOSSectionComplete('contentRating') &&
           isIOSSectionComplete('privacy') &&
           isIOSSectionComplete('business');
  }

  const a = state.iosSubmitAnswers;

  /* DATA COLLECTION QUESTIONS — THE PRESET IS OPTIONAL (v6.55).

     This used to require a purpose on every flagged data type, and in practice
     that made the preset chips mandatory without ever saying so: flagging a
     type (togglePrivacyDataType, app.js) creates it with `purposes: []`, and a
     preset is the only thing that fills them in bulk. A developer who ticked
     the types their game actually collects, by hand, and skipped the presets —
     which are offered as a shortcut, not a step — was left with a section that
     would not go green and no visible reason why.

     By request the bar is now the three answers the section really asks for:
     the collect-data question, a privacy policy URL, and — only when the
     answer is Yes — at least one data type flagged. Purposes still matter and
     the risk scoring still reads them (computeIOSSectionRisk, below), so an
     under-filled table still says so; it just no longer blocks submission.

     Mac App Store gets this for free: isMacSectionComplete delegates 'privacy'
     straight here, since both platforms answer these questions once into the
     same state.iosSubmitAnswers. */
  if (sectionId === 'privacy') {
    // Accept URL from either the step modal field or the onboarding field
    const url = (a.privacyPolicyUrl || state.formData.privacyUrl || '').trim();
    if (!url) return false;
    if (a.collectsData === null) return false;
    if (a.collectsData === 'yes' && Object.keys(a.dataPerType).length === 0) return false;
    return true;
  }

  if (sectionId === 'contentRating') {
    if (!IOS_INTENSITY_QUESTIONS.every(q => a[q.id] !== null)) return false;
    if (!IOS_CONTENT_YN_QUESTIONS.every(q => a[q.id] !== null)) return false;
    if (a.ageCategory === null) return false;
    if (a.ageCategory === 'made_for_kids'   && a.kidsAgeRange  === null) return false;
    if (a.ageCategory === 'override_higher' && a.overrideRating === null) return false;
    return true;
  }

  if (sectionId === 'business') {
    // IAP
    if (a.hasIAP === null) return false;
    // Export compliance (merged into business step)
    if (a.usesEncryption === null) return false;
    if (a.usesEncryption === 'yes') {
      if (a.encryptionExempt === null) return false;
      if (a.encryptionExempt === 'no') {
        if (a.hasERN === null) return false;
        if (a.hasERN === 'yes' && !a.ernNumber.trim()) return false;
      }
    }
    return true;
  }

  if (sectionId === 'distribution') {
    return a.selectedCountries.length > 0;
  }

  // (An older `return !!state.iosStorePreviewSeen` arm sat here. It was
  // unreachable — the real 'storePreview' branch above returns first — so it
  // was a trap for anyone editing it expecting a behaviour change.)

  return false;
}

/* Mac App Store twins of computeIOSSectionRisk/isIOSSectionComplete above —
   identical logic, reading state.macSubmitAnswers/state.macStorePreviewSeen
   and the 'macos' entries of the already pid-keyed state.platformBuilds/
   platformBuildProcessing/platformScreenshots maps instead of 'ios' ones, so
   Mac App Store's own step completion/risk never affects (or is affected
   by) the App Store's. Kept as a full separate function, matching how
   Android/Steam already have their own isXxxSectionComplete/
   computeXxxSectionRisk rather than a single generic parameterized one. */
function computeMacSectionRisk(sectionId) {
  // Content Rating and Data Privacy answers are shared with the App Store
  // (state.iosSubmitAnswers/iosAnswerMeta — see IOS_MAC_SHARED_ANSWER_FIELDS
  // and _appStoreAnswers/_appStoreAnswerMeta, app.js) — delegate straight to
  // the iOS computation so the two platforms can never disagree about the
  // very same answers.
  if (sectionId === 'privacy' || sectionId === 'contentRating') {
    return computeIOSSectionRisk(sectionId);
  }
  if (sectionId === 'questionnaire') {
    const risks = ['privacy','contentRating','business'].map(computeMacSectionRisk);
    if (risks.includes('HIGH'))   return 'HIGH';
    if (risks.includes('MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }
  const a    = state.macSubmitAnswers;
  const meta = state.macAnswerMeta;

  function fieldStatus(fieldId) {
    if (a[fieldId] === null || a[fieldId] === undefined) return 'missing';
    const m = meta[fieldId];
    if (!m) return 'human';
    if (m.humanConfirmed) return 'human';
    if (m.confidence >= 90) return 'certain';
    return 'confident';
  }

  function evalFields(fieldIds) {
    const statuses = fieldIds.map(fieldStatus);
    if (statuses.includes('missing'))   return 'HIGH';
    if (statuses.includes('confident')) return 'MEDIUM';
    return 'LOW';
  }

  if (sectionId === 'business') {
    if (a.usesEncryption === null) return 'HIGH';
    const fields = ['hasIAP', 'usesEncryption'];
    if (a.usesEncryption === 'yes') fields.push('encryptionExempt');
    return evalFields(fields);
  }

  if (sectionId === 'distribution') {
    if (a.selectedCountries.length === 0) return 'NONE';
    if (a.selectedCountries.includes('CN')) return 'MEDIUM';
    return 'LOW';
  }

  return 'NONE';
}

function isMacSectionComplete(sectionId) {
  if (sectionId === 'uploadBuild') return _uploadBuildComplete('macos');

  if (sectionId === 'screenshots') {
    // Optional-once-present, same as iOS — the preview shows Game Details
    // screenshots by default, so any available screenshot is enough to submit.
    /* EMPTYING THE LISTING IS AN ANSWER, AND IT IS "NOT DONE". This used to
       read the two POOLS — anything selected, anything uploaded — which is the
       right question while the only thing a developer can do is pick. Now that
       the Screenshots editor can take shots OUT of a listing, a platform whose
       every screenshot has been removed still had an upload in the pool and
       still reported complete, with nothing in the store row underneath it.
       `platformStoreShots` is what the preview draws, so it is what the tick
       has to agree with. Guarded because state.js loads before render.js;
       identical to the old expression on an untouched listing. */
    if (typeof platformStoreShots === 'function') return platformStoreShots('macos').length > 0;
    const ps = state.platformScreenshots?.macos;
    if (ps && (ps.selected.length > 0 || ps.custom.length > 0)) return true;
    return (state.uploads?.screenshots || []).length > 0;
  }
  if (sectionId === 'improveSubmission') return !!state.macSubmitAnswers.improveSubmissionSeen;

  // Game Center Achievements are purely additive — same convention as IAP
  // Products elsewhere (see makeBlankIOSAnswers' comment): a developer with
  // no achievements simply leaves the list empty, so an empty list never
  // blocks submission.
  if (sectionId === 'gameCenter') return true;

  // Localizations is a unified editing surface over Store Page/IAPs/
  // Achievements' own already-tracked localization data — it never gates on
  // any field of its own, but (same as iOS's own isIOSSectionComplete
  // above) still requires the developer to have actually opened and
  // reviewed it at least once before counting as done.
  if (sectionId === 'localizations') return !!state.macLocalizationsSeen;

  // Content Rating and Data Privacy are answered ONCE, shared with the App
  // Store (state.iosSubmitAnswers — see IOS_MAC_SHARED_ANSWER_FIELDS and
  // _appStoreAnswers, app.js), so Mac App Store's own completion for these
  // two sections is always identical to the App Store's — delegate rather
  // than re-derive from state.macSubmitAnswers, which no longer receives
  // writes for these fields at all.
  if (sectionId === 'privacy' || sectionId === 'contentRating') {
    return isIOSSectionComplete(sectionId);
  }

  // Same eight-element bar as the App Store's own — see
  // _storeListingTextComplete. Title/Subtitle resolve to the App Store's
  // shared storage and Description to Mac's own, exactly as this preview
  // reads them.
  if (sectionId === 'storePreview') {
    return isMacSectionComplete('contentRating') &&
           isMacSectionComplete('privacy') &&
           isMacSectionComplete('business') &&
           isMacSectionComplete('screenshots') &&
           _storeListingTextComplete('macos');
  }

  if (sectionId === 'questionnaire') {
    return isMacSectionComplete('contentRating') &&
           isMacSectionComplete('privacy') &&
           isMacSectionComplete('business');
  }

  const a = state.macSubmitAnswers;

  if (sectionId === 'business') {
    if (a.hasIAP === null) return false;
    if (a.usesEncryption === null) return false;
    if (a.usesEncryption === 'yes') {
      if (a.encryptionExempt === null) return false;
      if (a.encryptionExempt === 'no') {
        if (a.hasERN === null) return false;
        if (a.hasERN === 'yes' && !a.ernNumber.trim()) return false;
      }
    }
    return true;
  }

  if (sectionId === 'distribution') {
    return a.selectedCountries.length > 0;
  }

  // (Unreachable twin of the iOS arm above, removed for the same reason.)

  return false;
}

/* Mac App Store Full twins of computeMacSectionRisk/isMacSectionComplete
   above — but, per this platform's "fully independent" design decision
   (see PLATFORMS.macos_full's comment), these NEVER delegate to iOS/Mac
   App Store's own answers the way isMacSectionComplete does for privacy/
   contentRating. Every section here reads state.macFullSubmitAnswers
   directly. The step list itself is also organized by App Store Connect
   section (see PLATFORMS.macos_full.steps) rather than iOS/Mac App
   Store's smaller, more bundled step list, so this function's branches
   don't mirror isMacSectionComplete's one-to-one — Content Rating/Privacy/
   IAP/Export Compliance still read the same generic question sets, just
   split across more, more narrowly-named steps. */
function computeMacFullSectionRisk(sectionId) {
  const a    = state.macFullSubmitAnswers;
  const meta = state.macFullAnswerMeta;

  function fieldStatus(fieldId) {
    if (a[fieldId] === null || a[fieldId] === undefined) return 'missing';
    const m = meta[fieldId];
    if (!m) return 'human';
    if (m.humanConfirmed) return 'human';
    if (m.confidence >= 90) return 'certain';
    return 'confident';
  }

  function evalFields(fieldIds) {
    const statuses = fieldIds.map(fieldStatus);
    if (statuses.includes('missing'))   return 'HIGH';
    if (statuses.includes('confident')) return 'MEDIUM';
    return 'LOW';
  }

  if (sectionId === 'privacy') {
    return evalFields(['collectsData']);
  }

  if (sectionId === 'contentRating') {
    const fields = [
      ...IOS_INTENSITY_QUESTIONS.map(q => q.id),
      ...IOS_CONTENT_YN_QUESTIONS.map(q => q.id),
      'ageCategory',
    ];
    return evalFields(fields);
  }

  if (sectionId === 'appInfo') {
    if (a.contentRights === null) return 'HIGH';
    return 'LOW';
  }

  return 'NONE';
}

function isMacFullSectionComplete(sectionId) {
  const a = state.macFullSubmitAnswers;

  if (sectionId === 'uploadBuild') return _uploadBuildComplete('macos_full');

  if (sectionId === 'improveSubmission') return !!a.improveSubmissionSeen;

  if (sectionId === 'appInfo') {
    if (a.contentRights === null) return false;
    return true;
  }

  if (sectionId === 'contentRating') {
    if (!IOS_INTENSITY_QUESTIONS.every(q => a[q.id] !== null)) return false;
    if (!IOS_CONTENT_YN_QUESTIONS.every(q => a[q.id] !== null)) return false;
    if (a.ageCategory === null) return false;
    if (a.ageCategory === 'made_for_kids'   && a.kidsAgeRange  === null) return false;
    if (a.ageCategory === 'override_higher' && a.overrideRating === null) return false;
    return true;
  }

  if (sectionId === 'privacy') {
    const url = (a.privacyPolicyUrl || '').trim();
    if (!url) return false;
    if (a.collectsData === null) return false;
    if (a.collectsData === 'yes') {
      const types = Object.entries(a.dataPerType);
      if (types.length === 0) return false;
      for (const [, t] of types) {
        if (t.purposes.length === 0) return false;
      }
    }
    return true;
  }

  if (sectionId === 'versionInfo') {
    const listing = state.macFullAppStoreListing;
    if (!listing || !(listing.description || '').trim()) return false;
    const ps = state.platformScreenshots?.macos_full;
    const hasShots = !!(ps && (ps.selected.length > 0 || ps.custom.length > 0)) ||
                     (state.uploads?.screenshots || []).length > 0;
    if (!hasShots) return false;
    // App Review fields (merged in from the former standalone App Review
    // Information step — now the "App Review" section here).
    if (!a.reviewContact.firstName.trim() || !a.reviewContact.lastName.trim()) return false;
    if (!a.reviewContact.email.trim()) return false;
    if (a.demoAccount.required === null) return false;
    if (a.demoAccount.required === 'yes' &&
        (!a.demoAccount.username.trim() || !a.demoAccount.password.trim())) return false;
    return true;
  }

  if (sectionId === 'business') {
    return a.hasIAP !== null;
  }

  if (sectionId === 'screenshots') {
    /* EMPTYING THE LISTING IS AN ANSWER, AND IT IS "NOT DONE". This used to
       read the two POOLS — anything selected, anything uploaded — which is the
       right question while the only thing a developer can do is pick. Now that
       the Screenshots editor can take shots OUT of a listing, a platform whose
       every screenshot has been removed still had an upload in the pool and
       still reported complete, with nothing in the store row underneath it.
       `platformStoreShots` is what the preview draws, so it is what the tick
       has to agree with. Guarded because state.js loads before render.js;
       identical to the old expression on an untouched listing. */
    if (typeof platformStoreShots === 'function') return platformStoreShots('macos_full').length > 0;
    const ps = state.platformScreenshots?.macos_full;
    if (ps && (ps.selected.length > 0 || ps.custom.length > 0)) return true;
    return (state.uploads?.screenshots || []).length > 0;
  }

  // Game Center is purely additive, same convention as IAP Products (see
  // makeBlankIOSAnswers's comment) — a developer with none simply leaves
  // the list(s) empty, so an empty list never blocks completion.
  if (sectionId === 'gameCenter')    return true;

  // Localizations is a unified editing surface over Store Page/IAPs/
  // Achievements' own already-tracked localization data — it never gates on
  // any field of its own, but (same as iOS's own isIOSSectionComplete
  // above) still requires the developer to have actually opened and
  // reviewed it at least once before counting as done.
  if (sectionId === 'localizations') return !!state.macFullLocalizationsSeen;

  // App Information (the new, non-"Full" section reached from Product
  // Page Preview's own Information card — see buildMacFullStorePreviewSection's
  // infoDone/buildMacFullAppInformationSection, render.js) carries Primary
  // Category (locked to Games), Subcategories/Secondary Category, and
  // Promotional Text/Keywords/Support URL/Marketing URL/Copyright — every
  // one of these was already optional in App Information Full/Version
  // Information before the move, so this section is purely additive too,
  // same as Game Center just above. The Preview's own "seen && complete"
  // glow gate (mirroring Business's) therefore reduces to "seen" alone —
  // the glow simply stops once the user has visited it.
  if (sectionId === 'appInformation') return true;

  if (sectionId === 'versionRelease') {
    if (a.releaseOption === 'scheduled' && !a.scheduledReleaseDate.trim()) return false;
    return true;
  }

  if (sectionId === 'storePreview') {
    return !!state.macFullStorePreviewSeen;
  }

  return false;
}

/* ── Google Play Data Safety ─────────────────────────── */

// Google Play data type taxonomy
const ANDROID_DATA_TYPES = [
  { group: 'Location', types: [
    { id: 'approx_location',   label: 'Approximate location', desc: 'User or device location to an area ≥ 3 km², such as city-level' },
    { id: 'precise_location',  label: 'Precise location',     desc: 'User or device location within < 3 km²' },
  ]},
  { group: 'Personal info', types: [
    { id: 'name',              label: 'Name',                  desc: 'First or last name, or nickname' },
    { id: 'email_address',     label: 'Email address',         desc: "A user's email address" },
    { id: 'user_ids',          label: 'User IDs',              desc: 'Identifiers such as account ID, account number, or account name' },
    { id: 'address',           label: 'Address',               desc: 'Mailing or home address' },
    { id: 'phone_number',      label: 'Phone number',          desc: "A user's phone number" },
    { id: 'race_ethnicity',    label: 'Race and ethnicity',    desc: '' },
    { id: 'political_beliefs', label: 'Political or religious beliefs', desc: '' },
    { id: 'sexual_orientation',label: 'Sexual orientation',    desc: '' },
    { id: 'other_personal',    label: 'Other personal info',   desc: 'Date of birth, gender identity, veteran status, etc.' },
  ]},
  { group: 'Financial info', types: [
    { id: 'payment_info',      label: 'User payment info',     desc: 'Bank account number or payment card number' },
    { id: 'purchase_history',  label: 'Purchase history',      desc: 'Information about purchases or transactions made by the user' },
    { id: 'credit_score',      label: 'Credit score',          desc: "A user's credit score" },
    { id: 'other_financial',   label: 'Other financial info',  desc: 'Salary, assets, debts, etc.' },
  ]},
  { group: 'Health and fitness', types: [
    { id: 'health_info',       label: 'Health info',           desc: 'Medical records, symptoms, etc.' },
    { id: 'fitness_info',      label: 'Fitness info',          desc: 'Exercise or physical activity data' },
  ]},
  { group: 'Messages', types: [
    { id: 'emails',            label: 'Emails',                desc: 'Email subject line, sender, recipients, contents' },
    { id: 'sms',               label: 'SMS or MMS',            desc: 'Text messages including sender and recipients' },
    { id: 'other_messages',    label: 'Other in-app messages', desc: 'Instant messages, chat content, etc.' },
  ]},
  { group: 'Photos and videos', types: [
    { id: 'photos',            label: 'Photos',                desc: "A user's photos" },
    { id: 'videos',            label: 'Videos',                desc: "A user's videos" },
  ]},
  { group: 'Audio files', types: [
    { id: 'voice_recordings',  label: 'Voice or sound recordings', desc: 'Voicemail or sound recordings' },
    { id: 'music_files',       label: 'Music files',           desc: "A user's music files" },
    { id: 'other_audio',       label: 'Other audio files',     desc: 'Any other audio files created or provided by a user' },
  ]},
  { group: 'Files and docs', types: [
    { id: 'files_docs',        label: 'Files and docs',        desc: "A user's files or documents, or info about them (e.g., file names)" },
  ]},
  { group: 'Calendar', types: [
    { id: 'calendar_events',   label: 'Calendar events',       desc: 'Events, event notes, and attendees' },
  ]},
  { group: 'Contacts', types: [
    { id: 'contacts',          label: 'Contacts',              desc: 'Names, phone numbers, email addresses from address book' },
  ]},
  { group: 'App activity', types: [
    { id: 'app_interactions',  label: 'App interactions',      desc: 'Taps, page visits, or other interactions' },
    { id: 'in_app_search',     label: 'In-app search history', desc: 'What a user has searched for in your app' },
    { id: 'installed_apps',    label: 'Installed apps',        desc: "Information about apps installed on a user's device" },
    { id: 'other_ugc',         label: 'Other user-generated content', desc: 'Bios, notes, open-ended responses, etc.' },
    { id: 'other_actions',     label: 'Other actions',         desc: 'Gameplay, likes, dialog options, etc.' },
  ]},
  { group: 'Web browsing', types: [
    { id: 'web_history',       label: 'Web browsing history',  desc: 'Information about websites a user has visited' },
  ]},
  { group: 'App info and performance', types: [
    { id: 'crash_logs',        label: 'Crash logs',            desc: 'Crash data, stack traces, or other crash-related info' },
    { id: 'diagnostics',       label: 'Diagnostics',           desc: 'Battery life, loading time, latency, framerate, technical diagnostics' },
    { id: 'other_perf',        label: 'Other app performance data', desc: 'Any other app performance data' },
  ]},
  { group: 'Device or other IDs', types: [
    { id: 'device_ids',        label: 'Device or other IDs',  desc: 'IMEI, MAC address, Advertising Identifier, Play Installment ID, etc.' },
  ]},
];

// Flat lookup: typeId → { id, label, desc, group }
const ANDROID_DATA_TYPE_LOOKUP = {};
ANDROID_DATA_TYPES.forEach(g => g.types.forEach(t => { ANDROID_DATA_TYPE_LOOKUP[t.id] = { ...t, group: g.group }; }));

const ANDROID_PURPOSES = [
  { id: 'app_functionality', label: 'App functionality',                      desc: 'Features available in your app — necessary for the app to work' },
  { id: 'analytics',         label: 'Analytics',                              desc: 'Collect data about how users use your app or how it performs' },
  { id: 'developer_comms',   label: 'Developer communications',               desc: 'Send news or notifications about your app or developer' },
  { id: 'advertising',       label: 'Advertising or marketing',               desc: 'Display or target ads, or track ad performance' },
  { id: 'fraud_prevention',  label: 'Fraud prevention, security & compliance', desc: 'Fraud prevention, security, or compliance with laws' },
  { id: 'personalization',   label: 'Personalization',                        desc: 'Customize what is shown to the user — e.g., content recommendations' },
  { id: 'account_management',label: 'Account management',                     desc: 'Setup or management of a user\'s account with your app or company' },
];

const ANDROID_ACCOUNT_METHODS = [
  { id: 'username_password',  label: 'Username and password' },
  { id: 'username_other',     label: 'Username and other authentication method' },
  { id: 'username_pw_other',  label: 'Username, password, and other authentication method' },
  { id: 'oauth',              label: 'OAuth (Sign in with Google, Facebook, etc.)' },
  { id: 'other',              label: 'Other' },
  { id: 'none',               label: 'No account creation' },
];

function makeBlankAndroidAnswers() {
  return {
    // Business
    privacyPolicyUrl:         '',
    // Data Safety — Section 1: Collection & Security
    collectsOrSharesData:     null,  // 'yes' / 'no'
    encryptedInTransit:       null,  // 'yes' / 'no'
    accountMethod:            null,  // single-select: one of ANDROID_ACCOUNT_METHODS ids
    accountMethodOther:       '',    // free text if accountMethod === 'other'
    deleteAccountUrl:         '',
    providesDataDeletion:     null,  // 'yes' / 'no' / 'auto90'
    deleteDataUrl:            '',
    targetsFamilies:          null,  // 'yes' / 'no'
    // Data Safety — Section 2: Data Usage
    androidDataDescription:   '',   // plain-language → AI translates to data matrix
    // { [typeId]: { collected: bool, shared: bool, ephemeral: bool, required: bool, purposes: string[] } }
    dataPerType:              {},
    // Store Preview
    storePreviewSeen:         false,
    // Localizations — stub step, complete on first view. Google Play's own
    // Data Safety above is fully modelled; this one is not yet.
    localizationsSeen:        false,
    // Improve Your Submission — marks complete on first view
    improveSubmissionSeen:    false,
  };
}

/* Progress for Android's Google Play Content Questions (IARC tree).
   Counts only top-level (depth 1) questions — follow-ups are implicitly
   covered since a top-level question can't be "complete" while a follow-up
   it revealed is still unanswered (see giarcIsSubtreeComplete). */
function androidCqProgress() {
  const answered = GOOGLE_IARC_TOP_LEVEL_KEYS.filter(giarcIsAnswered).length;
  return { total: GOOGLE_IARC_TOP_LEVEL_KEYS.length, answered };
}

function isAndroidSectionComplete(sectionId) {
  if (sectionId === 'uploadBuild') return _uploadBuildComplete('android');

  if (sectionId === 'screenshots') {
    /* Android gates HARDER than the App Store family — Play requires its own
       screenshots and there is no pre-populated preview to fall back on — so
       this asks the listing, not the pool, and an empty listing is not done.
       See the note on isIOSSectionComplete's own arm. */
    if (typeof platformStoreShots === 'function') return platformStoreShots('android').length > 0 && !!(state.platformScreenshots?.android?.selected?.length || state.platformScreenshots?.android?.custom?.length);
    const ps = state.platformScreenshots?.android;
    return !!(ps && (ps.selected.length > 0 || ps.custom.length > 0));
  }
  if (sectionId === 'improveSubmission') return !!state.androidSubmitAnswers.improveSubmissionSeen;
  /* Visit-based, because it is a stub — see PLATFORMS.android.steps. It is
     deliberately NOT folded into the storePreview or questionnaire roll-ups
     below: those gate a real thing on its real prerequisites, and hanging
     them on a placeholder would let a step that asks nothing block one that
     asks plenty. */
  if (sectionId === 'localizations') return !!state.androidSubmitAnswers.localizationsSeen;

  if (sectionId === 'storePreview') {
    return isAndroidSectionComplete('contentRating') &&
           isAndroidSectionComplete('dataSafety') &&
           isAndroidSectionComplete('business') &&
           isAndroidSectionComplete('screenshots');
  }

  if (sectionId === 'questionnaire') {
    return isAndroidSectionComplete('contentRating') &&
           isAndroidSectionComplete('dataSafety') &&
           isAndroidSectionComplete('business');
  }

  const a = state.androidSubmitAnswers;
  if (sectionId === 'dataSafety') {
    const privUrl = (a.privacyPolicyUrl || state.formData.privacyUrl || '').trim();
    if (!privUrl) return false;
    if (a.collectsOrSharesData === null) return false;
    if (a.collectsOrSharesData === 'yes') {
      if (a.encryptedInTransit === null) return false;
      const types = Object.entries(a.dataPerType);
      if (types.length === 0) return false;
      for (const [, t] of types) {
        if (!t.collected && !t.shared) return false;
        if (t.purposes.length === 0) return false;
      }
    }
    return true;
  }
  if (sectionId === 'contentRating') {
    const { total, answered } = androidCqProgress();
    return total > 0 && answered === total;
  }
  if (sectionId === 'business') {
    return !!(state.formData.title?.trim() && state.formData.description?.trim());
  }
  if (sectionId === 'storePreview') {
    return !!a.storePreviewSeen;
  }
  return false;
}

function computeAndroidSectionRisk(sectionId) {
  if (sectionId === 'questionnaire') {
    const risks = ['dataSafety','contentRating','business'].map(computeAndroidSectionRisk);
    if (risks.includes('HIGH'))   return 'HIGH';
    if (risks.includes('MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }
  const a = state.androidSubmitAnswers;
  if (sectionId === 'dataSafety') {
    const privUrl = (a.privacyPolicyUrl || state.formData.privacyUrl || '').trim();
    if (!privUrl) return 'HIGH';
    if (a.collectsOrSharesData === null) return 'HIGH';
    if (a.collectsOrSharesData === 'yes') {
      const types = Object.entries(a.dataPerType);
      if (types.length === 0) return 'HIGH';
      const allPurposes = types.every(([, t]) => t.purposes.length > 0);
      if (!allPurposes) return 'MEDIUM';
    }
    return 'LOW';
  }
  if (sectionId === 'contentRating') {
    const { total, answered } = androidCqProgress();
    if (total === 0 || answered < total) return 'HIGH';
    return 'LOW';
  }
  if (sectionId === 'business') {
    if (!state.formData.title?.trim() || !state.formData.description?.trim()) return 'HIGH';
    return 'LOW';
  }
  return 'LOW';
}

/* ── Risk Categories (Submit Modal) ─────────────────── */

const RISK_CATEGORIES = [
  { id: 'violence',   label: 'Violence & Combat' },
  { id: 'sexual',     label: 'Sexual Content & Nudity' },
  { id: 'language',   label: 'Language & Crude Humor' },
  { id: 'substances', label: 'Controlled Substances' },
  { id: 'gambling',   label: 'Gambling & Monetization' },
  { id: 'privacy',    label: 'Data Privacy' },
  { id: 'online',     label: 'Online Safety & Communication' },
];

function computeSubmitRisk() {
  const fd   = state.formData;
  const qa   = state.questionAnswers;
  const qi   = state.questionInferred;
  const desc = (fd.description + ' ' + fd.title).toLowerCase();
  const has  = ks => ks.some(k => desc.includes(k));
  const results = {};

  // ── Violence & Combat ─────────────────────────────────
  {
    const ansYes   = qa.violence === 'yes';
    const ansNo    = qa.violence === 'no';
    const answered = qa.violence !== null;
    const hasGore  = has(['blood','gore','brutal','gruesome','slaughter','dismember']);
    const hasCombat= has(['fight','combat','battle','shoot','kill','war','weapon','sword','gun','fps','arena']);
    let risk, signals = [], justification;

    if (ansYes && hasGore) {
      risk = 'HIGH';
      justification = 'Your game contains violence and descriptions suggest blood or gore. This requires a Mature age rating (17+ on iOS, M on ESRB) and may trigger additional manual review. Platforms will prominently display violence and gore content descriptors on your store page.';
    } else if (ansYes) {
      risk = 'MEDIUM';
      justification = 'Your game contains violence or combat. Platforms will apply a violence content descriptor. Expect a rating of 12+/Teen or higher. If combat is cartoonish or consequence-free, document this in your content notes to support a lower descriptor.';
    } else if (!answered && hasCombat) {
      risk = 'MEDIUM';
      justification = 'Combat-related terms were detected in your description but violence hasn\'t been confirmed. Undisclosed violence is one of the most common reasons for rejection on first submission — confirm your answer before submitting.';
    } else if (ansNo) {
      risk = 'LOW';
      justification = 'You\'ve confirmed your game contains no violence. No violence-related content descriptors will be applied to your store listing.';
    } else {
      risk = 'LOW';
      justification = 'No violence signals detected. This section of platform content questionnaires can be answered "No" for all questions.';
    }

    if (answered) signals.push({ label: 'Violence / Combat', value: ansYes ? 'Yes — declared' : 'No — declared', source: qi.violence ? 'Auto-detected, confirmed' : 'Your answer' });
    if (!answered && hasCombat) signals.push({ label: 'Combat keywords', value: 'Detected in description', source: 'Description analysis' });
    if (hasGore) signals.push({ label: 'Gore / blood language', value: 'Detected in description', source: 'Description analysis' });
    results.violence = { risk, signals, justification };
  }

  // ── Sexual Content & Nudity ───────────────────────────
  {
    const ansYes   = qa.sexualContent === 'yes';
    const ansNo    = qa.sexualContent === 'no';
    const answered = qa.sexualContent !== null;
    const hasSex   = has(['adult','sexual','nude','nudity','erotic','mature','18+','dating','romantic']);
    let risk, signals = [], justification;

    if (ansYes) {
      risk = 'HIGH';
      justification = 'Your game contains sexual or mature content. This restricts your game to adults-only storefronts or requires age-gating. Steam requires a special developer agreement to list adult content. Nintendo eShop and some Xbox store regions do not allow explicit content regardless of rating.';
    } else if (!answered && hasSex) {
      risk = 'MEDIUM';
      justification = 'Adult-themed keywords were detected in your description. If your game includes suggestive content, dating mechanics, or revealing character designs, these must be disclosed. Failure to declare adult content is a leading cause of post-launch removal from stores.';
    } else if (ansNo) {
      risk = 'LOW';
      justification = 'You\'ve confirmed no sexual or mature content. No adult content restrictions will be applied to your listing.';
    } else {
      risk = 'LOW';
      justification = 'No sexual content signals detected. Adult content sections of platform questionnaires can be answered "No."';
    }

    if (answered) signals.push({ label: 'Sexual / Mature content', value: ansYes ? 'Yes — declared' : 'No — declared', source: 'Your answer' });
    if (!answered && hasSex) signals.push({ label: 'Adult keywords', value: 'Detected in description', source: 'Description analysis' });
    results.sexual = { risk, signals, justification };
  }

  // ── Language & Crude Humor ────────────────────────────
  {
    const ansYes   = qa.strongLanguage === 'yes';
    const ansNo    = qa.strongLanguage === 'no';
    const answered = qa.strongLanguage !== null;
    const hasLang  = has(['profanity','crude','explicit','swear','cursing','offensive language']);
    let risk, signals = [], justification;

    if (ansYes) {
      risk = 'MEDIUM';
      justification = 'Your game contains strong language. A language content descriptor will appear on your store page, typically raising the minimum age rating to 12+/Teen. Nintendo eShop applies stricter standards — consider offering a censored text option if targeting that platform.';
    } else if (!answered && hasLang) {
      risk = 'LOW';
      justification = 'Language-related terms were found in your description. If any characters use profanity in dialogue, text, or audio, this must be declared. Undeclared language typically results in a retroactive rating change rather than outright rejection.';
    } else if (ansNo) {
      risk = 'LOW';
      justification = 'No strong language declared. Your game will not receive language-related content descriptors.';
    } else {
      risk = 'LOW';
      justification = 'No language signals detected. Language sections of platform questionnaires can be answered "No."';
    }

    if (answered) signals.push({ label: 'Strong language', value: ansYes ? 'Yes — declared' : 'No — declared', source: 'Your answer' });
    if (!answered && hasLang) signals.push({ label: 'Language keywords', value: 'Detected in description', source: 'Description analysis' });
    results.language = { risk, signals, justification };
  }

  // ── Controlled Substances ─────────────────────────────
  {
    const subKW   = ['drug','alcohol','beer','wine','whiskey','vodka','cannabis','marijuana','tobacco','smoke','cocaine','heroin','pills','narcotic'];
    const matched = subKW.filter(k => desc.includes(k));
    const hasSub  = matched.length > 0;
    let risk, signals = [], justification;

    if (hasSub) {
      risk = 'MEDIUM';
      justification = 'References to controlled substances or alcohol were detected in your description. Platforms require you to specify whether substances can be used interactively and whether their use is presented favorably or glamorized. Interactive drug/alcohol use typically adds a descriptor and raises the age rating.';
      signals.push({ label: 'Substance keywords', value: matched.slice(0, 3).join(', '), source: 'Description analysis' });
    } else {
      risk = 'LOW';
      justification = 'No controlled substance references detected. This section of platform content questionnaires can be answered "No" for all questions.';
    }
    results.substances = { risk, signals, justification };
  }

  // ── Gambling & Monetization ───────────────────────────
  {
    const ansYes   = qa.inAppPurchases === 'yes';
    const ansNo    = qa.inAppPurchases === 'no';
    const answered = qa.inAppPurchases !== null;
    const lootKW   = ['loot box','lootbox','gacha','casino','slot machine','poker','blackjack','roulette','bet','wager','gambling','jackpot'];
    const hasLoot  = has(lootKW);
    const isFree   = fd.price === '0' || fd.price === '0.00' || fd.price === '' || fd.price === 'free';
    let risk, signals = [], justification;

    if (ansYes && hasLoot) {
      risk = 'HIGH';
      justification = 'Your game includes in-app purchases and gambling-style mechanics (loot boxes, gacha, or randomized rewards). Apple requires disclosure of the odds of receiving each item. Belgium, Netherlands, and other regions prohibit loot boxes entirely — you\'ll need region-specific restrictions and a clear odds disclosure UI before submitting.';
    } else if (ansYes) {
      risk = 'MEDIUM';
      justification = 'Your game includes in-app purchases. All platforms require these to be configured and disclosed before submission. Apple requires subscription terms links; Google Play requires pricing confirmation in 170+ markets. Budget extra time for pricing setup across platforms.';
    } else if (!answered && isFree) {
      risk = 'LOW';
      justification = 'Your game appears to be free and in-app purchase status wasn\'t confirmed. Free games are more closely scrutinized for undisclosed monetization. Even cosmetic items or tip jars count — confirm your answer before submitting.';
    } else if (ansNo) {
      risk = 'LOW';
      justification = 'No in-app purchases declared. Your game will be listed as a paid title with no monetization warnings. Note that adding IAP later requires re-submission on most platforms.';
    } else {
      risk = 'LOW';
      justification = 'No monetization signals detected. Monetization sections can be answered conservatively.';
    }

    if (answered) signals.push({ label: 'In-app purchases', value: ansYes ? 'Yes — declared' : 'No — declared', source: 'Your answer' });
    if (hasLoot) signals.push({ label: 'Randomized reward mechanics', value: 'Detected in description', source: 'Description analysis' });
    if (isFree) signals.push({ label: 'Game price', value: 'Free — monetization scrutiny applies', source: 'Price field' });
    results.gambling = { risk, signals, justification };
  }

  // ── Data Privacy ──────────────────────────────────────
  {
    const ansYes     = qa.dataCollection === 'yes';
    const ansNo      = qa.dataCollection === 'no';
    const answered   = qa.dataCollection !== null;
    const hasPrivacy = !!(fd.privacyUrl && fd.privacyUrl.trim());
    const onlineKW   = ['account','sign in','login','multiplayer','leaderboard','cloud save','analytics','achievements','profile','user data'];
    const hasOnline  = has(onlineKW);
    let risk, signals = [], justification;

    if (ansYes) {
      risk = 'HIGH';
      justification = 'Your game collects user data. Apple requires a fully completed Privacy Nutrition Label specifying every data type and its purpose. Google Play requires a Data Safety form with similar detail. If any data is linked to user identity or used for tracking, special entitlements and user consents are required. Ensure your privacy policy is current and hosted at the URL you provided.';
    } else if (!answered && hasOnline) {
      risk = 'MEDIUM';
      justification = 'Online features (accounts, leaderboards, multiplayer) were detected in your description. These features almost always involve data collection — even session tokens or device identifiers count. Confirm your data collection status and ensure your privacy policy covers all use cases.';
    } else if (!hasPrivacy) {
      risk = 'LOW';
      justification = 'A privacy policy URL has not been provided. All major platforms require a valid, live privacy policy link — even for games that collect no data. Without this, your submission will be rejected on first review.';
    } else if (ansNo) {
      risk = 'LOW';
      justification = 'No data collection declared and a privacy policy is provided. You\'ll still complete brief data safety forms, but all data type questions can be answered "not collected." Some platforms may cross-check this against your listed SDKs.';
    } else {
      risk = 'LOW';
      justification = 'No data collection signals detected. Privacy questionnaires can be answered conservatively.';
    }

    if (answered) signals.push({ label: 'Data collection', value: ansYes ? 'Yes — declared' : 'No — declared', source: 'Your answer' });
    signals.push({ label: 'Privacy policy URL', value: hasPrivacy ? 'Provided ✓' : 'Missing ✗', source: 'Compliance tab' });
    if (!answered && hasOnline) signals.push({ label: 'Online features', value: 'Detected in description', source: 'Description analysis' });
    results.privacy = { risk, signals, justification };
  }

  // ── Online Safety & Communication ─────────────────────
  {
    const chatKW     = ['chat','voice chat','text chat','message','communicate','ugc','user-generated','user generated','community','forum','voice'];
    const multiKW    = ['multiplayer','online multiplayer','co-op','cooperative','pvp','mmo','massively multiplayer'];
    const locationKW = ['location','gps','nearby','geo-location'];
    const hasChat    = has(chatKW);
    const hasMulti   = has(multiKW);
    const hasLoc     = has(locationKW);
    let risk, signals = [], justification;

    if (hasChat || hasLoc) {
      risk = 'HIGH';
      justification = 'Your game appears to include real-time user communication (chat, voice) or location sharing. Platforms require specific Interactive Elements disclosures, and child-safety compliance is mandatory — moderation tools, content filtering, and parental controls may be required. COPPA/GDPR-K compliance is essential if players under 13 can access these features.';
    } else if (hasMulti) {
      risk = 'MEDIUM';
      justification = 'Online multiplayer was detected in your description. This must be declared as an Interactive Element on all platform questionnaires. Even indirect player interaction (shared world state, shared leaderboards) counts. Confirm what data is exchanged between players and ensure your privacy policy addresses it.';
    } else {
      risk = 'LOW';
      justification = 'No real-time social or communication features detected. Interactive Elements sections of platform questionnaires can largely be answered "None."';
    }

    if (hasChat) signals.push({ label: 'Real-time communication', value: 'Chat / voice detected', source: 'Description analysis' });
    if (hasMulti) signals.push({ label: 'Online multiplayer', value: 'Detected in description', source: 'Description analysis' });
    if (hasLoc) signals.push({ label: 'Location features', value: 'Detected in description', source: 'Description analysis' });
    results.online = { risk, signals, justification };
  }

  return results;
}

/* ── Project / Version helpers ───────────────────────── */

function generateId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

/* ── Versioning & release tracks ──────────────────────
   A "Version" is the developer's own release intent (e.g. "1.3").
   A "track" is the destination within a platform (production vs a
   pre-release lane like TestFlight / closed testing / a beta branch).
   Build numbers / versionCodes are minted from project-level counters
   that only ever increase — never typed by the user. ───────────── */

// Tracks offered for the platforms that are actually submittable today.
// Console platforms (xbox/psn/nintendo) and EGS are still gated behind
// "Coming Soon" elsewhere in the app, so their track UI is stubbed for now —
// the data shape (platformReleases) already supports them.
const PLATFORM_TRACKS = {
  ios: [
    { id: 'testflight_internal', label: 'TF (internal)' },
    { id: 'testflight_external', label: 'TF (external)' },
    { id: 'production',          label: 'App Store' },
  ],
  /* THE TWO MAC ENTRIES WERE MISSING, and that is why the Mac App Store card
     showed its version line with no track picker while Steam showed its
     branch: buildReleaseBlock only draws the picker when PLATFORM_TRACKS has
     options for that platform, and only ios/android/steam were listed.
     TestFlight does distribute macOS builds, so the tracks are the same three
     as iOS — only the last label differs, because the destination is the Mac
     App Store and calling it "App Store" on a Mac card would be wrong. */
  macos: [
    { id: 'testflight_internal', label: 'TF (internal)' },
    { id: 'testflight_external', label: 'TF (external)' },
    { id: 'production',          label: 'Mac App Store' },
  ],
  macos_full: [
    { id: 'testflight_internal', label: 'TF (internal)' },
    { id: 'testflight_external', label: 'TF (external)' },
    { id: 'production',          label: 'Mac App Store' },
  ],
  android: [
    { id: 'internal',   label: 'internal testing' },
    { id: 'closed',     label: 'closed testing' },
    { id: 'open',       label: 'open testing' },
    { id: 'production', label: 'production' },
  ],
  steam: [
    { id: 'beta',       label: 'beta branch' },
    { id: 'production', label: 'default branch' },
  ],
};

/* ══════════════════════════════════════════════════════
   WHAT EACH STORE CALLS THE WAIT  (STORE_REVIEW)
   ══════════════════════════════════════════════════════
   Four phases a submission can be in, in each store's OWN vocabulary —
   verified against vendor documentation on 14 Sep 2026, not remembered. Three
   of those strings are ones the internet gets wrong:

   - Apple does NOT say "Ready for Sale" or "Processing for App Store" any
     more. `AppStoreVersionState` is deprecated in favour of `AppVersionState`,
     which renamed them READY_FOR_DISTRIBUTION and PROCESSING_FOR_DISTRIBUTION.
   - Apple never says "Approved" either. The word is **Accepted**.
   - It is "Pending Developer Release", not "Waiting for Developer Release".

   THE SHAPE THEY SHARE, and the reason `accepted` is its own phase rather than
   a flavour of live: all three stores stop after approving and hand the release
   back to you. Apple prints "Pending Developer Release" with a Release This
   Version button, Google "Ready to publish" with Publish changes, Steam says
   outright that "Approved titles will not release themselves". So the state
   names the approval, the line names the obligation, and the verb is yours.

   THIS TABLE HOLDS NO DURATIONS, and that is deliberate. It had a `days` per
   store for one day and it was a second answer to a question `OB_PLATFORM_TIMING`
   (render.js, Mark's, v0.58) had already answered for the Release Timing panel,
   the dashboard timeline and the calendar's workback — so the same submission
   came out a different length depending on which surface you read it on. One
   table for how long, this one for what it is called. The vendor claims that
   justified the old numbers survive as COPY where they belong: Apple's "90% in
   less than 24 hours" is a sentence in the card, not arithmetic.

   ⚠ One thing left flagged:
   Steam's `rejected` label is the only string here with no vendor source:
      Steamworks documents no rejection state and no withdrawal at all — the
      model is "feedback sent" or "Ready for release". Flagged rather than
      invented-and-forgotten. */
const STORE_REVIEW = {
  ios: {
    in_review: { label: 'IN REVIEW',                  note: '' },
    accepted:  { label: 'PENDING DEVELOPER RELEASE',  note: 'Accepted. It reaches the App Store when you release it.', action: 'Release This Version' },
    live:      { label: 'READY FOR DISTRIBUTION',     note: 'Live on the App Store.' },
    rejected:  { label: 'REJECTED',                   note: 'App Review sent notes. Reply in Resolution Center, or upload a new build.', action: 'Read the notes' },
  },
  macos: {
    in_review: { label: 'IN REVIEW',                  note: '' },
    accepted:  { label: 'PENDING DEVELOPER RELEASE',  note: 'Accepted. It reaches the Mac App Store when you release it.', action: 'Release This Version' },
    live:      { label: 'READY FOR DISTRIBUTION',     note: 'Live on the Mac App Store.' },
    rejected:  { label: 'REJECTED',                   note: 'App Review sent notes. Reply in Resolution Center, or upload a new build.', action: 'Read the notes' },
  },
  android: {
    in_review: { label: 'IN REVIEW',                  note: 'Google publishes no time limit.' },
    accepted:  { label: 'READY TO PUBLISH',           note: 'Passed review. It goes out when you publish it.', action: 'Publish changes' },
    live:      { label: 'PUBLISHED',                  note: 'Live on Google Play.' },
    rejected:  { label: 'UPDATE REJECTED',            note: 'Your live version stays up. Fix what they flagged and send again.', action: 'Read the notes' },
  },
  steam: {
    in_review: { label: 'IN REVIEW',                  note: 'Store page and build are reviewed separately.' },
    accepted:  { label: 'READY FOR RELEASE',          note: 'Approved titles do not release themselves.', action: 'Release App' },
    live:      { label: 'RELEASED',                   note: 'Live on Steam.' },
    rejected:  { label: 'REVIEW FEEDBACK',            note: 'Valve sent notes on the store page or the build.', action: 'Read the notes' },
  },
  web: {
    live:      { label: 'LIVE',                       note: 'Your game is live.' },
  },
};

/* Every phase the card can draw, in the order a submission moves through them.
   `rejected` is off that line — it can arrive from `in_review` and it goes
   backwards, to work you have to redo. */
const STORE_REVIEW_PHASES = ['in_review', 'accepted', 'live', 'rejected'];

/* THE APP'S CALENDAR MARK — the same art the topbar's Calendar tab wears, so
   the guide's month toggle and the nav tab are one icon rather than two
   calendars drawn by two hands. A filled path on an 82×75 viewBox taking
   `currentColor`, NOT a stroked 24-unit glyph: at 13px a 1.8 stroke is about
   one device pixel and the little date squares inside it disappear.
   NOTE: `index.html` carries a literal copy inside `#nav-calendar`, because
   that button is static markup with no JS at parse time. If the art changes,
   change both — this is the one symbol in the app that is knowingly twinned. */
const SM_CAL_SVG = `<svg viewBox="0 0 82 75" fill="none" aria-hidden="true"><g transform="matrix(1,0,0,1,-10.376,5.49316)"><path d="M23.153,69.417L78.735,69.417C82.994,69.417 86.182,68.366 88.298,66.264C90.413,64.162 91.471,61.008 91.471,56.803L91.471,7.121C91.471,2.916 90.413,-0.237 88.298,-2.34C86.182,-4.442 82.994,-5.493 78.735,-5.493L23.153,-5.493C18.894,-5.493 15.7,-4.442 13.57,-2.34C11.441,-0.237 10.376,2.916 10.376,7.121L10.376,56.803C10.376,61.008 11.441,64.162 13.57,66.264C15.7,68.366 18.894,69.417 23.153,69.417ZM22.542,62.866C20.752,62.866 19.368,62.385 18.392,61.422C17.415,60.459 16.927,59.041 16.927,57.17L16.927,18.799C16.927,16.927 17.415,15.51 18.392,14.547C19.368,13.584 20.752,13.102 22.542,13.102L79.264,13.102C81.082,13.102 82.479,13.584 83.455,14.547C84.432,15.51 84.92,16.927 84.92,18.799L84.92,57.17C84.92,59.041 84.432,60.459 83.455,61.422C82.479,62.385 81.082,62.866 79.264,62.866L22.542,62.866ZM43.009,27.751L45.41,27.751C46.115,27.751 46.611,27.615 46.895,27.344C47.18,27.072 47.323,26.584 47.323,25.879L47.323,23.478C47.323,22.773 47.18,22.291 46.895,22.034C46.611,21.776 46.115,21.647 45.41,21.647L43.009,21.647C42.304,21.647 41.809,21.776 41.524,22.034C41.239,22.291 41.097,22.773 41.097,23.478L41.097,25.879C41.097,26.584 41.239,27.072 41.524,27.344C41.809,27.615 42.304,27.751 43.009,27.751ZM56.519,27.751L58.919,27.751C59.652,27.751 60.154,27.615 60.425,27.344C60.696,27.072 60.832,26.584 60.832,25.879L60.832,23.478C60.832,22.773 60.696,22.291 60.425,22.034C60.154,21.776 59.652,21.647 58.919,21.647L56.519,21.647C55.813,21.647 55.325,21.776 55.054,22.034C54.782,22.291 54.647,22.773 54.647,23.478L54.647,25.879C54.647,26.584 54.782,27.072 55.054,27.344C55.325,27.615 55.813,27.751 56.519,27.751ZM70.068,27.751L72.428,27.751C73.161,27.751 73.663,27.615 73.934,27.344C74.205,27.072 74.341,26.584 74.341,25.879L74.341,23.478C74.341,22.773 74.205,22.291 73.934,22.034C73.663,21.776 73.161,21.647 72.428,21.647L70.068,21.647C69.336,21.647 68.834,21.776 68.563,22.034C68.292,22.291 68.156,22.773 68.156,23.478L68.156,25.879C68.156,26.584 68.292,27.072 68.563,27.344C68.834,27.615 69.336,27.751 70.068,27.751ZM29.5,41.056L31.901,41.056C32.606,41.056 33.095,40.921 33.366,40.649C33.637,40.378 33.773,39.89 33.773,39.185L33.773,36.825C33.773,36.092 33.637,35.597 33.366,35.339C33.095,35.082 32.606,34.953 31.901,34.953L29.5,34.953C28.768,34.953 28.266,35.082 27.995,35.339C27.724,35.597 27.588,36.092 27.588,36.825L27.588,39.185C27.588,39.89 27.724,40.378 27.995,40.649C28.266,40.921 28.768,41.056 29.5,41.056ZM43.009,41.056L45.41,41.056C46.115,41.056 46.611,40.921 46.895,40.649C47.18,40.378 47.323,39.89 47.323,39.185L47.323,36.825C47.323,36.092 47.18,35.597 46.895,35.339C46.611,35.082 46.115,34.953 45.41,34.953L43.009,34.953C42.304,34.953 41.809,35.082 41.524,35.339C41.239,35.597 41.097,36.092 41.097,36.825L41.097,39.185C41.097,39.89 41.239,40.378 41.524,40.649C41.809,40.921 42.304,41.056 43.009,41.056ZM56.519,41.056L58.919,41.056C59.652,41.056 60.154,40.921 60.425,40.649C60.696,40.378 60.832,39.89 60.832,39.185L60.832,36.825C60.832,36.092 60.696,35.597 60.425,35.339C60.154,35.082 59.652,34.953 58.919,34.953L56.519,34.953C55.813,34.953 55.325,35.082 55.054,35.339C54.782,35.597 54.647,36.092 54.647,36.825L54.647,39.185C54.647,39.89 54.782,40.378 55.054,40.649C55.325,40.921 55.813,41.056 56.519,41.056ZM70.068,41.056L72.428,41.056C73.161,41.056 73.663,40.921 73.934,40.649C74.205,40.378 74.341,39.89 74.341,39.185L74.341,36.825C74.341,36.092 74.205,35.597 73.934,35.339C73.663,35.082 73.161,34.953 72.428,34.953L70.068,34.953C69.336,34.953 68.834,35.082 68.563,35.339C68.292,35.597 68.156,36.092 68.156,36.825L68.156,39.185C68.156,39.89 68.292,40.378 68.563,40.649C68.834,40.921 69.336,41.056 70.068,41.056ZM29.5,54.362L31.901,54.362C32.606,54.362 33.095,54.233 33.366,53.975C33.637,53.718 33.773,53.223 33.773,52.49L33.773,50.13C33.773,49.398 33.637,48.903 33.366,48.645C33.095,48.387 32.606,48.258 31.901,48.258L29.5,48.258C28.768,48.258 28.266,48.387 27.995,48.645C27.724,48.903 27.588,49.398 27.588,50.13L27.588,52.49C27.588,53.223 27.724,53.718 27.995,53.975C28.266,54.233 28.768,54.362 29.5,54.362ZM43.009,54.362L45.41,54.362C46.115,54.362 46.611,54.233 46.895,53.975C47.18,53.718 47.323,53.223 47.323,52.49L47.323,50.13C47.323,49.398 47.18,48.903 46.895,48.645C46.611,48.387 46.115,48.258 45.41,48.258L43.009,48.258C42.304,48.258 41.809,48.387 41.524,48.645C41.239,48.903 41.097,49.398 41.097,50.13L41.097,52.49C41.097,53.223 41.239,53.718 41.524,53.975C41.809,54.233 42.304,54.362 43.009,54.362ZM56.519,54.362L58.919,54.362C59.652,54.362 60.154,54.233 60.425,53.975C60.696,53.718 60.832,53.223 60.832,52.49L60.832,50.13C60.832,49.398 60.696,48.903 60.425,48.645C60.154,48.387 59.652,48.258 58.919,48.258L56.519,48.258C55.813,48.258 55.325,48.387 55.054,48.645C54.782,48.903 54.647,49.398 54.647,50.13L54.647,52.49C54.647,53.223 54.782,53.718 55.054,53.975C55.325,54.233 55.813,54.362 56.519,54.362Z" fill="currentColor" fill-rule="nonzero"/></g></svg>`;

function storeReviewPhase(platformId, phase) {
  const store = STORE_REVIEW[platformId] || STORE_REVIEW.ios;
  return store[phase] || store.in_review || STORE_REVIEW.ios.in_review;
}

/* THE MARKETING NUDGE SPEAKS THE PLATFORM'S OWN LANGUAGE (v6.99).

   Mark: "maybe we could use language that is platform specific to help it make
   sense on the card."

   IT IS ALSO THE ANSWER TO THE MULTIPLICATION v6.56 REMOVED THIS BUTTON FOR.
   That version's strongest argument was that one card says the line once and
   three platforms in review say it three times identically on one screen —
   "noise proportional to the number of platforms". Three DIFFERENT lines are
   not that: they are three specific invitations, and the count of them is the
   count of things you are actually waiting on. The generic line was what made
   repetition read as a bug.

   WHAT THE COPY IS ALLOWED TO PROMISE is bounded by what Marketing actually
   is: an announcement composer whose storefront row auto-syncs from your
   active platforms, a landing page built from your own metadata, and ranked
   press and creator lists ("Find the press most likely to cover…", "Find the
   creators who already care about games like yours"). So the frame is going
   and WINNING PLAYERS OVER, which is a fair description of all four tabs. It
   deliberately does not promise featuring pitches, pre-registration or
   wishlist campaigns — none of which Marketing has.

   ONE FRAME, ONE BESPOKE LINE. Every store gets "Go win over <its own
   players>", because a shared shape reads as one idea that knows where it is
   and scales to a platform added later, where nine hand-written sentences
   read as arbitrary. Steam is the single exception and earns it: wishlists
   are Steam's actual pre-launch currency — the number that drives its
   visibility — and no other store has an equivalent a developer thinks in.

   THE AUDIENCE, NOT THE STORE. "iPhone players" rather than "App Store
   players": you market to people, and the store's own name is already on the
   card twice (the header and the status line). Naming it a third time would
   be the "two marks on one object" this file keeps refusing, in words.

   It must NOT restate the wait — no "Steam has it" — for the same reason.
   The card's status line says that already.

   Keep them SHORT. This prints at 12px mono on a card that is ~400px wide,
   and the arrow is part of the string's length. Anything much past the
   Steam line starts to wrap, and a wrapped nudge reads as a paragraph. */
const SUB_NUDGE_COPY = {
  steam:      'Turn this wait into wishlists',
  ios:        'Go win over iPhone players',
  macos:      'Go win over Mac players',
  macos_full: 'Go win over Mac players',
  android:    'Go win over Android players',
  egs:        'Go win over PC players',
  psn:        'Go win over PlayStation players',
  xbox:       'Go win over Xbox players',
  nintendo:   'Go win over Switch players',
  web:        'Go send players to your page',
};

/* The fallback is the line this button carried from the day it was built
   until v6.56 — so a platform added to PLATFORMS without a line here still
   says something true rather than nothing. `web` is listed above and never
   reaches this: its card is always `live`, and the nudge only draws on
   `in_review`. It is kept for the day that changes. */
function subNudgeCopy(platformId) {
  return SUB_NUDGE_COPY[platformId] || 'Quiet time. Go plan your launch';
}

function platformTrackLabel(platformId, trackId) {
  const t = (PLATFORM_TRACKS[platformId] || []).find(t => t.id === trackId);
  return t ? t.label : (trackId === 'production' ? 'Production' : trackId);
}

/* WHAT A BUILD IS CALLED, PER STORE.
   The card's release line is not one shape with different labels — the three
   concepts genuinely do not exist the same way, and a dev reads their own
   store's words:

     Apple      CFBundleShortVersionString + CFBundleVersion, shown as
                "1.0.4 (42)". The build number must be unique within a
                version, so the pair is the identity. Tracks: TestFlight
                internal/external, then the App Store.
     Google     versionName + versionCode, also shown as "1.0.4 (42)", but
                versionCode is an integer that must increase across the WHOLE
                app, not per version. Tracks: internal/closed/open/production.
     Steam      no version number at all. Valve's docs are explicit: you
                upload a build, it gets a BuildID, and you "set build live for
                branch" — default, or a named branch. So there is nothing to
                put before the parenthesis, and "track" is the wrong word.
     Web        neither. It is a deploy; the only fact is when.

   `versionLabel: null` means the line omits the version. `buildPrefix` writes
   the number Steam's way ("Build 42") instead of Apple's ("(42)"). `trackNoun`
   is what the second line is called, and null hides it.

   THE CONSOLES ARE DELIBERATELY GENERIC. Sony's, Microsoft's and Nintendo's
   partner portals are behind NDA and not publicly documented, so filling this
   in from memory would be inventing vocabulary and putting it in front of a
   dev who knows better. All three are in COMING_SOON_PLATFORMS anyway; when
   one goes live, take the words from its actual dashboard. */
const PLATFORM_BUILD_SHAPE = {
  ios:        { versionLabel: 'version',     buildLabel: 'build',       trackNoun: 'track'  },
  macos:      { versionLabel: 'version',     buildLabel: 'build',       trackNoun: 'track'  },
  macos_full: { versionLabel: 'version',     buildLabel: 'build',       trackNoun: 'track'  },
  android:    { versionLabel: 'versionName', buildLabel: 'versionCode', trackNoun: 'track'  },
  steam:      { versionLabel: null,          buildLabel: 'BuildID',     trackNoun: 'branch',
                buildPrefix: 'Build' },
  web:        { versionLabel: null,          buildLabel: null,          trackNoun: null     },
};
/* Anything not listed: show the version and a plain build number, no picker —
   the honest default until that store's words are known. */
const PLATFORM_BUILD_SHAPE_FALLBACK =
  { versionLabel: 'version', buildLabel: 'build', trackNoun: null };

const buildShapeFor = pid => PLATFORM_BUILD_SHAPE[pid] || PLATFORM_BUILD_SHAPE_FALLBACK;

function makeBuildCounters() {
  return { ios: 0, android: 0, xbox: 0, psn: 0, nintendo: 0 };
}

/* NOTHING IS SEEDED ANY MORE — this only guarantees the three shapes exist.

   It has lost two jobs in two rounds, and both are worth recording because the
   reasoning was the same each time: a demo that starts mid-story has nothing
   left to demonstrate.
     • It used to stamp a finished binary onto every platform, so a brand-new
       project opened with Upload Build already ticked green and a file name in
       the pill. The whole point of the card is dropping a binary in and
       watching the step complete.
     • It then still seeded the COUNTER high (42 on iOS), so the first real
       upload minted 43 — true to how a shipped game looks, but it made the
       first build of a brand-new project claim forty-two ancestors. Counting
       from 1 is the honest start, and it is also the clearer demo: you watch
       the number begin.
   The VERSION was never touched in either round; it stays whatever the project
   actually is.

   What remains is real work despite the name: the three call sites (project
   creation, setView, activatePlatform) all assume these exist before they
   touch them, and makeBuildCounters() is what starts every counter at 0 so
   mintBuildNumber returns 1 on the first upload. */
function ensureBuildState(proj) {
  state.platformBuilds = state.platformBuilds || {};
  state.selectedTracks = state.selectedTracks || {};
  proj.buildCounters   = proj.buildCounters   || makeBuildCounters();
}

// Build numbers / versionCodes are global, monotonic, project-lifetime counters —
// never reused, never typed by the user.
function mintBuildNumber(proj, platformId) {
  if (!proj.buildCounters) proj.buildCounters = makeBuildCounters();
  proj.buildCounters[platformId] = (proj.buildCounters[platformId] || 0) + 1;
  return proj.buildCounters[platformId];
}

// Most platforms use the project's version number as-is. Xbox requires a
// 4-part package version, so we silently pad it — the user never formats this.
function derivePlatformVersionString(platformId, versionNumber) {
  if (platformId === 'xbox') {
    const parts = String(versionNumber || '1.0').split('.');
    while (parts.length < 4) parts.push('0');
    return parts.slice(0, 4).join('.');
  }
  return versionNumber;
}

// Suggests the next version number by bumping the minor digit (1.3 → 1.4).
// Always editable afterward — this is just a default, never a prompt.
function bumpMinorVersion(versionStr) {
  const parts = String(versionStr || '1.0').split('.');
  let major = parseInt(parts[0], 10); if (isNaN(major)) major = 1;
  let minor = parseInt(parts[1], 10); if (isNaN(minor)) minor = 0;
  return `${major}.${minor + 1}`;
}

function makeReleaseRecord(proj, platformId, trackId, versionNumber) {
  return {
    id:                     generateId('rel'),
    track:                  trackId,
    platformVersionString:  derivePlatformVersionString(platformId, versionNumber),
    platformBuildNumber:    mintBuildNumber(proj, platformId),
    status:                 'submitted', // submitted → live | rejected
    submittedAt:            Date.now(),
  };
}

// Smart default for the track selector: whatever this platform last shipped
// to, anywhere in the project's version history. Falls back to Production.
function getLastUsedTrack(proj, platformId) {
  for (let i = proj.versions.length - 1; i >= 0; i--) {
    const releases = proj.versions[i].platformReleases?.[platformId];
    if (releases && releases.length) return releases[releases.length - 1].track;
  }
  return 'production';
}

// Drift visibility: what's the latest version live in production vs. the
// latest version this platform has shipped to ANY track (e.g. a beta).
// Purely informational — nothing here blocks anything.
function getPlatformReleaseSummary(proj, platformId) {
  let production = null;
  let latest = null;
  for (const ver of proj.versions) {
    const releases = ver.platformReleases?.[platformId] || [];
    for (const rel of releases) {
      /* platformBuildNumber and platformVersionString were already being
         WRITTEN by makeReleaseRecord and simply never read back out — the card
         wanted "v1.0.4 (42)" and this returned only the version. They matter
         separately: a version repeats across builds (1.0.4 can be uploaded
         five times) and the build number is what actually identifies one, so
         it is the pair a dev reads in App Store Connect or Play Console.
         platformVersionString differs from versionNumber only on Xbox, which
         needs a 4-part string — see derivePlatformVersionString. */
      const entry = { versionNumber: ver.versionNumber, track: rel.track, status: rel.status, submittedAt: rel.submittedAt,
                      buildNumber: rel.platformBuildNumber, versionString: rel.platformVersionString };
      if (!latest || rel.submittedAt >= latest.submittedAt) latest = entry;
      if (rel.track === 'production' && (!production || rel.submittedAt >= production.submittedAt)) production = entry;
    }
  }
  return { production, latest };
}

function makeBlankFormData() {
  return {
    title:                '',
    subtitle:             '',
    description:          '',
    price:                '',   // collected per-platform (iOS Business), kept here for store preview
    gameScenario:         null, // null | 'new' | 'new_platform' | 'update'
    supportUrl:           '',
    privacyUrl:           '',
    primaryLanguage:      'en',
    localized:            false,
    localizations:        [],   // languages the developer plans to localize into
    distributionPreset:   null, // null=unset|everywhere|english_only|minimize_regulation|custom
    selectedCountries:    [],            // initialized from preset on first use
    manualMarkets:        false,         // true when user is manually toggling countries
    localizationPreset:   'recommended', // recommended|primary_only|all_regions
    releaseTiming:        'specific_date',
    /* Prototype: pre-filled so the calendar, the launch countdown and the
       Platforms timeline all have something to show on a cold open. Evergreen
       rather than a hard-coded date that goes stale — the developer overwrites
       it the moment they set a real one.

       **THE 28th OF THIS MONTH, NOT THE 29th OF NEXT (v6.60).** It was next
       month's, which left every submission deadline counting back inside that
       month — tidy, and it put the green launch box on a month the GUIDE never
       opens on. That face resets `monthOffset` to 0 on the way in, deliberately,
       because a glance that opens on a month with no "today" in it is the one
       thing it must not do. So the one date the prototype most wants you to see
       was always one page away. (The Calendar TAB opens on next month and still
       shows it, which is why this went unnoticed.)

       It rolls forward rather than going stale: past the 28th it is next
       month's, so a cold open in the last two days of a month still has a
       launch ahead of it rather than behind. */
    releaseDate:          (() => {
      const t = new Date();
      const m = t.getDate() > 28 ? t.getMonth() + 1 : t.getMonth();
      const d = new Date(t.getFullYear(), m, 28);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-28`;
    })(),
    trailerUrl:           '',
    appVersion:           '1.0',
    releaseNotes:         '',

    // App Store Product Page Preview — per-language Title/Subtitle/
    // Description/What's New. The Primary Language's copy is the flat
    // title/subtitle/description/releaseNotes fields above (unchanged —
    // still what Game Details and every other platform's preview read);
    // every additional language selected in `localizations` gets its own
    // { title, subtitle, description, releaseNotes } entry here, keyed by
    // language code. Entries are created lazily on first edit (see
    // _iasSetFieldValue, app.js), not eagerly when a language is added, so
    // this stays empty until the developer actually writes a translation.
    localizedStoreText:   {},
  };
}

function makeBlankUploads() {
  return {
    appIcon:        null,
    screenshots:    [],
    featureGraphic: null,
    trailer:        null,
    // Key Art (Web platform's "Key Art" section — see
    // buildWebKeyArtEditSection in render.js, which manages all four fields
    // directly rather than mirroring a separate Steam-side section) — four
    // image slots, shown in alphabetical order: Capsule Image, Header
    // Image, IGDB Cover Art, Library Hero. Every field can be either
    // { name, dataUrl } for a manual upload, or { name, url } when
    // auto-populated. Auto-fill sources:
    //   - steamCapsuleImage ("Capsule Image", 231×87) ← Steam's own
    //     appdetails.capsule_image, fetched by _applySteamAboutData in
    //     app.js (same fetchShipmateGame call already used for
    //     Description/Developer/About This Game/Screenshots/Genres).
    //   - steamHeaderImage ("Header Image", 460×215) ← Steam's own
    //     appdetails.header_image, fetched the same way.
    //   - steamKeyArtCapsule ("IGDB Cover Art", 264×374) ← IGDB's own cover
    //     art (coverBigUrl in claude.js, applied by
    //     _applySteamCapsuleFromCover in app.js).
    //   - steamKeyArtHero ("Library Hero", 3840×1240) ← Steam's own
    //     library_hero.jpg (steamLibraryHeroUrl in claude.js, applied by
    //     _applySteamHeroBanner in app.js) — a stable, hash-free per-appid
    //     CDN path, no proxy needed. Like any auto-fill, isn't guaranteed to
    //     exist for every app, so a missing asset just leaves this field
    //     manual-upload-only rather than erroring.
    // _screenshotSrc in app.js resolves either shape (dataUrl or url,
    // proxying images.igdb.com URLs through wsrv.nl) to a render-ready
    // <img> src. IGDB Cover Art/Library Hero also feed the public preview
    // website's hero/capsule glow boxes. steamHeaderImage additionally gets
    // a second, convenience upload surface on Steam's own Store Page
    // Preview - Prototype (its "Select Steam Assets" section — see
    // buildSteamAssetsEditSection in render.js) — both editors read and
    // write this exact same field, so an upload from either place shows up
    // in the other.
    // (A "Library Capsule"/"Logo" pair, auto-filled from Steam's own
    // library_600x900.jpg/logo.png, briefly lived here as well — removed by
    // request; see git history around v3.02 if reviving that is ever needed.)
    steamCapsuleImage:   null,
    steamHeaderImage:    null,
    steamKeyArtCapsule:  null,
    steamKeyArtHero:     null,
    // Trailer preview (Assets tab's "Trailer" section — see buildAssetsTab in
    // render.js) — auto-filled from the linked Steam page's own appdetails
    // `movies` array (first entry, Steam's own primary trailer) by
    // _applySteamAboutData/_steamTrailerFromMovies in app.js. Always a plain
    // { name, thumbnail, hlsUrl } object (never a manual upload — there's no
    // dataUrl variant of this field, unlike the Key Art slots above), where
    // `thumbnail` is the preview image shown and `hlsUrl` is Steam's own
    // hls_h264 (.m3u8) manifest URL, streamed inline via hls.js when the
    // thumbnail is clicked (playSteamTrailer in app.js) — Steam's appdetails
    // no longer returns a plain progressive mp4/webm file for trailers, only
    // adaptive-streaming manifests (confirmed live against real store pages
    // during this project's own trailer-thumbnail bug investigation), so a
    // bare click-through link isn't viable and an inline player is used
    // instead. No IGDB-sourced fallback/equivalent (same as Genres/Capsule
    // Image/Header Image), so this is simply left null if the Steam fetch
    // fails or the game has no trailer listed.
    steamTrailer:        null,
  };
}

function makeBlankAnswers() {
  return { violence: null, sexualContent: null, strongLanguage: null, dataCollection: null, inAppPurchases: null };
}

function makeBlankInferred() {
  return { violence: false, sexualContent: false, strongLanguage: false, dataCollection: false, inAppPurchases: false };
}

// Steps that must always be re-done when creating a new release.
// Everything else carries forward as complete from the previous release.
const STEPS_RESET_ON_NEW_RELEASE = new Set([
  'storePreview',      // What's New text + re-review the live-looking store page
  'reviewSubmission',  // final checklist re-read before each submission
  'submit',            // the actual submission action — always new
]);

// Returns a step-status object seeded from a previous release's status,
// with the per-release mandatory steps reset to 'not_started'.
function inheritPlatformSteps(prevStatus) {
  const out = makeEmptyPlatformSteps();
  for (const [pid, steps] of Object.entries(prevStatus || {})) {
    if (!out[pid]) continue;
    for (const [stepId, status] of Object.entries(steps)) {
      if (STEPS_RESET_ON_NEW_RELEASE.has(stepId)) continue; // always reset
      out[pid][stepId] = status;                             // carry forward
    }
  }
  return out;
}

function makeEmptyVersion(versionNumber, carryPlatforms = [], prevStepStatus = null) {
  return {
    id:                  generateId('ver'),
    versionNumber,                       // e.g. "1.0" — display label is "v" + versionNumber
    name:                '',             // optional human label, e.g. "Holiday Update"
    changelog:           '',             // optional release notes
    activePlatforms:     [...carryPlatforms], // serialized as array (converted to Set in flat state)
    platformStepStatus:  prevStepStatus ? inheritPlatformSteps(prevStepStatus) : makeEmptyPlatformSteps(),
    platformReleases:    {},             // { [platformId]: ReleaseRecord[] }
  };
}

// Returns the most-recently-submitted version string for a given platform+track,
// or null if nothing has ever been submitted to that track.
function getTrackLiveVersion(proj, platformId, trackId) {
  let latest = null;
  for (const ver of (proj?.versions || [])) {
    const releases = ver.platformReleases?.[platformId] || [];
    for (const rel of releases) {
      if (rel.track === trackId) {
        if (!latest || rel.submittedAt >= latest.submittedAt) {
          latest = { versionNumber: ver.versionNumber, submittedAt: rel.submittedAt };
        }
      }
    }
  }
  return latest ? latest.versionNumber : null;
}

// Save the current flat state back into the active project/version record
function saveCurrentToProject() {
  const proj = state.projects.find(p => p.id === state.activeProjectId);
  if (!proj) return;
  proj.name             = state.formData.title || proj.name;
  proj.formData         = JSON.parse(JSON.stringify(state.formData));
  proj.uploads          = JSON.parse(JSON.stringify(state.uploads));
  // The pool travels with the slots that reference it. Saving one without the
  // other would leave every ref pointing at nothing.
  proj.assets           = JSON.parse(JSON.stringify(state.assets || []));
  proj.questionAnswers  = JSON.parse(JSON.stringify(state.questionAnswers));
  proj.questionInferred = JSON.parse(JSON.stringify(state.questionInferred));
  const ver = proj.versions.find(v => v.id === state.activeVersionId);
  if (!ver) return;
  ver.activePlatforms    = [...state.activePlatforms];
  ver.platformStepStatus = JSON.parse(JSON.stringify(state.platformStepStatus));
}

// Load a project + optional version into flat state (saves current first)
function loadProjectAndVersion(projectId, versionId) {
  saveCurrentToProject();
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;
  state.activeProjectId   = projectId;
  state.formData          = JSON.parse(JSON.stringify(proj.formData));
  state.uploads           = JSON.parse(JSON.stringify(proj.uploads));
  // A project saved before the library existed has no pool; smMigrate below
  // builds one from its uploads. Idempotent, so this is safe every time.
  state.assets            = JSON.parse(JSON.stringify(proj.assets || []));
  if (typeof smMigrate === 'function') smMigrate();
  state.questionAnswers   = JSON.parse(JSON.stringify(proj.questionAnswers));
  state.questionInferred  = JSON.parse(JSON.stringify(proj.questionInferred));
  const ver = versionId
    ? proj.versions.find(v => v.id === versionId) || proj.versions[0]
    : proj.versions[0];
  if (!ver) return;
  state.activeVersionId      = ver.id;
  state.activePlatforms      = new Set(ver.activePlatforms);
  state.platformStepStatus   = JSON.parse(JSON.stringify(ver.platformStepStatus));
}


/* ── Data Collection Presets ─────────────────────────── */
// Quick-select chips on the Privacy / Data Safety steps.
// Selecting presets auto-fills the NLP description and triggers AI translation.

/* **EACH PRESET CARRIES ITS OWN ANSWER, AND THAT IS THE FIX FOR A REAL BUG.**
   Jaco: *"si elijo varias casillas como cloud save, leaderboards, no guarda el
   resultado y nunca marca como completado el paso."*

   Measured, the presets were saved perfectly — `privacyPresets` held both, the
   chips were lit, `collectsData` was `'yes'` and `privacyDescription` was 692
   characters. What was empty was **`dataPerType`**, and that is the ONE thing
   `isIOSSectionComplete('privacy')` asks for once `collectsData === 'yes'`. So
   the step could not complete, and the answer the chips had "saved" was a
   paragraph of prose nothing downstream reads.

   **The only thing that ever wrote `dataPerType` was the AI call.**
   `_triggerPrivacyAI` returns on its first line without an API key — which is
   every local session, by design ("AI inference features won't work locally") —
   and on a failed or slow call live. A checklist item that cannot be completed
   without a network round trip is not a checklist item.

   **And the answer was already here, written for a machine to read back.** Look
   at the descriptions: they name Apple's own data types and groups in quotes,
   with purposes, because they were authored as a PROMPT. The preset knows
   exactly which types it means and then throws that away into a sentence so an
   LLM can parse it out again. `types` states it directly instead — same content,
   in the shape `dataPerType` actually stores.

   So the preset is deterministic and instant, and the AI becomes what it should
   have been: the path for a description somebody TYPES. It still overwrites
   `dataPerType` when it succeeds, which is the same question answered with more
   nuance — but nothing now depends on its answering at all.

   The shape is `togglePrivacyDataType`'s own (`purposes` / `identity` /
   `tracking`), not a second dialect, so a preset's rows are indistinguishable
   from hand-ticked ones and every existing control edits them. `identity` and
   `tracking` are read off each description's own closing sentences — "Linked to
   user identity", "NOT used for advertising or tracking" — rather than guessed. */
const PRIVACY_PRESETS = [
  {
    id:    'guest',
    label: 'Guest Play',
    sub:   'No account, no tracking',
    description: '',
    setsNo:    true,  // sets collectsData = 'no'
    exclusive: true,  // selecting this clears other chips
  },
  {
    id:    'accounts',
    label: 'User Accounts',
    sub:   'Email, username & password',
    // Structured description with explicit Apple data-type label names for reliable AI mapping
    description: 'App Store privacy data types collected: "Email Address" (Contact Info group) for App Functionality and Account Management — required for account creation, login, and recovery. "User ID" (Identifiers group) for App Functionality — account ID linked to the user. "Name" (Contact Info group) for App Functionality — display name. All data encrypted in transit. Linked to user identity. NOT used for advertising or tracking.',
    types: {
      email:   { purposes: ['app_function'], identity: 'yes', tracking: 'no' },
      user_id: { purposes: ['app_function'], identity: 'yes', tracking: 'no' },
      name:    { purposes: ['app_function'], identity: 'yes', tracking: 'no' },
    },
  },
  {
    id:    'analytics',
    label: 'Game Analytics',
    sub:   'Gameplay events & crash reports',
    description: 'App Store privacy data types collected: "Crash Data" (Diagnostics group) for Analytics and App Functionality — crash logs and error reports. "Performance Data" (Diagnostics group) for Analytics — launch time, frame rate, memory usage. "Product Interaction" (Usage Data group) for Analytics — feature usage, session duration, level progression. NOT linked to user identity. NOT used for advertising or tracking. NOT shared with third parties.',
    types: {
      crash:       { purposes: ['analytics', 'app_function'], identity: 'no', tracking: 'no' },
      performance: { purposes: ['analytics'],                 identity: 'no', tracking: 'no' },
      product_use: { purposes: ['analytics'],                 identity: 'no', tracking: 'no' },
    },
  },
  {
    id:    'ads',
    label: 'Advertising',
    sub:   'Ad network & device identifiers',
    description: 'App Store privacy data types collected: "Device ID" (Identifiers group) for Third-Party Advertising — advertising identifier (IDFA) shared with ad network. "Advertising Data" (Usage Data group) for Third-Party Advertising — ad impressions and interactions. Data is SHARED with third-party advertising partners. May be used for cross-app tracking and targeted advertising.',
    types: {
      device_id: { purposes: ['third_party_ads'], identity: 'no', tracking: 'yes' },
      ad_data:   { purposes: ['third_party_ads'], identity: 'no', tracking: 'yes' },
    },
  },
  {
    id:    'cloudsave',
    label: 'Cloud Save',
    sub:   'Game progress synced to cloud',
    description: 'App Store privacy data types collected: "User ID" (Identifiers group) for App Functionality — account identifier used to sync data. "Gameplay Content" (User Content group) for App Functionality — game save data including progress, achievements, and settings synced across devices. Data linked to user account. Encrypted in transit. NOT used for advertising.',
    types: {
      user_id:  { purposes: ['app_function'], identity: 'yes', tracking: 'no' },
      gameplay: { purposes: ['app_function'], identity: 'yes', tracking: 'no' },
    },
  },
  {
    id:    'leaderboards',
    label: 'Leaderboards',
    sub:   'Usernames & scores',
    description: 'App Store privacy data types collected: "User ID" (Identifiers group) for App Functionality — player identifier displayed on leaderboards. "Gameplay Content" (User Content group) for App Functionality — scores and achievements visible to other players. Data is publicly displayed within the game. NOT used for advertising or tracking.',
    types: {
      user_id:  { purposes: ['app_function'], identity: 'yes', tracking: 'no' },
      gameplay: { purposes: ['app_function'], identity: 'yes', tracking: 'no' },
    },
  },
];


/* ── Application State ───────────────────────────────── */

const state = {
  // Onboarding
  onboardingComplete: false,
  onboardingTab: 0,          // 0 = About, 1 = Distribution, 2 = Assets, 3 = Compliance (unreachable via Next — dead tab)
  _newProjectMode: false,    // true when onboarding is creating a 2nd+ project

  // Modal
  activeModal: null,

  // Top-level view within the main app: 'details' | 'dashboard' | 'broadcast' | 'performance'
  activeView: 'dashboard',

  // Performance dashboard (live-game analytics) — mock data for now.
  performance: { period: '30d', section: 'dashboard' },

  /* Submission: ONE platform at a time — a strip of platform tabs over a single
     pane, where the steps expand inline instead of opening the step modal.

       addOpen   the "Add platform" dropdown hanging off the sub-nav pill
                 (buildSubnavAddPlatform, render.js). Opening and closing it
                 does not render — the flag exists so a repaint that happens
                 WHILE it is open re-emits it open, and so closeAllDropdowns
                 has one thing to clear.
       tab       which platform's pane is showing. NEVER read directly — go
                 through submissionTab(), which heals a stale id (the selected
                 platform can be deactivated, or the project switched) rather
                 than leaving the pane blank.
       openStep  { [pid]: stepId } — the ONE expanded section per platform.
                 Per-platform rather than global so moving between tabs does not
                 fold up what you were reading; one at a time within a tab
                 because the pane is otherwise taller than a screen.
       layout    'inline' (steps expand in the pane) or 'modal' (steps open
                 the step modal, as they did before v6.29). THE WAY BACK: the
                 modal shell, openStepModal and every step body builder are
                 untouched, so flipping this reverts the interaction without
                 reverting the tab strip. Set it with smSubmitLayout() from the
                 console — see that function (app.js) for why there is no UI.
       settings  a platform id while the pane is showing that platform's
                 account face instead of its steps, null otherwise. The gear
                 sets it, the back arrow clears it. It is NOT platformFace:
                 that one drives the card's own flip, which the pane has no
                 reverse to perform. */
  /* `layout` DEFAULTS TO 'modal' AS OF v6.47 — Jaco: *"quiero que por defecto
     siempre tengamos ?layout=modal… no quiero que borremos nada de la
     implementación inline, pero que modal esté por defecto siempre."*

     This is ONE WORD and nothing else. Both arms are intact, the `?layout=`
     hook below still sets either one, `smLayout()` still flips it from the
     console, and every branch that reads this flag is untouched — which is the
     whole point.

     AND SINCE v6.46 IT REALLY IS THE DEFAULT FOR EVERYONE: the hook below no
     longer remembers a choice in `localStorage`, so no machine can be silently
     pinned to the other arm by a query string it loaded once, weeks ago. See
     that block for the argument. This literal is now the only thing that
     decides what a person who just opens the page sees — which is the
     whole point: the decision aid stops defaulting to the arm nobody chose,
     without the loser being deleted before there is a decision. See the
     backlog's "TWO PRESENTATIONS BEHIND ONE FLAG" for what that decision
     eventually has to do. */
  submission: { addOpen: false, tab: null, openStep: {}, settings: null, layout: 'modal' },

  // Marketing tab subsections: 'announce' | 'website' | 'press' | 'influencers'
  marketing: { section: 'announce' },

  /* Calendar / Checklist (Marketing → Calendar). One model feeds both halves:
     the month grid in the content column and the checklist in the guide column.
       monthOffset  months away from the current one; 0 = today's month. Starts
                    at 1 so the calendar opens on the launch month, where the
                    launch and all three submission deadlines live.
       view         'month' | 'week' | 'day' — only month is built so far
       selectedWeek ISO date of a week's Sunday, or null for the whole month.
                    Set by clicking the week number; narrows the checklist.
       done         { [itemKey]: true } — itemKey is the item id plus its date,
                    so each occurrence of a recurring item ticks separately.
       custom       items the developer added by double-clicking a day:
                    { id, kind, label, dateISO }
       overrides    { [itemKey]: {label, note, kind, dateISO} } — edits made to a
                    GENERATED item (a recurring beat, a submission deadline).
                    Those aren't stored records, so an edit can't change them at
                    source; it's kept here and applied on top when they're built.
                    Keyed on the item's natural key, so moving its date doesn't
                    lose the edit.
       hidden       { [itemKey]: true } — generated items removed from view
       query        search text; filters what the grid and checklist draw
       hintDone     true once an event has been dragged — retires the hint
       draft        the open composer, or null */
  calendar: { monthOffset: 1, view: 'month', selectedWeek: null, done: {}, custom: [], overrides: {}, hidden: {}, query: '', hintDone: false, draft: null },

  // Game Details sub-tabs: 'gamedetails' | 'distribution' | 'localization' | 'assets' | 'content'
  details: { section: 'gamedetails', contentPlatform: null },

  // Content Questions sub-tab: per-platform inline inference status ('idle'|'loading'|'ready')
  contentQ: { status: {} },

  // Shippy Guide collapse (horizontal): false = full card, true = mini progress rail

  /* Shippy Guide face: false = the tab's checklist, true = the month.
     It is the same month the Calendar tab is showing — the mini grid reads
     `calendar.monthOffset` rather than keeping an offset of its own, so paging
     in one place pages the other. One calendar, two windows onto it. */
  guideCal: false,

  // The day whose panel is open under the guide's month grid; null = closed.
  guideCalDay: null,

  /* The submission whose wait is FOCUSED — a platform id, or null. Only the
     stripe presentation can set it (the band is one stroke for every wait at
     once and has nothing to point at), and it is what the day panel reads to
     print that submission's own dates instead of the generic day line. */
  guideCalWait: null,

  /* HOW A REVIEW WAIT IS DRAWN ON THE MONTH — 'band' | 'stripe'.
     Two presentations of one fact, up for a decision:
       band   — a highlighter stroke behind the days (v6.26, the default)
       stripe — a thin coloured rule under each day, ONE PER SUBMISSION,
                and clickable
     The band is a glance ("am I waiting on anything today"); the stripe is a
     reading ("on what, and which one is this"). The stripe costs card height
     and the band cannot be pressed — that is the trade being looked at.
     Same rule as `submission.layout`: WHEN THE CHOICE IS MADE THE LOSER COMES
     OUT — this field, its hook below, the arm in `buildGuideMiniCal`, the CSS
     and the note in CLAUDE.md. A flag left behind is a second surface nobody
     is looking at, and it rots. */
  calWaitStyle: 'band',

  // The kind the panel's add row will use for the next item it creates. A key
  // of CAL_KIND; the dot in front of the field shows it.
  guideCalKind: 'marketing',

  // Submitted-card shape under evaluation: 1 = segmented progress, 2 = dates.
  // smReviewVariant(1|2) flips it. Temporary — one of the two will win.
  subVariant: 1,

  // pid → true while a submitted card is showing the steps it sent.
  subReview: {},

  // While a step modal is open on a SUBMITTED platform, this holds that pid and
  // the modal renders read-only. Cleared by closeStepModal, never on open.
  stepModalReadOnly: null,

  // DEBUG — the sub-tab band above the content. false = the row of pills,
  // true = just the name of the section you're in. Ctrl+D toggles it; see
  // the handler in app.js. Remove once the experiment is settled.
  subnavTitleOnly: false,

  // Top-nav sub-tab dropdown: opens on hover; navOpenView = which tab's menu shows
  navExpanded: false,
  navOpenView: null,

  // Localization has no required input (primary language is preset), so its
  // checklist item completes once the user has visited the section.
  localizationSeen: false,

  // Broadcast (unified announcement) composer — write once, adapt per destination.
  // Credentials are intentionally deferred; destinations show a "Connect later" state.
  broadcast: {
    message: '',              // the single source announcement the dev writes
    active: [],               // opt-in channel ids turned on (social/community/press/video)
    storeOff: [],             // auto storefront channels the dev has powered off
    expandedGroups: {},       // group id -> bool (secondary chips expand/collapse)
    previewDest: null,        // channel id currently shown in the adapted preview
  },

  // Activated platforms (shown with full task list on dashboard)
  activePlatforms: new Set(),

  // Per-platform step completion
  platformStepStatus: makeEmptyPlatformSteps(),

  // Form data (collected during onboarding)
  formData: makeBlankFormData(),

  uploads: makeBlankUploads(),

  /* THE ASSET LIBRARY — one pool of images per project, classified on
     arrival, referenced from everywhere. See assets.js for the record shape
     and for why `origin` exists.

     `uploads` above keeps its nine named slots because they mean something
     and the whole app reads them; what changed is that a slot now holds
     `{ ref: 'as_…' }` instead of a copy of the file. One file, one copy, many
     uses — which is also what makes "this master already covers 3 of Steam's
     9 requirements" answerable at all. */
  assets: [],

  questionAnswers: makeBlankAnswers(),

  questionInferred: makeBlankInferred(),

  // Projects list — each entry mirrors a saved snapshot
  projects: [],
  activeProjectId: null,
  activeVersionId: null,

  // Legacy generic submit modal (non-iOS platforms)
  submitModal: {
    platformId: null,
    expanded: [],
  },

  // Per-platform build uploads (one active build per platform)
  platformBuilds: {
    ios:        null,
    macos:      null,
    macos_full: null,
    android:    null,
    steam:      null,
  },

  // Per-platform binary processing flag (true for 10s after upload while fake analysis runs)
  platformBuildProcessing: {
    ios:        false,
    macos:      false,
    macos_full: false,
    android:    false,
    steam:      false,
  },

  // Which store preview sub-section is currently open in the flip animation
  // null = showing preview; 'content'|'business'|'data'|'screenshots' = flipped to sub-section
  storePreviewFlipTarget:   { ios: null, macos: null, macos_full: null, android: null, steam: null, web: null },

  /* MARKETING'S OWN FLIP TARGET, deliberately not sharing the one above.

     The page is editable from two places now — the Submission step modal and
     Marketing > Pages — and they are two independent editing sessions. Sharing
     storePreviewFlipTarget.web meant opening a panel in one surface left the
     other one primed to open flipped too: click a field in Marketing, then
     open the Submission step, and it came up on "Edit site details" instead of
     on the page. Two surfaces, two targets, no cross-talk. */
  mktWebFlipTarget:         null,
  // Tracks which sub-sections the user has actually visited (gates "done" state)
  storePreviewSectionSeen:  { ios: {}, macos: {}, macos_full: {}, android: {}, steam: {}, web: {} },

  /* The same idea one level up: which STEPS (not preview sub-sections) the
     developer has opened, as `{ [platformId]: { [stepId]: true } }`. Gates the
     steps in STEP_REQUIRES_VISIT — see its own comment further up this file for
     why an inferred questionnaire must not go green unlooked-at, and why this is
     keyed per platform rather than per step. Written only by
     markStepSectionSeen, read only by isStepSectionSeen. Left as a bare {} and
     filled lazily rather than pre-seeded per platform like the line above,
     since platform ids come and go with activePlatforms. */
  stepSectionSeen:          {},


  // Which required element (Title/Subtitle/Content/Business/Screenshots/Data)
  // currently has the animated "needs attention" glow on the App Store/Mac
  // App Store Product Page Preview footer's prev/next navigator
  // (buildStorePreviewSection/buildMacStorePreviewSection, setStorePreviewFocus
  // — app.js). null = no explicit choice yet, so the preview defaults to the
  // first not-yet-addressed required element on every render; a value here
  // (an element id, e.g. 'title'/'content'/'screenshots') is only ever set by
  // clicking the footer's prev/next arrows, and sticks until changed again or
  // this resets (e.g. app reload) — it does not auto-advance just because the
  // focused element gets addressed elsewhere in the app.
  storePreviewFocus:        { ios: null, macos: null },

  // Game Details → Distribution's countries list (buildObCountryChips,
  // render.js): which of the two header columns it's currently sorted by,
  // and in which direction. Sorting applies to the whole list — selected
  // countries are no longer floated to the top.
  // by: 'name' (the default) = alphabetical, or 'gamers' = by approximate
  // gamer count. dir: 'asc' (the default) or 'desc' — for 'name' that's
  // A→Z vs Z→A, for 'gamers' that's smallest→biggest vs biggest→smallest.
  // Clicking a header that's already active flips dir; clicking the other
  // header switches by and resets dir to that column's own natural default
  // (see setObDistSort, app.js). Page-level UI state, not per-project data —
  // same reasoning as storePreviewFocus just above: it resets on reload
  // rather than being saved onto the project, and switching projects
  // doesn't carry it over.
  obDistCountrySort:         { by: 'name', dir: 'asc' },

  // Web self-distribution site — editable fields shown in the Preview Website
  // step, organized in "Edit site details" into four groups: Factsheet,
  // Description, Media, About. Preview renders four always-visible main
  // sections (Factsheet, Description, Media, About), each with sub-sections
  // that only show once they have content — see buildWebSitePreviewSection
  // in render.js. Some sub-sections aren't stored here at all, but synced
  // read-only from elsewhere in Shipmate: Platforms (state.activePlatforms)
  // and Trailers (formData.trailerUrl / uploads.trailer — the same
  // "Trailer" asset set in the Assets step). Release Date USED to be one of
  // these (synced from formData.releaseDate, the shared cross-platform
  // release-timing picker used elsewhere in Shipmate) — it's now its own
  // plain text field below (releaseDate), by request, since the shared
  // date-picker only ever holds a single YYYY-MM-DD value while a store
  // listing's release date is often free text ("Coming Soon", "Q1 2027",
  // a Steam-formatted "Feb 18, 2026", etc).
  // List-type fields below are stored as plain newline-separated text (one
  // entry per line) and parsed at render time — see _pkLines in render.js —
  // matching the lightweight plain-text style already used for
  // formData.description.
  webSite: {
    accent: '#0EA5A4',
    // Which Steam Key Art asset backs the preview website's capsule box —
    // one of 'capsuleImage' (steamCapsuleImage), 'headerImage'
    // (steamHeaderImage), or 'igdbCoverArt' (steamKeyArtCapsule). Set via
    // the selector in Web's "Key Art" section (buildWebKeyArtEditSection /
    // setWebCapsuleSource in app.js); read in buildWebSitePreviewSection
    // (render.js) via _webCapsuleSourceField. Defaults to 'igdbCoverArt' —
    // this preview's original, only-ever-had-one-source behavior — so an
    // existing game's preview capsule doesn't change until the developer
    // explicitly picks something else. The preview website's hero box has
    // no equivalent choice; it's always Library Hero (steamKeyArtHero).
    capsuleSource: 'igdbCoverArt',
    // Factsheet — Developer + Location
    developer: '', basedIn: '',
    // "Links" sub-section (Factsheet > Developer > Links in the edit form —
    // _wsFactsheetFieldsHTML, render.js), both rendered as button-style
    // links beneath Location in the Developer sub-section on the actual
    // preview website (officialWebsiteBlock/socialLinksBlock in
    // buildWebSitePreviewSection, render.js). Official Website is a single
    // URL, auto-populated (when the picked title links to a Steam page)
    // from Steam's appdetails 'website' field — see _applySteamAboutData in
    // app.js — same treatment as developer/publisher above, but still
    // freely editable afterward.
    officialWebsite: '',
    // Array of { id, name, url } — social-media links the developer can
    // freely add/remove by hand (addWebLink/removeWebLink/setWebLinkField,
    // app.js; id minted via generateId('link')). Auto-populated (when the
    // picked title links to a Steam page) from /game's own `links` field —
    // see _applySteamSocialLinks in app.js.
    //
    // This used to be the app's one exception: appdetails had no field for
    // social links at all, so it was scraped out of the store page's raw
    // HTML, which made it the most fragile Steam-sourced value here. /game
    // carries them now, as [{name, url}], so it is an ordinary read off the
    // same response every other field on this object comes from, and the
    // scrape is gone (v6.61 — see claude.js where those three functions
    // used to be). Only overwritten when Steam actually has links, same
    // guard as developer/publisher/genres above/below, so a title with none
    // configured never clears links added by hand.
    links: [],
    // Free text. Auto-populated (when the picked title links to a Steam
    // page) from Steam's appdetails 'publishers' list, joined — see
    // _applySteamAboutData in app.js — same source/treatment as developer
    // above (its 'developers' list). Still a plain editable text field
    // otherwise, same as every other Factsheet field here.
    publisher: '',
    // Free text, e.g. "Feb 18, 2026", "Coming Soon", "Q1 2027" — a plain
    // editable text field, NOT tied to formData.releaseDate (the shared
    // YYYY-MM-DD date picker used for cross-platform release-timing
    // elsewhere in Shipmate; see state.js's top-of-webSite comment). Auto-
    // populated (when the picked title links to a Steam page) from Steam's
    // appdetails 'release_date' field — see _applySteamAboutData in app.js —
    // same source/treatment as developer/publisher/genres above. Steam's
    // release_date is `{ coming_soon: bool, date: string }`; when `date` is
    // empty (pre-announcement titles often omit it even with
    // coming_soon:true) this defaults to the literal string "Coming Soon"
    // rather than being left blank, matching the preview website's own
    // long-standing "Coming soon" fallback for an unset release date.
    releaseDate: '',
    // Free text, e.g. "Roguelike, Deckbuilder". Auto-populated (when the
    // picked title links to a Steam page) from Steam's appdetails 'genres'
    // list, joined — see _applySteamAboutData in app.js. That's Steam's
    // short, fixed, developer-assigned genre list, not the community-voted
    // "tags" chips shown on the store page — appdetails has no field for
    // those (see this project's Steam-tags research).
    genres: '',
    // Purchase — free text, e.g. "$19.99". Auto-populated once (when the
    // picked title links to a Steam page) from Steam's appdetails
    // 'price_overview' field (its final_formatted string, already
    // currency-formatted) — or the literal text "Free" when Steam's
    // 'is_free' flag is set instead — see _applySteamAboutData in app.js.
    // Same "auto-fill once, then freely editable" treatment as developer/
    // publisher/genres above: this is a plain text field the developer can
    // still change afterward, not kept in forced sync with Steam going
    // forward. Shown on the preview website next to the "Buy Now" button
    // in the About section's Purchase sub-section (purchaseValue,
    // buildWebSitePreviewSection, render.js) — that button itself is
    // decorative in this prototype (no real checkout behind it).
    price: '',
    // Description
    // "Hook" — overrides the Steam store page's own short_description
    // (state.steamLocInfo.shortDescription, cached by _applySteamAboutData
    // in app.js) when set; with no override, the preview falls back to that
    // short_description at render time (buildWebSitePreviewSection,
    // render.js) whenever the selected title is Steam-linked and Steam has
    // one. NOT synced with Game Details' Description field — that's
    // "About This Game" below now, which used to be this field's role.
    description: '',
    // "About This Game" — defaults to, and then stays FORCED in sync with,
    // Game Details' Description field (formData.description): every edit to
    // Description overwrites this field to match (_wsPropagateAboutGame,
    // app.js, wired into every place Description itself gets written), so
    // it always mirrors Description going forward, not just on first
    // pre-population. The developer can still freely edit this field
    // directly between those Description edits — same as any other plain
    // field, via setWebSiteField — but that edit never writes back to
    // Description, only the next Description edit overwrites it again. A
    // blank line marks a paragraph break; consecutive non-blank lines are
    // soft line breaks within the same paragraph (rendered with <br>, no
    // extra spacing between them) — see _pkParagraphs/aboutGameValue in
    // render.js. This lets the preview reproduce Steam's own two-level
    // spacing (tight lines within a paragraph vs. a real gap between
    // paragraphs) when Game Details' Description was itself auto-filled
    // from a linked Steam page's about_the_game
    // (_steamHtmlToParagraphLines in claude.js; see _applySteamAboutData in
    // app.js), and gives manual typing here the same two-level spacing, not
    // just a flat list.
    aboutGame: '',
    history: '',            // "Studio/Game History" — one paragraph per line
    // Former "About" group, folded into Factsheet (now labeled "About" on
    // the preview website — see factsheetHTML's comment in render.js) and
    // Description when that section was removed: aboutDev ("About the
    // Developer" bio, one paragraph per line) now shows under Description
    // (after History), email now shows under Factsheet (after Location,
    // before Links). The old group's standalone "Website" field (the
    // studio's own general site) was dropped rather than migrated — it
    // wasn't part of that move and reads as redundant with officialWebsite
    // above (the GAME's own site).
    aboutDev: '', email: '',
    // Media — the Web platform's OWN independent copies of Game Details'
    // Assets step (state.uploads.screenshots / state.uploads.trailer /
    // formData.trailerUrl), NOT references to those same objects. Every
    // add/remove/replace made to Game Details' own screenshots/trailer is
    // mirrored here too — see the calls into _wsSyncAutoScreenshots and the
    // mirroring added directly into handleScreenshotFiles/removeScreenshot/
    // handleTrailerFiles/removeTrailer/syncField, all in app.js — so this
    // starts pre-populated from whatever Game Details already has and stays
    // in sync with it going forward, one-way only: editing these fields
    // directly in the Web platform's own Media section (its own dropzones,
    // see _wsMediaFieldsHTML/buildWebMediaEditSection in render.js) only
    // ever writes here, never back to Game Details.
    //
    // screenshots: same shape as state.uploads.screenshots ({ id, name,
    // dataUrl } for a manual upload, or { id, name, url } for an
    // IGDB/Steam auto-import) — kept in sync by matching id, so an entry
    // added independently here (a different id) survives a Game Details
    // change instead of being wiped by it.
    screenshots: [],
    // trailerFile: same shape as state.uploads.trailer ({ name, size }).
    // trailerUrl: same as formData.trailerUrl. Unlike screenshots, these
    // are forced to match Game Details' current value on every change
    // there (whole-value overwrite, not merged) — a single trailer slot has
    // no "coexistence" story the way a list of screenshots does, so this
    // uses the same "default + force-overwrite-on-source-change" treatment
    // as About This Game has with Game Details' Description above.
    trailerFile: null, trailerUrl: '',

    // Steam Store Page Preview - Prototype's own Localization Review —
    // per-language overrides for Short Description/Developer/Publisher/
    // About This Game, deliberately reusing the same key name/shape
    // (localizedStoreText) as state.formData.localizedStoreText above, just
    // on this different parent object — that's what lets the generic
    // _promoteLangPrimary() helper (app.js) work unmodified for Steam's own
    // listing, the same way it already does for the App Store's and Mac
    // App Store's. The Primary Language's own copy is the flat
    // description/developer/publisher/aboutGame fields above (unchanged);
    // every additional language selected in formData.localizations gets its
    // own { description, developer, publisher, aboutGame } entry here, keyed
    // by language code, created lazily on first edit (see
    // _steamSetFieldValue, app.js) — same "lazy" convention as the App
    // Store's own localizedStoreText. Title is NOT one of these four fields
    // — it's governed entirely by the shared state.formData/
    // localizedStoreText machinery instead (see STEAM_SHARED_LISTING_FIELDS,
    // app.js), the same way Mac App Store's Title/Subtitle are shared rather
    // than duplicated (MAS_SHARED_LISTING_FIELDS, app.js).
    localizedStoreText: {},

    /* ── THE MARKETING PAGE'S PRESENTATION ────────────────────────────────
       Everything above this line is CONTENT: words and files about the game,
       every one of them editable in the Web panel, most auto-filled from
       Steam. This is the other kind of thing — the decisions a developer
       makes by LOOKING at the page rather than by filling in a form.

       They live together in one nested object rather than as nine more
       siblings for a reason that is not tidiness: content and presentation
       have different editors. Content goes through the flip panels, which
       are forms. Presentation goes through direct manipulation on the page
       itself — drag the art to reframe it, click a section to hide it —
       because "is the ape's face cut off" is a question no form can ask.
       Keeping the two apart in the state keeps them apart in the UI.

       Everything here has a default that makes a page look finished, so a
       developer who never opens this section still gets a good page. */
    page: {
      // Which sections are drawn, in page order. Metadata, Trailer, About and
      // Screenshots earn their place by having content; Footer is here even
      // though the template otherwise starts bare, because a marketing page
      // with no way to reach the people who made the game is not a minimal
      // page, it is a broken one.
      sections: { strip: true, video: true, about: true, shots: true, footer: true },

      /* HOW THE KEY ART SITS IN THE HERO. Steam's library_hero.jpg is
         3840×1240 (about 3.10:1) against a hero nearer 2.18:1, so roughly a
         third of its width is cropped no matter what — and which third is a
         real decision, because key art is usually composed for a wider box
         than ours. ox/oy are a pan offset in PIXELS, not a percentage, so the
         drag tracks the pointer 1:1. zoom is a percentage, 100 = untouched.
         fit 'fill' crops to the hero's proportions; 'whole' takes the art's
         own and crops nothing. */
      art: { ox: 0, oy: 0, zoom: 100, fit: 'fill' },

      /* THE LOGOTYPE the developer supplied, when they did — same shape as
         the uploads above ({ name, dataUrl } by hand, { name, url } when
         found on Steam's CDN). Separate from uploads.* because it belongs to
         the marketing page and nothing else submits it anywhere.

         tint 'original' shows the artwork exactly as delivered, which is the
         respectful default and right nearly always. 'white' knocks it out,
         and exists because a dark logotype on dark key art cannot be rescued
         by a shadow — only by knocking it out. */
      logo: null,
      logoTint: 'original',
      // Whether the supplied logotype is drawn. Separate from having one, so
      // turning it off is not the same as throwing the file away.
      logoShow: true,
      // The hero tagline. It draws the Hook rather than a line of its own —
      // see the note in web-page.js — so this is only whether it is shown.
      hookShow: false,
      // The game's name set in type over the art. ON, and the one in this
      // group you might switch off: key art that already carries a logotype
      // does not need the name a second time.
      titleShow: true,

      /* Where the two free pieces were dragged to, as { x, top, align } in
         percentages of the hero's stage. Null means "never moved", which is
         not the same as being at 50/50: an unplaced piece is laid out by the
         opening arrangement, a placed one is left exactly where it was put. */
      logoPos: null,
      hookPos: null,

      // An alternative background, when the store's own art is not what the
      // developer wants on their site. Held separately from
      // uploads.steamKeyArtHero so that "use the store art" stays a revert
      // rather than a re-download.
      artOverride: null,

      /* THE CALL TO ACTION in the hero. 'button' is one pill; 'stores' shows
         the availability marks large instead, which reads better for a game
         on five platforms than a single button pointing at one of them;
         'none' leaves the hero to the art. A choice rather than a fixed
         button because those three pages want genuinely different things. */
      buyMode: 'button',

      // The small logotype in the page's top-left corner, the way a normal
      // site header works. OFF by default: the hero already names the game,
      // in type, at the size it deserves, and a second small copy of the same
      // name a few hundred pixels above it is repetition, not a header.
      headerShow: false,

      // Labels of metadata rows the developer has hidden, e.g. ['Publisher'].
      // Stored as labels rather than indices so hiding a row survives the
      // band gaining or losing rows when a field is filled in later.
      hiddenRows: [],
    },
  },

  // Binary finding navigation — which finding is SELECTED (0-indexed per platform).
  // It used to mean "how many have been got through", which is why nothing could
  // go back; acknowledgeBinFinding (app.js) has the full note.
  binFindingIdx: { ios: 0, android: 0, steam: 0 },

  // Which findings have been resolved — a Set of indices per platform, so
  // resolving one no longer implies everything before it is resolved too.
  binFindingDone: {},

  // Whether the "View Fix" panel is currently expanded for the active finding
  binFindingFixExpanded: { ios: false, android: false, steam: false },

  // Improve Your Submission — which suggestion each batch's carousel points at.
  // Only Store Page carries one here; Binary keeps its own in binFindingIdx
  // because that index predates this and other code reads it.
  improveIdx: { storePage: 0 },

  /* Per-platform screenshot selections: which onboarding shots are selected,
     plus any platform-specific uploads.

     THE LISTING IS A SEQUENCE, NOT A SET (v6.42). `selected` and `custom` are
     the two POOLS a listing can draw from; the three fields beside them are
     what the developer has said about the listing itself, and all three are
     absences until the Screenshots editor is opened:

       order   ids in store order. Ids it does not name are appended after it,
               so a screenshot added to Assets later still shows up — the array
               is a preference, never a whitelist.
       removed ids taken OUT of this platform's listing. It is the difference
               between "not chosen yet" and "chosen against": an empty `order`
               means untouched, where a `removed` entry is a real answer. The
               asset itself is untouched, so this is hide, not delete.
       crops   { [id]: { z, tx, ty, url } } — the transform the developer set,
               plus the baked preview the store draws. The ORIGINAL is never
               modified, so clearing an entry really does revert.

     Every consumer reads all five through one resolver, `platformStoreShots`
     (render.js) — five copies of the selected+custom||all expression is what
     it replaced. */
  platformScreenshots: {
    ios:        { selected: [], custom: [], order: [], removed: [], crops: {} },
    macos:      { selected: [], custom: [], order: [], removed: [], crops: {} },
    macos_full: { selected: [], custom: [], order: [], removed: [], crops: {} },
    android:    { selected: [], custom: [], order: [], removed: [], crops: {} },
    steam:      { selected: [], custom: [], order: [], removed: [], crops: {} },
  },

  // iOS step modal — which step is currently open
  stepModal: {},

  // iOS App Store submission questionnaire answers
  iosSubmitAnswers: makeBlankIOSAnswers(),

  // Mac App Store submission questionnaire answers — a full independent
  // copy of iosSubmitAnswers above (same makeBlankIOSAnswers() shape, same
  // Content Rating/Privacy/Business/Export Compliance/IAP Products
  // questions, since Mac App Store submission goes through the same App
  // Store Connect review process as iOS) but its own separate object:
  // answering a question here never touches iosSubmitAnswers, and vice
  // versa. See answerMacField/updateMacTextField/addMacIapProduct etc.
  // (app.js) and buildMacContentRatingSection/buildMacPrivacySection/
  // buildMacBusinessSection/buildMacIapSection (render.js).
  macSubmitAnswers: makeBlankIOSAnswers(),

  // Mac App Store's own Game Center Achievements — the "Game Center" step
  // (PLATFORMS.macos.steps, right after Content Rating) mimics App Store
  // Connect's real Achievements section: a reorderable list of achievements
  // (add/remove — see addMacGameCenterAchievement/
  // removeMacGameCenterAchievement, app.js; reordering is drag-and-drop on
  // the collapsed row — macGcAchievementDragStart/DragOver/Drop/DragEnd,
  // app.js — not a function call), each
  // { id, refName, pointValue, hidden, achievableMultipleTimes, collapsed,
  // displayName, earnedDescription, preEarnedDescription, image, locs? }.
  // Display Name/Earned Description/Pre-Earned Description/Image are the
  // achievement's own PRIMARY-language fields, same as every other field
  // here (no per-language Localizations sub-list on the achievement card
  // itself — removed by request). Supporting-language overrides for those
  // three text fields instead live in the achievement's own `locs` map —
  // `a.locs[lang] = { displayName, earnedDescription, preEarnedDescription,
  // <field>SourceText?, <field>FromSteam? }`, lazily created — read/written
  // through Game Center's own "Achievement Localizations" section (the
  // "_masAchLoc"/"masAchLoc" prefixed cluster, app.js;
  // buildMacAchievementLocalizationsSection, render.js), the exact same
  // shape/role IAP products' own `p.locs` plays for IAP Localizations.
  // `image` is { name, dataUrl } or null. An achievement imported from
  // Steam (_applySteamAchievements, app.js) is additionally tagged
  // `fromSteam: true` and `steamIndex` (its position in Steam's own
  // achievement listing at import time, stable across later drag-reorders —
  // used by _checkSteamLocalizedAchievements, app.js, to match this
  // achievement back up against a freshly-fetched localized listing).
  // Deliberately a FULL-FIDELITY build (unlike Mac App Store Full's own
  // simplified gameCenter.achievements list — see makeBlankMacFullAnswers'
  // comment) since this is the one place in Shipmate meant to actually
  // mirror ASC's Achievements UI end to end.
  macGameCenterAchievements: [],

  // App Store (ios)'s own Game Center Achievements — a FULL, independent
  // twin of macGameCenterAchievements directly above, added for full
  // feature parity with Mac App Store's Game Center: same shape
  // ({ id, refName, pointValue, hidden, achievableMultipleTimes, collapsed,
  // displayName, earnedDescription, preEarnedDescription, image, locs?,
  // fromSteam?, steamIndex? }), same add/remove/save/expand/drag-reorder
  // mechanics (the "Ios"/"IosGc"-prefixed cluster, app.js, right after the
  // "Mac"/"MacGc"-prefixed one), same "Achievement Localizations" sub-
  // section (the "_iasAchLoc"/"iasAchLoc"-prefixed cluster, app.js —
  // buildIosAchievementLocalizationsSection, render.js). Kept as its own
  // completely separate array — never shared with, or derived from,
  // macGameCenterAchievements — since a game's iOS and Mac App Store
  // Game Center setups (achievement lists, point values, Steam-imported
  // text, etc.) are independent App Store Connect records in real life,
  // same "duplicate the stateful UI, not generalize it" pattern this file
  // already uses for macSubmitAnswers vs iosSubmitAnswers. The one place
  // the two DO share a source: a Steam-linked title's achievement import
  // (_applySteamAchievements, app.js) populates both arrays at once from
  // the same Steam fetch, since that's genuinely the same underlying data —
  // but from that point on each array is edited/localized/reordered fully
  // independently.
  iosGameCenterAchievements: [],

  // Mac App Store Full's own Game Center Achievements — a FULL, independent
  // twin of macGameCenterAchievements/iosGameCenterAchievements above, added
  // for full feature parity with Mac App Store's Game Center: same shape,
  // same add/remove/save/expand/drag-reorder mechanics (the "MacFull"/
  // "MacFullGc"-prefixed cluster, app.js, right after the "Ios"/"IosGc"-
  // prefixed one), same "Achievement Localizations" sub-section (the
  // "_macFullAchLoc"/"macFullAchLoc"-prefixed cluster, app.js —
  // buildMacFullAchievementLocalizationsSection, render.js). Kept as its
  // own completely separate array — never shared with, or derived from,
  // macGameCenterAchievements/iosGameCenterAchievements — same "duplicate
  // the stateful UI, not generalize it" pattern already used for those two.
  // A Steam-linked title's achievement import (_applySteamAchievements,
  // app.js) populates all three arrays at once from the same Steam fetch,
  // same as it already does for macGameCenterAchievements/
  // iosGameCenterAchievements. Supersedes the old, simpler
  // macFullSubmitAnswers.gameCenter.achievements list (its UI removed along
  // with Multiplayer, an earlier request) — this is the real, actively-used
  // one now.
  macFullGameCenterAchievements: [],

  // Mac App Store Full submission questionnaire answers — a from-scratch,
  // FULLY INDEPENDENT copy (see makeBlankMacFullAnswers' own comment):
  // answering a question here never touches iosSubmitAnswers or
  // macSubmitAnswers, and vice versa. See _appStoreAnswers/
  // _appStoreAnswerMeta (app.js), which resolve 'macos_full' to this object
  // the same way 'macos' resolves to macSubmitAnswers above.
  macFullSubmitAnswers: makeBlankMacFullAnswers(),

  // Google Play submission questionnaire answers
  androidSubmitAnswers: makeBlankAndroidAnswers(),

  // Steam submission questionnaire answers
  steamSubmitAnswers: makeBlankSteamAnswers(),

  // Per-field AI inference metadata for Steam (mirrors iosAnswerMeta)
  steamAnswerMeta: {},

  // Cache tracking which platform+step inferences have already run
  // { 'android:contentRating': true, 'steam:contentRating': true, ... }
  platformInferenceCache: {},

  // Android data matrix expansion state
  androidMatrixExpanded: false,

  // Android data NLP AI translation status: null | 'loading' | 'complete' | 'error'
  androidDataAIStatus: null,

  // Per-field AI inference metadata: { [fieldId]: { confidence: 0-100, humanConfirmed: bool } }
  iosAnswerMeta: {},

  // Mac App Store twin of iosAnswerMeta above — see macSubmitAnswers' comment.
  macAnswerMeta: {},

  // Mac App Store Full twin of iosAnswerMeta/macAnswerMeta above — see
  // macFullSubmitAnswers' comment.
  macFullAnswerMeta: {},

  // Cached Claude analysis result — populated on first inference step open, reused thereafter
  claudeCache: null,

  // Whether the user has visited Store Page Preview (makes it count as complete)
  iosStorePreviewSeen: false,

  // Mac App Store twin of iosStorePreviewSeen above.
  macStorePreviewSeen: false,

  // Mac App Store Full twin of iosStorePreviewSeen/macStorePreviewSeen above.
  macFullStorePreviewSeen: false,

  // Whether the user has opened and reviewed the Localizations step
  // (isIOSSectionComplete, state.js) — same "seen" gate as
  // iosStorePreviewSeen above, so Localizations doesn't show as complete in
  // the platform card until the developer has actually looked at it once.
  iosLocalizationsSeen: false,

  // Mac App Store twin of iosLocalizationsSeen above.
  macLocalizationsSeen: false,

  // Mac App Store Full twin of iosLocalizationsSeen/macLocalizationsSeen above.
  macFullLocalizationsSeen: false,

  // Mac App Store's OWN independent Product Page Preview listing text —
  // Title/Subtitle/Description/What's New, plus per-language overrides
  // (localizedStoreText, same shape as state.formData.localizedStoreText).
  // Pre-filled ONCE from state.formData's current values the first time the
  // Mac App Store platform is activated (see seedMacAppStoreListing, app.js)
  // — the same "auto-fill once, then freely editable" treatment already
  // used elsewhere in Shipmate (e.g. the Web platform's Developer/Publisher
  // fields) — then edited independently via _masFieldValue/_masSetFieldValue
  // (app.js) and buildMacStorePreviewSection (render.js). Editing this NEVER
  // writes back to state.formData / the App Store's own listing, and vice
  // versa. primaryLanguage/localizations (which languages exist at all) are
  // NOT duplicated here — that's a studio-wide decision shared with every
  // platform, not per-listing marketing copy.
  macAppStoreListing: null,

  // Steam's appdetails 'support_info.url' field, captured at Steam-link
  // time (_applySteamAboutData, app.js) purely as a cache — there's no
  // preview-website field this backs, unlike officialWebsite (state.webSite)
  // which is Steam's 'website' field doing double duty. Consumed once by
  // seedMacFullAppStoreListing (app.js) to pre-populate Mac App Store
  // Full's own Support URL field; never read anywhere else.
  steamSupportUrl: '',

  // Mac App Store Full's OWN independent Product Page Preview listing text
  // — a superset of macAppStoreListing above (Name/Subtitle/Description/
  // What's New), extended per the App Store Connect "Version Information"
  // section to also cover Promotional Text, Keywords, Support URL,
  // Marketing URL, and Copyright (with company name — NOT the hardcoded
  // "© {year}" the rest of Shipmate falls back to). Support URL/Marketing
  // URL are pre-populated from Steam's appdetails 'support_info.url'/
  // 'website' fields when available (steamSupportUrl above /
  // state.webSite.officialWebsite), same "auto-fill once, then freely
  // editable" treatment as every other Steam-sourced field elsewhere in
  // Shipmate. Title/Subtitle are NOT shared with either sibling platform
  // here (no MAS_SHARED_LISTING_FIELDS-style routing for macos_full), per
  // the "fully independent" design decision. Unlike the original
  // "simplified but functional" plan, Mac App Store Full's own Product
  // Page Preview (buildMacFullStorePreviewSection, render.js) is a full
  // parity port of Mac App Store's own — so localizedStoreText below is
  // now genuinely live, driving Mac App Store Full's own Localization
  // Review (buildMacFullLocalizationReviewSection) via the macFullPreviewLang/
  // macFullLocReview*/macFullTranslate*/macFullAutoTranslateFields cluster
  // just below, own independent copies of masPreviewLang/masLocReview*/
  // masTranslate*/masAutoTranslateFields further below. Editing this never
  // writes back to state.formData or either sibling platform's own
  // listing, and vice versa — EXCEPT Description,
  // sibling platform's own listing, and vice versa — EXCEPT Description,
  // which is the one field kept forced in sync FROM state.formData.description
  // going forward (see _macFullPropagateDescription, app.js) — still never
  // writes back TO it.
  macFullAppStoreListing: null,

  // Mac App Store Full's OWN Product Page Preview — full twins of
  // masPreviewLang/masTranslateStatus/masTranslatePendingLangs/
  // masAutoTranslateFields/masReviewSettingsOpen/masLocReviewField/
  // masLocReviewMode/masLocReviewBackTranslation/masLocReviewUndoHistory
  // further below, substituting "macFull" for "mas" — same shapes/
  // defaults, own independent copies, scoped to macFullAppStoreListing
  // above instead of macAppStoreListing. Unlike Mac App Store's own
  // cluster, there is no MAS_SHARED_LISTING_FIELDS-style split for any of
  // Title/Subtitle/Description/What's New here — every field is fully
  // independent, per macFullAppStoreListing's own comment above.
  macFullPreviewLang: null,
  macFullTranslateStatus: {},
  macFullTranslatePendingLangs: {},
  macFullAutoTranslateFields: { title: false, subtitle: true, description: true, releaseNotes: true },
  macFullReviewSettingsOpen: false,
  macFullLocReviewField: null,
  macFullLocReviewMode: 'locs',
  macFullLocReviewBackTranslation: {},
  macFullLocReviewUndoHistory: { real: {}, draft: {} },

  // Which section ('storePage' | 'iaps' | 'achievements') Mac App Store
  // Full's unified Localizations step (buildMacFullLocalizationsSection,
  // render.js) is currently showing in its leftmost dropdown. null means
  // "show Store Page" (the default). This unified view reuses Store
  // Page/IAPs/Achievements' own existing getters/setters/state directly —
  // it has no separate data store of its own, only this one field
  // recording which of the three sub-views is selected.
  macFullLocsView: null,

  // Mac App Store Full's OWN IAP Localizations — full twins of the nine
  // masIapLocIapId/masIapLocField/masIapLocMode/masIapLocBackTranslation/
  // masIapLocUndoHistory/masIapLocTranslateStatus/masIapLocTranslatePendingLangs/
  // masIapLocAutoTranslateFields/masIapLocSettingsOpen fields further below,
  // scoped to Mac App Store Full's own saved IAP products
  // (state.macFullSubmitAnswers.iapProducts — already fully independent of
  // every other platform's own) instead of Mac App Store's.
  macFullIapLocIapId: null,
  macFullIapLocField: null,
  macFullIapLocMode: 'locs',
  macFullIapLocBackTranslation: {},
  macFullIapLocUndoHistory: { real: {}, draft: {} },
  macFullIapLocTranslateStatus: {},
  macFullIapLocTranslatePendingLangs: {},
  macFullIapLocAutoTranslateFields: { name: true, desc: true },
  macFullIapLocSettingsOpen: false,

  // Which language Mac App Store's own Product Page Preview language
  // dropdown is currently showing — mirrors iasPreviewLang below, but kept
  // entirely separate so switching languages while previewing one platform
  // never affects the other.
  masPreviewLang: null,

  // Mac App Store twins of iasTranslateStatus/iasTranslatePendingLangs/
  // iasAutoTranslateFields/iasReviewSettingsOpen below — same shapes/
  // defaults, own independent copies.
  masTranslateStatus: {},
  masTranslatePendingLangs: {},
  masAutoTranslateFields: { title: false, subtitle: true, description: true, releaseNotes: true },
  masReviewSettingsOpen: false,

  // Mac App Store's OWN Localization Review — full twins of
  // locReviewField/locReviewMode/locReviewBackTranslation/locReviewUndoHistory
  // below, kept as entirely separate state (own cache, own undo history)
  // rather than reusing iOS's directly, even for the two fields (Title/
  // Subtitle) whose REAL data is shared — see MAS_SHARED_LISTING_FIELDS'
  // comment (app.js) for why: the real value is shared through
  // _masFieldValue/_masSetFieldValue regardless, so an edit made from
  // either platform's Localization Review always lands in the same place;
  // only this ephemeral review-UI scratch state (back-translation drafts,
  // undo stacks, which field/mode is showing) stays platform-local, the
  // same "duplicate the stateful UI, not the data" tradeoff already made
  // for IAP Localizations (see iapLocField's own comment further below).
  masLocReviewField: null,
  masLocReviewMode: 'locs',
  masLocReviewBackTranslation: {},
  masLocReviewUndoHistory: { real: {}, draft: {} },

  // Which section ('storePage' | 'iaps' | 'achievements') Mac App Store's
  // unified Localizations step (buildMacLocalizationsSection, render.js) is
  // currently showing in its leftmost dropdown. null means "show Store
  // Page" (the default). See macFullLocsView above for the shared design.
  macLocsView: null,

  // Which language the App Store Product Page Preview's top-right language
  // dropdown is currently showing (a language code, e.g. 'en'). null means
  // "use the Distribution section's primary language" — buildStorePreviewSection
  // falls back to state.formData.primaryLanguage whenever this is null or no
  // longer a valid choice (e.g. a supported language was deselected in
  // Distribution after being chosen here).
  iasPreviewLang: null,

  // Which field ('title' | 'subtitle' | 'description' | 'releaseNotes') the
  // Localization Review section's top-right field dropdown is currently
  // showing across every language's card (buildLocalizationReviewSection,
  // render.js — opened via the App Store Product Page Preview's "All Locs"
  // button). null means "show Title" — Localization Review's default view.
  locReviewField: null,

  // 'locs' | 'review' — which side Localization Review's SUPPORTING-language
  // cards currently show (the Primary Language's own card never flips —
  // nothing to review it against). 'locs' is the normal side (one field,
  // directly editable, same as every other Shipmate flip section's default
  // state). 'review' flips every supporting card to a two-way review layout:
  // the language's own text on top, a back-translation of it into the
  // Primary Language on the bottom — editing either half re-translates and
  // writes the other. Toggled by toggleLocReviewMode (app.js), which also
  // relabels the header's Review/"All locs" button. See
  // buildLocalizationReviewSection, render.js.
  locReviewMode: 'locs',

  // Back-translation drafts for Localization Review's flipped "review" side
  // — { [field]: { [lang]: { text, syncedTopText, status } } }. text is the
  // Primary-Language string currently shown in that card's BOTTOM half;
  // syncedTopText is the language's own real field value (the TOP half)
  // that `text` is already known to correspond to — as long as they match,
  // nothing needs re-translating. status is null | 'loading' | 'error'.
  // This is scratch review-UI state, not real submission data (unlike
  // formData.localizedStoreText, which the TOP half reads/writes directly
  // via the same _iasFieldValue/_iasSetFieldValue as the non-flipped side).
  // See _locReviewSyncBackTranslations / _locReviewCommitPrimaryEdit, app.js.
  locReviewBackTranslation: {},

  // Per-field undo/redo history for Localization Review's card fields —
  // { real: { [field]: { [lang]: { past: [...], future: [...] } } },
  //   draft: { [field]: { [lang]: { past: [...], future: [...] } } } }.
  // 'real' tracks a language's own actual field value (the non-flipped
  // card, or a flipped Review-side card's TOP half); 'draft' tracks a
  // flipped card's BOTTOM half (the Primary-Language back-translation
  // scratch pad in locReviewBackTranslation above) — a separate piece of
  // text with its own separate history. Populated only by a direct edit's
  // own commit (startLocReviewInlineEdit / startLocReviewBackTranslationEdit,
  // app.js) — never by a cascading auto-translate/mirror from elsewhere.
  // See _locReviewPushUndo/locReviewUndo/locReviewRedo, app.js.
  locReviewUndoHistory: { real: {}, draft: {} },

  // Which section ('storePage' | 'iaps' | 'achievements') App Store's
  // unified Localizations step (buildIosLocalizationsSection, render.js) is
  // currently showing in its leftmost dropdown. null means "show Store
  // Page" (the default). See macFullLocsView above for the shared design.
  iosLocsView: null,

  // Auto-translation status per field ('subtitle' | 'description' |
  // 'releaseNotes') for the App Store Product Page Preview's Subtitle/
  // Description/What's New auto-translation into supporting languages —
  // null | 'loading' | 'complete' | 'error'. See _iasTriggerAutoTranslate
  // in app.js. Session-transient UI state, not submission data, so it
  // lives at the top level rather than inside formData.
  iasTranslateStatus: {},

  // Which supporting languages a given field's CURRENT in-flight batch
  // translate (iasTranslateStatus above) will actually update — the
  // eligible-language list _iasTriggerAutoTranslate computed when it
  // started this batch. Read via _iasFieldTranslatePending (app.js) so
  // Localization Review can show the loading spinner only on the card(s)
  // really about to change, not indiscriminately on every supporting
  // language. Cleared back to an empty array once the batch finishes
  // (success or error) — only meaningful while its field's
  // iasTranslateStatus entry is 'loading'.
  iasTranslatePendingLangs: {},

  // Which localizable fields Shipmate automatically translates (or, for
  // Title, mirrors) from the Primary Language into every supporting
  // language — keyed 'title' | 'subtitle' | 'description' | 'releaseNotes',
  // each true (auto-translate/mirror on) or false (fully manual — no
  // propagation to supporting languages at all when the primary text is
  // set or edited). Defaults match Shipmate's original hardcoded behavior
  // exactly: Title off (it's only ever mirrored, never a real translation,
  // unless turned on here), Subtitle/Description/What's New on. Set via
  // the gear icon beside "Localization Review" (_iasToggleAutoTranslateField,
  // app.js). This only gates the Primary → supporting-languages direction;
  // the Review section's own top-half/bottom-half back-translation
  // (locReviewBackTranslation above) is independent and always active.
  iasAutoTranslateFields: { title: false, subtitle: true, description: true, releaseNotes: true },

  // Whether the "Automatically translated fields" dropdown (opened via the
  // gear icon beside "Localization Review") is currently open. Tracked in
  // state, rather than as a transient DOM class like every other dropdown
  // in the app (see swSelect/toggleSwSelect), because toggling a checkbox
  // inside it calls reRenderStepModal() to reflect the change immediately —
  // which fully replaces the modal's markup — so the open/closed state has
  // to survive that re-render by being read back in at render time instead
  // of living only in a DOM class that render would otherwise wipe out.
  iasReviewSettingsOpen: false,

  // ── Steam Store Page Preview - Prototype — own Localization Review ─────
  // Full twins of masPreviewLang/masLocReviewField/masLocReviewMode/
  // masLocReviewBackTranslation/masLocReviewUndoHistory/masTranslateStatus/
  // masTranslatePendingLangs/masAutoTranslateFields/masReviewSettingsOpen
  // above, substituting "steam" for "mas" — same shapes/defaults, own
  // independent copies, scoped to Steam's own Store Page Preview - Prototype
  // (buildSteamStorePreviewPrototypeSection/buildSteamLocalizationReviewSection,
  // render.js) instead of Mac App Store's Product Page Preview. Covers
  // Title (shared with the App Store's own state.formData — see
  // STEAM_SHARED_LISTING_FIELDS, app.js) plus Steam's own independent Short
  // Description/Developer/Publisher/About This Game (state.webSite.
  // localizedStoreText, above). Unlike the App Store's defaults (Subtitle/
  // Description/What's New on, Title off), Steam's own four fields default
  // Short Description and About This Game ON (real marketing copy worth
  // translating) and Developer/Publisher OFF (proper names, typically kept
  // as-is across locales) — see _steamFieldAutoTranslateEnabled, app.js.
  // Steam invents NO character limit for any of its 5 fields, unlike the App
  // Store's own IAS_FIELD_CHAR_LIMITS — see buildSteamLocalizationReviewSection's
  // own comment, render.js, for how that's reflected in its markup.
  steamPreviewLang: null,
  steamLocReviewField: null,
  steamLocReviewMode: 'locs',
  steamLocReviewBackTranslation: {},
  steamLocReviewUndoHistory: { real: {}, draft: {} },
  steamTranslateStatus: {},
  steamTranslatePendingLangs: {},
  steamAutoTranslateFields: { description: true, developer: false, publisher: false, aboutGame: true },
  steamReviewSettingsOpen: false,

  // ── Business — "IAP Localizations" ──────────────────────────────────
  // A full parallel of the nine locReview*/iasTranslate*/iasAutoTranslate*
  // fields directly above, scoped to ONE saved IAP product's Name/
  // Description at a time instead of the app's own Title/Subtitle/
  // Description/What's New — see buildIapLocalizationsSection (render.js)
  // and the _iapLoc*/iapLoc* function set (app.js) this drives. Kept
  // completely separate from the App-level fields above (its own state
  // keys, its own function names) rather than generalizing them to take an
  // optional product id — see the comment above _iapLocSavedProducts,
  // app.js, for why.

  // Which saved IAP product IAP Localizations' picker dropdown is currently
  // showing (an IAP product id, e.g. "iap_3"). null means "use the first
  // saved product" — _iapLocEffectiveIapId (app.js) falls back to it
  // whenever this is null or no longer a valid choice (e.g. that product
  // was removed after being chosen here).
  iapLocIapId: null,

  // Which field ('name' | 'desc') IAP Localizations' top-right field
  // dropdown is currently showing across every language's card. null means
  // "show Name" — IAP Localizations' default view, same convention as
  // locReviewField defaulting to Title above.
  iapLocField: null,

  // 'locs' | 'review' — mirrors locReviewMode above, independently, for IAP
  // Localizations' own Review/back-translation flip (toggleIapLocReviewMode,
  // app.js).
  iapLocMode: 'locs',

  // Back-translation drafts for IAP Localizations' flipped "review" side —
  // { [iapId]: { [field]: { [lang]: { text, syncedTopText, status,
  // forwardStatus } } } }. One level deeper than locReviewBackTranslation
  // above (keyed by IAP product first) but otherwise identical in shape and
  // meaning. See _iapLocSyncBackTranslations/_iapLocCommitPrimaryEdit, app.js.
  iapLocBackTranslation: {},

  // Per-field undo/redo history for IAP Localizations' card fields —
  // { real: { [iapId]: { [field]: { [lang]: { past: [...], future: [...] } } } },
  //   draft: { [iapId]: { [field]: { [lang]: { past: [...], future: [...] } } } } }.
  // One level deeper than locReviewUndoHistory above (keyed by IAP product
  // first) but otherwise identical. See _iapLocPushUndo/iapLocUndo/
  // iapLocRedo, app.js.
  iapLocUndoHistory: { real: {}, draft: {} },

  // Auto-translation status per (IAP product id, field) for IAP
  // Localizations' own Name/Description auto-translation into supporting
  // languages — { [iapId]: { [field]: null | 'loading' | 'complete' | 'error' } }.
  // See _iapLocTriggerAutoTranslate, app.js.
  iapLocTranslateStatus: {},

  // Which supporting languages a given (IAP product, field)'s CURRENT
  // in-flight batch translate (iapLocTranslateStatus above) will actually
  // update — { [iapId]: { [field]: [...langCodes] } }. Mirrors
  // iasTranslatePendingLangs above; read via _iapLocFieldTranslatePending
  // (app.js) so IAP Localizations can show the loading spinner only on the
  // card(s) really about to change.
  iapLocTranslatePendingLangs: {},

  // Which of an IAP product's two localizable fields Shipmate automatically
  // translates from the Primary Language into every supporting language —
  // keyed 'name' | 'desc', each true (auto-translate on) or false (mirrored
  // verbatim for Name, fully manual for Description). Both default on —
  // unlike Title/Description's own defaults (Title off, mirrored only), an
  // IAP product's Name is short marketing copy worth actually translating
  // out of the box, not just carrying over the Primary Language's text.
  // This setting is GLOBAL — it applies to every saved IAP product, not
  // just whichever one the picker dropdown currently shows (see
  // _iapLocToggleAutoTranslateField, app.js). Set via the gear icon beside
  // "IAP Localizations".
  iapLocAutoTranslateFields: { name: true, desc: true },

  // Whether IAP Localizations' own "Automatically translated fields"
  // dropdown is currently open — mirrors iasReviewSettingsOpen above,
  // independently (its own DOM id, 'iap-loc-settings-wrap', so the two
  // sections' gear menus can never affect each other — see
  // closeAllDropdowns/_iapLocToggleSettingsMenu, app.js).
  iapLocSettingsOpen: false,

  // Mac App Store's OWN IAP Localizations — full twins of the nine
  // iapLoc*/iapLocIapId fields directly above, scoped to Mac App Store's own
  // saved IAP products (state.macSubmitAnswers.iapProducts — already fully
  // independent of iOS's own, unaffected by the Content Rating/Privacy
  // sharing added elsewhere) instead of iOS's. Kept completely separate for
  // the same reason iapLoc* itself is kept separate from locReview* (see
  // iapLocIapId's own comment above) — IAP Products themselves are not
  // shared at all, so there's no sharing concern here, just the ordinary
  // "own copy of the same stateful UI" pattern used throughout Mac App
  // Store's build.
  masIapLocIapId: null,
  masIapLocField: null,
  masIapLocMode: 'locs',
  masIapLocBackTranslation: {},
  masIapLocUndoHistory: { real: {}, draft: {} },
  masIapLocTranslateStatus: {},
  masIapLocTranslatePendingLangs: {},
  masIapLocAutoTranslateFields: { name: true, desc: true },
  masIapLocSettingsOpen: false,

  // Mac App Store Game Center's own "Achievement Localizations" section
  // (buildMacAchievementLocalizationsSection, render.js — reached via the
  // Game Center step's own "Localizations" button, above the Achievements
  // list). A near-twin of the masIapLoc* fields directly above, keyed by
  // achievement id (state.macGameCenterAchievements) instead of IAP product
  // id, covering three fields (displayName/earnedDescription/
  // preEarnedDescription) instead of two — see the "_masAchLoc"/"masAchLoc"
  // prefixed handler cluster, app.js, for the full mechanics, including the
  // one real departure from IAP Localizations: an achievement imported from
  // Steam can carry a genuine Steam-authored translation
  // (a.locs[lang].displayNameFromSteam/earnedDescriptionFromSteam, set by
  // _checkSteamLocalizedAchievements) that outranks an AI translation the
  // same way Steam's own store-listing localizations already do elsewhere
  // in this file.
  masAchLocAchId: null,
  masAchLocField: null,
  masAchLocMode: 'locs',
  masAchLocBackTranslation: {},
  masAchLocUndoHistory: { real: {}, draft: {} },
  masAchLocTranslateStatus: {},
  masAchLocTranslatePendingLangs: {},
  masAchLocAutoTranslateFields: { displayName: true, earnedDescription: true, preEarnedDescription: true },
  masAchLocSettingsOpen: false,

  // App Store (ios)'s own "Achievement Localizations" section — full twin
  // of the masAchLoc* fields directly above, scoped to
  // state.iosGameCenterAchievements instead of state.macGameCenterAchievements.
  // See the "_iasAchLoc"/"iasAchLoc" prefixed handler cluster, app.js, for
  // the full mechanics (identical to "_masAchLoc"/"masAchLoc" in every way
  // except which achievement array it reads/writes).
  iasAchLocAchId: null,
  iasAchLocField: null,
  iasAchLocMode: 'locs',
  iasAchLocBackTranslation: {},
  iasAchLocUndoHistory: { real: {}, draft: {} },
  iasAchLocTranslateStatus: {},
  iasAchLocTranslatePendingLangs: {},
  iasAchLocAutoTranslateFields: { displayName: true, earnedDescription: true, preEarnedDescription: true },
  iasAchLocSettingsOpen: false,

  // Mac App Store Full Game Center's own "Achievement Localizations"
  // section (buildMacFullAchievementLocalizationsSection, render.js —
  // reached via the Game Center step's own "Localizations" button, above
  // the Achievements list). Full twin of the masAchLoc*/iasAchLoc* fields
  // above, keyed by achievement id (state.macFullGameCenterAchievements)
  // instead of state.macGameCenterAchievements/state.iosGameCenterAchievements.
  // See the "_macFullAchLoc"/"macFullAchLoc" prefixed handler cluster,
  // app.js, for the full mechanics (identical to "_masAchLoc"/"masAchLoc"
  // in every way except which achievement array it reads/writes) — same
  // naming convention already established for IAP Localizations'
  // macFullIapLoc* fields (see those, further above).
  macFullAchLocAchId: null,
  macFullAchLocField: null,
  macFullAchLocMode: 'locs',
  macFullAchLocBackTranslation: {},
  macFullAchLocUndoHistory: { real: {}, draft: {} },
  macFullAchLocTranslateStatus: {},
  macFullAchLocTranslatePendingLangs: {},
  macFullAchLocAutoTranslateFields: { displayName: true, earnedDescription: true, preEarnedDescription: true },
  macFullAchLocSettingsOpen: false,

  // Cached Steam store-page info for the currently-selected Steam-linked
  // game — { appId, baselineDescription, shortDescription,
  // supportedLanguagesRaw } or null when no Steam-linked game is selected
  // (or its appdetails fetch failed). baselineDescription is the default-
  // language "About This Game" field (about_the_game), flattened from HTML
  // to plain text. shortDescription is Steam's own one-or-two-sentence
  // marketing blurb (short_description) — backs the Web platform's "Hook"
  // field at render time (buildWebSitePreviewSection, render.js; see
  // state.webSite.description's own comment below). Populated by
  // _applySteamAboutData (app.js) right after it fetches the game's
  // default-language appdetails; baselineDescription is also consumed by
  // _checkSteamLocalizedDescription (app.js) whenever a supported language
  // is added, to fetch that language's appdetails and compare its (same
  // conversion of) about_the_game against the cached baseline — Steam
  // silently falls back to the default-language listing for languages it
  // hasn't actually localized, rather than erroring, so this comparison is
  // what tells a real localization apart from that fallback. Session-
  // transient, not submission data, so it lives at the top level rather
  // than inside formData.
  steamLocInfo: null,

  /* Which languages Steam's own localization scrapes have FINISHED with, as
     { listing: { [lang]: true }, achievements: { [lang]: true } }.

     "Finished" deliberately means settled, not successful: a language Steam
     had no translation for, and a language whose fetch failed outright, both
     belong here, because all three outcomes equally answer the only question
     being asked — is it still worth waiting for Steam before machine-
     translating this language? Auto-translate holds off while a language is
     unsettled (see _steamMayStillSupply, app.js) so Shipmate doesn't pay for
     a translation Steam is about to overwrite, and the scrape calls
     _markSteamLocSettled when it lands, which re-runs the propagate pass so
     whatever Steam left empty falls through to translation as the fallback.

     Two domains because the store listing and the achievements list are
     scraped by separate, independently-timed calls — one settling says
     nothing about the other. Reset with the rest of the Steam localization
     cache whenever a new title is picked. */
  steamLocSettled: null,

  // Cached default-language ("baseline") name/description for every
  // achievement on the currently-selected Steam-linked game's public
  // achievement stats page — { appId, achievements: [{name, description}] }
  // in the same order Steam itself lists them, or null when no Steam-linked
  // game is selected (or its achievements fetch failed). Populated by
  // _applySteamAchievements (app.js) right after it fetches/parses that
  // page for the default language; consumed by _checkSteamLocalizedAchievements
  // (app.js) whenever a supported language is added, the same
  // "genuinely localized vs. Steam silently fell back to the default
  // language" comparison steamLocInfo's own baseline fields support for the
  // store listing. Kept as its own field rather than folded into
  // steamLocInfo itself since the two are populated by separate,
  // independently-timed fetches (_applySteamAboutData vs.
  // _applySteamAchievements) — neither cache should have to guess whether
  // the other has finished loading yet. Session-transient, not submission
  // data, so it lives at the top level rather than inside formData.
  steamAchievementsBaseline: null,

  // Whether the privacy matrix is showing all types (default: fully collapsed)
  privacyMatrixExpanded: false,

  // Per-group collapse overrides inside the Data Types table
  // (buildPrivacyMatrix/togglePrivacyGroup), keyed "pid:Group Name" (e.g.
  // "ios:Health & Fitness"). Absent = use the default (expanded only if the
  // group has a flagged/selected data type); present = the developer's own
  // explicit choice from clicking that group's header, which wins either way.
  /* The Data Types accordion (v6.52). `privacyGroupOpen` is ONE group name per
     platform, or null — the whole model. `privacyGroupOrder` is the group order
     frozen when the table was opened, so nothing re-sorts under a pointer that
     is working inside it. `privacyGroupExpanded`, the per-group override map
     these replace, is DELETED rather than left at `{}`: a field nothing reads
     is a mechanism waiting to be switched back on. */
  privacyGroupOpen:  {},
  privacyGroupOrder: {},

  // Content Rating question collapse (iOS + future AI-inferred steps)
  // Set of question IDs that were answered when AI inference last completed.
  // null = inference has not run yet (show all questions).
  // Set  = inference ran; IDs in this set are collapsed behind "Show answered" chevron.
  iosAnsweredAtInference: null,
  // Whether the user has expanded the "Show answered" section manually.
  iosContentRatingExpanded: false,

  // Mac App Store twins of iosAnsweredAtInference/iosContentRatingExpanded
  // above — kept fully independent so AI inference (or manual expand/collapse)
  // on one platform's Content Rating/Export Compliance/Business questions
  // never collapses or reveals rows on the other's.
  macAnsweredAtInference: null,
  macContentRatingExpanded: false,

  // Mac App Store Full twins of the same pair, same independence rationale.
  macFullAnsweredAtInference: null,
  macFullContentRatingExpanded: false,

  // Same snapshot pattern for Android and Steam
  androidAnswerSnapshot: null,

  // Full prompt sent in the last unified inference call — shown by "See Prompt" debug button.
  lastInferencePrompt: null,

  // Context sources snapshot taken immediately before the last inference call.
  // Stored pre-call so the debug block shows what actually went IN, not post-inference state.
  lastInferenceSources: null,

  // Per-platform selected submission track (pid → trackId). Defaults to 'production'.
  selectedTracks: {},

  // Per-platform flip state: null = not submitted; { track, time } = submitted + card flipped
  platformFlipped: {},

  // Per-platform developer-portal auth (prototype/faked). Keyed by pid:
  //   undefined / { loggedIn:false } → card shows the credentials (login) face
  //   { loggedIn:true, username }    → sign-in persists for the session
  platformAuth: {},

  // Connect-face stage per pid: 'intro' | 'signin' | 'confirm'. Absent = default
  // (intro, or signin once the extension is installed).
  connectStage: {},
  // Which platform's browser-framed sign-in modal is open (pid) or null.
  ascLogin: null,
  // Google OAuth sub-view for the Play Console flow: 'choose' | 'add' | 'consent'.
  googleView: 'choose',
  googleAccount: null,
  // Captured (faked) sign-in email per pid, used to label the connected account.
  connectAccountEmail: {},
  // Simulated "is the Shipmate browser extension installed?" — global, sticky
  // for the session so only the first connect prompts to install it.
  extensionInstalled: false,

  // Which face each active card is showing: 'steps' | 'account'.
  // Default when absent: 'steps' if signed in, else 'account'.
  //   signed out           → account face shows the login form  (STATE 1)
  //   signed in + account  → account face shows settings         (STATE 2)
  //   signed in + steps    → the submission steps / "linked"     (STATE 3)
  platformFace: {},

  // Faked "Linked App" selection per platform on the signed-in settings face.
  platformLinkedApp: {},

  // Cached STEPS-face pixel height per pid, so the ACCOUNT face can be pinned to
  // the same height and flips stay size-stable.
  platformCardHeight: {},
  androidContentRatingExpanded: false,
  // Google Play Content Questions (IARC tree) — keys the user has explicitly
  // re-opened after their subtree auto-collapsed (fully answered). Purely a
  // display override; clearing an answer removes the key from this set too.
  // Applies to 'radio' questions, which auto-collapse once answered.
  giarcManuallyExpanded: new Set(),
  // Same idea in reverse, for 'picklist_multi' ("select all that apply")
  // questions: those never auto-collapse just because one option was
  // checked (the user may still be picking more), so they only collapse
  // once the user explicitly does so via the collapse button, which adds
  // the key here. Clearing an answer removes the key from this set too.
  giarcManuallyCollapsed: new Set(),
  steamAnsweredAtInference: null,
  steamContentRatingExpanded: false,

  // Privacy NLP AI translation status: null | 'loading' | 'complete' | 'error'
  privacyAIStatus: null,

  // Selected quick-setup preset IDs for Privacy / Data Safety steps
  privacyPresets: [],

  // Claude AI UI state (not persisted)
  claudeUI: {},

  // Consolidated Questionnaire answers: { [questionId]: yn | option | option[] | string }
  cqAnswers: {},

  // Per-question AI inference metadata: { [questionId]: { confidence: 0-100, humanConfirmed: bool } }
  cqAnswerMeta: {},

  // CQ inference lifecycle: null | 'loading' | 'done' | 'error'
  cqInferenceStatus: null,
  cqInferenceError: null,

  cqSeen: false,

  // Transient state for the game search widget (scenarios: new_platform, update)
  // { status: 'loading'|'done'|'error', found: bool, title, description, source, confidence, confirmed: bool, error: string }
  liveSearch: null,

  // Picklist results from IGDB while user is typing a game title
  // [{ id, name, coverUrl, platforms, summary }]
  titlePicklist: [],

  // Set (to the fetch's error message) when the IGDB picklist search itself
  // failed — a network/proxy/auth error, NOT "no games matched". Kept
  // separate from titlePicklist (which is legitimately just [] for both
  // cases) so buildTitlePicklist (render.js) can show "search failed, try
  // again" instead of silently rendering nothing indistinguishable from a
  // genuine no-results title. Cleared the moment a search is retried or
  // succeeds — see _runTitlePicklist, app.js.
  titlePicklistError: null,

  // AI store page insights: null | { loading: true } | { issues: [...], index } | { error }
  storePageInsights: null,

  // AI visual analysis of screenshots + icon for the Improve Your Submission step
  // null | { loading: true } | { items: [{ area, severity, title, body }] } | { error }
  improveSubmissionAnalysis: null,

  // Whether incomplete-question highlights (amber rails) are enabled.
  // Starts false — enabled only after AI pre-population (≥80% filled)
  // or when the user returns to the onboarding modal after completing it.
  showHighlights: false,
};

/* THE LAYOUT FLAG NEEDS A WAY TO BE FLIPPED, AND IT DID NOT HAVE ONE.

   `submission.layout` ('inline' | 'modal') is the switch on the step row's
   click — see the note in render.js, at `const modalMode`. It shipped with no
   way to set it: no parameter, no setting, nothing. The only way to see the
   other presentation was to edit the literal above, which means the flag could
   not do the one job it was put there for — letting us look at both and decide.

   So: `?layout=modal` on the URL sets it, `?layout=inline` sets it back.
   Nothing else changes.

   **THE DEFAULT IS WHATEVER THE LITERAL ABOVE SAYS, AND THAT IS 'modal'
   (v6.47).** With no parameter this block does nothing at all, so what ships is
   exactly that literal. This hook cannot change the published default by
   accident.

   **AND THE URL IS NOW THE ONLY DOOR — `sm.layout` IS GONE (v6.46).** Jaco:
   *"necesito que me garantices que cualquier persona que lo abra verá el modal
   flag por defecto."* It stored the choice so a working day did not have to
   carry the query string through every reload, and the cost of that was the one
   thing this comment used to defend as "looks like a bug and is not": a browser
   that loaded `?layout=inline` ONCE, at any point, was pinned to the arm nobody
   chose, forever, with no sign of it on screen. That is not a guarantee about a
   default, it is a default with an invisible exception per machine — and the
   people who will open this are exactly the ones who cannot be told to run
   `localStorage.removeItem`.

   So the remembering goes, and any key already written is CLEARED on the way
   past rather than left as a dead entry: the guarantee has to hold on the
   machines that already tripped it, which is the whole point of asking for one.
   The flag itself is untouched — both arms, the literal and the console helper
   all still work — and `?layout=inline` still gives you the other presentation,
   for that load. `smSubmitLayout()` (app.js) already never touched storage, so
   the live switch and the reload door now agree.

   The try/catch is the house style (see app.js's own localStorage line):
   private browsing throws on get, set and remove alike, and a layout you are
   merely LOOKING at is never worth an exception. */
(() => {
  try {
    const q = new URLSearchParams(location.search).get('layout');
    if (q === 'modal' || q === 'inline') state.submission.layout = q;
    localStorage.removeItem('sm.layout');
  } catch (_) {}
})();

/* The same door for the calendar's wait presentation — `?wait=stripe` or
   `?wait=band`, remembered under `sm.wait`. Written as its own block rather
   than folded into the one above so the two flags can be deleted separately,
   which they will be: they are answering different questions and will be
   settled on different days. `smWaitStyle()` in app.js is the console door and
   re-renders; this one is for a reload. */
(() => {
  try {
    const q = new URLSearchParams(location.search).get('wait');
    if (q === 'band' || q === 'stripe') localStorage.setItem('sm.wait', q);
    const saved = localStorage.getItem('sm.wait');
    if (saved === 'band' || saved === 'stripe') state.calWaitStyle = saved;
  } catch (_) {}
})();

/* ══════════════════════════════════════════════════════
   STEAM SUBMISSION
   ══════════════════════════════════════════════════════ */

/* ── Content Survey categories (PDF 7) ─────────────── */
const STEAM_CONTENT_CATEGORIES = [
  { group: 'Fantasy / Mild Violence', items: [
    { id: 'fmv_blood',   label: 'Unrealistic blood color' },
    { id: 'fmv_cartoon', label: 'Cartoon violence / fantasy violence' },
    { id: 'fmv_fights',  label: 'Fights without gore or blood; display of weapons; bones/skeletons; derogatory language; anguish' },
  ]},
  { group: 'Realistic Violence', items: [
    { id: 'rv_blood',     label: 'Realistic blood; violent acts; accidental death; bodily injury; corpses; violence description' },
    { id: 'rv_killing',   label: 'Killing' },
    { id: 'rv_minorities',label: 'Violence against minorities or vulnerable groups' },
  ]},
  { group: 'High Impact Violence / Cruelty', items: [
    { id: 'hiv_extreme',    label: 'Contains extremely violent or gory content (e.g., mutilation; torture; detailed deaths)' },
    { id: 'hiv_glorify',    label: 'Glamorization of / incitement to violence' },
    { id: 'hiv_gratuitous', label: 'Realistic excessive/gratuitous violence; grotesque violence' },
  ]},
  { group: 'Suicide', items: [
    { id: 'sui_depiction', label: 'Depiction of suicide' },
  ]},
  { group: 'Crime', items: [
    { id: 'crime_acts',     label: 'Depiction of criminal acts' },
    { id: 'crime_favorable',label: 'Favorable depiction of criminal behavior' },
  ]},
  { group: 'Horror', items: [
    { id: 'hor_bleak',       label: 'Fear — settings are bleak and dark, but not realistic' },
    { id: 'hor_frightening', label: 'Very frightening scenes; psychological horror' },
  ]},
  { group: 'Language', items: [
    { id: 'lang_mild',     label: 'Mild profanity, swearing, cursing' },
    { id: 'lang_moderate', label: 'Moderate crude language; occasional swearing' },
  ]},
  { group: 'Crude Humor', items: [
    { id: 'crude_adult',  label: 'Adult humor — comedic references to bodily functions, death, killing, crime, mental health, substance abuse, social and/or political issues' },
    { id: 'crude_sexual', label: 'Adult humor with sexual connotations' },
  ]},
  { group: 'Nudity or Sexual Content', items: [
    { id: 'sex_revealing',        label: 'Revealing outfits; sexual stimulation; sexual innuendo; sex-related language; masturbation' },
    { id: 'sex_veiled',           label: 'Veiled nudity — body form implied by tight-fitting clothing or objects barely covering a naked body' },
    { id: 'sex_nonexplicit',      label: 'Non-explicit sexual content; prostitution; exaggerated eroticism or excessive erotic content' },
    { id: 'sex_somenudity',       label: 'Some nudity — breasts or buttocks visible, but no genitalia' },
    { id: 'sex_violence',         label: 'Depictions of sexual violence (rape, abuse)' },
    { id: 'sex_minor_suggest',    label: 'Suggestion of a minor involved in a sexual context' },
    { id: 'sex_minor_insinuate',  label: 'Suggestion or insinuation of minors engaged in sexual activity' },
  ]},
  { group: 'Explicit Sexual Content', items: [
    { id: 'esex_explicit',   label: 'Contains sexual content that is explicit or graphic and is intended for adults only' },
    { id: 'esex_genitalia',  label: 'Clear depiction of genitalia' },
  ]},
  { group: 'Legal Drugs', items: [
    { id: 'drug_legal',     label: 'Insinuated consumption of alcohol or tobacco' },
    { id: 'drug_illegal',   label: 'Insinuated consumption of illegal drugs; description of illegal drug use' },
    { id: 'drug_depiction', label: 'Depiction of use of any illegal drugs; drug traffic' },
    { id: 'drug_favorable', label: 'Favorable speech about illicit drug use' },
  ]},
  { group: 'Social Themes', items: [
    { id: 'social_abortion', label: 'References to abortion' },
  ]},
  { group: 'Elements of Extremism', items: [
    { id: 'ext_nazi',     label: 'Includes symbols of Nazi organizations (e.g., swastikas, SS runes). NOTE: may prevent sale in Germany.' },
    { id: 'ext_hateful',  label: 'Disparaging or hateful messages directed at certain population groups' },
    { id: 'ext_genocide', label: 'Glorification, denial, or gross trivialization of the Holocaust or other events of genocide' },
  ]},
  { group: 'Simulated Gambling / Speculative Acts', items: [
    { id: 'gamb_refs',        label: 'References to real-world gambling games or environments; not visible on screen' },
    { id: 'gamb_resembles',   label: 'Depiction of an environment resembling a real-world betting or gambling service' },
    { id: 'gamb_interaction', label: 'Interaction with gambling-like mechanics and chance-based outcomes' },
    { id: 'gamb_realmoney',   label: 'Participation requires real money or in-game currency purchased with real money' },
  ]},
  { group: 'Interactive Elements', items: [
    { id: 'int_purchases', label: 'In-game purchases' },
    { id: 'int_chance',    label: 'Chance-based in-game purchases' },
    { id: 'int_chat',      label: 'In-game chat — text and/or voice chat' },
    { id: 'int_filtered',  label: 'Filtered in-game text chat only (no voice, filters curse words and sexual terms)' },
    { id: 'int_online',    label: 'Online interactivity' },
  ]},
];

/* ── Tag Wizard constants (PDF 9) ───────────────────── */
const STEAM_TOP_GENRES = [
  'Action','Adventure','Casual','Racing','RPG','Simulation','Software','Sports','Strategy',
];

const STEAM_GENRES = [
  '2D Fighter','3D Fighter','4X','Action Roguelike','Action RPG','Action-Adventure',
  'Animation & Modeling','Arcade','Audio Production','Auto Battler','Automobile Sim',
  'Base Building','Baseball','Basketball','Battle Royale',"Beat 'em up",'BMX',
  'Board Game','Bowling','Building','Card Game','City Builder','Colony Sim',
  'Character Action Game','Chess','Clicker','Cycling','Dating Sim',
  'Design & Illustration','Diplomacy','Education','eSports','Experimental',
  'Exploration','Farming Sim','Fighting','Football','God Game','Golf',
  'Grand Strategy','Hacking','Hidden Object','Hockey','Idler','Interactive Fiction',
  'JRPG','Life Sim','Management','Match 3','Medical Sim','Mini Golf','Mining',
  'MMORPG','MOBA','Motocross','Open World','Outbreak Sim','Party Game',
  'Party-Based RPG','Photo Editing','Pinball','Platformer','Point & Click',
  'Puzzle','Rhythm','Roguelike','RTS','Sandbox','Shooter','Skateboarding',
  'Skating','Skiing','Snowboarding','Soccer','Space Sim','Stealth','Strategy RPG',
  'Survival','Tabletop','Tennis','Tower Defense','Trivia','Turn-Based Strategy',
  'Utilities','Video Production','Visual Novel','Walking Simulator','Word Game','Wrestling',
];

const STEAM_SUB_GENRES = [
  '2D Platformer','3D Platformer','Action RTS','Arena Shooter','Boomer Shooter',
  'Bullet Hell','Card Battler','Choose Your Own Adventure','Collectathon',
  'Combat Racing','Creature Collector','CRPG','Dungeon Crawler','Flight','FPS',
  'Hack and Slash','Heist','Hero Shooter','Horror','Idler','Immersive Sim',
  'Investigation','Looter Shooter','Mahjong','Metroidvania','Mystery Dungeon',
  'On-Rails Shooter','Open World Survival Craft','Outbreak Sim','Political Sim',
  'Precision Platformer','Puzzle Platformer','Real Time Tactics','Roguelite',
  'Runner',"Shoot 'Em Up",'Shop Keeper','Side Scroller','Sokoban','Solitaire',
  'Souls-like','Spectacle Fighter','Survival Horror','Tactical RPG',
  'Third-Person Shooter','Time Management','Top-Down Shooter','Traditional Roguelike',
  'Turn-Based Tactics','Twin Stick Shooter','Typing','Wargame',
];

const STEAM_AI_LIVE_TYPES = ['Code','Text','Textures','3D Models','Sound Effects','Music','Voice','Other'];

/* ── Accessibility features (PDF 11 Summary) ────────── */
const STEAM_ACCESSIBILITY_FEATURES = [
  { id: 'adj_difficulty',  label: 'Adjustable Difficulty',          desc: 'Difficulty settings allow players to match their experience to their abilities' },
  { id: 'save_anytime',    label: 'Save Anytime',                   desc: 'Players can save at any point in the game' },
  { id: 'custom_volume',   label: 'Custom Volume Controls',         desc: 'Volume for different audio types can be adjusted independently' },
  { id: 'narrated_menus',  label: 'Narrated Game Menus',            desc: 'Players can listen to game menus with narrated audio' },
  { id: 'stereo_sound',    label: 'Stereo Sound',                   desc: 'Players can identify how far left or right sounds are coming from' },
  { id: 'surround_sound',  label: 'Surround Sound',                 desc: 'Players can identify direction of sounds in any direction' },
  { id: 'adj_text_size',   label: 'Adjustable Text Size',           desc: 'Players can adjust in-game text, menu text, subtitles' },
  { id: 'subtitle_opts',   label: 'Subtitle Options',               desc: 'Players can customize subtitle display including background opacity, text color and size' },
  { id: 'color_alt',       label: 'Color Alternatives',             desc: "Gameplay doesn't rely on colors, or players can adjust distinguishing colors" },
  { id: 'contrast',        label: 'Contrast Controls',              desc: 'Contrast is adjustable, e.g., dark/light mode' },
  { id: 'camera_comfort',  label: 'Camera Comfort',                 desc: 'Players can adjust or disable screen shaking, camera bob, motion blur' },
  { id: 'no_vision',       label: 'Playable without Vision',        desc: 'Players can play fully without ever seeing the screen' },
  { id: 'keyboard_only',   label: 'Keyboard Only Option',           desc: 'Game can be played with just a keyboard' },
  { id: 'mouse_only',      label: 'Mouse Only Option',              desc: 'Game can be played with just a mouse' },
  { id: 'touch_only',      label: 'Touch Only Option',              desc: 'Game can be played with just touch controls' },
  { id: 'no_qte',          label: 'Playable without Quick Time Events', desc: 'Players can avoid sequences of precisely timed inputs' },
  { id: 'own_pace',        label: 'Playable at Your Own Pace',      desc: 'Players can take as long as they need for any input' },
  { id: 'chat_tts',        label: 'Chat Text-to-speech',            desc: 'Text chat between players can be narrated out loud in real time' },
  { id: 'chat_stt',        label: 'Chat Speech-to-text',            desc: 'Voice chat between players can be read as text transcript in real time' },
];

/* ── State factory ──────────────────────────────────── */
function makeBlankSteamAnswers() {
  return {
    // Content Survey — all yes/no items stored in one object {[id]: 'yes'|'no'|null}
    steamContentAnswers: {},
    matureDescription:  '',
    matureAccess:       '',
    // Generative AI
    usesAI:             null,
    aiDescription:      '',
    aiLiveGenerated:    null,
    aiThirdParty:       null,
    aiLiveTypes:        [],
    aiCodeDesc:         '',
    aiCopyrightDesc:    '',
    aiModerationDesc:   '',
    aiThirdPartyName:   '',
    aiThirdPartyUrl:    '',
    aiAvailabilityDesc: '',
    aiMonetizationDesc: '',
    // Tag Wizard
    topGenres:          [],
    genres:             [],
    subGenres:          [],
    // Technical — Players (mirrors Steamworks' own "Players" checkbox tree:
    // three top-level modes, an optional PvP/Co-op breakdown each with
    // Online/LAN/Local granularity, and Cross-Platform Multiplayer as its
    // own top-level toggle). Read by buildSteamTechnicalSection's Players
    // subsection and computeSteamPlayerBadges (render.js), the latter also
    // feeding the Store Page Preview - Prototype's Features block.
    players: {
      singlePlayer: false,
      multiPlayer:  false,
      mmo:          false,
      pvp:          false,
      pvpOnline:    false,
      pvpLan:       false,
      pvpLocal:     false,
      coop:         false,
      coopOnline:   false,
      coopLan:      false,
      coopLocal:    false,
      crossPlatform: false,
    },
    inputSupport:       null,
    xboxFullSupport:    null,
    psControllers:      [],
    steamInputAPI:      null,
    // Accessibility
    accessibilityFeatures: [],
    // Store Preview
    storePreviewSeen:   false,
    privacyPolicyUrl:   '',
    // Store Page Preview - Prototype — full-page mockup, marks complete on first view
    storePreviewPrototypeSeen: false,
    // Store Page Preview - Prototype's "Languages" block — null until the
    // user has opened it once (_steamSeedLanguagesIfNeeded, app.js), which
    // seeds it from Game Details' Primary + Supported languages as
    // [{code, interface, fullAudio, subtitles}, ...]. Once seeded it's
    // never re-synced from Game Details again — same "seed once, then
    // freely editable" pattern as Developer/Publisher/Price elsewhere in
    // this prototype — so edits/removals made in
    // buildSteamLanguagesEditSection (render.js) stick.
    languages:          null,
    // Data Safety and Localizations — stub steps, complete on first view.
    // See PLATFORMS.steam.steps for why they are rows rather than nothing.
    dataSafetySeen:     false,
    localizationsSeen:  false,
    // Improve Your Submission — marks complete on first view
    improveSubmissionSeen: false,
  };
}

function isSteamSectionComplete(sectionId) {
  if (sectionId === 'uploadBuild') return _uploadBuildComplete('steam');

  if (sectionId === 'screenshots') {
    const ps = state.platformScreenshots?.steam;
    return !!(ps && (ps.selected.length > 0 || ps.custom.length > 0));
  }
  if (sectionId === 'improveSubmission') return !!state.steamSubmitAnswers.improveSubmissionSeen;
  if (sectionId === 'storePreviewPrototype') return !!state.steamSubmitAnswers.storePreviewPrototypeSeen;
  /* Both visit-based, because both are stubs — see PLATFORMS.steam.steps for
     why the rows exist at all, and why "you have seen this" is the only claim
     either can honestly make yet. Kept out of the questionnaire roll-up below
     for isAndroidSectionComplete's own stated reason. */
  if (sectionId === 'dataSafety')    return !!state.steamSubmitAnswers.dataSafetySeen;
  if (sectionId === 'localizations') return !!state.steamSubmitAnswers.localizationsSeen;

  if (sectionId === 'questionnaire') {
    return isSteamSectionComplete('contentRating') &&
           isSteamSectionComplete('storeTags') &&
           isSteamSectionComplete('technical');
  }

  const a = state.steamSubmitAnswers;
  if (sectionId === 'contentRating') {
    if (a.usesAI === null) return false;
    if (a.steamContentAnswers && a.steamContentAnswers['gen_mature'] === 'yes') {
      if (!a.matureDescription.trim() || !a.matureAccess.trim()) return false;
    }
    return true;
  }
  if (sectionId === 'storeTags')  return a.topGenres.length >= 1;
  if (sectionId === 'technical')  {
    if (a.inputSupport === null) return false;
    if (a.inputSupport !== 'keyboard_only' && a.xboxFullSupport === null) return false;
    return true;
  }
  return false;
}

function computeSteamSectionRisk(sectionId) {
  if (sectionId === 'questionnaire') {
    const risks = ['contentRating','storeTags','technical'].map(computeSteamSectionRisk);
    if (risks.includes('HIGH'))   return 'HIGH';
    if (risks.includes('MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }
  const a = state.steamSubmitAnswers;
  if (sectionId === 'contentRating') return a.usesAI === null ? 'HIGH' : 'LOW';
  if (sectionId === 'storeTags')     return a.topGenres.length === 0 ? 'HIGH' : 'LOW';
  if (sectionId === 'technical')     return a.inputSupport === null  ? 'HIGH' : 'LOW';
  return 'LOW';
}
