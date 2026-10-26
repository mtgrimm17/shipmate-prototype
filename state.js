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

/* Every key under a top-level question, reachable through ANY option — the
   static shape of the branch, not what the current answers happen to reveal.
   Used to treat a top-level question and its follow-ups as one unit when
   deciding who owns it (see giarcSeedFromIos, app.js). */
function giarcSubtreeKeys(key, out = []) {
  const q = GOOGLE_IARC_BY_KEY[key];
  if (!q) return out;
  out.push(key);
  giarcOptionEntries(q).forEach(o =>
    giarcChildKeysForOption(o.child).forEach(k => { if (!out.includes(k)) giarcSubtreeKeys(k, out); }));
  return out;
}

/* ── App Store answers → IARC (Google Play + Epic Games Store) ──────────────

   Apple's questionnaire is coarser than IARC's: thirteen intensity levels and
   a handful of yes/no capabilities against a 95-question tree. So this maps
   only what an App Store answer actually SAYS, and leaves a follow-up blank
   rather than guessing it. A blank IARC row is a question the developer
   answers; a wrong one is a rating they ship.

   One entry per IARC top-level question. `from` names the App Store fields
   that drive it — if any of those was answered by the developer, the mapping
   outranks an AI guess on the IARC side (giarcSeedFromIos). `derive` returns
   the answers for the WHOLE branch (short keys, option indices exactly as
   GOOGLE_IARC_QUESTIONS numbers them), or null when the App Store answers do
   not settle it. Keys are only written if their parent's answer reveals them;
   giarcSeedFromIos prunes anything else. */
const _giarcSev = v => v === 'frequent' ? 2 : v === 'infrequent' ? 1 : v === 'none' ? 0 : null;

/* THE SEVEN GROUPS EPIC'S FOURTEEN TOPICS ARE SHOWN IN (v8.52), one list
   for every surface: Shippy's checklist rows (_smEgsContentItems, app.js),
   the card's topic ORDER and its "N of 7" count (buildEgsContentRatingSection,
   render.js). Jaco: "debería poner 2/7 si consideramos todas juntas, y
   deberías agrupar por orden las de los distintos grupos." IARC's own order
   scattered a group across the card (Gambling 4th, its partner Purchases
   8th); the card now walks the topics group by group, so the rail and the
   card read in the same sequence. IARC's order is not stored anywhere, so
   nothing else depends on it. */
const GIARC_RAIL_GROUPS = [
  { label: 'Violence & Fear',        keys: ['bloodviolencegore', 'fear'] },
  { label: 'Sexuality & Dating',     keys: ['sexsuggestdate'] },
  { label: 'Language & Humor',       keys: ['offlang', 'crude'] },
  { label: 'Drugs & Alcohol',        keys: ['drugs'] },
  { label: 'Gambling & Purchases',   keys: ['gambling', 'crypto'] },
  { label: 'Online Features',        keys: ['interact', 'location'] },
  { label: 'Sensitive Content',      keys: ['nazi', 'korea', 'terrorism', 'crimes'] },
];
const GIARC_TOPIC_ORDER = GIARC_RAIL_GROUPS.flatMap(g => g.keys.map(k => 'google.content.' + k));

const GIARC_FROM_IOS = [
  { top: 'bloodviolencegore', from: ['cartoonViolence', 'realisticViolence', 'extendedViolence'],
    derive(a) {
      const c = _giarcSev(a.cartoonViolence), r = _giarcSev(a.realisticViolence), e = _giarcSev(a.extendedViolence);
      if (c === 0 && r === 0 && e === 0) return { bloodviolencegore: 2 };                  // No
      if (!(c > 0 || r > 0 || e > 0)) return null;
      const out = { bloodviolencegore: 1 };                                                 // Yes
      // Apple's Realistic and Extended Graphic Violence are both, by their own
      // definitions, violence against HUMANS in lifelike situations. Cartoon /
      // Fantasy alone does not say who the target is, so Types is left open.
      if (r > 0 || e > 0) {
        out.bloodviolencegoretypes = [1];                                                   // against humans
        out.humansetting   = 2;                                                             // Realistic
        out.humanreactions = 2;                                                             // Realistic
        if (e > 0) out.humanbloodlevel = e === 2 ? 4 : 3;                                   // High / Moderate
      }
      return out;
    } },

  { top: 'fear', from: ['horrorFear'],
    derive(a) {
      const h = _giarcSev(a.horrorFear);
      if (h === null) return null;
      if (h === 0) return { fear: 2 };
      // "Horrifying" is a step past what Apple's Horror/Fear Themes measures,
      // so the mapping stops at Scary and leaves Horrifying to the developer.
      return { fear: 1, feartypes: [1], scaryfreq: h === 2 ? 2 : 1 };
    } },

  { top: 'sexsuggestdate', from: ['matureSuggestive', 'sexualContent', 'graphicSexual'],
    derive(a) {
      const m = _giarcSev(a.matureSuggestive), s = _giarcSev(a.sexualContent), g = _giarcSev(a.graphicSexual);
      if (m === 0 && s === 0 && g === 0) return { sexsuggestdate: 2 };
      // Mature/Suggestive alone covers trauma and political strife too, so it
      // cannot by itself answer a question about sexuality.
      if (!(s > 0 || g > 0)) return null;
      const types = [1];                                                                    // sexual activity
      if (m > 0) types.push(2);                                                             // suggestive themes
      return { sexsuggestdate: 1, sexsuggestdatetypes: types, sexfreq: Math.max(s || 0, g || 0) === 2 ? 2 : 1 };
    } },

  { top: 'gambling', from: ['simulatedGambling', 'realMoneyGambling'],
    derive(a) {
      const sim = _giarcSev(a.simulatedGambling), real = a.realMoneyGambling;
      if (sim === 0 && real === 'no') return { gambling: 2 };
      if (!(sim > 0 || real === 'yes')) return null;
      const out = { gambling: 1, gamblingtypes: [3] };                                      // casino-style
      if (real === 'yes') out.casinorewards = 1;
      else if (real === 'no') out.casinorewards = 2;
      return out;
    } },

  { top: 'offlang', from: ['profanity'],
    derive(a) {
      const p = _giarcSev(a.profanity);
      if (p === null) return null;
      if (p === 0) return { offlang: 2 };
      return p === 2 ? { offlang: 1, offlangtypes: [2], swearing: 2 }                       // moderate swearing, often
                     : { offlang: 1, offlangtypes: [1], profanities: 1 };                   // minor profanities, rarely
    } },

  // Apple folds crude humour into Profanity, so only its "none" is an answer here.
  { top: 'crude', from: ['profanity'],
    derive(a) { return _giarcSev(a.profanity) === 0 ? { crude: 2 } : null; } },

  { top: 'drugs', from: ['substancesAlcohol'],
    derive(a) {
      const d = _giarcSev(a.substancesAlcohol);
      if (d === null) return null;
      return { drugs: d === 0 ? 2 : 1 };                      // which substance is not something Apple asks
    } },

  { top: 'crypto', from: ['hasIAP', 'lootBoxes', 'realMoneyGambling'],
    derive(a) {
      if (a.hasIAP === 'yes') {
        const out = { crypto: 1, cryptotypes: [1] };                                        // purchases of digital goods
        if (a.lootBoxes === 'yes') out.digitalchance = 1;
        else if (a.lootBoxes === 'no') out.digitalchance = 2;
        return out;
      }
      if (a.hasIAP === 'no' && a.realMoneyGambling === 'no') return { crypto: 2 };
      return null;
    } },

  { top: 'interact', from: ['messagingChat', 'userGenContent', 'socialMedia'],
    derive(a) {
      const v = [a.messagingChat, a.userGenContent, a.socialMedia];
      if (v.includes('yes')) return { interact: 1 };
      if (v.every(x => x === 'no')) return { interact: 2 };
      return null;
    } },
];


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

/* App Review contact validation. App Store Connect rejects a malformed phone or
   email outright, and the agent's submit-prep then drops just that field so the
   rest of the record still lands (submitprep._review_block). That drop was
   SILENT — the user typed 's' into Phone, it never reached ASC, and nothing
   said so. This catches the same bad values at entry, in Shipmate, so the user
   is warned before they submit. Empty is allowed (an empty field clears the ASC
   value by design, #49). Returns '' when the value is fine, else a short
   message. Kept here (loads first) so render.js and app.js can both call it. */
function smContactFieldError(path, value) {
  const v = (value || '').trim();
  if (!v) return '';                       // empty is allowed — clears the field
  if (path === 'reviewContact.email' || /\bemail$/i.test(path)) {
    // Deliberately loose — matches Apple's own acceptance, not RFC 5322.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address (name@example.com).';
  }
  if (path === 'reviewContact.phone' || /\bphone$/i.test(path)) {
    const digits = v.replace(/[^0-9]/g, '');
    // App Store Connect requires a full number — 10 digits (area/country code
    // included). The inline check must match that, or it clears at a length ASC
    // still rejects (9 digits looked fine inline but the sync dropped it).
    if (digits.length < 10) return 'Enter a full phone number including area code (at least 10 digits).';
    if (!/^[+()\-.\s0-9]+$/.test(v)) return 'A phone number can only contain digits, spaces and + ( ) - .';
    return '';
  }
  return '';
}

/* Listing-field validation, the same idea as smContactFieldError but for the App
   Information fields that go through the /populate path. Copyright is the one with
   a format rule App Store Connect enforces at write time: it must be at least 2
   characters (ENTITY_ERROR.ATTRIBUTE.INVALID.TOO_SHORT) — a single 's' was
   rejected and dropped silently. Empty is allowed (clears the field). Returns ''
   when fine, else a short message. */
function smListingFieldError(field, value) {
  const v = (value || '').trim();
  if (!v) return '';                       // empty is allowed — clears the field
  if (field === 'copyright' && v.length < 2) {
    return 'Copyright must be at least 2 characters, e.g. 2027 Your Studio.';
  }
  return '';
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
  // Same glyph as egs, by its own copy rather than a reference — platformIcon
  // does a flat PLATFORM_ICONS[pid] lookup, exactly as macos_full does above.
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
      /* CONTENT RATING AND DATA SAFETY ARE NOT ROWS HERE (v8.89), by
         request, and the two go for different reasons.

         CONTENT RATING STILL EXISTS, just not as a row. Its questions are
         reached from the Store Page Preview's own Content block
         (openStorePreviewSection('steam','content')), which is exactly
         where Epic's live and why Epic has no row either: the preview is
         the page these answers appear on, so the page is the door. The
         visit gate (STEP_REQUIRES_VISIT) still stamps contentRating when
         that door opens, so the Shippy rating row keeps working.

         DATA SAFETY IS GONE OUTRIGHT. It was a stub — a heading and a
         Shipmate Tip, marked done by being looked at — and the argument
         for keeping it was that every other store walks ratings -> data ->
         localizations -> store page, so an absent row would make Steam the
         one platform whose checklist silently skipped a question. That
         argument was about Steam's checklist matching the others'. It does
         not survive being asked to take the row out: a row that states a
         question, has no answer, and goes green for being opened is worth
         less than the space it occupies. _chkDataSafetyDone drops Steam
         with it (render.js), so a Steam-only project gets no data row
         rather than one it can never satisfy.

         LOCALIZATIONS IS STILL A STUB and still a row: it was not in the
         request, and unlike Data Safety it has somewhere to go — the
         preview's own Localizations button already opens a real
         side-by-side review. */
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
      { id: 'privacy',           label: 'App Privacy'                                  },
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
    /* FIVE-STEP MAC FLOW (v7.87): Connect · Generate Build · Product Page
       Preview · Improve Your Submission · Submit. Rationale:

       1. CONNECT is step 1 and a HARD GATE. The card already shows the
          account/connect wizard (showAccountFace → buildAccountCard, render.js)
          until the account is connected, so every step below is unreachable
          before it — that flip IS the gate, left untouched. Once connected,
          Connect rides along as a checked Step 1
          (isMacSectionComplete('connect') = platformAccountReady('macos')). The
          deeper "is the ASC *browser* session live" check is a separate piece
          (task #35); this is the structural gate.

       2. CONTENT RATING and APP PRIVACY are no longer their own rows. They live
          INSIDE Product Page Preview, reached through the preview's own doors
          that were always there — the 'content' cell and the 'data' /
          "Answer Data Collection Questions" block (buildMacStorePreviewSection,
          render.js) — alongside Business, which was already preview-only. They
          stay MANDATORY: isMacSectionComplete('storePreview') is not complete
          until Content Rating, App Privacy, Business AND the listing content
          all are, so Submit can't bypass them. The Content Rating visit gate
          (STEP_REQUIRES_VISIT) still applies — opening the preview's 'content'
          door stamps it.

       3. 'submit' is still appended separately by buildSubmitStepCard (render.js)
          and is NOT in this array. Localizations stays conditionally hidden
          (_visiblePlatformSteps drops it with no languages), so the common case
          shows exactly five rows.

       This reworks macos only (the live Mac card); macos_full is left as-is. */
    steps: [
      { id: 'connect',           label: 'Connect Account'                              },
      { id: 'uploadBuild',       label: 'Generate Build'                               },
      { id: 'localizations',     label: 'Localizations'                                },
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
      { id: 'contentRating',   label: 'Age Rating',                hasInference: true },
      { id: 'privacy',         label: 'App Privacy'                                   },
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
  /* ── EPIC GAMES STORE, BUILT OUT (v7.30) ───────────────────────────────
     What was here was the placeholder every not-yet-real platform gets:
     "Review Store Listing", "Confirm Media & Key Art", "Ratings (IARC)",
     "Release Settings" — four rows invented to look like a checklist, none of
     which corresponds to anything in Epic's Developer Portal.

     THESE ONES DO. Read off Epic's own published flow rather than guessed:
     their Get Started is five steps (Onboarding, Publish Your Product Home
     Page, Finalize and Test Configurations, Submit for Final Review, Release),
     and steps 2 and 3 break down into the lettered sub-steps this list is
     built from — "Store Settings: Product Configuration, Regions and Ratings",
     "Base Product Offer", "Offer Dates", "Product Home Page", "Binaries and
     Artifacts", "Optional: Localize". The Store Presence section names the
     same surfaces again (Configure Store Settings, Manage Regions & Ratings,
     Manage Offers, Manage Pages, Manage Artifacts, Localize Store Presence),
     and Requirements & Guidelines adds the technical ones: patch notes,
     cross-platform multiplayer for PC, Epic Games Store Achievements.

     ORDERED THE WAY EPIC ORDERS THEM — binary, then what the store needs to
     know about it, then the page, then review — rather than alphabetically or
     by how much work each is. Onboarding is not a row for the same reason it
     is not one on any other card: connecting the account lives on the gear
     (see "THE UNNUMBERED STEP" below), and Submit is appended by
     buildSubmitStepCard, not listed here — the same shape Google Play, the App
     Store and Steam already have. */
  egs: {
    id: 'egs', label: 'Epic Games Store', color: '#313131',
    steps: [
      { id: 'uploadBuild',       label: 'Upload Build'                                 },
      /* PRODUCT CONFIGURATION, SPLIT THE WAY EPIC SPLITS IT (v8.44). The
         Developer Portal's Store Settings > Product Configuration screen has
         exactly these three faces — Product details and Specifications under
         "Required Information", Social media under "Optional Information" —
         and they come BEFORE Regions and Ratings in Epic's own Get Started
         flow, which is what this card calls Content Rating. Keeping Epic's
         order means a developer working from their docs is never asked for
         something two screens ahead of where they are. */
      { id: 'productDetails',    label: 'Product Details'                              },
      /* NO 'specifications', 'socialMedia' OR 'contentRating' ROW (v8.57) —
         removed as Submission steps per request, now that the Store Page
         Preview carries a door to each of them: the System Requirements block
         opens Specifications, the Follow Us / Social Media Links block opens
         Social Media, and the rating card opens Content Rating. Same move Mac
         App Store made for Content Rating and App Privacy (see
         PLATFORMS.macos's own comment above), and the same three facts hold.

         THE SECTIONS ARE UNTOUCHED. buildEgsSpecificationsSection,
         buildEgsSocialMediaSection and Epic's content-rating tree still
         render, openStepModal('egs', <id>) still opens them — that is what the
         preview's blocks call — and isEgsSectionComplete still answers for all
         three. They are simply no longer counted among this platform's own
         steps (platformStepCount, and every list that maps over
         PLATFORMS.egs.steps). Their step definitions live on in
         PLATFORM_OFF_CARD_STEPS below so the modal still knows their titles.

         AND TWO OF THEM STAY MANDATORY. isEgsSectionComplete('storePreview')
         is not complete until Content Rating and Specifications are, so
         Submit cannot bypass what the page prints. The content-rating visit
         gate (STEP_REQUIRES_VISIT) still applies and is still stamped, by
         openStorePreviewSection's own 'content' -> 'contentRating' mapping.
         Social Media is the exception and always was: Epic files it under
         "Optional Information", its completeness was only ever "has been
         looked at", and a game with no Discord is not an unfinished game. */
      { id: 'localizations',     label: 'Localizations'                                },
      { id: 'storePreview',      label: 'Store Page Preview'                           },
      { id: 'improveSubmission', label: 'Improve Your Submission'                      },
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

/* ── WHICH EXTENSION BUILD THIS APP NEEDS (v8.23) ─────────────────────────
   `SM_EXT_VERSION` is the version in the shipped zip's manifest. Bump BOTH
   together or the page will ask for a build it does not serve.

   THE URL CARRIES IT, AND THAT IS THE POINT. The download was a bare
   `shipmate-extension.zip` while every script and style tag on the page
   carried `?v=8.22`, so the one file a browser is most likely to have cached —
   a download it already took — was the one file with nothing to bust it.
   Deploying a new extension and handing the developer back the old one out of
   cache is a bug you cannot see from either end.

   KEYED ON THE EXTENSION, NOT THE APP. `?v=0.2.0`, not `?v=8.23`: the app
   ships many times a week and the extension rarely, and busting a 30KB
   download on every app version would cost every user a re-download to fix a
   problem they do not have. */
const SM_EXT_VERSION = '0.2.1';
const SM_EXT_URL     = 'shipmate-extension.zip?v=' + SM_EXT_VERSION;

/* Dotted numeric compare, enough for `0.2.0` vs `0.10.0` and nothing more —
   this is a two-field version in a file we control, not semver with
   pre-release tags. */
function _smVerLt(a, b) {
  const pa = String(a || '').split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b || '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x < y;
  }
  return false;
}

/* An extension that announced itself but is older than this app needs.

   IT CANNOT SEE 0.1.0, AND THAT IS WORTH KNOWING RATHER THAN DISCOVERING.
   Announcing is itself a 0.2.0 feature, so a 0.1.0 install is silent and
   indistinguishable from nothing installed — the page shows the download step
   and cannot say why. From 0.2.0 onward every build announces, so this does
   work for the next bump; for the one happening now, the download step's own
   copy has to carry the explanation instead. */
function shipmateExtStale() {
  const d = state.extDetect;
  return !!(d && d.seen && d.version && _smVerLt(d.version, SM_EXT_VERSION));
}

/* IS THE EXTENSION AVAILABLE? ONE QUESTION, FOUR ASKERS (v8.22).
   Two different facts answer it — the user pressed "I've installed it"
   (extensionInstalled), or the extension announced itself (extDetect.seen) —
   and four places need the answer: this file's connectStepList, the connect
   face's stage, the Connect Account modal's task list, and UPF's signed-in
   handler. Four copies of `a || b` is how the fifth one gets written as just
   `a`, which is exactly the bug this fixes. */
function shipmateExtReady() {
  /* A STALE BUILD IS NOT A READY ONE (v8.23). If it announced a version older
     than this app needs, the Download and Install steps come back — updating
     is the thing to do, and showing them green would hide that. The user's own
     "I've installed it" claim still wins, as it does over every other answer
     here: they can see their own browser and we cannot. */
  if (shipmateExtStale()) return !!state.extensionInstalled;
  return !!(state.extensionInstalled || (state.extDetect && state.extDetect.seen));
}

// Ordered step ids for a platform's connect wizard. The extension step drops
// out once the extension is installed; Google Play uses a single OAuth step.
function connectStepList(pid) {
  const f = connectFlowConfig(pid);
  if (f.oauth) return ['intro', 'google', 'done'];
  const s = ['intro'];
  if (f.needsExtension && !shipmateExtReady()) s.push('extension');
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
      else if (pid === 'egs')        state.egsSubmitAnswers.storePreviewSeen     = true;
  }
  if (stepId === 'storePreviewPrototype' && pid === 'steam') {
    state.steamSubmitAnswers.storePreviewPrototypeSeen = true;
  }
  if (stepId === 'localizations') {
    if (pid === 'macos')           state.macLocalizationsSeen     = true;
    else if (pid === 'macos_full') state.macFullLocalizationsSeen = true;
    else if (pid === 'android')    state.androidSubmitAnswers.localizationsSeen = true;
    else if (pid === 'steam')      state.steamSubmitAnswers.localizationsSeen   = true;
      /* NOT OPTIONAL, unlike the arm above it. This chain ends in a bare
         `else` that writes state.iosLocalizationsSeen, so a card with no arm
         here would tick the APP STORE's Localizations step. */
    else if (pid === 'egs')        state.egsSubmitAnswers.localizationsSeen     = true;
    else                           state.iosLocalizationsSeen     = true;
  }
  /* Epic's three Product Configuration steps (v8.44). Only socialMedia's flag
     decides a done state; the other two are recorded because every other
     step on this card records one and a half-kept habit is worse than none. */
  if (pid === 'egs') {
    if (stepId === 'productDetails')      state.egsSubmitAnswers.productDetailsSeen = true;
    else if (stepId === 'specifications') state.egsSubmitAnswers.specificationsSeen = true;
    else if (stepId === 'socialMedia')    state.egsSubmitAnswers.socialMediaSeen    = true;
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
/* ── STEPS A CARD NO LONGER DRAWS, BUT THE APP STILL KNOWS (v8.57) ────────
   A step can be taken off a platform's card and stay completely alive — its
   section still renders, openStepModal still opens it, its completeness still
   answers — because the only thing the card's list decides is what gets a
   numbered row and what platformStepCount counts. Mac App Store did it first
   with Game Center; Epic now does it with Specifications, Social Media and
   Content Rating, all three reached through the Store Page Preview's own
   blocks.

   WHAT BREAKS WITHOUT THIS REGISTER is small and invisible until you see it:
   the step modal reads its title (and whether to run inference) from
   `PLATFORMS[pid].steps.find(...)`, so a step that is no longer in that array
   opens with a BLANK HEADING. Game Center answered that with a hardcoded
   label at the point of use, which works once; at four steps across four
   platforms it is a list of special cases in the middle of a render function.
   So the definitions move here, `platformStep` is the one lookup that knows
   about both lists, and the callers stop caring which list a step is in. */
const PLATFORM_OFF_CARD_STEPS = {
  ios:        [{ id: 'gameCenter',     label: 'Game Center' }],
  macos:      [{ id: 'gameCenter',     label: 'Game Center' }],
  macos_full: [{ id: 'gameCenter',     label: 'Game Center' }],
  egs: [
    { id: 'specifications', label: 'Specifications'                      },
    { id: 'socialMedia',    label: 'Social Media'                        },
    /* hasInference rides along with the definition, not with the row. Epic's
       content rating is inferred on the way in through the preview's own
       door (openStorePreviewSection's `needsInference`, app.js) as well, but
       the flag belongs to the step either way. */
    { id: 'contentRating',  label: 'Content Rating', hasInference: true  },
    /* OFF THE CARD LIKE ITS THREE NEIGHBOURS (v8.82). The logo is reached
       by pressing the thing it draws, at the top of the store page's own
       panel — the same door Specifications, Social Media and Content Rating
       took in v8.57, and for the same reason: a step whose whole subject is
       visible on the preview does not also need a row on the card. */
    { id: 'logo',           label: 'Logo'                                },
  ],
};

/* THE ONE LOOKUP. Asks the card's list first — an id in both would be a
   mistake, and this way the card's own definition wins — then the off-card
   register. Returns null for an id neither list knows, which is what every
   caller's `step?.` already expects. */
function platformStep(pid, stepId) {
  const p = PLATFORMS[pid];
  return (p && p.steps.find(s => s.id === stepId))
      || (PLATFORM_OFF_CARD_STEPS[pid] || []).find(s => s.id === stepId)
      || null;
}

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
  if (pid === 'egs')        return isEgsSectionComplete(stepId);
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
  /* AN ID NOBODY KNOWS COUNTS AS NOTHING (v8.52). _visiblePlatformSteps has
     always guarded this; four of the arms below read p.steps directly and
     would throw. That cost nothing while every id in the file was real —
     removing Epic Games Store Full made 'egs_full' an id that can still
     arrive from an older saved selection, and a dashboard that throws on one
     stale string is worse than one that shows it as empty. */
  if (!p) return { total: 0, complete: 0, submitDone: false, allRequired: false };
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
  // Epic Games Store: same shape as Google Play and Steam below — completion
  // comes from its own answers (and, for Content Rating, from the shared IARC
  // tree), never from platformStepStatus, which nothing sets for its steps.
  if (platformId === 'egs') {
    const steps = _visiblePlatformSteps(platformId);
    const complete = steps.filter(s => platformSectionComplete(platformId, s.id)).length;
    return { total: steps.length, complete, submitDone: false,
             allRequired: complete === steps.length && platformAccountReady(platformId) };
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
  /* APPLE ADDED THESE TWO, AND THEY ARE REQUIRED. Answers are required on
     submissions from September 2026. Placed between User-Generated Content and
     Messaging and Chat because that is where Apple's own Capabilities list puts
     them, and because the first is a property OF user-generated content: the
     question is not whether users make things, it is whether the app then
     spreads them. */
  { id: 'socialMedia',         label: 'Social Media',
    tooltip: 'Redistributing, amplifying, or interacting with user-generated content through a social feed or similar discovery method. Includes feeds, reshares, follows, or public comment threads.' },
  { id: 'socialMediaU13Off',   label: 'Social Media Disabled for Users Under 13',
    tooltip: 'Users under 13 do not have access to the app\'s social media capabilities. Answer Yes only if those features are actually withheld from under-13 accounts.' },
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

/* ══════════════════════════════════════════════════════
   APPLE'S AGE RATING, AS APPLE ACTUALLY COMPUTES IT
   ══════════════════════════════════════════════════════
   Read off App Store Connect Help -> "Age ratings values and definitions" in a
   browser on 2026-09-20, the OS-26-and-later table, and transcribed here
   verbatim. Two summarised fetches of the same page disagreed with each other
   and with the page, which is why this says where it came from: if a floor
   below is ever doubted, RE-READ THE PAGE. Do not re-derive it from a summary.

   THE RULE IS A MAXIMUM, NOT A LADDER. Every answer carries a minimum tier;
   the app takes the highest one any of its answers demands. What this replaced
   was a five-line ladder that read THREE of the twenty-four answers and could
   only ever say 4+, 12+ or 17+ — so a game with frequent cartoon violence,
   constant profanity and guns throughout came out 4+, the same as a shape
   sorter. Every one of its errors ran the same way: too low.

   UNRATED IS NOT A RATING, IT IS A REJECTION. Apple: an unrated app cannot be
   published on the App Store. Graphic Sexual Content and Nudity and Prolonged
   Graphic or Sadistic Realistic Violence put an app there at ANY frequency,
   infrequent included — there is no "a little of it is 18+" tier. The old
   ladder reported 17+ for exactly those two, which told a developer they were
   clear to ship something Apple will refuse outright.

   THE TIERS ARE THE CURRENT ONES. iOS 26 / macOS Tahoe 26 and later show
   4+, 9+, 13+, 16+, 18+. The 12+ and 17+ that older OS versions display come
   from Apple's own separate legacy table off the same answers; Shipmate
   previews what today's store shows, so it is this table that is modelled.
   (The legacy table is in the team's Apple age rating spec if it is ever
   needed — it is a different questionnaire, not a relabelling: it has no
   descriptor at all for guns, loot boxes or health and wellness.) */
const AGE_TIER_ORDER = ['4+', '9+', '13+', '16+', '18+', 'Unrated'];
const AGE_UNRATED    = 'Unrated';

/* Frequency questions. `none` never raises anything, which is why it is absent
   rather than mapped to '4+' — an answered `none` and an unanswered question
   make the same demand of the rating, and only completeness cares about the
   difference. */
const APPLE_AGE_FLOORS_INTENSITY = {
  profanity:         { infrequent: '9+',        frequent: '13+'       },
  horrorFear:        { infrequent: '9+',        frequent: '13+'       },
  substancesAlcohol: { infrequent: '13+',       frequent: '18+'       },
  medicalTreatment:  { infrequent: '13+',       frequent: '16+'       },
  matureSuggestive:  { infrequent: '9+',        frequent: '16+'       },
  sexualContent:     { infrequent: '13+',       frequent: '18+'       },
  graphicSexual:     { infrequent: AGE_UNRATED, frequent: AGE_UNRATED },
  cartoonViolence:   { infrequent: '9+',        frequent: '13+'       },
  realisticViolence: { infrequent: '13+',       frequent: '18+'       },
  extendedViolence:  { infrequent: AGE_UNRATED, frequent: AGE_UNRATED },
  gunsWeapons:       { infrequent: '9+',        frequent: '13+'       },
  simulatedGambling: { infrequent: '13+',       frequent: '18+'       },
  contests:          { infrequent: '4+',        frequent: '13+'       },
};

/* Yes/no questions — the floor a `yes` demands. The five at 4+ are listed
   rather than omitted because Apple lists them: they are what 4+ MAY contain,
   and a table that only held the uplifts would read as if they were unrated
   content nobody had gotten around to scoring.

   `socialMediaU13Off` sits at 13+ because Apple's own 13+ row lists it beside
   Social Media. It reads oddly — it is a mitigation, not content — but it is
   only ever answered Yes by an app that already answered Social Media Yes, so
   in practice it never moves the result on its own. Transcribed, not
   second-guessed. */
const APPLE_AGE_FLOORS_YN = {
  parentalControls:     '4+',
  ageAssurance:         '4+',
  userGenContent:       '4+',
  messagingChat:        '4+',
  advertising:          '4+',
  healthWellness:       '9+',
  lootBoxes:            '9+',
  socialMedia:          '13+',
  socialMediaU13Off:    '13+',
  unrestrictedInternet: '16+',
  realMoneyGambling:    '18+',   // Apple calls this one simply "Gambling"
};

/* Does THIS answer, on its own, make the app unpublishable? The red pill in
   the questionnaire and the block on the footer button both ask this, and they
   ask the table rather than naming the two fields, so a floor that ever
   changes cannot leave a highlight behind pointing at the wrong pill. */
function appleAgeAnswerIsUnrated(fieldId, value) {
  return APPLE_AGE_FLOORS_INTENSITY[fieldId]?.[value] === AGE_UNRATED;
}

function appleAgeUnratedFields(a) {
  if (!a) return [];
  return Object.keys(APPLE_AGE_FLOORS_INTENSITY)
    .filter(f => appleAgeAnswerIsUnrated(f, a[f]));
}

/* THE RATING. Returns a tier string, or 'Unrated'.

   `made_for_kids` NO LONGER FORCES 4+, and that is the one behaviour change
   here that is not simply an arithmetic fix. It used to return '4+' before
   looking at anything else, so frequent gore plus Made for Kids came out 4+.
   Apple's Kids Category is a declaration about who the app is FOR; it does not
   erase the content descriptors, and an app whose answers exceed the Kids
   Category's ceiling is in conflict with that declaration rather than quietly
   rated down. So the content answers always win. (Surfacing that conflict as
   its own warning is a separate job and is not done here.)

   `override_higher` may only RAISE. That field's own tooltip calls it an
   override of the calculated rating, and until now it was stored and never
   read at all — set it to 18+ on a clean questionnaire and the page still said
   4+. An override cannot pull an app OUT of Unrated either: nothing the
   developer declares makes prohibited content publishable. */
function appleAgeRating(a) {
  if (!a) return '4+';
  let tier = '4+';
  const raise = t => {
    if (t && AGE_TIER_ORDER.indexOf(t) > AGE_TIER_ORDER.indexOf(tier)) tier = t;
  };

  Object.entries(APPLE_AGE_FLOORS_INTENSITY).forEach(([f, floors]) => raise(floors[a[f]]));
  Object.entries(APPLE_AGE_FLOORS_YN).forEach(([f, floor]) => { if (a[f] === 'yes') raise(floor); });

  if (tier === AGE_UNRATED) return AGE_UNRATED;

  if (a.ageCategory === 'override_higher') {
    raise({ '9': '9+', '13': '13+', '16': '16+', '18': '18+' }[a.overrideRating]);
  }
  return tier;
}

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
    socialMedia:            null,
    socialMediaU13Off:      null,
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
    /* THE BASE PRICE IS PER APPLE STORE NOW, NOT PER GAME (by request). It was
       `state.formData.price` on the reasoning that "Mac App Store and App Store
       share Apple's one price" — which is how Apple bills, and is still not how
       a developer prices: a Mac build and a phone build routinely carry
       different numbers, and the two Business Questions sections are two forms.

       `null` rather than '' because '' is a real answer here — it is what "free,
       and I said so" looks like in this field — so a blank cannot double as
       "never set". seedOnboardingToIOS fills it once per platform from the
       game-wide value, and after that the two are independent in both
       directions. NOT in IOS_MAC_SHARED_ANSWER_FIELDS, which is the whole
       point: that Set is the list of answers the two stores give once.

       state.formData.price stays, and the App Store still writes it — Game
       Details' own summary, the risk scoring and the marketing page all read
       one game-wide price and none of them is asking a per-store question. */
    price:                  null,
    taxCategory:            'games',
    // Distribution
    selectedCountries:      [],
    distPreset:             'everywhere',
    // Improve Your Submission — marks complete on first view
    improveSubmissionSeen:  false,
  };
}

/* Mac App Store's blank-answers shape. Starts from the iOS question set (shared
   Content Rating / Privacy / Export Compliance / IAP) and adds the ASC-mandatory
   fields that are NOT shared with iOS and used to live only on the now-hidden
   Mac App Store Full platform: 3rd-party content rights and the App Review
   contact / demo account / notes. Content Rating and Privacy still route to the
   shared iOS answers (IOS_MAC_SHARED_ANSWER_FIELDS / _appStoreAnswers), so those
   are deliberately NOT re-declared here. The App Store Connect sync
   (submitPrepData, upf.js) reads these via _appStoreAnswers('macos'). */
function makeBlankMacAnswers() {
  return {
    ...makeBlankIOSAnswers(),
    contentRights:    null,                                             // 'yes' / 'no'
    reviewContact:    { firstName: '', lastName: '', phone: '', email: '' },
    demoAccount:      { required: null, username: '', password: '' },   // required: 'yes' / 'no'
    reviewNotes:      '',
    reviewAttachment: null,
    availability:     { mode: 'all', countries: [] },                   // mode: 'all' | 'select'
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

/* ── "Every required element on the page", and the page says which ────────
   Product Page Preview draws its own required-elements list and the step's tick
   has to agree with it. This used to re-derive a subset of that list by hand
   here, and drifted from it twice — the second time on Business, whose pill
   asks "answered AND you have looked at it" where this asked only "answered".

   So the list is no longer restated. sppRequiredElements / sppAllRequiredDone
   (render.js) are the one enumeration, and both the bar and this predicate read
   them. The previous half-fix — a local helper that checked the three text
   fields — is gone with the drift it was patching.

   Guarded because state.js loads before render.js, and it fails CLOSED: an
   un-loaded page reports the step incomplete for a frame rather than claiming a
   listing is ready before anything has been measured. */
function _sppStepComplete(pid) {
  return (typeof sppAllRequiredDone === 'function') && sppAllRequiredDone(pid);
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

  // Complete when every required element in the top bar is — asked of the page
  // itself rather than re-listed here. See _sppStepComplete above.
  if (sectionId === 'storePreview') return _sppStepComplete('ios');

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
  // Connect is Step 1 (v7.87). It is complete when the account is connected AND
  // the agent holds an App Store Connect API key (the key is the last task in
  // the Connect modal — buildConnectStepSection — and is mandatory for the
  // metadata sync). The key requirement applies only when an agent is actually
  // reachable: with no local agent (a plain demo) there is nothing to generate a
  // key, so gating on it would lock the whole card — connect then rides along on
  // the account alone, as before. The agent==null case (not yet probed) also
  // returns true; buildIOSActiveCard/buildConnectStepSection probe health and
  // re-render, so it settles to the real answer. platformStepCount's allRequired
  // multiplies in platformAccountReady, so this never relaxes the Submit gate.
  if (sectionId === 'connect') {
    if (!platformAccountReady('macos')) return false;
    const agent = state.upf && state.upf.agent;
    if (agent && agent.ok) return !!(agent.account && agent.account.hasApiKey);
    return true;
  }

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

  // Product Page Preview is the umbrella step (v7.87): it is not complete until
  // its listing content (the eight-element bar — _sppStepComplete; Title/Subtitle
  // from the App Store's shared storage, Description from Mac's own) AND every
  // sub-step reached through its own doors is complete — Content Rating, App
  // Privacy and Business, which stopped being their own rows and now live inside
  // this preview. platformSectionComplete (not isMacSectionComplete) so the
  // Content Rating visit gate is honoured; opening the preview's 'content' door
  // stamps that visit.
  if (sectionId === 'storePreview') {
    return _sppStepComplete('macos')
        && platformSectionComplete('macos', 'contentRating')
        && platformSectionComplete('macos', 'privacy')
        && platformSectionComplete('macos', 'business');
  }

  if (sectionId === 'questionnaire') {
    return isMacSectionComplete('contentRating') &&
           isMacSectionComplete('privacy') &&
           isMacSectionComplete('business');
  }

  const a = state.macSubmitAnswers;

  if (sectionId === 'business') {
    if (a.hasIAP === null) return false;
    // 3rd-party content rights + App Review contact/demo (mandatory for an ASC
    // submission; consolidated onto Mac App Store from the former Mac App Store
    // Full platform).
    if (a.contentRights === null) return false;
    if (!a.reviewContact.firstName.trim() || !a.reviewContact.lastName.trim()) return false;
    if (!a.reviewContact.email.trim()) return false;
    if (a.demoAccount.required === null) return false;
    if (a.demoAccount.required === 'yes' &&
        (!a.demoAccount.username.trim() || !a.demoAccount.password.trim())) return false;
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

  // Business now also carries the 3rd-party-content question and the App Review
  // contact/demo account (moved here from the former App Information Full and
  // App Review steps). Any of them unanswered is a blocking gap.
  if (sectionId === 'business') {
    if (a.contentRights === null) return 'HIGH';
    if (!a.reviewContact.firstName.trim() || !a.reviewContact.lastName.trim() || !a.reviewContact.email.trim()) return 'HIGH';
    if (a.demoAccount.required === null) return 'HIGH';
    return 'LOW';
  }

  return 'NONE';
}

function isMacFullSectionComplete(sectionId) {
  const a = state.macFullSubmitAnswers;

  if (sectionId === 'uploadBuild') return _uploadBuildComplete('macos_full');

  if (sectionId === 'improveSubmission') return !!a.improveSubmissionSeen;

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

  if (sectionId === 'business') {
    // 3rd-party content (moved from App Information Full) + App Review contact
    // and demo account (moved from the App Review step) now live in Business.
    if (a.contentRights === null) return false;
    if (!a.reviewContact.firstName.trim() || !a.reviewContact.lastName.trim()) return false;
    if (!a.reviewContact.email.trim()) return false;
    if (a.demoAccount.required === null) return false;
    if (a.demoAccount.required === 'yes' &&
        (!a.demoAccount.username.trim() || !a.demoAccount.password.trim())) return false;
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

/* ── EPIC GAMES STORE ANSWERS (v7.30) ──────────────────────────────────────
   Small on purpose. Epic's Content Rating is not here at all — it is IARC, the
   same questionnaire Google Play asks, and `state.cqAnswers` already holds it
   for the whole project rather than per platform. See isEgsSectionComplete's
   contentRating arm for why that sharing is the correct model and not a
   shortcut.

   Regions & Pricing and Technical Requirements are Epic's own, so they live
   here. The two `*Seen` flags are the visit-based stubs Google Play and Steam
   already use for the same two steps. */
/* ══ EPIC'S PRODUCT CONFIGURATION TABLES (v8.44) ═══════════════════════════
   Read off the Developer Portal's own Store Settings > Product Configuration
   screens rather than from the docs: the docs describe the fields, the form
   is what actually constrains them. Every list below is complete and in the
   order the portal shows it, and every character limit is the one the
   portal's own counter enforces. Where the portal offers a closed list these
   are the options it offers — adding one here would be inventing a value the
   store will reject.

   Shared with nothing. Epic Games Store Full has no Product Configuration
   steps, so these tables have exactly one caller
   today; they are module-level anyway because they are data, and data that
   lives inside a builder is data that gets rebuilt on every repaint. */
const EGS_GENRES = [
  'Action', 'Action-Adventure', 'Adventure', 'Card Game', 'Casual',
  'City Builder', 'Comedy', 'Dungeon Crawler', 'Exploration', 'Fantasy',
  'Fighting', 'First Person', 'Horror', 'Indie', 'MOBA', 'Music',
  'Narration', 'Open World', 'Party', 'Platformer', 'Puzzle', 'RPG', 'RTS',
  'Racing', 'Retro', 'Rhythm', 'Rogue-Lite', 'Shooter', 'Simulation',
  'Space', 'Sports', 'Stealth', 'Strategy', 'Survival', 'Tower Defense',
  'Trivia', 'Turn-Based', 'Turn-Based Strategy',
];

const EGS_FEATURES = [
  'Alexa Game Control', 'Co-op', 'Competitive', 'Controller Support',
  'Cross Platform', 'Local Multiplayer', 'MMO', 'Online Multiplayer',
  'Single Player', 'VR',
];

/* Epic caps Genres at three (v8.45). The portal's own counter reads "1/3"
   beside the field and stops taking ticks at the third. */
const EGS_GENRE_MAX = 3;

/* LOGIN TYPE IS TYPED, NOT PICKED (v8.45). It looks like a closed list
   because its suggestion menu holds one value, but the portal's field is a
   tag input: you type a login service, press Enter, and it becomes a chip
   with an x on it. Epic ID is there by default and can be taken off — which
   is the giveaway, since nothing in a closed one-option list would be
   removable. Three entries, fifty characters each, both the portal's. */
const EGS_LOGIN_TYPE_DEFAULT   = 'Epic ID';
const EGS_LOGIN_TYPE_MAX       = 3;
const EGS_LOGIN_TYPE_ENTRY_MAX = 50;

/* EPIC'S OWN SUPPORTED LANGUAGES (v8.45), as the Audio and Text pickers
   offer them — one list, used by both. These are NOT the game's languages:
   until v8.45 this section offered the languages Shipmate's Localizations
   step knew about, which meant a product with only English could not say it
   had Japanese audio. Epic asks what the product supports; the answer is
   picked from Epic's list, and the two can legitimately differ. */
const EGS_LANGUAGES = [
  'Arabic', 'Bulgarian', 'Catalan', 'Chinese (Simplified)',
  'Chinese (Traditional)', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English',
  'Finnish', 'French', 'German', 'Greek', 'Hebrew', 'Hindi', 'Hungarian',
  'Indonesian', 'Italian', 'Japanese', 'Korean', 'Lithuanian', 'Malay',
  'Norwegian', 'Persian', 'Polish', 'Portuguese', 'Portuguese (Brazil)',
  'Romanian', 'Russian', 'Serbian', 'Slovak', 'Spanish (Latin America)',
  'Spanish (Spain)', 'Swedish', 'Tagalog', 'Thai', 'Turkish', 'Ukrainian',
  'Vietnamese', 'Welsh',
];

const EGS_DIRECTX_VERSIONS = ['DirectX 12', 'DirectX 11', 'DirectX 10', 'DirectX 9'];

const EGS_INPUT_DEVICES = ['Gamepad', 'Steering wheel', 'Joystick',
                           'Motion sensing', 'Rhythm controller'];

/* The two tabs on the Specifications form. `directx` is what the tab carries
   rather than what the OS is: Mac's tab is Windows' form with the DirectX
   pair removed, and nothing else about it differs. */
const EGS_SPEC_OS = [
  { id: 'windows', label: 'Windows', directx: true  },
  { id: 'mac',     label: 'Mac',     directx: false },
];

/* One row per heading on the Specifications form, each a Minimum and a
   Recommended box of 140 characters. `winOnly` marks the DirectX pair, which
   is the only row the Mac tab drops.

   `required` AND `hint` BOTH READ OFF THE PORTAL (v8.88). Measured on
   dev.epicgames.com's own Specifications form for a real product: the
   first four headings carry a yellow asterisk on BOTH columns — not just
   the minimum, which is what this file assumed until now — and DirectX,
   Storage and Sound card carry none. The portal's boxes have no
   placeholder text at all, so the example strings that used to live here
   are gone: a greyed-out "8 GB RAM" reads as an answer already given, and
   the portal does not show one. */
const EGS_SPEC_ROWS = [
  { id: 'os',      label: 'OS version',  required: true },
  { id: 'cpu',     label: 'CPU',         required: true },
  { id: 'memory',  label: 'Memory',      required: true },
  { id: 'gpu',     label: 'GPU',         required: true },
  { id: 'directx', label: 'DirectX',     winOnly: true, options: EGS_DIRECTX_VERSIONS },
  { id: 'storage', label: 'Storage' },
  { id: 'sound',   label: 'Sound card' },
];
const EGS_SPEC_MAX = 140;
const EGS_SPEC_NOTES_MAX = 260;

/* Epic's Social Links, in the portal's order. Every box is a 260-character
   URL and every one is optional. The ids are ours; the labels are the
   portal's own placeholders, which is why this list says Twitter rather than
   X — the field is still labelled Twitter in the form, whatever the icon
   beside it has become. */
const EGS_SOCIAL_LINKS = [
  { id: 'website',   label: 'Game website', placeholder: 'https://your-game.com' },
  { id: 'twitter',   label: 'Twitter',      placeholder: 'https://x.com/yourstudio' },
  { id: 'facebook',  label: 'Facebook',     placeholder: 'https://facebook.com/yourgame' },
  { id: 'instagram', label: 'Instagram',    placeholder: 'https://instagram.com/yourgame' },
  { id: 'twitch',    label: 'Twitch',       placeholder: 'https://twitch.tv/yourstudio' },
  { id: 'discord',   label: 'Discord',      placeholder: 'https://discord.gg/invite' },
  { id: 'vkontakte', label: 'Vkontakte',    placeholder: 'https://vk.com/yourgame' },
  { id: 'youtube',   label: 'YouTube',      placeholder: 'https://youtube.com/@yourstudio' },
  { id: 'reddit',    label: 'Reddit',       placeholder: 'https://reddit.com/r/yourgame' },
  { id: 'naver',     label: 'Naver',        placeholder: 'https://cafe.naver.com/yourgame' },
  { id: 'youku',     label: 'Youku',        placeholder: 'https://youku.com/yourgame' },
  { id: 'weibo',     label: 'Weibo',        placeholder: 'https://weibo.com/yourgame' },
];
const EGS_SOCIAL_MAX = 260;

/* THE FOUR PICKERS, IN ONE TABLE (v8.46). Genres, Features, Audio and Text
   are the same control in the portal — a box you click to get the whole list
   and type into to narrow it — and they are now the same control here.
   Keyed by the answer field they write, because that is the one thing each
   of them really differs by; everything else is a column.

   `options` is a getter rather than the array itself only so this table can
   sit above EGS_GENRES and friends without caring which order the consts
   happen to be declared in. */
/* ── THE GAME'S LANGUAGES, IN EPIC'S WORDS (v8.80) ────────────────────────
   Game Details' Languages page writes CODES (state.formData.primaryLanguage
   and .localizations, keyed like OB_LANG_NAMES in render.js); Epic's lists
   are NAMES. This is the join, and it is a table rather than a name match
   because three of them do not match: Game Details' "Portuguese (Brazilian)"
   is Epic's "Portuguese (Brazil)", and its one plain "Spanish" has to choose
   between Epic's two — Spain, since es-419 already carries Latin America.
   Codes with no Epic equivalent simply have no row; Epic names with no code
   (Catalan, Welsh, Tagalog…) are reachable only by picking them. */
const EGS_LANG_BY_CODE = {
  en: 'English', zh: 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)',
  ja: 'Japanese', ko: 'Korean', pt: 'Portuguese', 'pt-BR': 'Portuguese (Brazil)',
  es: 'Spanish (Spain)', 'es-419': 'Spanish (Latin America)', de: 'German',
  fr: 'French', ru: 'Russian', ar: 'Arabic', tr: 'Turkish', id: 'Indonesian',
  th: 'Thai', nl: 'Dutch', pl: 'Polish', it: 'Italian', sv: 'Swedish',
  nb: 'Norwegian', da: 'Danish', fi: 'Finnish', cs: 'Czech', hu: 'Hungarian',
  ro: 'Romanian', uk: 'Ukrainian', vi: 'Vietnamese', ms: 'Malay',
  he: 'Hebrew', el: 'Greek',
};

/* The primary language is ALWAYS in it, so the two pickers can never come up
   empty: Game Details defaults it to 'en' and a project cannot clear it. */
function egsGameLanguageNames() {
  const fd  = state.formData || {};
  const out = [];
  [fd.primaryLanguage || 'en', ...(fd.localizations || [])].forEach(c => {
    const n = EGS_LANG_BY_CODE[c];
    if (n && out.indexOf(n) < 0) out.push(n);
  });
  return out;
}

/* WHAT A PICKER OFFERS, WHICH IS NOT ALWAYS WHAT EPIC ALLOWS (v8.80).
   `cfg.options` stays Epic's own table — a fact about the storefront, and
   what the Developer Portal would accept. This is the narrower question the
   two language fields now ask: which of them has this game actually been
   made in? Genres and Features are unfiltered and go straight through.

   ANYTHING ALREADY CHOSEN STAYS ON THE LIST even once Game Details stops
   naming it. A value the developer can see on the page and cannot untick is
   worse than a list one row too long, and removing it for them would be
   deleting an answer they never withdrew. */
function egsPickOptions(fieldId) {
  const cfg = EGS_PICK_FIELDS[fieldId];
  if (!cfg || !cfg.gameLanguages) return cfg ? cfg.options : [];
  const sel   = state.egsSubmitAnswers[fieldId] || [];
  const allow = egsGameLanguageNames();
  return cfg.options.filter(o => allow.indexOf(o) >= 0 || sel.indexOf(o) >= 0);
}

const EGS_PICK_FIELDS = {
  genres: {
    label: 'Genres', required: true, max: EGS_GENRE_MAX,
    noun: 'genre', get options() { return EGS_GENRES; },
  },
  features: {
    label: 'Features', required: true,
    noun: 'feature', get options() { return EGS_FEATURES; },
  },
  audioLanguages: {
    /* AND IN v8.80 IT BECAME THE GAME'S AFTER ALL, by request. v8.45 put
       these two on Epic's full forty-one on the argument that an audio track
       is not a store localization — a game shipped only in English can still
       have Japanese voice-over. That is still true of Epic, and `options`
       below is still Epic's table; what changed is which question Shipmate
       asks here. Game Details already knows the languages this game is made
       in, and asking again, against a list eleven longer, was asking the
       developer to repeat themselves. `gameLanguages` is the flag that says
       so; egsPickOptions above does the narrowing. */
    label: 'Audio', gameLanguages: true,
    noun: 'language', get options() { return EGS_LANGUAGES; },
  },
  textLanguages: {
    label: 'Text', required: true, gameLanguages: true,
    noun: 'language', get options() { return EGS_LANGUAGES; },
  },
};

/* THE FOUR WRITABLE FIELDS ON THE STORE PAGE, AND WHAT EPIC ALLOWS THEM
   (v8.48). Name and Short description are the portal's own counters; the
   headline and the body share one 10,000-character field, which is why
   egsBodyLimit() subtracts one from the other rather than giving the body a
   limit of its own. Epic's Product Home Page stores them together — the
   headline is the h2 at the top of the body, not a field beside it. */
/* ══ EPIC'S OWN LIMITS (v9.03) ═══════════════════════════════════════════
   Every number here is read off the Developer Portal's Product Details
   page (Store Settings › Product configuration › Product details), which
   prints each field's counter as "<left> <limit> <left> characters left".
   name 64 and shortDesc 280 were already right; the four added below are
   the ones the preview was counting nothing for.

   Two notes from the same page. Legal footer and the body share the
   number 10000 and are still separate fields, so they get separate
   entries — a shared constant would be two rules that happen to agree.
   And Epic's own counter prints "undefined" instead of "characters left"
   on its URL fields (Privacy link, EULA link, Support page link); that is
   a bug on their page, not a format to copy. */
const EGS_PAGE_LIMITS = {
  name: 64, shortDesc: 280, headline: 140, body: 10000,
  developer: 280, publisher: 280, legalFooter: 10000, privacyLink: 260,
};
function egsBodyLimit(headlineLen) {
  const used = headlineLen != null
    ? headlineLen
    : ((state.egsSubmitAnswers && state.egsSubmitAnswers.headline) || '').length;
  return Math.max(0, EGS_PAGE_LIMITS.body - used);
}

/* TWO FIELDS, TWO SOURCES, NO WIRE BETWEEN THEM (v8.54). The short
   description and the body were sharing state.formData.description, so
   typing in one moved the other: Short description WROTE that field, and
   writing it propagated on to state.webSite.aboutGame, which is what the
   body reads. One keystroke, two boxes.

   They are different pieces of copy — Epic prints the short one under the
   carousel and the long one below the tags — so each now has its own store
   and its own default. The short one falls back to Steam's cached
   short_description; the body falls back to Game Details' Description, which
   is where Steam's about_the_game already lands. Neither default is a copy:
   both are read at render time and overridden the moment anybody types. */
function egsShortDesc() {
  const own = ((state.egsSubmitAnswers || {}).shortDesc || '').trim();
  if (own) return own;
  return ((state.steamLocInfo && state.steamLocInfo.shortDescription) || '').trim();
}

function egsBodyText() {
  const own = ((state.webSite || {}).aboutGame || '').trim();
  if (own) return own;
  return ((state.formData || {}).description || '').trim();
}

/* ── THE CONNECT GATE, AND WHO IT STILL APPLIES TO (v8.55) ────────────────
   An App Store-shaped card used to lock every step under an incomplete
   Connect Account step: padlock, no onclick, nothing to press. Mac App Store
   is the exception from here on — its steps are reachable in any order, so
   Product Page Preview, Age Rating and the rest can be opened and filled in
   before the account is connected, and the work is no longer held behind a
   step that has nothing to do with it.

   WHICH, IN PRACTICE, RETIRES THE GATE. Mac App Store is the only platform
   whose steps include 'connect' (App Store, Mac App Store Full and the rest
   start at Upload Build), so nothing else was ever gated by it. The
   predicate stays rather than the gate coming out, because it is the one
   place the rule is written down: a platform that grows a Connect step later
   gets the lock back by name, not by accident.

   ONE PREDICATE, TWO CALLERS. buildIOSActiveCard (render.js) draws the cards
   and updateIOSStepNumbers (app.js) patches them in place right after first
   paint; when the two disagreed about the gate the second overwrote the
   first, which is the lock→number flicker that patch exists to avoid. */
function appStoreStepGateOn(pid) {
  return pid !== 'macos';
}

/* ── EPIC'S ACHIEVEMENT RULES, AS EPIC STATES THEM (v8.60) ────────────────
   Every number here is quoted from Epic rather than chosen. The field set,
   the 255s and the icon line are read off Create achievement in the Developer
   Portal (Game Services > Achievements > Epic Online Services > Create
   achievement, single achievement without stat); the XP rules are quoted from
   dev.epicgames.com/docs/epic-games-store/services/epic-achievements/achievements-setup
   under "XP Requirements for Epic Games Store Achievements":

     Each product must have exactly 1,000 XP in total, regardless of how many
     achievements are defined. The XP value for individual achievements must
     be a multiple of 5. The minimum XP for a single achievement is 5, and the
     maximum is 200. Bronze: 5-45 XP. Silver: 50-95 XP. Gold: 100-200 XP.

   THE PLATINUM TIER IS NOT A VALUE YOU SET, which is why it is not in the
   table below: Epic awards it to a player who earns the full 1,000 XP from
   one product. A fourth row here would have invited a developer to pick it.

   The 1,000 total can be raised — Epic grants up to 2,000 XP for each year a
   product has been on the store, to a maximum of 5,000, on request. That is a
   conversation with Epic rather than a field, so this card states the default
   and says the request exists rather than pretending to grant it. */
const EGS_ACH_CHAR_MAX = 255;
const EGS_ACH_XP = { min: 5, max: 200, step: 5, total: 1000 };
const EGS_ACH_TIERS = [
  { id: 'bronze', label: 'Bronze', min: 5,   max: 45  },
  { id: 'silver', label: 'Silver', min: 50,  max: 95  },
  { id: 'gold',   label: 'Gold',   min: 100, max: 200 },
];
/* "256x256 px. PNG, JPG, BMP or GIF. 256KB maximum" — the portal's own line,
   under both icon wells, verbatim. */
const EGS_ACH_ICON = {
  px: 256,
  bytes: 256 * 1024,
  accept: 'image/png,image/jpeg,image/bmp,image/gif',
  types: ['image/png', 'image/jpeg', 'image/bmp', 'image/gif'],
  note: '256x256 px. PNG, JPG, BMP or GIF. 256KB maximum',
};

/* Which tier an XP value falls in, or null for one that is not a legal value
   at all. Used for the badge on the row and nothing else — the tier is a
   read-out of the number, never a second place to set it. */
function egsAchXpTier(xp) {
  const n = parseInt(xp, 10);
  if (!isFinite(n)) return null;
  return EGS_ACH_TIERS.find(t => n >= t.min && n <= t.max) || null;
}

/* WHY AN XP VALUE IS REFUSED, in Epic's words, or null when it is fine. A
   blank is not an error here: an achievement nobody has priced yet is
   unfinished, which the row already says, and shouting at an empty field as
   soon as it is drawn is how a form reads as broken. */
function egsAchXpError(xp) {
  const raw = (xp === null || xp === undefined) ? '' : String(xp).trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!isFinite(n) || !Number.isInteger(n)) return 'XP must be a whole number.';
  if (n < EGS_ACH_XP.min || n > EGS_ACH_XP.max)
    return `Epic allows ${EGS_ACH_XP.min} to ${EGS_ACH_XP.max} XP per achievement.`;
  if (n % EGS_ACH_XP.step !== 0) return `XP must be a multiple of ${EGS_ACH_XP.step}.`;
  return null;
}

/* THE PRODUCT'S TOTAL, which Epic requires to be exactly 1,000. Reads the
   editable list only: the Steam import carries no XP at all (Steam has no
   such field), so a total taken over it would always be 0 and would always
   be wrong. */
function egsAchXpTotal() {
  return (state.egsAchievements || []).reduce((n, a) => {
    const v = parseInt(a.xp, 10);
    return n + (isFinite(v) ? v : 0);
  }, 0);
}

/* A BLANK ACHIEVEMENT, in the portal's own shape. `tab` and `open` are
   surface state riding on the record rather than a parallel map keyed by id:
   there is one editor per achievement and it dies with it. */
function makeBlankEgsAchievement() {
  return {
    id: (typeof generateId === 'function') ? generateId('egsach') : 'egsach' + Date.now(),
    achievementId:       '',
    visibility:          'shown',
    lockedIcon:          null,
    unlockedIcon:        null,
    lockedDisplayName:   '',
    lockedDescription:   '',
    unlockedDisplayName: '',
    unlockedDescription: '',
    flavorText:          '',
    xp:                  '',
    tab:                 'unlocked',
    open:                true,
  };
}

/* ── EPIC: THE ACHIEVEMENTS THE PAGE SHOWS (v8.55) ────────────────────────
   One import, read from where it landed. Steam's achievements arrive once
   (_applySteamAchievements, app.js) and are written into each platform's own
   Game Center list; Epic has no list of its own to write to, so its page
   reads the Mac App Store import — the same records, carrying the icon Steam
   served — and falls back to the raw fetch cache
   (state.steamAchievementsBaseline), which has the names and descriptions
   but no artwork, if that list has since been emptied.

   SORTED BY NAME, because Epic's own achievements pages are: alan-wake-2
   opens on "Accessorize!" and runs alphabetically to the end.

   XP IS NOT INVENTED. Epic prints an XP value on every row and a total above
   them. Steam has no such field and Shipmate never asks for one, so a number
   appears here only where the developer has typed a point value into Game
   Center, and the row says plainly that it is unset otherwise. The "% of
   players unlock" line Epic prints beside it is live telemetry from a
   published product — not submission data — so it is not on this page at
   all, the same reason the content rating card prints no ESRB letter. */
function egsAchievements() {
  /* EPIC'S OWN LIST WINS ONCE THERE IS ONE (v8.60). Until the developer adds
     or edits an achievement there is nothing to show but the Steam import, so
     the two paths below are unchanged and this card behaves exactly as it did
     in v8.55. The moment they press Add, adoptEgsAchievements (app.js) copies
     whatever was on screen into state.egsAchievements and that list is the
     page from then on — one source, the rule this file keeps.

     IN THE ORDER THEY WERE ADDED, not sorted. Epic's live page is
     alphabetical and the two paths below still sort, because they are
     read-outs; an EDITABLE row that jumps up the page as you type its name is
     a row you cannot type into. */
  const own = (state.egsAchievements || []).filter(Boolean);
  if (own.length) {
    return own.map(a => {
      const hidden = a.visibility === 'hidden';
      const xp = parseInt(a.xp, 10);
      return {
        /* ── THE ROW READS THE UNLOCKED FIELDS, AND ONLY THOSE (v9.03) ──
           Each of these used to fall back to its locked twin when the
           unlocked box was empty, which from the outside looked like the
           header syncing to whichever of the pair was typed in last: type
           a locked name into a row with no unlocked name and the header
           changed; type an unlocked one and it changed again; clear it
           and the locked one came back. Two fields quietly feeding one
           line is a header you cannot predict, and the description's
           fallback ran the other way round from the name's — locked
           first — so the two halves of the same header disagreed about
           which twin won.

           The unlocked pair is the right single source: it is what Epic's
           own page shows for an achievement, and it is the pair the
           editor marks required.

           HIDDEN IS NOT PART OF THAT, and is unchanged. Epic's tooltip:
           a Hidden achievement is "presented to users as a 'Hidden
           Achievement' with the icon that was uploaded for them". That is
           a rule about concealment, not about which of two boxes a header
           reads, so it still overrides both. */
        name:        hidden ? 'Hidden Achievement'
                            : (a.unlockedDisplayName || '').trim(),
        description: hidden ? '' : (a.unlockedDescription || '').trim(),
        hidden,
        icon:        ((hidden ? a.lockedIcon : (a.lockedIcon || a.unlockedIcon)) || {}).dataUrl || '',
        xp:          (isFinite(xp) && xp > 0) ? xp : null,
        recordId:    a.id,
      };
    });
  }
  return egsSteamAchievements();
}

/* ── WHAT STEAM GAVE US, WHOEVER IS ASKING (v8.67) ────────────────────────
   Split out of egsAchievements so a re-scrape can rebuild Epic's list from
   the import. It could not before: the adoption read egsAchievements(), which
   returns Epic's OWN list as soon as there is one, so a second scrape handed
   the adopter back the very records it was supposed to replace. Separating
   "what Steam says" from "what this page shows" is what makes the overwrite
   expressible at all. */
function egsSteamAchievements() {
  const gc = (state.macGameCenterAchievements || [])
    .filter(x => x && ((x.displayName || '').trim() || (x.refName || '').trim()));
  let out;
  if (gc.length) {
    out = gc.map(x => {
      const xp = parseInt(x.pointValue, 10);
      return {
        name:        ((x.displayName || x.refName) || '').trim(),
        description: (x.earnedDescription || '').trim(),
        hidden:      x.hidden === true,
        icon:        ((x.image || {}).dataUrl) || '',
        xp:          (isFinite(xp) && xp > 0) ? xp : null,
      };
    });
  } else {
    const base = ((state.steamAchievementsBaseline || {}).achievements) || [];
    out = base.filter(x => x && (x.name || '').trim()).map(x => ({
      name:        (x.name || '').trim(),
      description: (x.description || '').trim(),
      hidden:      false,
      icon:        '',
      xp:          null,
    }));
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function makeBlankEgsAnswers() {
  return {
    /* THE PRICE, AND IT IS NOT A TIER ANY MORE (v8.41). It is set on the Store
       Page Preview's buy box, from EGS_PRICE_TIERS, and 'Free' is the default
       rather than a blank — a game nobody has priced is free, which is a real
       answer and the commonest one. */
    price:                 'Free',
    /* Gone with Regions & Pricing (v8.41): distribution, excludedRegions,
       korea, priceModel, priceTier and releaseDate. Nothing reads them now,
       and a field nobody writes is the thing most likely to be revived by
       someone who does not know why it stopped being written. */
    /* Gone with Technical Requirements (v8.42): crossPlatformMultiplayer,
       achievements, patchNotes and eosOverlay. They were written by
       answerEgsField and read by the section and by the preview's Technical
       block, all three of which went together. Epic Games Store Full still
       has all four. */

    /* ── PRODUCT DETAILS (v8.44) ───────────────────────────────────────────
       Store Settings > Product Configuration > Product details, plus the
       Base Game offer's General details, which Epic splits across two
       screens but asks about one product.

       FOUR FIELDS ARE DELIBERATELY NOT HERE: display name, short
       description, developer name and publisher name. Epic asks for all
       four, and Shipmate already holds all four — state.formData.title,
       state.formData.description, state.webSite.developer and .publisher —
       and the Store Page Preview on this very card already prints them. A
       second copy under egsSubmitAnswers would be a second truth, and the
       preview would go on showing the first one. The section edits the
       originals instead; see setEgsProductShared in app.js. */
    /* Gone with their questions (v8.45): productLogo and productIcon, which
       asked a developer to confirm an upload this prototype does not do, and
       offerName and offerShortDesc, which asked the base game offer to name
       itself a second time. Nothing reads them now. */
    shortDesc:             '',     // the store page's own, seeded from Steam
    genres:                [],     // from EGS_GENRES, max EGS_GENRE_MAX
    features:              [],     // from EGS_FEATURES
    loginTypes:            [EGS_LOGIN_TYPE_DEFAULT],  // typed, max 3; Epic ID by default
    audioLanguages:        [],     // from EGS_LANGUAGES
    textLanguages:         [],     // ditto; Epic marks this one required
    legalFooter:           '',
    privacyLink:           '',
    eulaLink:              '',
    supportPageLink:       '',     // Epic wants AT LEAST ONE of these two
    supportEmail:          '',
    earlyAccess:           null,   // 'yes' / 'no' — 'yes' obliges an FAQ page
    sellerName:            '',     // the legal entity that receives funds
    nftBlockchain:         null,   // 'yes' / 'no'
    promotionalContent:    null,   // 'yes' / 'no'
    /* The h2 at the top of the store page's body (v8.48). Epic keeps it in
       the same 10,000-character field as the body itself; this card keeps it
       separate so the page can draw it as the heading it is, and takes its
       length off the body's allowance. */
    headline:              '',
    productDetailsSeen:    false,
    /* ── SPECIFICATIONS (v8.44) ────────────────────────────────────────────
       Epic asks these per operating system behind a Windows/Mac tab strip,
       with a "My product supports this OS" switch on each. Mac's tab is the
       same form minus DirectX. */
    specs: {
      windows: makeBlankEgsSpecOs(),
      mac:     makeBlankEgsSpecOs(),
    },
    inputDevices:          [],     // from EGS_INPUT_DEVICES
    specsNotes:            '',
    specificationsSeen:    false,
    /* ── SOCIAL MEDIA (v8.44) ──────────────────────────────────────────────
       Epic's "Social Links", the links shown in the store page's Follow Us
       section. Every one is optional, which is why this section's done rule
       is a visit rather than a filled field — see isEgsSectionComplete. */
    social:                makeBlankEgsSocial(),
    socialMediaSeen:       false,
    // Store Preview
    storePreviewSeen:      false,
    // Stubs, complete on first view — the same treatment Google Play's and
    // Steam's Localizations rows get, and for the same reason.
    localizationsSeen:     false,
    improveSubmissionSeen: false,
  };
}
/* One operating system's column of the Specifications form. Both the minimum
   and the recommended box are free text in the portal (140 characters each)
   rather than a parsed number — Epic prints them verbatim on the store page,
   so "8 GB RAM" and "16 GB" are both things a developer really types. */
/* ══ ONE OPERATING SYSTEM'S TAB (v8.88) ══════════════════════════
   `supported` IS A BOOLEAN NOW, not the three-state it was. The portal's
   control is a switch, off by default, and a switch has no unanswered
   position — so neither does this. What that costs is the old
   completeness rule's "every OS has been answered", which only made sense
   while there was something to answer; isEgsSectionComplete now asks what
   the portal asks, which is whether at least one OS is on and filled in.
   _egsSpecs() below carries an older project's 'yes'/'no'/null across.

   `inputDevices` AND `notes` MOVED IN HERE from the section, also from the
   portal: the form's fields are named windows_additionalNotes and
   macos_additionalNotes, so a product can say "SSD required" of Windows
   without saying it of Mac. */
function makeBlankEgsSpecOs() {
  return {
    supported: false,                // the portal's switch, off by default
    inputDevices: [],                // from EGS_INPUT_DEVICES, per OS
    notes:   '',                     // Additional notes, per OS, 260 chars
    os:      { min: '', rec: '' },
    cpu:     { min: '', rec: '' },
    memory:  { min: '', rec: '' },
    gpu:     { min: '', rec: '' },
    storage: { min: '', rec: '' },
    sound:   { min: '', rec: '' },
    directx: { min: '', rec: '' },   // Windows only; Mac's tab has no DirectX
  };
}
/* THE ANSWERS, NORMALISED ON READ (v8.88). A project saved before v8.88
   has `supported: 'yes' | 'no' | null` and keeps its input devices and
   notes on the section rather than on each tab. Rather than a migration
   that has to run exactly once, every read comes through here — the same
   pattern _steamSysreq uses next door, and for the same reason: a preview
   that throws on an old save is worse than one that fills the gap. */
function _egsSpecs() {
  const a = state.egsSubmitAnswers;
  if (!a) return { windows: makeBlankEgsSpecOs(), mac: makeBlankEgsSpecOs() };
  if (!a.specs) a.specs = { windows: makeBlankEgsSpecOs(), mac: makeBlankEgsSpecOs() };
  EGS_SPEC_OS.forEach(o => {
    let sp = a.specs[o.id];
    if (!sp) { sp = a.specs[o.id] = makeBlankEgsSpecOs(); return; }
    /* 'yes' becomes on; 'no' and the old unanswered null both become off,
       because the switch has nowhere else to put them. */
    if (typeof sp.supported !== 'boolean') sp.supported = (sp.supported === 'yes');
    if (!Array.isArray(sp.inputDevices)) {
      sp.inputDevices = Array.isArray(a.inputDevices) ? a.inputDevices.slice() : [];
    }
    if (typeof sp.notes !== 'string') sp.notes = a.specsNotes || '';
    EGS_SPEC_ROWS.forEach(r => {
      if (!sp[r.id] || typeof sp[r.id] !== 'object') sp[r.id] = { min: '', rec: '' };
    });
  });
  return a.specs;
}

/* One tab's required headings, both columns — what the portal's own
   asterisks ask for. An OS switched off is not asked. */
function egsSpecOsFilled(osId) {
  const sp = _egsSpecs()[osId];
  if (!sp) return false;
  return EGS_SPEC_ROWS
    .filter(r => r.required && (!r.winOnly || (EGS_SPEC_OS.find(o => o.id === osId) || {}).directx))
    .every(r => (sp[r.id].min || '').trim() && (sp[r.id].rec || '').trim());
}

/* The twelve Social Links boxes, keyed by EGS_SOCIAL_LINKS' ids. Built from
   the table rather than typed out, so the two cannot drift. */
function makeBlankEgsSocial() {
  const out = {};
  EGS_SOCIAL_LINKS.forEach(l => { out[l.id] = ''; });
  return out;
}

function isEgsSectionComplete(sectionId) {
  if (sectionId === 'uploadBuild') return _uploadBuildComplete('egs');

  /* ONE IARC QUESTIONNAIRE, TWO STOREFRONTS, and that is how IARC actually
     works rather than a convenience. A developer fills in the International
     Age Rating Coalition questionnaire ONCE and the coalition issues ratings
     for each participating storefront's own board from those same answers —
     which is why Epic's own docs point at IARC rather than defining a
     questionnaire of their own. `state.cqAnswers` was already global (it was
     never namespaced per platform), so this arm is literally Google Play's,
     and answering either card completes both. */
  if (sectionId === 'contentRating') {
    const { total, answered } = androidCqProgress();
    return total > 0 && answered === total;
  }

  const a = state.egsSubmitAnswers;

  /* PRODUCT DETAILS IS DONE WHEN EPIC'S ASTERISKS ARE (v8.44). Every term
     below is a field the Developer Portal marks required, and nothing that
     it does not: Genres and Features but not Login type, Text languages but
     not Audio, and the offer's seller. Developer and publisher are read from
     where they really live rather than from a copy (see
     makeBlankEgsAnswers). */
  if (sectionId === 'productDetails') {
    /* NO SHORT DESCRIPTION TERM (v8.48). The field moved to the Store Page
       Preview, where it is edited in place on the thing that prints it. A
       section cannot be incomplete over a question it no longer asks. */
    /* NO GENRES, FEATURES, DEVELOPER OR PUBLISHER TERM (v8.59). All four
       moved to the Store Page Preview, where they are chosen and typed on the
       page that prints them, and a section cannot be incomplete over a
       question it no longer asks — the rule the short description's own note
       states just above. They did not stop being required: the preview's
       roll-up carries them now, exactly as it took Specifications in v8.57. */
    /* AND NO TEXT LANGUAGES TERM (v8.72), the fifth field to make that move,
       with Login Accounts Required, Audio, the legal footer and the privacy
       link. Text is the only one of the five Epic marks required, so it is
       the only one that needed re-homing rather than simply deleting: it is
       in the preview's roll-up below. */
    return (!!a.supportPageLink.trim() || !!a.supportEmail.trim())
        /* USER SUPPORT IS AN OR, AND EPIC SAYS SO IN WORDS: "Provide at least
           one". A developer with a support site and no support inbox is
           finished, and asking for both would be inventing a requirement. */
        && !!a.sellerName.trim()
        && a.nftBlockchain !== null
        && a.promotionalContent !== null;
  }
  /* SPECIFICATIONS IS FINISHED WHEN THE PORTAL'S OWN SAVE WOULD TAKE IT
     (v8.88): at least one operating system switched on, and every switched-on
     one with its four required headings filled in on BOTH columns.

     TWO THINGS THIS USED TO GET WRONG, both read off the portal's form.
     It required a decision on every OS, which a switch cannot express —
     off and unanswered are the same position, and a Mac-less product is
     not an unfinished one. And it required only the minimum column, while
     the portal asterisks both: a product whose CPU minimum is filled and
     whose recommended is blank cannot be saved there, so calling it done
     here would be Shipmate telling a developer they were finished when
     Epic was about to disagree. DirectX, Storage and Sound card carry no
     asterisk and are not counted. */
  if (sectionId === 'specifications') {
    const sp = _egsSpecs();
    return EGS_SPEC_OS.some(o => sp[o.id].supported)
        && EGS_SPEC_OS.filter(o => sp[o.id].supported).every(o => egsSpecOsFilled(o.id));
  }
  /* A VISIT IS THE HONEST CLAIM FOR AN OPTIONAL SECTION. Epic files Social
     media under "Optional Information", so there is no field whose absence
     is a problem; a game with no Discord is not an unfinished game. Asking
     for one link anyway would be the "green while empty" failure in reverse
     — red while correct. */
  if (sectionId === 'socialMedia') return !!a.socialMediaSeen;

  /* THE LOGO IS DONE WHEN THERE IS ONE (v8.82). Unlike Social Media, which
     Epic files under Optional Information and which is therefore a visit,
     the panel has a hole in it until this is answered — and a hole on the
     store page is the one thing this preview is for showing. */
  if (sectionId === 'logo') {
    return typeof egsFeaturedLogo === 'function' && !!egsFeaturedLogo();
  }

  /* NO 'technical' ARM (v8.42). Technical Requirements was removed from this
     card; Epic Games Store Full keeps the step, the section and this arm's
     twin below. Nothing asks this function about 'technical' for 'egs' any
     more, and an arm nobody reaches is how a removed step quietly comes
     back. */
  /* LOCALIZATIONS IS NO LONGER A VISIT (v7.31). It was `localizationsSeen`
     while it was a stub, which is the only claim a placeholder can honestly
     make. Now that the step is a real review, ticking it for having glanced
     at it would be the "green while empty" failure this file keeps fighting —
     so it asks for the two fields Epic's product page actually prints, in
     every supporting language. Auto-translate fills them the moment a
     language is added, so a developer who does nothing still sees this go
     green; one who turns auto-translate off sees it wait, correctly. */
  if (sectionId === 'localizations') {
    const langs = (state.formData.localizations || [])
      .filter(l => l !== (state.formData.primaryLanguage || 'en'));
    if (!langs.length) return !!a.localizationsSeen;   // nothing to translate yet
    const store = (state.webSite && state.webSite.localizedStoreText) || {};
    return langs.every(l => {
      const e = store[l] || {};
      return !!(e.description || '').trim() && !!(e.aboutGame || '').trim();
    });
  }
  if (sectionId === 'improveSubmission') return !!a.improveSubmissionSeen;

  if (sectionId === 'screenshots') {
    if (typeof platformStoreShots === 'function') return platformStoreShots('egs').length > 0;
    const ps = state.platformScreenshots?.egs;
    return !!(ps && (ps.selected.length > 0 || ps.custom.length > 0));
  }

  /* The page is done when everything it PRINTS is done — the same roll-up
     Google Play's own storePreview arm makes, over Epic's fields instead. */
  if (sectionId === 'storePreview') {
    /* SPECIFICATIONS JOINED THE ROLL-UP IN v8.57, when it stopped being a row
       of its own. It belonged here from v8.44 in any case: the page has
       printed a System Requirements block since then, and the rule this arm
       states is "done when everything it PRINTS is done". Without it, taking
       the row away would have quietly made a required section optional.

       platformSectionComplete, not isEgsSectionComplete, for the content
       rating alone: that is the wrapper that applies the STEP_REQUIRES_VISIT
       gate, which the removed row used to apply and which nothing else on
       this card would. Social Media is deliberately absent — Epic calls it
       Optional Information and its only test was ever a visit. */
    /* GENRES, FEATURES, DEVELOPER AND PUBLISHER JOINED IN v8.59, when they
       moved onto this page. Epic marks all four required and the page prints
       all four, which is this arm's whole rule. */
    /* AND TEXT LANGUAGES IN v8.72, when the foot chip's five fields left
       Product Details. Only this one of the five: Epic marks Text required
       and leaves Audio, Login Accounts Required, the legal footer and the
       privacy link optional, so the other four have nothing to carry. */
    const ws = state.webSite || {};
    return platformSectionComplete('egs', 'contentRating')
        && a.textLanguages.length > 0
        && isEgsSectionComplete('specifications')
        && isEgsSectionComplete('screenshots')
        && a.genres.length > 0
        && a.features.length > 0
        && !!(ws.developer || '').trim()
        && !!(ws.publisher || '').trim();
  }
  return false;
}

/* Progress for Android's Google Play Content Questions (IARC tree).
   Counts only top-level (depth 1) questions — follow-ups are implicitly
   covered since a top-level question can't be "complete" while a follow-up
   it revealed is still unanswered (see giarcIsSubtreeComplete). */
/* ── WHAT THE LOGO STEP OFFERS (v8.82, narrowed v8.83) ───────────────────
   The scrape's own LOGOTYPES, plus anything uploaded here, minus anything
   removed here.

   KEY ART IS NOT A LOGO, and v8.82 offering it was the wrong kind of
   helpful. The two are different objects: a logotype is the game's name
   drawn as a shape, usually on transparency, which is what Epic's slot
   contains and what it means by "legible on a dark background"; key art is
   a picture with the name somewhere in it. Seeding the step with key art
   put a plausible wrong answer in front of the developer and made the
   featured one a coin toss, since the first candidate wins by default.

   Nothing is lost by it: key art is still in the asset pool, and the + slot
   takes any file at all, so a developer who really does want to crop their
   key art down to a logo can still upload it. `logo` is what smAssetKind
   (assets.js) stamps on a logotype on the way in, and the import keeps the
   SOURCE's own word for it where the source said — provenance is a fact and
   geometry is an inference, which is that function's own rule. */
const EGS_LOGO_KINDS = ['logo'];

function egsLogoCandidates() {
  const pool = (typeof smPool === 'function') ? smPool() : [];
  const gone = state.egsLogoRemoved || [];
  const out  = [];
  const push = (a) => {
    if (!a || !a.src || gone.indexOf(a.id) >= 0) return;
    if (out.some(x => x.id === a.id)) return;
    out.push(a);
  };
  /* Logotypes first within the scrape: a logotype IS the thing Epic asks
     for, and key art is the fallback a developer crops down. */
  EGS_LOGO_KINDS.forEach(k => pool.filter(a => a.kind === k).forEach(push));
  (state.egsLogos || []).forEach(push);
  return out;
}

/* The one the page draws: the chosen one if it is still there, else the
   first candidate. Same shape as smAppTrailer's own fallback, and for the
   same reason — a choice that has been removed must not blank the page. */
function egsFeaturedLogo() {
  const all = egsLogoCandidates();
  if (!all.length) return null;
  return all.find(a => a.id === state.egsLogoFeatured) || all[0];
}

function androidCqProgress() {
  const answered = GOOGLE_IARC_TOP_LEVEL_KEYS.filter(giarcIsAnswered).length;
  return { total: GOOGLE_IARC_TOP_LEVEL_KEYS.length, answered };
}

/* ══ AN ESTIMATED ESRB RATING FROM THE IARC ANSWERS (v8.81) ═══════════════
   Adam: "build the estimator." The store page preview printed the IARC mark
   and the words "Content Rating" because, as the note on that card used to
   say, "inventing an ESRB letter here would be inventing the one thing on
   this page nobody may invent." That still holds for a RATING. It does not
   hold for an ESTIMATE that says so on its face, which is what this is and
   what the card now prints: "Likely Everyone 10+", never "Everyone 10+".

   WHY AN ESTIMATE IS POSSIBLE AT ALL. IARC is not a rating, it is a routing
   layer: the developer answers one questionnaire and each participating
   authority's own rules engine issues its own rating from those same
   answers. ESRB's process page puts it plainly — the questionnaire "assigns
   the rating category, content descriptors, and interactive elements". So
   the function from these 95 answers to an ESRB rating exists and is
   deterministic.

   WHY IT CAN ONLY BE AN ESTIMATE. The per-authority rule sets are not
   published; that is the point of IARC, and the boards deliberately
   disagree with each other. Three of the fourteen top-level questions in
   this very tree are nobody's business but one board's — Nazi symbols is
   USK, "erode the national identity of the Republic of Korea" is GRAC,
   terrorism advocacy is ClassInd — and this function ignores all three,
   because they do not touch an ESRB rating. And even IARC's own answer is
   provisional: ESRB monitors assignments, tests products after release and
   corrects ratings that do not match the content.

   SO THE TWO HALVES OF THE OUTPUT ARE NOT EQUALLY CERTAIN, and the card
   draws them differently for that reason:

     - INTERACTIVE ELEMENTS are a direct read. "Users Interact", "Shares
       Location" and "In-Game Purchases" are three questions answered yes,
       restated in ESRB's words. They carry no estimate and no hedge.
       (ESRB's "In-Game Purchases (Includes Random Items)" is NOT derivable:
       this tree never asks whether a purchase is randomised, so the plain
       descriptor is the honest one.)

     - THE AGE CATEGORY AND DESCRIPTORS are inferred, by the model below.

   THE MODEL IS A FLOOR, NOT A SCORE. Every answer that matters raises a
   MINIMUM rating and may name a descriptor; the estimate is the highest
   minimum any single answer demands. That is how the published rating
   definitions read — Teen "may contain violence, suggestive themes, crude
   humor, minimal blood, simulated gambling, and/or infrequent strong
   language", so one piece of content at Teen level makes the whole product
   at least Teen — and it is why the card can say WHICH answers drove the
   result: they are exactly the signals sitting at the winning floor.

   Every threshold below is traceable to ESRB's own published wording, in
   the rating definitions and the content-descriptor list. Where the
   questionnaire is finer-grained than ESRB's words (it asks about distance
   and frequency; ESRB says "intense"), the comment on that rule says which
   way it rounds. It rounds DOWN in doubt: an estimate that comes in under
   the real rating is a developer surprised once at submission, and an
   estimate that comes in over it is a developer who redesigns content that
   never needed it. */

const ESRB_ORDER  = ['E', 'E10', 'T', 'M', 'AO'];

/* ── ONE DESCRIPTOR PER FAMILY, THE STRONGEST (v8.81) ────────────────────
   ESRB's descriptor list is a set of ladders, and a box prints the top rung
   it has reached, not the whole climb: Cyberpunk 2077 says "Intense
   Violence" and not "Violence, Intense Violence", and a game with cash
   payouts says "Real Gambling" and not "Simulated Gambling, Real Gambling".
   The rules above fire per answer and will happily emit two rungs of one
   ladder — realistic violence shown close up earns Violence at Teen and
   Intense Violence at Mature — so the ladders are stated here and the
   weaker rung is dropped at the end.

   Sexual Violence is deliberately absent: ESRB prints it ALONGSIDE the
   sexuality ladder rather than instead of it. */
const ESRB_LADDERS = [
  ['Violent References', 'Fantasy Violence', 'Violence', 'Intense Violence'],
  ['Animated Blood', 'Blood', 'Blood and Gore'],
  ['Comic Mischief', 'Crude Humor', 'Mature Humor'],
  ['Gambling Themes', 'Simulated Gambling', 'Real Gambling'],
  ['Language', 'Strong Language'],
  ['Lyrics', 'Strong Lyrics'],
  ['Partial Nudity', 'Nudity'],
  ['Suggestive Themes', 'Sexual Themes', 'Sexual Content', 'Strong Sexual Content'],
  ['Drug Reference', 'Use of Drugs'],
  ['Alcohol Reference', 'Use of Alcohol'],
  ['Tobacco Reference', 'Use of Tobacco'],
];

/* Returns the printed list, and a map from every descriptor that was
   emitted to the one that ends up standing for it — so "what drove the
   rating" can name something the card actually shows. */
function _esrbPrintable(raw) {
  const keep = raw.slice();
  const became = {};
  raw.forEach(d => { became[d] = d; });
  ESRB_LADDERS.forEach(ladder => {
    const on = ladder.filter(d => raw.indexOf(d) >= 0);
    if (on.length < 2) return;
    const top = on[on.length - 1];
    on.slice(0, -1).forEach(weak => {
      became[weak] = top;
      const i = keep.indexOf(weak);
      if (i >= 0) keep.splice(i, 1);
    });
  });
  /* ESRB prints "Use of Drugs and Alcohol" as one descriptor when both are
     present — Cyberpunk 2077 and Red Dead Redemption 2 both do on Epic — so
     the pair is merged rather than printed twice. After the ladders, not
     before: it is the top rung of each that gets merged. */
  if (keep.indexOf('Use of Drugs') >= 0 && keep.indexOf('Use of Alcohol') >= 0) {
    const both = 'Use of Drugs and Alcohol';
    [keep.indexOf('Use of Drugs'), keep.indexOf('Use of Alcohol')]
      .sort((a, b) => b - a).forEach(i => keep.splice(i, 1));
    keep.push(both);
    Object.keys(became).forEach(k => {
      if (became[k] === 'Use of Drugs' || became[k] === 'Use of Alcohol') became[k] = both;
    });
  }
  keep.sort();
  return { keep, became };
}
const ESRB_LABELS = {
  E:   { short: 'E',    label: 'Everyone' },
  E10: { short: 'E10+', label: 'Everyone 10+' },
  T:   { short: 'T',    label: 'Teen' },
  M:   { short: 'M',    label: 'Mature 17+' },
  AO:  { short: 'AO',   label: 'Adults Only 18+' },
};

/* Reading an answer. state.cqAnswers[key] is a 1-based option index for a
   radio and an array of them for a picklist_multi; an unanswered question
   and one whose parent was answered "No" both read as undefined, which is
   what makes every test below safe to run unconditionally. */
function _esrbVal(key) {
  return (state.cqAnswers || {})[key];
}
function _esrbIs(key, i)  { return _esrbVal(key) === i; }
function _esrbHas(key, i) {
  const v = _esrbVal(key);
  return Array.isArray(v) ? v.indexOf(i) >= 0 : v === i;
}

/* One side of the violence questions, asked twice: the tree asks the same
   eight questions about humans and about everything else, and ESRB's
   distinction is not WHO but whether it reads as real. So the two share a
   function and differ only in the two questions that exist on one side. */
function _esrbViolence(p, sig) {
  const presented = _esrbVal(p + 'presented');     // 1 referred … 6 often close-up
  const blood     = _esrbVal(p + 'bloodlevel');    // 1 none … 4 high
  if (presented === undefined && blood === undefined) return;

  /* Fantasy unless the questionnaire says otherwise. "Fantasy Violence" is
     ESRB's "easily distinguishable from real life", which is what a
     fantastical setting, a childlike or pixelated style, or a non-human
     that does not behave like one all say. */
  const stylised = _esrbIs(p + 'setting', 1)       // fantastical
                || _esrbIs(p + 'style', 1)         // childlike
                || _esrbIs(p + 'style', 2)         // pixelated
                || (p === 'google.content.nonhuman' && _esrbIs(p + 'behavior', 2));
  const shown    = presented >= 3;                 // depicted at all
  const closeUp  = presented === 6;                // often, close up
  const real     = !stylised && _esrbIs(p + 'reactions', 2);

  if (presented === 1 || presented === 2) {
    /* Referred to or implied but never seen: ESRB's "Violent References". */
    sig('E', 'Violent References');
  } else if (shown && stylised) {
    sig('E10', 'Fantasy Violence');
  } else if (shown) {
    sig('T', 'Violence');
  }

  /* INTENSE VIOLENCE IS ESRB'S TOP VIOLENCE DESCRIPTOR and its definition
     names three things together: "graphic, realistic-looking physical
     conflict, which may involve extreme blood, gore, weapons, and human
     injury or death". So it takes realistic violence AND one of the two
     things the questionnaire has that mean graphic: seen close up and often,
     or a high level of blood and gore. One alone is not it. */
  if (real && (closeUp || blood === 4)) sig('M', 'Intense Violence');

  /* A war setting, or innocents who can be killed with no penalty, is the
     questionnaire's way of asking the same question ESRB answers with
     Mature. Neither names a descriptor of its own. */
  if (real && _esrbIs(p + 'warsetting', 1)) sig('M', null);
  if (_esrbIs(p + 'innocents', 3))          sig('M', null);
  if (_esrbIs(p + 'innocents', 2))          sig('T', null);

  /* Blood, and ESRB has three words for it by realism and degree:
     "Animated Blood" is discoloured or unrealistic, "Blood" is depictions,
     "Blood and Gore" adds mutilated body parts. */
  if (blood === 2 && stylised)  sig('E10', 'Animated Blood');
  else if (blood === 2)         sig('T',   'Blood');
  else if (blood === 3)         sig('T',   stylised ? 'Animated Blood' : 'Blood');
  else if (blood === 4)         sig('M',   'Blood and Gore');

  if (_esrbIs(p + 'overtones', 1)) sig('E10', null);
  if (p === 'google.content.nonhuman' && _esrbIs(p + 'animal', 1)) sig('T', null);
}

/* THE ESTIMATE. Returns null until the questionnaire is finished — a partial
   tree would give a confidently low answer, which is the one failure mode
   this is not allowed to have. */
function egsEsrbEstimate() {
  if (typeof androidCqProgress !== 'function') return null;
  const cq = androidCqProgress();
  if (!(cq.total > 0 && cq.answered === cq.total)) return null;

  let floor = 'E';
  const descriptors = [];
  const drivers     = [];
  const sig = (level, descriptor) => {
    if (ESRB_ORDER.indexOf(level) > ESRB_ORDER.indexOf(floor)) floor = level;
    if (descriptor && descriptors.indexOf(descriptor) < 0) descriptors.push(descriptor);
    drivers.push({ level, descriptor: descriptor || null });
  };

  /* ── a questionnaire that cannot be rated ──────────────────────────────
     Sexual activity involving minors is not a rating question; it is the
     screening question IARC asks so that the submission stops. An estimator
     that answered it with a cheerful "Likely Adults Only" would be the
     wrong kind of helpful, so this returns no estimate at all and the card
     says the questionnaire needs IARC's own review. */
  if (_esrbIs('google.content.sexminor', 1)) {
    return { ratable: false, code: null, short: null, label: null,
             descriptors: [], interactive: _esrbInteractive(), drivers: [] };
  }

  // ── violence, blood and gore ──────────────────────────────────────────
  if (_esrbHas('google.content.bloodviolencegoretypes', 1)) _esrbViolence('google.content.human', sig);
  if (_esrbHas('google.content.bloodviolencegoretypes', 2)) _esrbViolence('google.content.nonhuman', sig);
  if (_esrbIs('google.content.nonviolentgore', 1)) sig('T', 'Blood');
  if (_esrbIs('google.content.nonviolentgore', 2)) sig('M', 'Blood and Gore');
  if (_esrbIs('google.content.nonviolentgore', 3)) sig('M', 'Blood and Gore');
  if (_esrbIs('google.content.nonviolentblood', 1)) sig('E10', 'Blood');
  if (_esrbIs('google.content.nonviolentblood', 2)) sig('T',   'Blood');

  /* ── fear ──────────────────────────────────────────────────────────────
     ESRB has no horror descriptor, so this raises the floor and names
     nothing. Saying it with a descriptor ESRB does not print would be
     inventing vocabulary, and leaving it out of the floor would let a
     genuinely frightening game read as Everyone. */
  if (_esrbIs('google.content.scaryfreq', 1))      sig('E',   null);
  if (_esrbIs('google.content.scaryfreq', 2))      sig('E10', null);
  if (_esrbIs('google.content.horrifyingfreq', 1)) sig('T',   null);
  if (_esrbIs('google.content.horrifyingfreq', 2)) sig('T',   null);
  if (_esrbIs('google.content.imminentthreat', 1)) sig('M',   null);

  // ── sexuality and nudity ──────────────────────────────────────────────
  /* ESRB's ladder here is Suggestive Themes → Sexual Themes → Sexual
     Content → Strong Sexual Content, and the questionnaire's own ladder
     lines up with it almost word for word. */
  if (_esrbHas('google.content.suggestivetypes', 1)) sig('E10', 'Suggestive Themes');
  if (_esrbHas('google.content.suggestivetypes', 2)) sig('T',   'Sexual Themes');
  if (_esrbHas('google.content.suggestivetypes', 3)) sig('T',   'Sexual Themes');
  if (_esrbHas('google.content.suggestivetypes', 4)) sig('M',   'Sexual Themes');
  if (_esrbIs('google.content.sexdepiction', 1))     sig('T',   'Sexual Themes');
  if (_esrbIs('google.content.sexdepiction', 2))     sig('M',   'Sexual Content');
  if (_esrbIs('google.content.sexdepiction', 3))     sig('M',   'Strong Sexual Content');
  if (_esrbIs('google.content.sexdepiction', 4))     sig('M',   'Strong Sexual Content');
  /* Adults Only is "graphic sexual content", and the questionnaire spells
     out graphic three ways at once: shown in full, often, and at length. */
  if (_esrbIs('google.content.sexdepiction', 4)
      && _esrbIs('google.content.sexfreq', 2)
      && _esrbIs('google.content.sexlength', 2)) sig('AO', 'Strong Sexual Content');

  if (_esrbIs('google.content.datingfocus', 1)) sig('E10', 'Suggestive Themes');
  if (_esrbIs('google.content.revealnudity', 1)) {
    sig(_esrbIs('google.content.revealcontext', 1) ? 'T' : 'E10', 'Suggestive Themes');
  }
  /* ESRB splits nudity at how much: "Partial Nudity" is brief and/or mild,
     "Nudity" is graphic or prolonged. The questionnaire splits it by what is
     shown, so buttocks and covered breasts are the partial end and nipples
     or genitalia the other. */
  if (_esrbHas('google.content.nuditytypes', 1)) sig('T', 'Partial Nudity');
  if (_esrbHas('google.content.nuditytypes', 2)) sig('T', 'Partial Nudity');
  if (_esrbHas('google.content.nuditytypes', 3)) sig('T', 'Partial Nudity');
  if (_esrbHas('google.content.nuditytypes', 4)) sig('M', 'Nudity');
  if (_esrbHas('google.content.nuditytypes', 5)) sig('M', 'Nudity');
  if (_esrbIs('google.content.nuditycontext', 1)) sig('M', null);
  if (_esrbIs('google.content.sexualviolence', 2)) sig('M',  'Sexual Violence');
  if (_esrbIs('google.content.sexualviolence', 1)) sig('AO', 'Sexual Violence');

  // ── gambling ──────────────────────────────────────────────────────────
  /* "Gambling Themes" is images or activities associated with gambling
     WITHOUT simulating it; "Simulated Gambling" is playing without real
     money; "Real Gambling" is betting real cash, which the Adults Only
     definition names outright. */
  if (_esrbIs('google.content.gamblingthemes', 1)) sig('T',   'Gambling Themes');
  if (_esrbIs('google.content.gamblingthemes', 2)) sig('E10', 'Gambling Themes');
  if (_esrbHas('google.content.gamblingtypes', 2)) sig('T', 'Simulated Gambling');
  if (_esrbHas('google.content.gamblingtypes', 3)) sig('T', 'Simulated Gambling');
  if (_esrbHas('google.content.gamblingtypes', 4)) sig('E10', 'Simulated Gambling');
  if (_esrbIs('google.content.bingorewards', 1))   sig('AO', 'Real Gambling');
  if (_esrbIs('google.content.casinorewards', 1))  sig('AO', 'Real Gambling');

  // ── language ──────────────────────────────────────────────────────────
  /* ESRB: "Language" is mild to moderate profanity, "Strong Language" is
     explicit and/or frequent. Everyone already allows "infrequent mild
     language" and Teen "infrequent strong language", which is where the
     rarely/often split lands on each row. */
  if (_esrbIs('google.content.profanities', 1))    sig('E',   'Language');
  if (_esrbIs('google.content.profanities', 2))    sig('E10', 'Language');
  if (_esrbIs('google.content.swearing', 1))       sig('T',   'Language');
  if (_esrbIs('google.content.swearing', 2))       sig('T',   'Strong Language');
  if (_esrbIs('google.content.sexexpletives', 1))  sig('T',   'Strong Language');
  if (_esrbIs('google.content.sexexpletives', 2))  sig('M',   'Strong Language');
  if (_esrbIs('google.content.discrimlang', 1))    sig('T',   'Strong Language');
  if (_esrbIs('google.content.discrimlang', 2))    sig('M',   'Strong Language');

  // ── controlled substances ─────────────────────────────────────────────
  /* ESRB has a reference/use pair for each of drugs, alcohol and tobacco,
     and the questionnaire asks presentation in exactly those terms. */
  const subst = (key, refName, useName, refFloor, useFloor) => {
    if (_esrbIs(key, 1)) sig(refFloor, refName);
    if (_esrbIs(key, 2)) sig(useFloor, useName);
    if (_esrbIs(key, 3)) sig('M', useName);          // encourages/glamorises
    if (_esrbIs(key, 4)) sig('M', useName);          // detailed instruction
  };
  subst('google.content.illegaldrugs', 'Drug Reference', 'Use of Drugs', 'T', 'M');
  subst('google.content.fantdrugs',    'Drug Reference', 'Use of Drugs', 'E10', 'T');
  subst('google.content.meddrugs',     'Drug Reference', 'Use of Drugs', 'E10', 'T');
  subst('google.content.alcohol',      'Alcohol Reference', 'Use of Alcohol', 'E10', 'T');
  subst('google.content.tobacco',      'Tobacco Reference', 'Use of Tobacco', 'E10', 'T');

  // ── crude humour ──────────────────────────────────────────────────────
  /* "Comic Mischief" is slapstick or suggestive humour, "Crude Humor" is
     vulgar antics including bathroom humour, "Mature Humor" is adult. The
     questionnaire's four rows climb that ladder in order. */
  if (_esrbHas('google.content.crudetypes', 1)) sig('E',   'Comic Mischief');
  if (_esrbHas('google.content.crudetypes', 2)) sig('E10', 'Crude Humor');
  if (_esrbHas('google.content.crudetypes', 3)) sig('T',   'Crude Humor');
  if (_esrbHas('google.content.crudetypes', 4)) sig('M',   'Mature Humor');

  /* Crime: imitable by children raises the floor, detailed technique more
     so. Neither is an ESRB descriptor. */
  if (_esrbIs('google.content.crimekids', 1)) sig('T', null);
  if (_esrbIs('google.content.crimetech', 1)) sig('M', null);

  const { keep: out, became } = _esrbPrintable(descriptors);

  /* WHAT DROVE IT: the signals sitting at the winning floor, named — and
     named with the descriptor the card PRINTS, which after the ladders
     above may not be the one the rule emitted. A descriptor that only
     reached Teen is still printed on a Mature product (ESRB prints all of
     them) but it did not drive the rating. */
  const driving = drivers.filter(d => d.level === floor && d.descriptor)
                         .map(d => became[d.descriptor] || d.descriptor)
                         .filter(d => out.indexOf(d) >= 0)
                         .filter((d, i, a) => a.indexOf(d) === i)
                         .sort();

  return { ratable: true, code: floor,
           short: ESRB_LABELS[floor].short, label: ESRB_LABELS[floor].label,
           descriptors: out, driving, interactive: _esrbInteractive(), drivers };
}

/* THE PART THAT IS NOT AN ESTIMATE. Three questions, restated in ESRB's own
   words. ESRB is explicit that interactive elements "don't affect the
   rating", which is why they are computed apart from the floor above and
   drawn under a rule on the card. */
function _esrbInteractive() {
  const out = [];
  if (_esrbIs('google.content.interact', 1)) out.push('Users Interact');
  if (_esrbIs('google.content.location', 1)) out.push('Shares Location');
  if (_esrbHas('google.content.cryptotypes', 1)) out.push('In-Game Purchases');
  return out;
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
    { id: 'testflight_internal', label: 'TestFlight (internal)' },
    { id: 'testflight_external', label: 'TestFlight (external)' },
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
    { id: 'testflight_internal', label: 'TestFlight (internal)' },
    { id: 'testflight_external', label: 'TestFlight (external)' },
    { id: 'production',          label: 'Mac App Store' },
  ],
  macos_full: [
    { id: 'testflight_internal', label: 'TestFlight (internal)' },
    { id: 'testflight_external', label: 'TestFlight (external)' },
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
    // Submit-time progress (#42): the build uploads + Apple-processes AT submit.
    uploading:        { label: 'UPLOADING BUILD',         note: 'Sending your build to App Store Connect.' },
    processing:       { label: 'APPLE PROCESSING BUILD',  note: 'Apple is processing your upload. This can take 20–40 minutes.' },
    internal_testing: { label: 'AVAILABLE FOR INTERNAL TESTING', note: 'Your build is in TestFlight for your internal testers — no review needed.' },
    in_review: { label: 'WAITING FOR REVIEW',         note: '' },
    accepted:  { label: 'PENDING DEVELOPER RELEASE',  note: 'Accepted. It reaches the App Store when you release it.', action: 'Release This Version' },
    live:      { label: 'READY FOR DISTRIBUTION',     note: 'Live on the App Store.' },
    rejected:  { label: 'REJECTED',                   note: 'App Review sent notes. Reply in Resolution Center, or upload a new build.', action: 'Read the notes' },
  },
  macos: {
    uploading:        { label: 'UPLOADING BUILD',         note: 'Sending your build to App Store Connect.' },
    processing:       { label: 'APPLE PROCESSING BUILD',  note: 'Apple is processing your upload. This can take 20–40 minutes.' },
    internal_testing: { label: 'AVAILABLE FOR INTERNAL TESTING', note: 'Your build is in TestFlight for your internal testers — no review needed.' },
    in_review: { label: 'WAITING FOR REVIEW',         note: '' },
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

/* ── THE POST-SUBMISSION CARD'S TRACK-SPECIFIC STATUS SERIES (v8.11) ──────────
   A Mac submission moves through a DIFFERENT ordered series of statuses
   depending on the track it was sent to, and the card's segment bar draws
   exactly these — one segment per status, in order. The LAST entry is the
   track's terminal step, the only one that can turn green (complete):

     Internal TestFlight  needs no App Review —
       Uploading Build → Processing Build → Ready for Testing
     External TestFlight  goes through review, then to testers —
       Uploading Build → Processing Build → Waiting for Review → In Review
       → Ready for Testing
     App Store (production) goes through review, then waits on the developer —
       Uploading Build → Processing Build → Waiting for Review → In Review
       → Pending Developer Release

   Keyed by the track id (PLATFORM_TRACKS): testflight_internal /
   testflight_external / production. */
const SUBMIT_TRACK_SERIES = {
  testflight_internal: ['uploading', 'processing', 'ready_for_testing'],
  testflight_external: ['uploading', 'processing', 'waiting_for_review', 'in_review', 'ready_for_testing'],
  production:          ['uploading', 'processing', 'waiting_for_review', 'in_review', 'pending_developer_release'],
};

function submitTrackSeries(track) {
  return SUBMIT_TRACK_SERIES[track] || SUBMIT_TRACK_SERIES.testflight_internal;
}

/* Status label + the description beneath it, written PER STATE so the line says
   exactly where the submission is: `progress` while it is happening, `failed`
   if it stopped here, `complete` for a terminal step that finished. `weight`
   sizes that status's segment — the quick automatic steps are thin and the long
   waits are wide (relative expected time, not a count). A terminal step's
   `action`, if any, is the developer's own next move (Release). */
const SUBMIT_PHASE_COPY = {
  uploading: {
    label: 'Uploading Build', weight: 1,
    progress: 'Sending your build to App Store Connect.',
    failed:   'The upload to App Store Connect didn’t finish. Open the step and press Submit again.',
  },
  processing: {
    label: 'Processing Build', weight: 2,
    progress: 'Apple is processing the uploaded build, this usually takes between 5 and 15 minutes.',
    // A processing failure is Apple rejecting the binary during validation — Submit
    // again with the same build won't help. Apple emails the reason (an ITMS-… code);
    // the fix is to correct it and upload a NEW build.
    failed:   'Apple rejected this build during processing. Check your email for the reason from Apple, fix it, then generate and upload a new build.',
  },
  waiting_for_review: {
    label: 'Waiting for Review', weight: 4,
    progress: 'Your build is in the queue for App Review. This usually takes a day or two.',
    failed:   'App Review couldn’t be started for this build. Check App Store Connect for details.',
  },
  in_review: {
    label: 'In Review', weight: 3,
    progress: 'App Review is looking at your build right now.',
    failed:   'App Review rejected your build. Read their notes in App Store Connect, fix what they flagged, and submit a new build.',
  },
  ready_for_testing: {
    label: 'Ready for Testing', weight: 1,
    progress: 'Almost there — your build is on its way to your testers.',
    complete: 'Your build is available to your testers in TestFlight.',
    failed:   'Your build didn’t reach TestFlight. Check App Store Connect for details.',
  },
  pending_developer_release: {
    label: 'Pending Developer Release', weight: 1,
    progress: 'Almost there — App Review has approved your build.',
    complete: 'Approved. It reaches the Mac App Store as soon as you release it.',
    failed:   'Your build wasn’t approved. Read App Review’s notes in App Store Connect.',
    action:   'Release This Version',
  },
  /* Not in any series — the demo state after the developer presses Release on a
     Pending Developer Release card. Keeps the bar fully green. */
  released: {
    label: 'Released', weight: 1,
    complete: 'Live on the Mac App Store.',
  },
};

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

/* THE MARKETING NUDGE SPEAKS THE PLATFORM'S OWN LANGUAGE (v7.00).

   Mark: "maybe we could use language that is platform specific to help it make
   sense on the card", and then the sentence itself — "Work this Mac release
   into a marketing plan".

   IT IS ALSO THE ANSWER TO THE MULTIPLICATION v6.56 REMOVED THIS BUTTON FOR.
   That version's strongest argument was that one card says the line once and
   three platforms in review say it three times identically on one screen —
   "noise proportional to the number of platforms". Three DIFFERENT lines are
   not that: they are three specific invitations, and the count of them is the
   count of things you are actually waiting on. The generic line was what made
   repetition read as a bug.

   THE SENTENCE NAMES THE RELEASE, NOT THE AUDIENCE, and that is the correction
   this version makes. An earlier pass went with "Go win over Mac players →",
   which Mark rejected. He is right, and the reason is worth keeping: the card
   is about a BUILD you just sent, so "this Mac release" is the thing already
   on screen and the line simply tells you what to do with it. "Win over
   players" is a different, vaguer subject that the card never raised.

   "Work X into a plan" is also the honest verb for where it lands. Marketing
   is an announcement composer whose storefront row auto-syncs from your active
   platforms, a landing page built from your own metadata, and two ranked
   discovery lists (press and creators) — a place you go to PLAN, which is
   exactly what the sentence promises. It deliberately does not promise
   featuring pitches, pre-registration or wishlist campaigns; Marketing has
   none of those, and a link that oversells its destination is worse than a
   generic one.

   ONE FRAME, ONE NOUN. Only the platform's own word is stored, because nine
   near-identical sentences would be nine edits the next time the frame moves —
   the inventory problem this file keeps paying for. A store that ever needs a
   bespoke line gets an override in `subNudgeCopy` below, not a ninth copy of
   the frame here.

   THE WORDS ARE THE DEVELOPER'S, NOT THE STORE'S — "Mac", not "Mac App
   Store"; "Switch", not "Nintendo eShop". You ship a Mac release; the store's
   own name is already on this card twice (the header and the status line),
   and a third would be the "two marks on one object" this file keeps refusing,
   in words. It must not restate the wait either — no "Steam has it" — for the
   same reason.

   MEASURED, because the frame is long and the arrow counts. 12px IBM Plex
   Mono advances exactly 7.2px a character, and the card's text column is
   376px at 1280 and 1512, 372 at 960, 442 at 1100 (where the guide drops
   below and the cards widen). Against the narrowest of those, 372:

       Steam       338.4    Mac / iOS / web   324.0    Android   352.8

   — every platform that can reach this card today, with ~20px to spare on the
   longest. `egs` (374.4) and `psn` (381.6) do NOT fit at 372 and would wrap to
   two lines; both are in COMING_SOON_PLATFORMS and cannot own a submitted card
   yet, so the natural word is kept rather than contorted for an unreachable
   case. If either ever ships, shorten its noun here — that is the one line to
   change, and a wrapped nudge reads as a paragraph. */
const SUB_NUDGE_PLATFORM = {
  steam:      'Steam',
  ios:        'iOS',
  macos:      'Mac',
  macos_full: 'Mac',
  android:    'Android',
  egs:        'Epic Games',
  psn:        'PlayStation',
  xbox:       'Xbox',
  nintendo:   'Switch',
  web:        'web',
};

/* The fallback is the line this button carried from the day it was built until
   v6.56, so a platform added to PLATFORMS without a word above still says
   something true rather than naming itself `undefined`. `web` is listed and
   never reaches this anyway: its card is always `live` and the nudge only
   draws on `in_review`. Kept for the day that changes. */
function subNudgeCopy(platformId) {
  const name = SUB_NUDGE_PLATFORM[platformId];
  return name ? `Work this ${name} release into a marketing plan`
              : 'Quiet time. Go plan your launch';
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


/* ══ STEAM'S SYSTEM REQUIREMENTS (v8.86) ═════════════════════════════════
   Steamworks asks for these per operating system, in two columns, and the
   store page prints them back as two columns under an OS tab — measured on
   store.steampowered.com (Cyberpunk 2077, Portal 2, Counter-Strike 2).

   THREE OPERATING SYSTEMS, NOT TWO. Epic's own EGS_SPEC_OS has Windows and
   Mac because Epic's portal has two tabs; Steam has three, and the third is
   labelled "SteamOS + Linux" on the store page even though Steamworks calls
   the field Linux.

   THE ROWS ARE STEAM'S OWN LABELS, in Steam's order, which is not Epic's:
   Steam leads with a 64-bit note that is its own line rather than a field,
   prints OS before Processor, and has both Network and Sound Card where
   Epic has only a sound card. `winOnly` marks DirectX, the one row the Mac
   and Linux tabs drop — the same flag EGS_SPEC_ROWS uses for the same
   reason. */
/* ══ READ OFF STEAMWORKS' OWN FORM (v8.93) ═══════════════════════
   partner.steamgames.com's Store edit page, field by field, rather than
   from the store page it prints to. Four things came back that reading
   the published page could not have told us:

     - THE OS LIST IS FOUR, NOT THREE: windows, mac, linux and android.
       Android is deliberately left out here, by request.
     - MEMORY AND DISK SPACE ARE A NUMBER AND A UNIT, not free text. The
       portal gives an amount box and an MB/GB select; "8 GB RAM" typed
       into one box is this card's invention, and the store page's own
       "8 GB RAM" is Steam composing the two.
     - NETWORK IS A TICK, not a line. One checkbox, "Broadband internet
       connection".
     - DIRECTX IS A CLOSED LIST of twenty-one versions, and VR Devices
       and Support is a row of its own that this card never had.

   `os` carries which rows that tab drops: mac has no DirectX and no VR
   row, linux has no DirectX. */
const STEAM_SYSREQ_OS = [
  { id: 'windows', label: 'Windows',        tab: 'Windows',        directx: true,  vr: true  },
  { id: 'mac',     label: 'Mac',            tab: 'Mac',            directx: false, vr: false },
  { id: 'linux',   label: 'Linux + SteamOS', tab: 'Linux + SteamOS', directx: false, vr: true },
];

/* Steamworks' own DirectX list, in its own order. */
const STEAM_DIRECTX_VERSIONS = ['N/A','5.2','6.0','6.1','6.1a','7.0','7.0a','7.1',
  '8.0','8.0a','8.1','8.1a','8.1b','8.2','9.0','9.0a','9.0b','9.0c','10','11','12'];
const STEAM_SIZE_UNITS = ['MB', 'GB'];

/* `kind` is what the control is in the portal, and the labels are the
   portal's own wording down to "OS Version:" and "VR Devices and
   Support:". No `hint`: not one box on Steamworks' form carries
   placeholder text, and a greyed-out "8 GB RAM" reads as an answer
   already given. */
const STEAM_SYSREQ_ROWS = [
  { id: 'os',       label: 'OS Version',             kind: 'text' },
  { id: 'cpu',      label: 'Processor',              kind: 'text' },
  { id: 'memory',   label: 'Memory',                 kind: 'size' },
  { id: 'gpu',      label: 'Graphics',               kind: 'text' },
  { id: 'network',  label: 'Network',                kind: 'check',
    check: 'Broadband internet connection' },
  { id: 'directx',  label: 'DirectX Version',        kind: 'select',
    options: STEAM_DIRECTX_VERSIONS, winOnly: true },
  { id: 'storage',  label: 'Disk Space',             kind: 'size' },
  { id: 'sound',    label: 'Sound Card',             kind: 'text' },
  { id: 'vr',       label: 'VR Devices and Support', kind: 'text', vrOnly: true },
  { id: 'notes',    label: 'Additional Notes',       kind: 'text' },
];
const STEAM_SYSREQ_MAX = 240;

/* Which rows a given tab asks for. winOnly is DirectX; vrOnly is the VR
   row, which Mac's tab drops and Linux's keeps. */
function steamSysreqRowsFor(osId) {
  const os = STEAM_SYSREQ_OS.find(o => o.id === osId) || STEAM_SYSREQ_OS[0];
  return STEAM_SYSREQ_ROWS.filter(r =>
    (!r.winOnly || os.directx) && (!r.vrOnly || os.vr));
}

/* The 64-bit line Steam prints above the fields rather than beside a label
   — on the store page it is a bare <li> with no <strong>, which is why it
   is a flag here and not a row. */
const STEAM_SYSREQ_64BIT = 'Requires a 64-bit processor and operating system';

/* ══ STEAM ACHIEVEMENTS (v8.98) ══════════════════════════════════════════
   Five fields, because five is what the Steamworks Achievement
   Configuration page asks a developer for that a PLAYER ever sees:
   Display Name, Description, Hidden, Achieved Icon, Unachieved Icon. The
   portal's own table has two more columns — API Name and Progress Stat —
   and both exist for the SDK rather than for the store page: a key the
   game calls SetAchievement() with, and a stat to tie progress to. This
   card is a preview of a store page, where neither is ever printed, so
   neither is asked for here. (The same reason Epic's achievement editor
   has no achievement id; see makeBlankEgsAchievement.)

   NO CHARACTER LIMITS, because the portal states none. Every name and
   description input on partner.steamgames.com/apps/achievements/<appid>
   was read live for this version and not one of them carries a maxlength
   attribute. A counter here would be Shipmate inventing a rule Steam does
   not have, which is the mistake v8.95 cost a round-trip to undo on the
   genre list: a list taken from markup is not the list a developer sees,
   and a limit nobody wrote down is not a limit. */

/* THE ASSET RULE, IN STEAM'S OWN WORDS, from the line printed under both
   icon wells on the Achievement Configuration page: "For best results,
   achievement icons should be 256x256 px JPG images. They can be as small
   as 64x64, but it is recommended you use the larger size. We recommend
   that achieved icons be colorful; unachieved icons should be grayscale."

   256x256 JPG is the requirement, so a file that is neither is refused;
   64x64 is the floor Steam names, so anything between the two is taken
   with a note rather than rejected. */
const STEAM_ACH_ICON = {
  px:     256,
  minPx:  64,
  accept: 'image/jpeg',
  types:  ['image/jpeg'],
  note:   '256 x 256 px JPG',
};

/* A BLANK ACHIEVEMENT. `open` is surface state riding on the record rather
   than a parallel map keyed by id — there is one editor per achievement and
   it dies with it, the same shape makeBlankEgsAchievement uses. */
function makeBlankSteamAchievement() {
  return {
    id: (typeof generateId === 'function') ? generateId('steamach') : 'steamach' + Date.now(),
    displayName:    '',
    description:    '',
    hidden:         false,
    achievedIcon:   null,
    unachievedIcon: null,
    open:           true,
  };
}

/* THE LIST, FILTERED OF HOLES. One accessor so the preview block, the
   editor and the completeness check cannot disagree about what is in it. */
function steamAchievements() {
  return (state.steamAchievements || []).filter(Boolean);
}

/* WHAT A STORE PAGE SHOWS FOR ONE ROW. Steam prints the achieved (colourful)
   icon in the showcase, and a hidden achievement still shows its icon — it
   is the name and description that are withheld until it is unlocked. */
function steamAchievementTileIcon(a) {
  return ((a && a.achievedIcon) || {}).dataUrl
      || ((a && a.unachievedIcon) || {}).dataUrl
      || '';
}

/* DONE MEANS THERE IS AT LEAST ONE NAMED ACHIEVEMENT. An empty row the
   developer added and has not typed into yet is not an answer, the same
   test every other block on this page applies to its own field. */
function steamAchievementsFilled() {
  return steamAchievements().some(a => (a.displayName || '').trim());
}

/* A size row is {amount, units}, a check row is a boolean, and everything
   else is a string — the shapes the portal's own controls have. */
function makeBlankSteamSysreq() {
  const out = {};
  STEAM_SYSREQ_OS.forEach(o => {
    const col = () => {
      const c = {};
      STEAM_SYSREQ_ROWS.forEach(r => {
        c[r.id] = r.kind === 'size'  ? { amount: '', units: 'GB' }
                : r.kind === 'check' ? false
                : '';
      });
      return c;
    };
    /* `supported` is a three-state like Epic's: null is unanswered, and a
       tab that has been answered "no" is a decision rather than a gap. */
    out[o.id] = { supported: null, bits64: false, minimum: col(), recommended: col() };
  });
  return out;
}

/* Steam's legal notice: the small grey paragraph under the requirements on
   every store page (#game_area_legal, 11px, rgb(86,97,104)). Steamworks
   caps it; 2,650 characters is the longest in the games surveyed (GTA V),
   so the cap here is generous rather than measured. */
const STEAM_LEGAL_MAX = 8000;

/* ══ WHAT THE STORE PAGE PREVIEW'S FIELDS COUNT AGAINST (v8.89) ════════
   Only the two long-form fields get a counter, because only they have a
   length worth watching. Title, Developer, Publisher and Release Date are
   single-line boxes with no published cap, and a number beside each would
   be four numbers on a page that is trying to look like a store page.

   THE SHORT DESCRIPTION'S 300 IS STEAMWORKS' OWN EDITOR COUNTER, not
   Valve's documentation: the published page
   (partner.steamgames.com/doc/store/page/description) says only that the
   section "is limited to a few hundred characters", which was checked
   while writing this and is as precise as Valve gets in public. If the
   editor has moved, this constant is the one line to change.

   THE ABOUT CAP IS GENEROUS RATHER THAN MEASURED, the same admission
   STEAM_LEGAL_MAX makes above. Valve publishes no limit for About This
   Game and calls it a "longer-form section"; 10,000 is Epic's body limit,
   borrowed so the two previews behave alike rather than invented to look
   authoritative. Neither field is hard-capped — see _steamSppCounter. */
const STEAM_SHORTDESC_MAX = 300;
const STEAM_ABOUT_MAX     = 10000;

/* THE REST OF THE PAGE'S OWN BOXES (v8.91). v8.89 counted the two long
   fields on the argument that only they had a length worth watching, and
   left Title, Developer, Publisher and Release Date bare. By request every
   box a developer types in on this page now carries a number: a counted
   field and an uncounted one sitting in the same column read as two
   different KINDS of field, which is a distinction this page does not
   have.

   NONE OF THESE FOUR IS VALVE'S PUBLISHED FIGURE, and none is the editor's
   either — Steamworks does not show a counter on them. They are Shipmate's
   own, picked to sit well clear of any real answer, which is the same
   admission STEAM_LEGAL_MAX and STEAM_ABOUT_MAX make above. They are here
   so the boxes behave alike, not to assert a rule Steam enforces; a real
   limit, when one is found, replaces the number and nothing else. */
const STEAM_PAGE_LIMITS = {
  name:        100,   /* longest store names run to about 80 */
  developer:   128,   /* a list, not a name: "Sound Games, Lightfox Games" */
  publisher:   128,
  /* RELEASE DATE IS NOT HERE (v8.92). It had a limit for one version,
     because it had a box to type in. It no longer does: the field is read
     only and its one writer is the scrape, so there is nothing for a
     developer to run past and nothing to count. */
};

/* ══ THE RELEASE DATE, AS THE PAGE PRINTS IT (v8.92) ════════════════
   /game returns releaseDate as { comingSoon, date }, and `date` is already
   a display string in English — "Feb 19, 2026" for a dated title, a window
   like "Q1 2026" for an announced one, and an empty string for a title
   with no date at all. Steam prints whichever of those it has, so mostly
   this passes the string through.

   THE ONE THING IT REFORMATS is an ISO date. The endpoint does not send
   one, but Shipmate's own date picker stores YYYY-MM-DD
   (state.formData.releaseDate), and a page that printed "2026-02-19"
   where Steam prints "19 Feb, 2026" would be showing a developer a date
   format their store page will never use. Empty becomes "Coming soon",
   which is what Steam shows and what this field already defaulted to. */
const STEAM_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];
function steamReleaseDateText(raw) {
  const v = (raw == null ? '' : String(raw)).trim();
  if (!v) return 'Coming soon';
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (iso) {
    const m = STEAM_MONTHS[parseInt(iso[2], 10) - 1];
    /* Steam's own order on a store page: "19 Feb, 2026". */
    if (m) return parseInt(iso[3], 10) + ' ' + m + ', ' + iso[1];
  }
  return v;
}


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
  macSubmitAnswers: makeBlankMacAnswers(),

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

  /* Which OS tab the System Requirements STEP and the PREVIEW are each
     showing (v8.86). Two fields rather than one: the page and the form are
     read at different moments and tying them together moves one under the
     other. Surface state, like egsPreviewTab. */
  steamSysreqTab: 'windows',
  /* Which pane of Steam - Technical is showing (v9.02). Four now:
     players / supported / controller / access. */
  steamTechnicalTab: 'players',
  steamSysreqPreviewTab: null,

  // Epic Games Store submission answers. Content Rating is NOT here — it is
  // IARC, shared with Google Play through state.cqAnswers (see
  // isEgsSectionComplete).
  /* WHICH PICKER IS OPEN, AND WHAT IS TYPED IN IT (v8.46). Surface state,
     not an answer — but it has to be state rather than a DOM class, because
     ticking an option repaints the whole step modal and a menu that closed
     itself on every tick would make choosing three genres three journeys.
     closeAllDropdowns resets both, for the reason its own comment gives. */
  egsPickOpen: null,
  egsPickFilter: '',

  /* WHICH TAB OF THE STORE PAGE PREVIEW IS ON SCREEN (v8.55): 'overview' or
     'achievements', the two Epic itself shows. Surface state, like the
     picker above — the tab strip was always drawn and never pressable, so
     half the page Epic publishes had no preview at all. */
  egsPreviewTab: 'overview',

  /* WHICH OPERATING SYSTEM'S TAB THE SPECIFICATIONS FORM IS SHOWING
     (v8.88). Surface state, like egsPreviewTab above: the portal opens on
     Windows and remembers nothing about it between visits. */
  egsSpecTab: 'windows',

  /* ── EPIC'S PRODUCT LOGO (v8.82) ────────────────────────────────────────
     Epic's panel opens on the product logo, above the rating card, and the
     slot it sits in is 16:9 with the artwork CONTAINED in it — measured on
     store.epicgames.com, where `_sidebarLogo_` computes to `aspect-ratio:
     16 / 9` and the served file is 854x480. SM_REQS.epic already carried
     the upload spec (960x540, PNG, max 1MB, "legible on a dark
     background", marked official), and the two agree, so the table stays
     the single statement of it and nothing here repeats the numbers.

     A LIST AND A CHOICE, not one slot. The ask is Mac App Store's media
     carousel: several candidates, any of them removable, more uploadable,
     and one of them featured. So `egsLogos` is the candidates and
     `egsLogoFeatured` is the id of the one the page draws — a separate
     field rather than an order, because "which one is on the store page"
     is a decision and not a side effect of sorting.

     SEEDED FROM THE SCRAPE, NOT COPIED INTO IT. egsLogoCandidates (below)
     reads the asset pool every time instead of writing the pool's images
     in here on import: a logo the developer has not touched should follow
     the pool when a later scrape improves it, and only a real edit — an
     upload, a removal, a choice — puts anything in these two fields. */
  egsLogos: [],
  egsLogoRemoved: [],
  egsLogoFeatured: null,

  /* WHICH ITEM THE MEDIA CAROUSEL IS SHOWING (v8.56). Epic's carousel is one
     list seen two ways — a stage and a strip of thumbnails under it — so the
     index belongs to the page, not to either half. Surface state, like the
     tab above. */
  egsMediaIndex: 0,

  /* EPIC'S OWN ACHIEVEMENTS (v8.60) — the ones added and edited on the Store
     Page Preview's Achievements tab, in the Developer Portal's own shape.
     Empty until the developer adds one or adopts the Steam import; see
     egsAchievements() for which list the page reads. */
  egsAchievements: [],

  /* STEAM'S OWN ACHIEVEMENTS (v8.98) — the list the Store Page Preview's
     Achievements block shows and the Steam - Achievements section edits,
     in the Steamworks Achievement Configuration page's own shape (see
     makeBlankSteamAchievement). Empty until the developer adds one or a
     Steam scrape lands; unlike every other imported field in this app, a
     scrape REPLACES this list rather than leaving a filled one alone —
     asked for directly, and the same rule Epic's list follows (see
     replaceEgsAchievementsFromSteam). */
  steamAchievements: [],
  egsSubmitAnswers: makeBlankEgsAnswers(),

  /* Epic's Localizations surface state (v7.31). Which field is on screen,
     whether the cards are flipped to review, and whether the gear is open —
     all three are about the SURFACE, not the copy, which is why Epic keeps its
     own rather than sharing Steam's: the text is shared (see
     buildEgsLocalizationReviewSection) and flipping one store's review should
     not flip the other's. */
  egsLocReviewField:     'title',
  egsLocReviewMode:      'all',    // 'all' | 'review'
  egsReviewSettingsOpen: false,

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
  /* THE APP STORE'S OWN LISTING TEXT — today, exactly one field.

     Game Details' Description used to BE the App Store preview's Description:
     `_iasFieldValue('description', primary)` read `formData.description` and
     `_iasSetFieldValue` wrote it, so editing the preview edited Game Details
     and, through Mac's own empty-field fallback, the Mac preview too. By
     request the three are now one-way — Game Details fills the two previews and
     overwrites them on every change; neither preview writes back, and neither
     writes to the other.

     Only `description` lives here because it is the only field that needed
     moving: Title and Subtitle are deliberately SHARED between the two Apple
     stores (MAS_SHARED_LISTING_FIELDS, app.js) and a supporting language's text
     already has its own per-store storage. An object rather than a bare string
     for symmetry with macAppStoreListing, and so the next field that needs
     splitting has somewhere obvious to go.

     `null` means "never written", which is what lets a project saved before the
     split fall back to formData.description until the first propagation. */
  appStoreListing: { description: null },
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
  // "Has this user told us the extension is installed?" — global, sticky for
  // the session so only the first connect prompts to install it. This is the
  // user's own claim (the "I've installed it" button); what the extension says
  // about itself lives in extDetect below. Ask shipmateExtReady(), not this.
  extensionInstalled: false,

  /* WHAT THE EXTENSION SAYS ABOUT ITSELF (v8.22).
     Connect Account used to make everyone download and install the extension
     even when they already had it, because the page had no way to tell. It can
     tell now: content-shipmate.js posts `{__shipmate:'present', version}` onto
     this window when it loads and whenever we ping it.

     DELIBERATELY NOT STICKY, unlike extensionInstalled above. An extension can
     be uninstalled, disabled, or left behind in another browser profile, so a
     detection remembered forever would eventually be a lie. This is re-probed
     every time the Connect surface is drawn and starts false on every load.

     `probed` exists so the UI can tell "we have not asked yet" from "we asked
     and heard nothing" — the second is a real answer, the first is not. */
  extDetect: { seen: false, version: '', at: 0, probed: false },

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
  // Key of Epic's open Presentation picker, so ticking an option (which
  // re-renders) does not close it. Cleared by closeAllDropdowns.
  giarcPickerOpen: null,
  // Epic's type rows (buildEgsTypeRows): option indices the developer
  // explicitly answered NO, per question key. IARC stores only the ticks.
  egsTypeNo: {},
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

/* ══ THE GENRES STEAMWORKS SHOWS (v8.95) ══════════════════════
   Ten, not the twenty-eight v8.93 put here. That version read every
   `checkbox_rgGenres_*` row out of the Store edit page's markup and took
   the lot; eighteen of them are in the DOM but not on the form — the
   software and video genres (Accounting, Animation & Modeling, Movie,
   Episodic, 360 Video and the rest, plus Free To Play), which Steam
   reveals for other application types and never shows for a Game.
   Measured this time rather than read: every row's own height, with its
   ancestors checked for display:none.

   The lesson is the one this file keeps relearning — a list taken from
   markup is not the list a developer sees, and only the second one is
   the question being asked. */
const STEAM_INFO_GENRES = [
  'Action', 'Adventure', 'Casual', 'Indie', 'Massively Multiplayer',
  'Racing', 'RPG', 'Simulation', 'Sports', 'Strategy',
];

/* ══ THE TAG WIZARD'S OWN THREE TIERS (v8.94) ═══════════════════
   Read straight out of the wizard: it ships its hierarchy to the browser
   as `genreHierarchy`, three tiers of tag ids, with `tagNames` to resolve
   them. v8.93 could only check that each name this file carried was a
   real Steam tag — which tier it belonged in had to wait for the wizard
   to open, and here it is.

   WHAT THAT CHANGED is more than three names. The top tier is SEVEN, not
   nine: Arcade and Survival are top-level and Casual, Racing, Software
   and Sports are not — Racing and Sports sit a tier down, and Casual and
   Software are not tags in this hierarchy at all. The lower tiers are 69
   and 82 against the 89 and 52 this file had, so a quarter of the second
   tier was in the wrong place and about forty tags were missing outright.

   THE TIERS OVERLAP, which is not a mistake here: Steam lists Racing,
   Battle Royale, Metroidvania and twenty-odd others in both the second
   and third tier, because each is a genre in its own right and also a
   sub-genre of something else.

   STILL NOT MODELLED: the wizard narrows the third tier to the children
   of whichever second-tier tag you picked (`m_rgGenresToParents`). This
   card offers all three tiers in full, as it always has. The lists are
   now Steam's; the narrowing is a behaviour change nobody asked for yet.
   The wizard also caps a title at twenty tags in total. */
/* ══ THE TAG WIZARD'S TAXONOMY (v9.10) ═══════════════════════════════════
   partner.steamgames.com/taxonomy/tagwizard asks nine questions. This card
   offered three, over lists that came from `genreHierarchy` — a different
   structure on the same page that is not what any of those questions
   actually offers. Four whole sections were missing with it: Visuals &
   Viewpoint, Themes & Moods, Features and Players.

   WHERE THESE CAME FROM. Each question's choices are a `fill|<category>`
   directive the page resolves at render time, so the lists below are
   getQuestionChoices() called on the wizard's own question objects, tag id
   and all. All 396 were checked back against the live page by hash before
   being written down — the lesson of v8.95, where a list taken from markup
   turned out not to be the list a developer sees.

     Top-Level Genres    9     Visuals & Viewpoint   28
     Genres             53     Themes & Moods       174
     Sub-Genres         69     Features              53
                               Players               10

   THE IDS ARE STEAM'S. Selections are stored as labels, because every
   other part of this app already reads these arrays as labels; the ids
   ride along so a future importer can join on a number rather than a name,
   the way Supported Features does.

   TWO OF THE NINE ARE NOT HERE, and could not be. "What Else" offers tags
   Steam found in the title's own store description, and "User Tags" offers
   tags the community has already applied — both are per-game data out of
   Valve's corpus, which this prototype has no source for. Inventing either
   would be inventing an answer. Also not modelled: the wizard brightens
   the tags common among titles similar to yours, which is a recommendation
   computed from that same corpus. */
const STEAM_TAG_TOTAL_MAX = 20;          // `maxTags` on the wizard


const STEAM_TAG_SUPERGENRES = [
  ['9', 'Strategy'], ['19', 'Action'], ['21', 'Adventure'], ['122', 'RPG'], ['597', 'Casual'],
  ['599', 'Simulation'], ['699', 'Racing'], ['701', 'Sports'], ['8013', 'Software'],
];

const STEAM_TAG_GENRES = [
  ['84', 'Design & Illustration'], ['87', 'Utilities'], ['784', 'Video Production'],
  ['809', 'Photo Editing'], ['872', 'Animation & Modeling'], ['1027', 'Audio Production'],
  ['1036', 'Education'], ['1625', 'Platformer'], ['1645', 'Tower Defense'], ['1664', 'Puzzle'],
  ['1666', 'Card Game'], ['1670', '4X'], ['1676', 'RTS'], ['1698', 'Point & Click'],
  ['1716', 'Roguelike'], ['1718', 'MOBA'], ['1741', 'Turn-Based Strategy'], ['1752', 'Rhythm'],
  ['1754', 'MMORPG'], ['1770', 'Board Game'], ['1773', 'Arcade'], ['1774', 'Shooter'],
  ['3799', 'Visual Novel'], ['3810', 'Sandbox'], ['4106', 'Action-Adventure'],
  ['4158', 'Beat \'em up'], ['4231', 'Action RPG'], ['4328', 'City Builder'],
  ['4364', 'Grand Strategy'], ['4434', 'JRPG'], ['4736', '2D Fighter'], ['5055', 'eSports'],
  ['5300', 'God Game'], ['5900', 'Walking Simulator'], ['6506', '3D Fighter'],
  ['7178', 'Party Game'], ['9551', 'Dating Sim'], ['10235', 'Life Sim'], ['10437', 'Trivia'],
  ['10695', 'Party-Based RPG'], ['11014', 'Interactive Fiction'], ['16598', 'Space Sim'],
  ['17305', 'Strategy RPG'], ['17389', 'Tabletop'], ['24003', 'Word Game'],
  ['35079', 'Job Simulator'], ['42804', 'Action Roguelike'], ['87918', 'Farming Sim'],
  ['176981', 'Battle Royale'], ['220585', 'Colony Sim'], ['1084988', 'Auto Battler'],
  ['1100687', 'Automobile Sim'], ['1220528', 'Hobby Sim'],
];

const STEAM_TAG_SUBGENRES = [
  ['1628', 'Metroidvania'], ['1646', 'Hack and Slash'], ['1663', 'FPS'], ['1665', 'Match 3'],
  ['1674', 'Typing'], ['1720', 'Dungeon Crawler'], ['1723', 'Action RTS'], ['1730', 'Sokoban'],
  ['1738', 'Hidden Object'], ['1776', 'Espionage'], ['3798', 'Side Scroller'],
  ['3813', 'Real Time Tactics'], ['3814', 'Third-Person Shooter'], ['3834', 'Exploration'],
  ['3877', 'Precision Platformer'], ['3959', 'Roguelite'], ['4102', 'Combat Racing'],
  ['4255', 'Shoot \'Em Up'], ['4474', 'CRPG'], ['4486', 'Choose Your Own Adventure'],
  ['4637', 'Top-Down Shooter'], ['4684', 'Wargame'], ['4758', 'Twin Stick Shooter'],
  ['4777', 'Spectacle fighter'], ['4885', 'Bullet Hell'], ['5379', '2D Platformer'],
  ['5395', '3D Platformer'], ['5537', 'Puzzle Platformer'], ['5547', 'Arena Shooter'],
  ['5652', 'Collectathon'], ['6835', 'Poker'], ['8666', 'Runner'], ['9204', 'Immersive Sim'],
  ['9271', 'Trading Card Game'], ['13070', 'Solitaire'], ['14139', 'Turn-Based Tactics'],
  ['15045', 'Flight'], ['16689', 'Time Management'], ['21635', 'Language Learning'],
  ['21725', 'Tactical RPG'], ['26921', 'Political Sim'], ['29482', 'Souls-like'],
  ['33572', 'Mahjong'], ['35079', 'Job Simulator'], ['37376', 'Falling Blocks'],
  ['42804', 'Action Roguelike'], ['49213', 'Rugby'], ['56690', 'On-Rails Shooter'],
  ['71389', 'Spelling'], ['91114', 'Shop Keeper'], ['158638', 'Cricket'],
  ['198631', 'Mystery Dungeon'], ['323922', 'Musou'], ['353880', 'Looter Shooter'],
  ['454187', 'Traditional Roguelike'], ['560542', 'Incremental'], ['615955', 'Idler'],
  ['620519', 'Hero Shooter'], ['723991', 'Bullet Heaven'], ['769306', 'Escape Room'],
  ['791774', 'Card Battler'], ['847164', 'Volleyball'], ['916648', 'Creature Collector'],
  ['1023537', 'Boomer Shooter'], ['1091588', 'Roguelike Deckbuilder'],
  ['1100686', 'Outbreak Sim'], ['1100688', 'Medical Sim'], ['1199779', 'Extraction Shooter'],
  ['1220528', 'Hobby Sim'],
];

const STEAM_TAG_VISUALS = [
  ['1697', 'Third Person'], ['1714', 'Psychedelic'], ['1732', 'Voxel'], ['1751', 'Comic Book'],
  ['3839', 'First-Person'], ['3871', '2D'], ['3964', 'Pixel Graphics'], ['4085', 'Anime'],
  ['4094', 'Minimalist'], ['4145', 'Cinematic'], ['4175', 'Realistic'], ['4191', '3D'],
  ['4195', 'Cartoony'], ['4252', 'Stylized'], ['4305', 'Colorful'], ['4400', 'Abstract'],
  ['4562', 'Cartoon'], ['4726', 'Cute'], ['4791', 'Top-Down'], ['4975', '2.5D'],
  ['5851', 'Isometric'], ['6052', 'Noir'], ['6815', 'Hand-drawn'], ['10816', 'Split Screen'],
  ['18594', 'FMV'], ['21978', 'VR'], ['31275', 'Text-Based'], ['776177', '360 Video'],
];

const STEAM_TAG_THEME_MOOD = [
  ['699', 'Racing'], ['701', 'Sports'], ['1036', 'Education'], ['1616', 'Trains'],
  ['1637', 'Dogs'], ['1643', 'Building'], ['1644', 'Driving'], ['1647', 'Western'],
  ['1651', 'Satire'], ['1659', 'Zombies'], ['1662', 'Survival'], ['1667', 'Horror'],
  ['1671', 'Superhero'], ['1673', 'Aliens'], ['1678', 'War'], ['1680', 'Heist'],
  ['1681', 'Pirates'], ['1684', 'Fantasy'], ['1687', 'Stealth'], ['1688', 'Ninja'],
  ['1702', 'Crafting'], ['1708', 'Tactical'], ['1710', 'Surreal'], ['1746', 'Basketball'],
  ['1751', 'Comic Book'], ['1753', 'Skateboarding'], ['1755', 'Space'], ['1777', 'Steampunk'],
  ['3835', 'Post-apocalyptic'], ['3854', 'Lore-Rich'], ['3916', 'Old School'],
  ['3920', 'Cooking'], ['3942', 'Sci-fi'], ['3952', 'Gothic'], ['3978', 'Survival Horror'],
  ['3987', 'Historical'], ['4004', 'Retro'], ['4036', 'Parkour'], ['4046', 'Dragons'],
  ['4057', 'Magic'], ['4064', 'Thriller'], ['4115', 'Cyberpunk'], ['4137', 'Transhumanism'],
  ['4150', 'World War II'], ['4168', 'Military'], ['4172', 'Medieval'], ['4236', 'Loot'],
  ['4291', 'Spaceships'], ['4295', 'Futuristic'], ['4342', 'Dark'], ['4520', 'Farming'],
  ['4535', 'Dwarves'], ['4598', 'Alternate History'], ['4604', 'Dark Fantasy'],
  ['4608', 'Swordplay'], ['4695', 'Economy'], ['4821', 'Mechs'], ['4845', 'Capitalism'],
  ['4852', 'Billiards'], ['4878', 'Parody'], ['4947', 'Romance'], ['5030', 'Dystopian'],
  ['5160', 'Dinosaurs'], ['5179', 'Cold War'], ['5350', 'Family Friendly'],
  ['5363', 'Destruction'], ['5372', 'Conspiracy'], ['5382', 'World War I'],
  ['5432', 'Programming'], ['5502', 'Hacking'], ['5613', 'Detective'], ['5673', 'Modern'],
  ['5716', 'Mystery'], ['5727', 'Baseball'], ['5752', 'Robots'], ['5794', 'Science'],
  ['5914', 'Tennis'], ['5981', 'Mining'], ['6041', 'Horses'], ['6054', 'Elves'],
  ['6129', 'Logic'], ['6214', 'Birds'], ['6310', 'Diplomacy'], ['6378', 'Crime'],
  ['6691', '1990\'s'], ['6702', 'Mars'], ['6910', 'Naval'], ['6915', 'Martial Arts'],
  ['6948', 'Rome'], ['7038', 'Golf'], ['7108', 'Party'], ['7309', 'Skiing'],
  ['7328', 'Bowling'], ['7423', 'Sniper'], ['7432', 'Lovecraftian'], ['7622', 'Offroad'],
  ['7743', '1980s'], ['7926', 'Artificial Intelligence'], ['8369', 'Investigation'],
  ['9157', 'Underwater'], ['9541', 'Demons'], ['9564', 'Hunting'], ['9626', 'Animals'],
  ['9803', 'Snow'], ['10383', 'Transportation'], ['10397', 'Memes'], ['10617', 'Samurai'],
  ['10679', 'Time Travel'], ['10808', 'Supernatural'], ['11634', 'Vikings'],
  ['12190', 'Boxing'], ['12472', 'Management'], ['12686', 'Vampires'], ['13276', 'Tanks'],
  ['13382', 'Archery'], ['13577', 'Sailing'], ['13906', 'Game Development'],
  ['15045', 'Flight'], ['15277', 'Philosophical'], ['15564', 'Fishing'], ['15868', 'Motocross'],
  ['16094', 'Mythology'], ['16250', 'Gambling'], ['17015', 'Werewolves'], ['17337', 'Lemmings'],
  ['17894', 'Cats'], ['19568', 'Cycling'], ['19780', 'Submarine'], ['20486', 'Wolves'],
  ['21006', 'Underground'], ['22602', 'Agriculture'], ['22955', 'Mini Golf'],
  ['23491', 'Cleaning'], ['25959', 'Wuxia'], ['28444', 'Snowboarding'], ['30358', 'Nature'],
  ['31579', 'Otome'], ['44868', 'LGBTQ+'], ['46348', 'Zoo'], ['47827', 'Wrestling'],
  ['49213', 'Rugby'], ['52406', 'Cult'], ['96359', 'Skating'], ['97070', 'Assassins'],
  ['97376', 'Cozy'], ['123332', 'Bikes'], ['129761', 'ATV'], ['180368', 'Faith'],
  ['198913', 'Motorbike'], ['252854', 'BMX'], ['255534', 'Automation'], ['324176', 'Hockey'],
  ['507423', 'Foxes'], ['552282', 'Wholesome'], ['760247', 'Xianxia'], ['847164', 'Volleyball'],
  ['889937', 'Decorating'], ['1239876', 'Organizing'], ['1254546', 'Football (Soccer)'],
  ['1254552', 'Football (American)'], ['1352486', 'Capybaras'], ['1654', 'Relaxing'],
  ['1714', 'Psychedelic'], ['1719', 'Comedy'], ['1721', 'Psychological Horror'],
  ['3934', 'Immersive'], ['4136', 'Funny'], ['4166', 'Atmospheric'], ['5186', 'Psychological'],
  ['5608', 'Emotional'], ['5923', 'Dark Humor'], ['6052', 'Noir'], ['14720', 'Nostalgia'],
  ['19995', 'Dark Comedy'],
];

const STEAM_TAG_FEATURES = [
  ['1646', 'Hack and Slash'], ['1669', 'Moddable'], ['1687', 'Stealth'], ['1695', 'Open World'],
  ['1702', 'Crafting'], ['1717', 'Hex Grid'], ['1742', 'Story Rich'], ['1759', 'Perma Death'],
  ['1775', 'PvP'], ['3968', 'Physics'], ['3993', 'Combat'], ['4155', 'Class-Based'],
  ['4202', 'Trading'], ['4325', 'Turn-Based Combat'], ['4559', 'Quick-Time Events'],
  ['4747', 'Character Customization'], ['4835', '6DOF'], ['4994', 'Naval Combat'],
  ['5125', 'Procedural Generation'], ['5154', 'Score Attack'], ['5711', 'Team-Based'],
  ['5765', 'Gun Customization'], ['5796', 'Bullet Time'], ['6276', 'Inventory Management'],
  ['6426', 'Choices Matter'], ['6625', 'Time Manipulation'], ['6730', 'PvE'],
  ['6869', 'Nonlinear'], ['6971', 'Multiple Endings'], ['7208', 'Female Protagonist'],
  ['7250', 'Linear'], ['7332', 'Base Building'], ['7481', 'Controller'], ['7556', 'Dice'],
  ['7569', 'Grid-Based Movement'], ['7702', 'Narrative'], ['7926', 'Artificial Intelligence'],
  ['8122', 'Level Editor'], ['8253', 'Music-Based Procedural Generation'],
  ['8945', 'Resource Management'], ['9592', 'Dynamic Narration'], ['11095', 'Boss Rush'],
  ['11104', 'Vehicular Combat'], ['12057', 'Tutorial'], ['14139', 'Turn-Based Tactics'],
  ['17389', 'Tabletop'], ['18594', 'FMV'], ['31275', 'Text-Based'], ['32322', 'Deckbuilding'],
  ['42089', 'Jump Scare'], ['42152', 'Dialogue Heavy'], ['255534', 'Automation'],
  ['856791', 'Asymmetric VR'],
];

const STEAM_TAG_PLAYERS = [
  ['128', 'Massively Multiplayer'], ['1685', 'Co-op'], ['3841', 'Local Co-Op'],
  ['3843', 'Online Co-Op'], ['3859', 'Multiplayer'], ['4182', 'Singleplayer'],
  ['4508', 'Co-op Campaign'], ['4840', '4 Player Local'], ['7368', 'Local Multiplayer'],
  ['17770', 'Asynchronous Multiplayer'],
];


/* ── THE SEVEN SECTIONS ──────────────────────────────────────────────────
   One row per taxonomy question, in the wizard's order, carrying the cap
   this card applies and the hint its heading prints.

   THE CAPS ARE THE DESIGN'S, NOT THE FORM'S, for the first three — and
   they are deliberately the tighter pair of two numbers that disagree on
   Steam's own page. The wizard PRINTS "choose one or two top-level
   genres", "Select one or two genres", "Select up to three sub-genres";
   its validator ACCEPTS 3, 5 and 6. v9.08/v9.09 built this section's pills
   and pickers against 2, 2 and 3 — the printed numbers — and those went
   through design review. So the printed numbers stand, and the ones the
   form would accept are recorded here beside them rather than silently
   swapped in. If the looser caps are ever wanted, `max` is the only edit.

   THE OTHER FOUR ARE UNCAPPED, which is the form's answer and the printed
   one both: select_max is -1 and the prompt says "any relevant". */
const STEAM_TAG_SECTIONS = [
  { key: 'topGenres', label: 'Top-Level Genre', max: 2, formMax: 3,
    tags: STEAM_TAG_SUPERGENRES, pills: true, required: true,
    hint: 'Required. Choose one or two top-level genres to categorize your title.' },
  { key: 'genres', label: 'Genre', max: 2, formMax: 5, tags: STEAM_TAG_GENRES,
    hint: 'Optional. Up to two more specific genres, shown with your top-level genre.' },
  { key: 'subGenres', label: 'Sub-genre', max: 3, formMax: 6, tags: STEAM_TAG_SUBGENRES,
    hint: 'Optional. Up to three sub-genres — the most specific tags, which lead your store page.' },
  { key: 'visuals', label: 'Visuals & Viewpoint', max: -1, formMax: -1, tags: STEAM_TAG_VISUALS,
    hint: 'Optional. How your title looks, and the viewpoint it is played from.' },
  { key: 'themeMood', label: 'Themes & Moods', max: -1, formMax: -1, tags: STEAM_TAG_THEME_MOOD,
    hint: 'Optional. What your title is about, and how it feels to play.' },
  { key: 'features', label: 'Features', max: -1, formMax: -1, tags: STEAM_TAG_FEATURES,
    hint: 'Optional. What a player does, and what the game does back.' },
  { key: 'playerTags', label: 'Players', max: -1, formMax: -1, tags: STEAM_TAG_PLAYERS,
    hint: 'Optional. Who plays, and together or alone.' },
];

/* ── THE SOFTWARE GENRES, WHICH THIS IS NOT FOR (v9.14) ──────────────────
   Steam's taxonomy serves its whole store, and that includes the
   applications it sells alongside games: Design & Illustration, Photo
   Editing, Utilities and the rest are genres a Blender or an Audition
   would tick. Shipmate submits games.

   THE LIST IS STEAM'S OWN, not a judgement about which names sound like
   software. The Tag Wizard's `categoriesByTag` marks each tag with the
   families it belongs to, and exactly eight carry `software_genre` —
   these eight, ids and all. Two of them are ones a reader would probably
   not have struck out by eye: Education, which is also offered under
   Themes & Moods, and Audio Production.

   EDUCATION GOES FROM THEMES & MOODS TOO, which is the one consequence
   worth naming. There is no separate "Education (theme)" tag — id 1036
   appears in both questions and is the same tag, so a game ticking it
   there is applying Steam's software genre. It is dropped wherever it
   appears rather than in some places and not others.

   FILTERED, NOT DELETED. The arrays above stay exactly as the wizard
   serves them, so steam914's hashes keep checking them against the live
   page; this is the one place that says what Shipmate declines to offer
   and why. If Valve adds a software genre, the hash goes red and this
   list is where the answer goes. */
const STEAM_SOFTWARE_TAG_IDS = [
  '84',    // Design & Illustration
  '87',    // Utilities
  '784',   // Video Production
  '809',   // Photo Editing
  '872',   // Animation & Modeling
  '1027',  // Audio Production
  '1036',  // Education      (also listed under Themes & Moods)
  '8013',  // Software       (a top-level genre)
];

/* WHAT A SECTION ACTUALLY OFFERS: its list, minus the software genres,
   in alphabetical order.

   ALPHABETICAL IS OURS, NOT STEAM'S (v9.14, by request). The wizard
   prints each list in an order of Valve's own that is neither
   alphabetical nor by id, and which nothing on the page explains; a
   hundred and seventy-four themes in an order you cannot predict is a
   list you can only read by scanning all of it. The arrays keep Steam's
   order — that is what the hashes are taken over — and the sort happens
   here, on the way to the screen.

   `numeric` so "2D Fighter" comes before "3D Fighter" and "4X" rather
   than after both, and `sensitivity: 'base'` so "eSports" files under E
   with everything else instead of after "Word Game". */
function steamSectionTags(sec) {
  const drop = new Set(STEAM_SOFTWARE_TAG_IDS);
  return (sec.tags || [])
    .filter(pair => !drop.has(pair[0]))
    .sort((a, b) => a[1].localeCompare(b[1], 'en', { numeric: true, sensitivity: 'base' }));
}

/* Every tag the title carries, deduped, in the wizard's own section order —
   which is what the twenty-tag cap counts. */
function steamWizardTags() {
  const a = state.steamSubmitAnswers;
  const seen = new Set();
  const out = [];
  STEAM_TAG_SECTIONS.forEach(s => (a[s.key] || []).forEach(label => {
    if (!seen.has(label)) { seen.add(label); out.push(label); }
  }));
  return out;
}

/* ══ THE TWENTY IS ENFORCED, NOT ANNOUNCED (v9.16) ════════════════════════
   `maxTags` is Steam's cap on the tags a title carries, and until now the
   card stated it at its foot and let you sail past. These three are what
   every control asks before it lets a tag on, so the pill that greys out
   and the handler that refuses are deciding the same thing from the same
   code rather than each carrying its own arithmetic.

   COUNTED THE WAY steamWizardTags COUNTS — deduped across sections. Several
   tags sit in more than one of Steam's lists and Steam counts each once, so
   ticking a label you already carry elsewhere costs nothing and must not be
   refused at the cap.

   It asks about a PROSPECTIVE answer rather than a tag, because the one
   control that does not simply add — the top tier, where a third press
   evicts the older of two — can be at the cap and still have a legal
   press. */
function steamTagsOverMax(field, nextArr) {
  const a = state.steamSubmitAnswers || {};
  const seen = new Set();
  STEAM_TAG_SECTIONS.forEach(s =>
    (s.key === field ? nextArr : (a[s.key] || [])).forEach(l => seen.add(l)));
  return seen.size > STEAM_TAG_TOTAL_MAX;
}
/* What a press on a top-level genre would leave behind: off if it is on, on
   if it is not, and a third press drops the older of the two. */
function steamTopGenreNext(g) {
  const cur = ((state.steamSubmitAnswers || {}).topGenres || []).slice();
  const i = cur.indexOf(g);
  if (i >= 0) { cur.splice(i, 1); return cur; }
  cur.push(g);
  while (cur.length > 2) cur.shift();
  return cur;
}
/* Would that press be refused? A press that REMOVES never is, however far
   over the title already sits. */
function steamTopGenreBlocked(g) {
  return !((state.steamSubmitAnswers || {}).topGenres || []).includes(g)
      && steamTagsOverMax('topGenres', steamTopGenreNext(g));
}

const STEAM_AI_LIVE_TYPES = ['Code','Text','Textures','3D Models','Sound Effects','Music','Voice','Other'];

/* ══ ACCESSIBILITY, IN STEAM'S OWN FOUR GROUPS (v8.93) ═══════════
   The nineteen features were already exactly Steam's; what this card did
   not have was the grouping the Accessibility wizard presents them in.
   Read off partner.steamgames.com/doc/accessibility_features: Gameplay,
   Audio, Visual, Input, in that order. Nineteen ungrouped checkboxes is a
   list to get through; four short groups is a form. */
/* ══ SUPPORTED FEATURES (v9.01) ══════════════════════════════════════════
   Steamworks' own Supported Features list, read off the store-page editor
   (partner.steamgames.com/admin/game/edit — the .feature_options_list
   block under the "Supported Features" heading). Nineteen rows there;
   seventeen here, Remote Play on Phone and Remote Play on Tablet left out
   by request.

   `id` IS STEAM'S OWN CATEGORY ID, taken from each row's checkbox name
   (app[classification][category][category_NN]). That is the same number
   /game's `categories` array carries, which is what makes the scrape a
   lookup rather than a guess at matching display names — the mistake the
   player seed has to work around, where "DualShock Controller Support"
   arrives under two different ids.

   `desc` IS THE PORTAL'S OWN SENTENCE, verbatim, with only the trailing
   "Go to X configuration" link dropped. Asked for directly, and it is the
   right call anyway: a paraphrase of a rule teaches the rule wrong.

   ── THE ORDER IS THE STORE PAGE'S, AND IT IS ONLY PARTLY MEASURED ──────
   Steam does not print these in the editor's order. The spine below comes
   from Steam's own "Narrow by feature" facet (store.steampowered.com/
   search), which agreed with the print order everywhere the two overlap,
   and from eight product pages read for this version:

     Portal 2 (620)        22 29 13 30 23 15 17 14 41 42 43 44 62
     Team Fortress 2 (440) 22 29 13 30 35 15 17 14 41 42
     Civilization VI       22 29 30 35 32 42 44 62
     Warframe (230410)     22 29 30 35 41 42 43 61
     Cyberpunk 2077        22 29 23 61 62
     God of War Ragnarök   22 23 61 62
     The Last of Us Pt I   22 29 23 43 62
     Hades II (1145350)    22 29 13 23 62

   THREE PLACEMENTS ARE INFERRED, not measured, because no page surveyed
   declared the feature alongside the ones that would pin it. They are
   marked `guessed: true` below so the next person knows which lines to
   doubt: Steam Workshop (for Steam China), Steam Leaderboards and
   Includes Source SDK. Steam China sits beside Workshop and Leaderboards
   beside Stats because they are the same feature's siblings; Source SDK
   is where the facet puts it, between Cloud and Remote Play. In-App
   Purchases vs Steam Cloud, and Turn Notifications vs Stats, are also
   unproven — no page carried both — so those two adjacencies follow the
   facet and the Civ VI/TF2 constraints and nothing stronger. */
/* NO INTRO PARAGRAPH (v9.02, by request). The portal prints one above
   this list; the constant that carried it is gone rather than left
   unused, so nobody re-adds it by finding it here. */

const STEAM_SUPPORTED_FEATURES = [
  { id: '22', label: 'Steam Achievements', icon: '\u{1F3C6}',
    desc: 'Must first implement and release Steam Achievements.' },
  { id: '29', label: 'Steam Trading Cards', icon: '\u{1F0CF}',
    desc: 'Only select this category if you have uploaded, reviewed, and published Steam Trading Cards and badges.' },
  { id: '13', label: 'Captions available', icon: '\u{1F4AC}',
    desc: "Captions are intended for hearing impaired, where text shown on screen should include description of noises, music, and sound effects. If your game has subtitles, please indicate that above under 'Supported languages'" },
  { id: '30', label: 'Steam Workshop', icon: '\u{1F6E0}',
    desc: 'Must first configure Steam Workshop for your game and make use of Steam Workshop APIs to share user-generated content.' },
  { id: '51', label: 'Steam Workshop (for Steam China)', icon: '\u{1F6E0}', guessed: true,
    desc: 'Only for games distributed via Steam China and making use of that version of Steam Workshop.' },
  { id: '23', label: 'Steam Cloud', icon: '\u2601',
    desc: 'Must first enable and test Steam Cloud.' },
  { id: '35', label: 'In-App Purchases', icon: '\u{1F6D2}',
    desc: "You must select this if there is additional content available for purchase within your game that isn't surfaced on the Steam Store." },
  { id: '32', label: 'Steam Turn Notifications', icon: '\u{1F514}',
    desc: 'Only select this category if your game is making use of the Steam Turn Notification APIs.' },
  { id: '15', label: 'Stats', icon: '\u{1F4CA}',
    desc: 'This feature describes games that make use of Steamworks stat reporting. Must be accompanied by configuring Steam Stat Reporting.' },
  { id: '25', label: 'Steam Leaderboards', icon: '\u{1F947}', guessed: true,
    desc: 'Only select this category if your game is making use of the Steam Leaderboard APIs.' },
  { id: '16', label: 'Includes Source SDK', icon: '\u{1F9F0}', guessed: true,
    desc: "This category only applies to games that are built on Valve's Source Engine." },
  { id: '17', label: 'Includes level editor', icon: '\u{1F9F1}',
    desc: "You can select this category if your game includes a level editor for players to create or modify levels for the game. It can be part of your game, or provided as a 'tool' app as a separate install." },
  { id: '14', label: 'Commentary available', icon: '\u{1F399}',
    desc: 'This feature is intended to communicate when your game offers a special mode for players to discover developer commentary within the game.' },
  { id: '43', label: 'Remote Play on TV', icon: '\u{1F4FA}',
    desc: 'Setting this feature means that you have tested streaming your game to a TV, your application has full controller support, and you use large fonts and UI elements suitable for viewing at a distance on a TV.' },
  { id: '44', label: 'Remote Play Together', icon: '\u{1F4E1}',
    desc: 'Setting this feature means that your game allows players to invite their Steam friends to play with them via streaming. One instance of the game runs on the host machine while other friends connect their controllers and view the game through the Internet.' },
  /* STEAM DRAWS "HDR" AS LETTERS, not a picture — verified on God of War
     Ragnarök's own Features list, where the icon column reads HDR. There
     is no emoji for it and inventing one (a rainbow?) would say something
     the store page does not. */
  { id: '61', label: 'HDR available', icon: 'HDR', iconText: true,
    desc: 'Setting this feature means that your game supports HDR output (HDR10 (PQ)/scRGB) to supported HDR displays. Games that render internally as HDR and tonemap to SDR should not set this.' },
  { id: '63', label: 'Steam Timeline', icon: '\u23F1',
    desc: 'Select this feature if your game makes use of the Timeline Markers APIs.' },
];

/* THE TWO LEFT OUT, by request — kept as ids rather than deleted so the
   scrape can say "known, and deliberately not offered" instead of
   silently dropping a category it did not recognise. */
const STEAM_SUPPORTED_EXCLUDED = ['41', '42'];   // Remote Play on Phone / on Tablet

/* The chosen features as objects, in the store page's order. One accessor
   so the Technical section, the preview and any test agree about what is
   selected and in what order. */
function steamSupportedSelected(ids) {
  const picked = new Set((ids || []).map(String));
  return STEAM_SUPPORTED_FEATURES.filter(f => picked.has(f.id));
}

const STEAM_ACCESS_CATEGORIES = [
  { id: 'gameplay', label: 'Gameplay' },
  { id: 'audio',    label: 'Audio'    },
  { id: 'visual',   label: 'Visual'   },
  { id: 'input',    label: 'Input'    },
];

const STEAM_ACCESSIBILITY_FEATURES = [
  { id: 'adj_difficulty', cat: 'gameplay',  label: 'Adjustable Difficulty',          desc: 'Difficulty settings allow players to match their experience to their abilities' },
  { id: 'save_anytime', cat: 'gameplay',    label: 'Save Anytime',                   desc: 'Players can save at any point in the game' },
  { id: 'custom_volume', cat: 'audio',   label: 'Custom Volume Controls',         desc: 'Volume for different audio types can be adjusted independently' },
  { id: 'narrated_menus', cat: 'audio',  label: 'Narrated Game Menus',            desc: 'Players can listen to game menus with narrated audio' },
  { id: 'stereo_sound', cat: 'audio',    label: 'Stereo Sound',                   desc: 'Players can identify how far left or right sounds are coming from' },
  { id: 'surround_sound', cat: 'audio',  label: 'Surround Sound',                 desc: 'Players can identify direction of sounds in any direction' },
  { id: 'adj_text_size', cat: 'visual',   label: 'Adjustable Text Size',           desc: 'Players can adjust in-game text, menu text, subtitles' },
  { id: 'subtitle_opts', cat: 'visual',   label: 'Subtitle Options',               desc: 'Players can customize subtitle display including background opacity, text color and size' },
  { id: 'color_alt', cat: 'visual',       label: 'Color Alternatives',             desc: "Gameplay doesn't rely on colors, or players can adjust distinguishing colors" },
  { id: 'contrast', cat: 'visual',        label: 'Contrast Controls',              desc: 'Contrast is adjustable, e.g., dark/light mode' },
  { id: 'camera_comfort', cat: 'visual',  label: 'Camera Comfort',                 desc: 'Players can adjust or disable screen shaking, camera bob, motion blur' },
  { id: 'no_vision', cat: 'visual',       label: 'Playable without Vision',        desc: 'Players can play fully without ever seeing the screen' },
  { id: 'keyboard_only', cat: 'input',   label: 'Keyboard Only Option',           desc: 'Game can be played with just a keyboard' },
  { id: 'mouse_only', cat: 'input',      label: 'Mouse Only Option',              desc: 'Game can be played with just a mouse' },
  { id: 'touch_only', cat: 'input',      label: 'Touch Only Option',              desc: 'Game can be played with just touch controls' },
  { id: 'no_qte', cat: 'input',          label: 'Playable without Quick Time Events', desc: 'Players can avoid sequences of precisely timed inputs' },
  { id: 'own_pace', cat: 'input',        label: 'Playable at Your Own Pace',      desc: 'Players can take as long as they need for any input' },
  { id: 'chat_tts', cat: 'input',        label: 'Chat Text-to-speech',            desc: 'Text chat between players can be narrated out loud in real time' },
  { id: 'chat_stt', cat: 'input',        label: 'Chat Speech-to-text',            desc: 'Voice chat between players can be read as text transcript in real time' },
];

/* ══ THE STORE PAGE HAS ITS OWN ORDER, TWICE OVER (v9.00) ════════════════
   Both the categories and the features inside them are printed in an
   order of Valve's choosing, and it is not STEAM_ACCESSIBILITY_FEATURES'
   order above. Taken from Steam's own "Narrow by accessibility feature"
   facet (store.steampowered.com/search), which lists all nineteen under
   the four category headings — the canonical list, rather than whatever
   subset one game happens to declare — and checked against two product
   pages that print a subset of it: God of War Ragnarök (2322010), which
   declares all four categories, and The Last of Us Part I (1888930),
   which declares three. All three agree.

   Where it differs from the array above, which was the first guess and
   was wrong three times out of four:
     Visual  puts Contrast Controls LAST, after Playable without Vision
     Audio   puts Narrated Game Menus LAST, after Stereo and Surround
     Input   puts Playable without Timed Input FIRST, and Your Own Pace last

   ONE FEATURE, TWO NAMES. The facet calls id 74 "Playable without Timed
   Input"; the product page calls the same thing "Playable without Quick
   Time Events" and links it to /category/playable_without_timed_input.
   The preview prints a product page, so it keeps the product page's
   wording, which is the label the array already carries. */
const STEAM_ACCESS_STORE_ORDER = [
  { id: 'gameplay', features: ['adj_difficulty', 'save_anytime'] },
  { id: 'visual',   features: ['adj_text_size', 'subtitle_opts', 'color_alt',
                               'camera_comfort', 'no_vision', 'contrast'] },
  { id: 'audio',    features: ['custom_volume', 'stereo_sound', 'surround_sound',
                               'narrated_menus'] },
  { id: 'input',    features: ['no_qte', 'keyboard_only', 'mouse_only', 'touch_only',
                               'chat_stt', 'chat_tts', 'own_pace'] },
];

/* The declared features grouped the way the store page groups them:
   [{ id, label, features: [feature, ...] }], categories with nothing in
   them left out entirely. Takes the id list
   (state.steamSubmitAnswers.accessibilityFeatures) so the preview and any
   test ask the same question of the same data. */
function steamAccessStoreGroups(ids) {
  const picked = new Set(ids || []);
  return STEAM_ACCESS_STORE_ORDER.map(ord => {
    const cat = STEAM_ACCESS_CATEGORIES.find(c => c.id === ord.id) || { id: ord.id, label: ord.id };
    const features = ord.features
      .filter(fid => picked.has(fid))
      .map(fid => STEAM_ACCESSIBILITY_FEATURES.find(f => f.id === fid))
      .filter(Boolean);
    return { id: cat.id, label: cat.label, features };
  }).filter(g => g.features.length);
}

/* How many the collapsed row says. The store prints the TOTAL across every
   category, not the number of categories. */
function steamAccessDeclaredCount(ids) {
  return steamAccessStoreGroups(ids).reduce((n, g) => n + g.features.length, 0);
}

/* ── State factory ──────────────────────────────────── */
/* ── READING /game's requirements (v8.86) ────────────────────────────────
   search.dev.shipmate.gg returns the requirements already flattened out of
   Steam's HTML into plain text, which is the whole reason this is twenty
   lines rather than an HTML parse. One column looks like:

     "Minimum: \n• OS *: Windows 7\n• Processor: 2.6 GHz Intel Quad Core
      \n• Memory: 2 GB RAM\n• DirectX: Version 11"

   A "Minimum: " or "Recommended: " prefix, then one line per field, each
   "• Label: value". Surveyed across eight games (Cyberpunk 2077, RDR2,
   GTA V, Counter-Strike 2, Portal 2, Stardew Valley, PEAK, Tape To Tape),
   and three things that survey turned up are handled here rather than
   discovered later:

     - "OS *", not "OS". Steam's asterisk marks a legacy or unsupported
       OS version, and it is part of the label, so a match on the label
       has to tolerate it. Tape To Tape is the one in the sample.
     - A LINE WITH NO COLON is Steam's bare 64-bit note, which has no
       label because on the store page it has no <strong>. It sets the
       flag rather than becoming a field with an empty name.
     - A label Shipmate has no row for is kept, appended to Additional
       Notes. Dropping it silently would lose, for instance, "VR Support"
       — and the notes row is where Steam itself puts the leftovers. */
/* ══ ONE ROW'S ANSWER, AS THE STORE PAGE PRINTS IT (v8.93) ══════════
   The portal stores a size as a number and a unit and a network as a
   tick, and the store page prints both as a line of text. Everything
   downstream of the form — the preview's own requirements block, and the
   translation onto Epic's free-text boxes — wants that line, so it is
   written once here rather than three times badly. An empty row returns
   an empty string, which every caller already treats as "not answered". */
function steamSysreqText(rowId, value) {
  const row = STEAM_SYSREQ_ROWS.find(r => r.id === rowId);
  if (!row) return (value == null) ? '' : String(value).trim();
  if (row.kind === 'size') {
    const a = value && String(value.amount || '').trim();
    if (!a) return '';
    /* "8 GB RAM", not "8 GB". The portal stores a number and a unit and
       Steam appends the noun when it prints the Memory line — caught by
       egs887, which had Epic's box carrying the store page's own wording
       and started getting the bare size instead. Disk Space gets no
       suffix: Steam prints "70 GB available space" only when the
       developer typed that into Additional Notes. */
    return a + ' ' + ((value && value.units) || 'GB') + (row.id === 'memory' ? ' RAM' : '');
  }
  if (row.kind === 'check') return value ? row.check : '';
  return (value == null) ? '' : String(value).trim();
}

/* Row id → the shorter label Steam prints on the store page. */
const STEAM_SYSREQ_STORE_LABEL = {
  os: 'OS', storage: 'Storage', vr: 'VR Support',
};

/* Store-page label → row id, for the three Steam shortens when printing. */
const STEAM_STORE_LABELS = {
  'os': 'os', 'storage': 'storage', 'vr support': 'vr',
  'additional notes': 'notes', 'directx': 'directx',
};

function parseSteamReqColumn(text) {
  const out = { bits64: false, fields: {}, extra: [] };
  if (!text || typeof text !== 'string') return out;
  /* Everything after the first newline; the prefix is the column's own name
     and is already known by the caller. */
  const body = text.indexOf('\n') >= 0 ? text.slice(text.indexOf('\n') + 1) : '';
  body.split('\n').forEach(raw => {
    const line = raw.replace(/^\s*[•\u2022]\s*/, '').trim();
    if (!line) return;
    const i = line.indexOf(':');
    if (i < 0) {
      if (/64-bit/i.test(line)) out.bits64 = true;
      else out.extra.push(line);
      return;
    }
    const label = line.slice(0, i).replace(/\*/g, '').trim().toLowerCase();
    const value = line.slice(i + 1).trim();
    if (!value) return;
    /* The STORE page's labels, which are not all the PORTAL's: Steam
       prints "OS" for the field Steamworks calls "OS Version", "Storage"
       for "Disk Space", and "VR Support" for "VR Devices and Support".
       Matched on either, so a scrape keeps working now that the rows
       carry the portal's wording. */
    const row = STEAM_SYSREQ_ROWS.find(r =>
      r.label.toLowerCase() === label || (STEAM_STORE_LABELS[label] === r.id));
    if (!row) { out.extra.push(line); return; }
    if (row.kind === 'size') {
      /* "8 GB RAM" / "70 GB available space" → the amount and unit the
         portal stores separately. Anything it cannot split stays whole in
         the amount box rather than being dropped. */
      const m = /^(\d+(?:\.\d+)?)\s*(MB|GB)\b/i.exec(value);
      out.fields[row.id] = m ? { amount: m[1], units: m[2].toUpperCase() }
                             : { amount: value, units: 'GB' };
    } else if (row.kind === 'check') {
      out.fields[row.id] = true;
    } else {
      out.fields[row.id] = value;
    }
  });
  return out;
}

/* One platform's pair of columns into one tab's answers. Returns null when
   there is nothing in it, so the caller can tell "Steam has no Mac
   requirements" from "Steam says Mac needs an M1" — the endpoint spells the
   first of those two different ways depending on the game (an empty object,
   or the key missing altogether), and both arrive here as null. */
function steamReqTabFromApi(platformValue) {
  if (!platformValue || typeof platformValue !== 'object') return null;
  const min = parseSteamReqColumn(platformValue.minimum);
  const rec = parseSteamReqColumn(platformValue.recommended);
  const any = Object.keys(min.fields).length || Object.keys(rec.fields).length
           || min.bits64 || rec.bits64;
  if (!any) return null;
  const col = (p) => {
    /* Start from a blank column so every row has the shape its control
       expects, then lay the parsed answers over it. */
    const c = {};
    STEAM_SYSREQ_ROWS.forEach(r => {
      const v = p.fields[r.id];
      c[r.id] = v !== undefined ? v
              : r.kind === 'size'  ? { amount: '', units: 'GB' }
              : r.kind === 'check' ? false
              : '';
    });
    if (p.extra.length) {
      c.notes = [c.notes, ...p.extra].filter(Boolean).join(' ').slice(0, STEAM_SYSREQ_MAX);
    }
    return c;
  };
  return { supported: 'yes', bits64: !!(min.bits64 || rec.bits64),
           minimum: col(min), recommended: col(rec) };
}

/* ══ THE SAME SCRAPE, READ ONTO EPIC'S FORMS (v8.87) ═══════════════
   v8.86 taught Shipmate to read /game's requirements, categories and legal
   notice onto Steam's own sections. Epic asks three of the same questions
   on its Store Page Preview — Specifications, Features and Legal — and a
   developer who has already picked their Steam title should not type the
   answers a second time.

   THE TWO FORMS ARE NOT THE SAME SHAPE, and the gaps below are why these
   are translators rather than copies:

     - Epic has TWO operating systems, Windows and Mac. Steam has three,
       and a game's Linux requirements have nowhere to land here, so they
       are dropped rather than crammed into a tab that means Mac.
     - Epic has no Network row. Steam's network line, its own notes and
       anything it labelled with a heading Epic does not have all collect
       in that operating system's OWN Additional notes box, each prefixed
       with the column it came from. (Until v8.88 Epic kept one notes box
       for the whole section and a leftover had to name its OS as well;
       the portal's form has one per tab, so they no longer do.)
     - Epic's DirectX is a closed set of four pills, not a text box, so
       "Version 12" has to become "DirectX 12" or it cannot be stored at
       all — a value outside the four would draw no pill and look like a
       row nobody filled in.
     - Steam's bare 64-bit line is a convention of Steam's own page
       furniture, not a field. Epic's OS box carries the bitness inside the
       string a developer types ("Windows 10 64-bit" is the portal's own
       example), so the flag is dropped rather than invented into a row. */
const STEAM_TO_EGS_SPEC_ROW = {
  os: 'os', cpu: 'cpu', memory: 'memory', gpu: 'gpu',
  directx: 'directx', storage: 'storage', sound: 'sound',
  /* network, vr and notes have no Epic row and collect in its one
     Additional notes box — see egsSpecOsFromSteamTab's leftovers. */
};

/* "Version 12", "Version 9.0c", "DirectX 11" → one of EGS_DIRECTX_VERSIONS,
   or null when the major version is not one Epic offers. Null rather than a
   guess: an unmatched pill row is honestly empty, and a wrong one is a
   claim the developer never made. */
function egsDirectxFromSteam(value) {
  const m = /(\d+)/.exec(String(value || ''));
  if (!m) return null;
  const want = 'DirectX ' + m[1];
  return EGS_DIRECTX_VERSIONS.indexOf(want) >= 0 ? want : null;
}

/* One Steam tab (as steamReqTabFromApi returns it) onto one Epic OS block.
   Returns { spec, leftovers } — the caller folds the leftovers into the
   section's single Additional notes box, because this function cannot know
   what the other operating system is about to add to it. */
function egsSpecOsFromSteamTab(tab, osLabel) {
  if (!tab) return null;
  const spec = makeBlankEgsSpecOs();
  spec.supported = true;
  const leftovers = [];
  [['minimum', 'min'], ['recommended', 'rec']].forEach(([from, to]) => {
    const col = tab[from] || {};
    Object.keys(col).forEach(sid => {
      /* Flattened through steamSysreqText since v8.93: Epic's boxes are
         free text, and Steam's memory and disk space are a number and a
         unit by then. */
      const raw = steamSysreqText(sid, col[sid]);
      if (!raw) return;
      const eid = STEAM_TO_EGS_SPEC_ROW[sid];
      if (!eid) {
        /* Network and Additional Notes, the two rows Steam has and Epic
           does not. Named by OS and column so the notes box reads as a
           list of leftovers rather than one contradictory machine. */
        const row = STEAM_SYSREQ_ROWS.find(r => r.id === sid);
        leftovers.push((to === 'min' ? 'Minimum' : 'Recommended')
                       + ' — ' + ((row && row.label) || sid) + ': ' + raw);
        return;
      }
      if (eid === 'directx') {
        const dx = egsDirectxFromSteam(raw);
        if (dx) spec.directx[to] = dx;
        else leftovers.push('DirectX: ' + raw);
        return;
      }
      spec[eid][to] = raw.slice(0, EGS_SPEC_MAX);
    });
  });
  return { spec, leftovers };
}

/* ── Steam's categories onto Epic's ten Features ─────────────────────
   Epic's list is closed and short, so this is many-to-few: one Steam
   category can answer two of Epic's (Online PvP is both Online Multiplayer
   and Competitive), and several Steam categories have no Epic answer at
   all. Two judgement calls worth naming, since neither is forced:

     - LAN IS NEITHER (changed in v8.88, by request). v8.87 read a LAN
       game as Local Multiplayer on the grounds that it is not played over
       the internet. Epic's Local Multiplayer means players at one machine,
       which a LAN game is not, so the two Steam LAN rows now answer only
       the question they really do answer — whether the play is
       competitive or cooperative — and leave the where to the rows that
       state it.
     - A BARE "Multi-player" SEEDS NOTHING. It says there is more than one
       player without saying where they are, and Epic has no feature that
       means only that. Steam almost always ships the breakdown alongside
       it, and those rows are the ones that answer the question. */
const STEAM_CATEGORY_TO_EGS_FEATURES = {
  'Single-player':              ['Single Player'],
  'Online PvP':                 ['Online Multiplayer', 'Competitive'],
  'Online Co-op':               ['Online Multiplayer', 'Co-op'],
  'Online Multi-Player':        ['Online Multiplayer'],
  'LAN PvP':                    ['Competitive'],
  'LAN Co-op':                  ['Co-op'],
  'Local Multi-Player':         ['Local Multiplayer'],
  'Local Co-op':                ['Local Multiplayer', 'Co-op'],
  'Shared/Split Screen':        ['Local Multiplayer'],
  'Shared/Split Screen PvP':    ['Local Multiplayer', 'Competitive'],
  'Shared/Split Screen Co-op':  ['Local Multiplayer', 'Co-op'],
  'PvP':                        ['Competitive'],
  'Co-op':                      ['Co-op'],
  'MMO':                        ['MMO'],
  'Cross-Platform Multiplayer': ['Cross Platform'],
  'Full controller support':    ['Controller Support'],
  'Partial Controller Support': ['Controller Support'],
  'Tracked Controller Support': ['VR'],
  'VR Supported':               ['VR'],
  'VR Only':                    ['VR'],
  'VR Support':                 ['VR'],
};

/* ── Steam's links onto Epic's Social Links (v8.88) ──────────────────
   /game returns the row of links Steam prints beside the store page as
   [{name, url}] — the same array _applySteamSocialLinks already puts on
   the marketing page — and Epic asks for twelve of the same services by
   name on its Social Links form.

   MATCHED ON THE HOST, NOT THE NAME. A link's name is whatever the
   developer typed into Steamworks ("Official Site", "Our Discord", "公式
   サイト"), and Steam does not constrain it; the host is set by the
   service and is the same for everyone. The name is still read, but only
   as a fallback for a host this table does not know.

   THE WEBSITE BOX IS THE LEFTOVER, deliberately. Anything whose host is
   none of the eleven services is the game's own site far more often than
   it is anything else, and Epic's first box is exactly that — but only
   the FIRST such link takes it, because a page with three unrecognised
   links has not told us which one is the home page. */
const STEAM_LINK_HOST_TO_EGS = {
  'x.com': 'twitter', 'twitter.com': 'twitter',
  'facebook.com': 'facebook', 'fb.com': 'facebook',
  'instagram.com': 'instagram',
  'twitch.tv': 'twitch',
  'discord.gg': 'discord', 'discord.com': 'discord', 'discordapp.com': 'discord',
  'vk.com': 'vkontakte', 'vkontakte.ru': 'vkontakte',
  'youtube.com': 'youtube', 'youtu.be': 'youtube',
  'reddit.com': 'reddit',
  'naver.com': 'naver',
  'youku.com': 'youku',
  'weibo.com': 'weibo', 'weibo.cn': 'weibo',
};
/* Only for a host the table above missed. Tested against the LOWERCASED
   name, as a word, so "Our Discord server" matches and "Discordant
   Soundtrack" does not. */
const STEAM_LINK_NAME_TO_EGS = [
  [/\b(x|twitter)\b/,            'twitter'],
  [/\bfacebook\b/,               'facebook'],
  [/\binstagram\b/,              'instagram'],
  [/\btwitch\b/,                 'twitch'],
  [/\bdiscord\b/,                'discord'],
  [/\b(vk|vkontakte)\b/,         'vkontakte'],
  [/\byoutube\b/,                'youtube'],
  [/\breddit\b/,                 'reddit'],
  [/\bnaver\b/,                  'naver'],
  [/\byouku\b/,                  'youku'],
  [/\bweibo\b/,                  'weibo'],
  [/\b(website|home\s*page|official\s*site)\b/, 'website'],
];

/* "www.youtube.com" and "m.youtube.com" are youtube.com; "cafe.naver.com"
   is naver.com. Everything is matched on the last two labels, which is
   what makes one row in the table cover a service's subdomains. */
function steamLinkHost(url) {
  let h = '';
  try { h = new URL(String(url)).hostname.toLowerCase(); }
  catch (e) {
    const m = /^(?:[a-z]+:)?\/\/([^\/?#]+)/i.exec(String(url || ''));
    h = m ? m[1].toLowerCase() : '';
  }
  h = h.replace(/^www\./, '');
  const parts = h.split('.');
  /* co.uk and com.br would otherwise collapse to the registry itself. */
  if (parts.length > 2) {
    const last2 = parts.slice(-2).join('.');
    const last3 = parts.slice(-3).join('.');
    return /^(co|com|net|org|ac|gov)\.[a-z]{2}$/.test(last2) ? last3 : last2;
  }
  return h;
}

function egsSocialFromSteamLinks(links) {
  const out = {};
  let tookWebsite = false;
  (Array.isArray(links) ? links : []).forEach(l => {
    const url = l && String(l.url || '').trim();
    if (!url) return;
    const name = String((l && l.name) || '').toLowerCase();
    let id = STEAM_LINK_HOST_TO_EGS[steamLinkHost(url)] || null;
    if (!id) {
      const hit = STEAM_LINK_NAME_TO_EGS.find(([re]) => re.test(name));
      id = hit ? hit[1] : null;
    }
    if (!id) {
      if (tookWebsite) return;
      id = 'website';
      tookWebsite = true;
    }
    /* First one wins: Steam lets a page carry two YouTube links and Epic
       has one box, and the first is the one the developer put first. */
    if (!out[id]) out[id] = url;
  });
  return out;
}

/* Epic's own order, not Steam's: the Features picker lists EGS_FEATURES
   alphabetically and a seeded set that arrived in Steam's order would read
   as shuffled next to it. */
function egsFeaturesFromSteamCategories(names) {
  const out = [];
  (names || []).forEach(n => {
    (STEAM_CATEGORY_TO_EGS_FEATURES[n] || []).forEach(f => {
      if (EGS_FEATURES.indexOf(f) >= 0 && out.indexOf(f) < 0) out.push(f);
    });
  });
  return EGS_FEATURES.filter(f => out.indexOf(f) >= 0);
}

/* ══ STEAM'S GENRES, FOR THE TWO PAGES THAT ASK FOR GENRES (v9.17) ═══════
   /game's `genres` is an array of plain English strings in Steam's own
   genre vocabulary — the short, fixed, developer-assigned list, not the
   community tags Steam - Tags deals in. Read off the endpoint across
   fourteen titles before either of these was written: every value was one
   of the ten Steamworks offers a Game, plus "Free To Play" and "Early
   Access", which Steamworks sets elsewhere and keeps out of the Genres
   list for a Game. Nothing mature-content-ish ever appeared.

   NEITHER HELPER TRANSLATES A NAME, because neither has to. Nine of
   Steam's ten are spelled exactly as Epic spells them, and the tenth —
   Massively Multiplayer — has no Epic genre at all (MOBA is a different
   claim, not a synonym). So a filter against the list each page offers is
   the entire mapping, and a value neither list carries is dropped rather
   than guessed into something near it.

   Each returns its own page's order rather than Steam's, the way the
   Features seed does: a set that arrived in a foreign order reads as
   shuffled next to the list it was picked from. */
function steamInfoGenresFromSteam(genres) {
  const out = [];
  (genres || []).forEach(g => {
    const n = (typeof g === 'string') ? g.trim() : '';
    if (n && STEAM_INFO_GENRES.indexOf(n) >= 0 && out.indexOf(n) < 0) out.push(n);
  });
  return STEAM_INFO_GENRES.filter(g => out.indexOf(g) >= 0);
}
/* EPIC TAKES THREE, AND WHICH THREE IS ARBITRARY — measured, and worth
   saying plainly: Steam returns its genres ALPHABETICALLY, with Free To
   Play and Early Access appended, so there is no primary among them and
   nothing to rank by. Path of Exile arrives Action, Adventure, Indie,
   Massively Multiplayer, RPG and three of those five have to go.
   So: the first three Epic also offers, which is stable and defensible
   and not a judgement; the developer who wants a different three takes a
   chip off and picks one, which is what that control is for. */
function egsGenresFromSteam(genres) {
  const out = [];
  (genres || []).forEach(g => {
    const n = (typeof g === 'string') ? g.trim() : '';
    if (n && EGS_GENRES.indexOf(n) >= 0 && out.indexOf(n) < 0
        && out.length < EGS_GENRE_MAX) out.push(n);
  });
  return EGS_GENRES.filter(g => out.indexOf(g) >= 0);
}

function makeBlankSteamAnswers() {
  return {
    /* System requirements and the legal notice (v8.86). Both are printed on
       the store page; the requirements are a step of their own and the
       notice is typed on the page itself. */
    sysreq:      makeBlankSteamSysreq(),
    legalNotice: '',
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
    /* The Tag Wizard's seven taxonomy sections (v9.10). Labels, not ids —
       see STEAM_TAG_SECTIONS. The first three names are unchanged so
       everything that already reads them (the preview's tag chips, the
       submission card's risk check, v9.08's pills and pickers) keeps
       working. */
    topGenres:          [],
    genres:             [],
    subGenres:          [],
    visuals:            [],
    themeMood:          [],
    features:           [],
    playerTags:         [],
    /* Steam's own Genres checkbox list (STEAM_INFO_GENRES), which is the
       store form's question and NOT the Tag Wizard's top tier above
       (v8.93). Kept apart because Steam keeps them apart. */
    infoGenres:         [],
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
    /* Steamworks' Supported Features (v9.01) — Steam category ids, see
       STEAM_SUPPORTED_FEATURES. A real empty: [] means nobody has picked
       yet, which is what lets the scrape seed it without clobbering an
       answer (see _applySteamCategories, app.js). */
    supportedFeatures: [],
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
    // Localizations — a stub step, complete on first view. See
    // PLATFORMS.steam.steps for why it is a row rather than nothing, and
    // why Data Safety's flag went with its row in v8.89.
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
  /* THE STORE PAGE IS DONE WHEN ITS PAGE IS (v9.10). Jaco: "the store marks
     as done even if I just added one tag." It was visit-based — opening the
     preview once ticked the card's step — from when this page was a stub.
     It is the page now, with its own fifteen rows (sppRequiredElements,
     steam branch), so the step asks the same question Shippy's list does:
     every required row filled. Being seen is still required, as before. */
  if (sectionId === 'storePreviewPrototype') {
    if (!state.steamSubmitAnswers.storePreviewPrototypeSeen) return false;
    return typeof sppAllRequiredDone === 'function' ? sppAllRequiredDone('steam') : false;
  }
  /* Visit-based, because it is a stub — see PLATFORMS.steam.steps for why
     the row exists at all, and why "you have seen this" is the only claim a
     stub can honestly make yet. Kept out of the questionnaire roll-up below
     for isAndroidSectionComplete's own stated reason.
     (Data Safety was the other one and went in v8.89 with its row.) */
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
