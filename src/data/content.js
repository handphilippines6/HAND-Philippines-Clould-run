/*
 * hp-content.js - Organization content for the HAND design port.
 *
 * Derived from the approved design source (data/content.js). Image references
 * are rewritten from the design's local /img files to the verified Wix-hosted
 * photo keys in images.js (same media mapping the design itself used via
 * data/photoMap.js - see images.js for the perceptual-match provenance).
 * Field shapes are unchanged so views port 1:1 from the design pages.
 */
/**
 * HAND-Philippines — content layer.
 * Every string here is sourced from:
 *   - hand_philippines_details.md  (the content of record)
 *   - WEBSITE-STRUCTURE.md         (structure of record)
 *   - 01_SITE_MAP_PUBLIC_STRUCTURE.md (route + page specs)
 * Nothing is invented. Where a document says content is not yet available,
 * that is stated explicitly rather than filled in.
 */

export const org = {
  shortName: 'HAND-Philippines',
  name: 'HAND — PHILIPPINES',
  fullName: 'Health Assistance and Network Development',
  legalName: 'Health Assistance and Network Development-Philippines',
  tagline: 'Bayanihan in action for health equity in the Philippines',
  generalPrinciple:
    'A small, volunteer-run, homegrown nonprofit that came out of a grassroots movement to help calamity victims in 2014 and now champions small but tangible global health equity projects in the Philippines.',
  ein: '46-4698622',
  taxStatus: 'Registered through the IRS as a 501(c)3',
  taxExemption:
    'Donations are tax-exempt to the fullest extent allowed by federal and state law.',
  mailingAddress: {
    line1: 'HAND-Philippines',
    line2: 'PO Box 85',
    cityStateZip: 'Augusta, ME 04332',
    full: 'HAND-Philippines, PO Box 85, Augusta, ME 04332',
  },
  phone: '(207) 800-7270',
  phoneNote: 'call, VM or text',
  email: 'info@hand-philippines.org',
  partnershipsEmail: 'partnerships@hand-philippines.org',
  logoUrl:
    'https://static.wixstatic.com/media/f3ccce_4c66e381d4c849d193a9c5bef13537bd~mv2.jpg/v1/fill/w_50,h_50,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/sun_hand_r12_flagblue.jpg',
  social: [
    /* Only verified profiles are listed: no Instagram account is published yet. */
    { label: 'Facebook', url: 'https://www.facebook.com/handphilippinesorg/' },
  ],
  leadership: {
    name: 'Reynerio Lance Lanoy, MD, MPH, FACP',
    role: 'Co-Founder & President',
  },
};

/* ---- Opening page: Mission · Vision · Principles ---------------------- */
export const mission = {
  label: 'Health Assistance',
  text:
    'Uplifting the health and well-being of families affected by natural calamities in the Philippines through empowered, community-based healthcare.',
};

export const vision = {
  label: 'Network Development',
  text:
    'A network of resilient communities with self-sustaining healthcare that prioritizes holistic well-being as a catalyst for sustainable economic progress.',
};

export const principles = [
  {
    title: 'Inspired by the Bayanihan Spirit',
    text:
      'A concept deeply rooted in Filipino culture and tradition referring to the spirit of communal unity, cooperation, and helping one another in need.',
  },
  {
    title: 'Core values: generosity, compassion, and unity',
    text: 'The three values that guide how we work and how we show up for our partners.',
  },
  {
    title: 'Solidarity and social cohesion',
    text: 'Fostering a profound sense of solidarity and social cohesion within the community.',
  },
];

/* ---- Brief description of what we do --------------------------------- */
export const whatWeDo = [
  'Focus on helping communities recover and thrive after natural calamities',
  'Prioritize health and well-being of constituents',
  'Deliver community-based healthcare through Rural Health Units (RHUs)',
  'Involve community members, local health workers, and civic organizations in planning, delivering, and managing healthcare programs',
  'Prioritize repairing and rehabilitating RHUs and community childcare centers destroyed by natural calamities',
  'Provide technical expertise, financial support, essential equipment, medications, and supplies',
  'Work with US-based medical professionals through medical missions and telehealth consultations',
  'Organize under-five feeding programs and community childcare services',
  'Support early childhood education',
];

/* ---- Our Impact (2025–2026) — server-approved display metrics -------- */
export const impact = [
  { value: '216', label: 'Cataract surgeries', note: 'Nearly triple the previous year', tone: 'sun' },
  { value: '59', label: 'Major surgeries', note: 'A 146% increase in complex surgical care', tone: 'blue' },
  { value: '2,800', label: 'Patients served', note: 'Through outreach and medical missions', tone: 'blue' },
  { value: '10', label: 'Rural Health Units supported', note: 'Doubling their community footprint', tone: 'sun' },
  { value: '4', label: 'Hospital partnerships', note: 'Established to expand specialized surgical access', tone: 'blue' },
];

/* ---- Why medical missions matter (from Bohol) ------------------------- */
export const whyItMatters = [
  'In Bohol Province, average annual family income is $1,770 for a family of six',
  'Despite nationalized healthcare, coverage is limited',
  'Copay for cataract surgery at a subsidized government hospital: ~$1,000',
  'Major elective surgeries (cholecystectomies, hernia repairs): $1,500–$2,000',
  'Many low-income individuals forgo timely surgical treatment, leading to irreversible health consequences or death',
  'Common issues: farmers and fishermen losing sight in their fifties due to cataracts, working-age adults succumbing from untreated gallstone cholecystitis or intestinal gangrene from incarcerated hernia',
];

/* ---- Financial transparency & accountability -------------------------- */
export const financialTransparency = [
  'Executive leadership team operates purely on a volunteer basis',
  'Zero percent of donations goes toward administrative salaries',
  '100% of gifts directly fund medical shipments, operations, training, and clinic upgrades',
];

/* ---- Programs (active catalog only, per 01_SITE_MAP §3) ------------- */
/* Excluded per document: Community Food Sustainability, Scholarship (future) */
export const programs = [
  {
    slug: 'medical-missions-adopt-a-rhu',
    title: 'Medical Missions & Adopt-a-RHU',
    short: 'Medical Missions and Adopt-a-RHU',
    icon: 'stethoscope',
    tone: 'blue',
    summary:
      'Free medical, surgical, and dental care for underserved communities, paired with long-term support for village-level Rural Health Units.',
    cover: 'field-clinic',
    body: [
      {
        heading: 'Foreign Surgical and Medical Mission (FSMM)',
        points: [
          'Joint efforts between foreign medical professionals and local counterparts',
          'Provide free medical, surgical, dental, and other health-related services to underserved communities',
          'Regulated by the Philippines Department of Health (DOH) through the Bureau of International Health Cooperation',
          'Since 2014, HAND-Philippines has sent doctors, nurses, and other medical and non-medical volunteers from the US',
          'Community-based mobile clinics travel to 3–5 locations per trip',
          'Healthcare workers offer screening tests, essential treatments, and public health education programs',
          'Close partnership with Municipal Health Office (MHO) ensures follow-up care and referrals',
          'In 2024, embarked on first hospital-based FSMM for more complex surgeries (cholecystectomies, hernia repairs, thyroidectomies)',
        ],
      },
      {
        heading: 'Adopt-a-Rural Health Unit Program',
        points: [
          'Provides material, technological, and financial support to Rural Health Units (RHUs)',
          'RHUs are village-level health stations run by local government',
          'Targets RHUs in impoverished communities recovering from natural disasters',
          'Works closely with RHU staff, local officials, and stakeholders',
          'Identifies specific unmet needs within each community',
          'Support is tailored to address unique challenges',
          'Jointly develops plans, processes, and goals with local community partners',
          'Focuses on empowering RHUs and contributing to long-term sustainability',
        ],
      },
    ],
    ctas: ['donate', 'get-involved', 'contact'],
  },
  {
    slug: 'many-hands-lasting-change',
    title: 'Many Hands, Lasting Change',
    short: 'Many Hands, Lasting Change',
    icon: 'cargo',
    tone: 'sun',
    summary:
      'The PWH Cargo delivery program and similar endeavors — $340,000 of biomedical cargo delivered to equip hospitals and rural health centers.',
    cover: 'boat-equipment',
    body: [
      {
        heading: 'Overview',
        points: [
          'Delivers $340,000 worth of biomedical cargo to equip hospitals and rural health centers',
          'Enables local providers to deliver immediate care without patients traveling to distant referral centers',
          'Includes the PWH Cargo delivery program and similar endeavors',
        ],
      },
    ],
    ctas: ['donate', 'contact'],
  },
  {
    slug: 'vela-neonatal-resuscitation',
    title: 'Vela Neonatal Resuscitation',
    short: 'Vela Neonatal Resuscitation',
    icon: 'heart',
    tone: 'blue',
    summary:
      'Equipping birth centers with resuscitation equipment and training frontline workers to prevent newborn deaths.',
    cover: 'clinic-child',
    body: [
      {
        heading: 'Overview',
        points: [
          'Equips birth centers with resuscitation equipment',
          'Trains frontline workers to prevent newborn deaths',
        ],
      },
    ],
    ctas: ['donate', 'get-involved'],
  },
  {
    slug: 'disaster-response-rebuilding',
    title: 'Disaster Response & Rebuilding',
    short: 'Disaster Response & Rebuilding',
    icon: 'shield',
    tone: 'sun',
    summary:
      'Repairing and rehabilitating Rural Health Units and public schools, and mobilizing humanitarian aid after catastrophic disasters.',
    cover: 'community-kids',
    body: [
      {
        heading: 'Post-Calamity Repair and Rehabilitation Program',
        points: [
          'Works closely with governmental and non-governmental agencies',
          'Implements a comprehensive strategy to repair and rehabilitate RHUs and public schools',
          'Primary goal: restore essential infrastructure to greater resiliency from pre-disaster conditions',
          'Ensures impacted communities regain and maintain access to vital healthcare and educational services',
        ],
      },
      {
        heading: 'Post-Calamity Humanitarian Aid Program',
        points: [
          'After catastrophic natural disasters, promptly mobilizes local staff and resources',
          'Delivers crucial humanitarian aid and medical services to affected communities',
          'Collaborates with other local agencies to deploy scarce resources effectively',
        ],
      },
    ],
    ctas: ['donate', 'get-involved'],
  },
  {
    slug: 'educational-forums',
    title: 'Educational Forums',
    short: 'Educational Forums (Lecture Series)',
    icon: 'book',
    tone: 'blue',
    summary:
      'An annual educational symposium during medical missions that promotes continuing education and strengthens US–Philippine collaboration.',
    cover: 'health-seminar',
    body: [
      {
        heading: 'Lecture Series',
        points: [
          'Annual educational symposium during medical missions',
          'Promotes continuing education while strengthening collaboration between US and Philippine teams',
          'Topics include violence against women, community-level management of common psychiatric cases, HIV prevention, and basic life support / bystander CPR training',
        ],
      },
    ],
    ctas: ['get-involved', 'contact'],
  },
  {
    slug: 'academic-research',
    title: 'Academic & Research',
    short: 'Academic & Research',
    icon: 'cap',
    tone: 'sun',
    summary:
      'Global Health Rotation and Research Opportunities — clinical rotations and study support for students, volunteers, and partners.',
    cover: 'harbor-group',
    body: [
      {
        heading: 'Global Health Rotation — International Medical Student Rotation, Bohol',
        points: [
          'Four-week clinical rotation on the island of Bohol',
          'For third- and fourth-year medical students',
          'January 1st to 31st, 2027',
          'Rotates through regional and community hospitals, RHUs, and outreach clinics',
          'Travel by boat to small islands off the coast of Bohol',
          'Clinical experiences: outpatient primary care, inpatient medicine, emergency care, preventive health, maternal and child health, chronic disease management, and community health initiatives',
          'Learn about tropical medicine, public health, and cross-cultural communication',
          'Faculty mentors and local physicians provide supervision and guidance',
          'Emphasizes cultural humility, ethical global health engagement, teamwork, and service',
        ],
        contact: [
          { label: 'Dr. Thomas Shima', value: 'tridoc98@gmail.com' },
          { label: 'Andy Dolley', value: 'info@hand-philippines.org' },
        ],
      },
      {
        heading: 'Research Opportunities',
        points: [
          'Available for volunteers and partners',
          'Focus on healthcare outcomes and community health improvement',
        ],
      },
    ],
    ctas: ['get-involved', 'contact'],
  },
];

/* Excluded from the active catalog — retained so the exclusion is
   documented in code rather than silently dropped. */
export const excludedPrograms = [
  { title: 'Community Food Sustainability Program', reason: 'Not in the active catalog.' },
  { title: 'Scholarship', reason: 'Planned for the future — do not post yet.' },
];

/* ---- Medical Mission 2027 ------------------------------------------- */
export const medicalMission = {
  title: 'Medical Mission Trip 2027',
  dates: 'April 20 to April 30, 2027',
  location: 'Island province of Bohol, Philippines',
  contactName: 'Andy',
  contactPhone: '(207) 800-7270',
  volunteers:
    'Volunteers from across the United States and the Philippines',
  services:
    'Provides free medical, surgical, dental, pharmacy, emergency, and community health services',
  priority: 'Priority given to those on the 2026 waitlist',
  cover: 'tent-exam',
  generalInformation: [
    'Since 2014, partnered with Rural Health Units, district hospitals, and local healthcare professionals',
    'Expands access to life-changing care for patients who cannot afford it',
    'Fosters lasting friendships and professional partnerships between American and Filipino volunteers',
    'Volunteers include physicians, nurses, pharmacists, dentists, allied health professionals, students, and non-medical volunteers',
    'Encourages a peer-to-peer fundraising program',
  ],
  p2p: [
    'Volunteers are encouraged to raise support through the peer-to-peer fundraising program',
    'Helps provide free surgeries, medications, laboratory services, and other essential care for indigent patients',
  ],
  reservation: {
    note:
      'A reservation form is available through Andy. Priority is given to those on the 2026 waitlist for the 2027 trip.',
    phone: '(207) 800-7270',
  },
  teamBalance: {
    note: 'Participation is limited to maintain an effective balance of skills:',
    roles: [
      { role: 'Providers (Physicians, APPs, Dentists, Pharmacists, Residents & Fellows)', slots: 18 },
      { role: 'Nurses (ER, ICU, Medical-Surgical, PACU, OR)', slots: 24, note: 'Particularly need OR and PACU nurses' },
      { role: 'Other Medical (EMTs, Techs, Nursing Unit Assistants, etc.)', slots: 6 },
      { role: 'Non-Medical', slots: 4 },
      {
        role: 'Youth Volunteers (under 18 as of April 7, 2027, must be accompanied by a parent/adult)',
        slots: 22,
      },
    ],
  },
  schedule: [
    { date: 'April 20 (Tuesday)', title: 'Arrival Day', detail: 'Volunteers arrive and transfer to HAND Home Base in Bohol' },
    { date: 'April 21 (Wednesday)', title: 'Orientation, Team Building & Mission Preparation', detail: '' },
    { date: 'April 22 (Thursday)', title: 'Educational Lecture Day', detail: '' },
    {
      date: 'April 23, 24, 26, 27, 28',
      title: 'Medical Mission Work Days',
      detail: 'Two simultaneous mobile community clinic teams',
    },
    { date: 'April 25', title: 'Rest Day', detail: '' },
    { date: 'April 28 (Evening)', title: 'Stay near the worksite', detail: 'Anda Beach location' },
    { date: 'April 29 (Thursday)', title: 'Return to Home Base, Farewell Dinner', detail: '' },
    { date: 'April 30 (Friday)', title: 'Departure Day', detail: '' },
  ],
  serviceGoals: [
    { label: 'Mobile Clinics', detail: 'Two teams, each serving five Rural Health Units; goal to reach at least 3,000 patients' },
    { label: 'Rural Health Surgery Service', detail: 'Major surgeries for charity cases; goal to increase from 53 in 2026 to 70' },
    { label: 'Cataract Surgery Service', detail: 'Goal to exceed 216 surgeries from last year' },
    { label: 'Acute Care Service', detail: 'Partnering with a community hospital, staffing the emergency room and wards; goal to serve at least 300 ER patients and 50 inpatients' },
    { label: 'Community Health Education', detail: 'Seminars and training sessions on violence against women, psychiatric case management, HIV prevention, and CPR training' },
    { label: 'Electronic Medical Record System', detail: 'New implementation in 2027 with paper backup' },
  ],
  preparation: [
    'Approximately four weeks before traveling: role-specific educational materials, instructional videos, reading assignments',
    'Live Zoom Q&A sessions with medical mission leadership in the weeks leading up to departure',
    'In-person mission orientation focuses on hands-on practice, teamwork, and final preparation',
  ],
  expectations: [
    'Mission trips are designed to take care of volunteer needs and safety',
    'Focus on serving the sick',
    'A sense of fulfillment from uplifting lives halfway around the world',
    'Inspiration to champion the cause beyond the medical mission',
  ],
  airports: [
    { label: 'Primary airport', value: 'Cebu Mactan International Airport (CEB)' },
    {
      label: 'Alternative',
      value: 'Ninoy Aquino Manila International Airport (MNL) with a connecting flight to Bohol-Panglao International Airport (TAG)',
    },
  ],
  sponsorsNote: 'We highlight our sponsors who make each mission possible.',
  testimonialsNote:
    'Patient testimonials are not yet prominently displayed. Please contact us to speak with our patient community.',
};


/* ---- Events ---------------------------------------------------------- */
export const gala = {
  slug: 'gala-and-auction',
  name: '3rd Annual HAND-Philippines Gala: Bayaníhan',
  eventName: 'Gala and Auction',
  date: 'Saturday, November 7, 2026 at 6:30PM',
  location: 'Ocean Gateway, Portland, Maine',
  dressCode:
    'Black tie optional, formal attire, or traditional Filipiniana (mossy green theme color optional)',
  theme: 'Bayaníhan — the Filipino tradition of community cooperation',
  ticketPrice: '$175',
  ticketIncludes: 'Includes entry, dinner, and auction participation',
  activities: [
    'Dinner (gluten-free and vegan options)',
    'Complimentary beer and wine',
    'Specialty cocktails for purchase',
    'Auction',
    'Live music and dancing by the Laura Hudson Project',
  ],
  reservation: {
    label: 'Reservation System',
    detail: '$50 deposit due at checkout; remaining balance invoiced in October 2026',
    note: 'Deposits are nonrefundable',
  },
  taxDeductible:
    'A portion of the ticket is tax-deductible; an official tax receipt is provided via email',
  supports:
    '2027 initiatives including medical equipment for community hospitals in Bohol and training/resources for local midwives',
  cover: 'gala-dance',
  sponsorContact: [
    { label: 'Partnerships', value: 'partnerships@hand-philippines.org' },
    { label: org.leadership.name, value: org.leadership.role },
  ],
};

export const artAmongTheMeadows = {
  slug: 'art-among-the-meadows',
  name: 'Art Among the Meadows',
  status: 'Coming soon',
  description:
    'Art Among the Meadows is a community art sale where local artists and supporters come together to raise funds for HAND-Philippines programs. Detailed event information and the photo gallery are not yet available.',
  photoNote: 'The photo gallery for this event is not yet available.',
  howToInvolve:
    'Artists who would like to donate artwork can reach us through the contact form below. We will follow up with details about participation.',
  cover: 'hall-crowd',
};


/* ---- Our Story & Timeline ------------------------------------------- */
export const timeline = [
  {
    year: '2013',
    title: 'The ground shakes, the typhoon hits',
    tone: 'sun',
    cover: 'mission-banner',
    points: [
      'Fall: Philippines struck by a 7.2 magnitude earthquake and Super Typhoon Haiyan',
      'Local Filipino doctors and nurses formed grassroots medical humanitarian teams',
      'The Filipino diaspora in the US provided critical financial support',
      'Filipino doctors in Maine and California began collecting donations',
    ],
  },
  {
    year: '2014',
    title: 'The first volunteers land',
    tone: 'blue',
    cover: 'surgical-mission-group',
    points: [
      'April: Founders and volunteer American nurses traveled to the Philippines',
      'Established key partnerships with local governments and civic organizations',
      'Formed a cooperative network for longer-lasting projects',
    ],
  },
  {
    year: '2015',
    title: '501(c)3 status, and a focus on Tungod',
    tone: 'blue',
    cover: 'barrio-children',
    points: [
      'January: Attained 501(c)3 non-profit status',
      'Focused on Tungod, a densely populated coastal community in northern Bohol',
      'Contributed to repair and rehabilitation of a rural health station, a community childcare center, and a primary school',
      'Launched feeding programs for preschoolers in Tungod and two other villages',
    ],
  },
  {
    year: '2018',
    title: 'Adopt-a-Rural Health Unit begins',
    tone: 'sun',
    cover: 'surgical-mission-group',
    points: [
      'Initiated the Adopt-a-Rural Health Unit Program',
      'Sent medications and supplies to rural health stations serving Tungod and other impoverished communities',
    ],
  },
  {
    year: '2020–2021',
    title: 'Pandemic, then typhoon',
    tone: 'blue',
    cover: 'community-kids',
    points: [
      'COVID-19 pandemic: redirected efforts to combat food scarcity',
      'Started community gardens and provided seed capital for subsistence farmers and fishermen',
      'December 2021: Super Typhoon Rai struck the Philippines',
      'Activated the disaster response program and distributed water, food, and medications',
    ],
  },
  {
    year: '2023',
    title: 'A larger volunteer group',
    tone: 'blue',
    cover: 'volunteers-kids',
    points: [
      'May: Medical mission with an expanding volunteer group',
      'Revitalized the Adopt-a-Rural Health Unit Program',
    ],
  },
  {
    year: '2024',
    title: 'Hospital-based mission and rebuilding',
    tone: 'sun',
    cover: 'clinic-child',
    points: [
      'Aimed to resume repair and rehabilitation projects',
      'Expanded the community childcare program',
      'Strengthened the capacity of rural health stations',
      'Embarked on the first hospital-based FSMM for more complex surgeries',
    ],
  },
];

/* ---- Roster ----------------------------------------------------------- */
export const roster = {
  lead:
    'A volunteer-run network of Filipino-American doctors, nurses and professionals in Maine and California.',
  note:
    'HAND-Philippines is a volunteer-run organization with an expanding network of Filipino-American doctors, nurses, and professionals in Maine and California, collaborating with local clinics, government leaders, and civic organizations in the Philippines.',
  /*
   * Verified leadership (names, roles, and portraits taken from this
   * project's earlier about.js backup). Cards render photo + name + role;
   * each bio is retained for a future profile view.
   */
  groups: [
    {
      label: 'Board of Directors',
      people: [
        {
          name: 'James Trettin, M.D.',
          role: 'Board Chair',
          photo:
            'https://static.wixstatic.com/media/2f2616_aeff69ce084049afa0e9adcc48f60300~mv2.png/v1/fill/w_420,h_420,al_c,lg_1,q_85,enc_avif,quality_auto/James%20Trettin.png',
          bio: 'Emergency and family medicine physician with clinical experience in the United States and New Zealand. Serves HAND-Philippines through direct patient care and health education. Also volunteers with Doctors Without Walls.',
        },
        {
          name: 'Tom Shima, D.O.',
          role: 'Board Vice Chair',
          photo:
            'https://static.wixstatic.com/media/2f2616_31e18d8e440c486ab82a4c554b31a221~mv2.png/v1/crop/x_0,y_138,w_470,h_488/fill/w_486,h_505,al_c,lg_1,q_85,enc_avif,quality_auto/2f2616_31e18d8e440c486ab82a4c554b31a221~mv2.png',
          bio: 'Family medicine physician and hospitalist. Passionate about medical missions and teaching; leads two trips a year to the Philippines with medical students interested in global health.',
        },
        {
          name: 'Brooke Rodrigue, RN',
          role: 'Director & Fundraising Committee Lead',
          photo:
            'https://static.wixstatic.com/media/2f2616_dfdb2668940e4330841b25e65be24352~mv2.jpeg/v1/fill/w_710,h_931,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/2f2616_dfdb2668940e4330841b25e65be24352~mv2.jpeg',
          bio: 'Former Board Chair. Registered nurse, aesthetic medicine entrepreneur, and co-host of the annual HAND Philippines Gala. Serves as nurse volunteer on medical mission trips.',
        },
        {
          name: 'Ashley Couverette, RN',
          role: 'Director',
          photo:
            'https://static.wixstatic.com/media/2f2616_e4e25a8e84af492d9e85ad35de05b499~mv2.jpeg/v1/crop/x_25,y_0,w_591,h_614/fill/w_486,h_505,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/image0%20(4).jpeg',
          bio: 'Experienced nurse and dedicated volunteer on multiple Medical Surgical Missions. Provides triage, diagnostic testing, minor surgical care, medications, and health education.',
        },
        {
          name: 'Mark Griswold',
          role: 'Director',
          photo:
            'https://static.wixstatic.com/media/2f2616_c7a199f2ee7348c392e15cd825b2d8e1~mv2.jpeg/v1/crop/x_0,y_480,w_1423,h_1423/fill/w_612,h_635,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/image.jpeg',
          bio: 'Small business owner with more than 20 years in public health, working with state agencies, nonprofit organizations, and international partners on health systems and disease surveillance.',
        },
        {
          name: 'Tirunellai Shankar, M.D.',
          role: 'Director',
          photo:
            'https://static.wixstatic.com/media/2f2616_c561c4f88ad444ee9481c42c0056a9c4~mv2.jpg/v1/fill/w_603,h_564,al_c,q_80,enc_avif,quality_auto/TR%20Shankar_edited.jpg',
          bio: 'General Surgery Specialist in Skowhegan, Maine. Joined the Board of Directors in 2026. More than 19 years of diverse experience in General Surgery.',
        },
        {
          name: 'Jennifer Christian',
          role: 'Director',
          photo: '',
          bio: 'Member of the HAND-Philippines Board of Directors.',
        },
        {
          name: 'Jenette Tschirhart, M.D.',
          role: 'Director',
          photo:
            'https://static.wixstatic.com/media/2f2616_d99ede01b49a4526ac31f0e7875d3317~mv2.jpeg/v1/fill/w_712,h_673,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/2f2616_d99ede01b49a4526ac31f0e7875d3317~mv2.jpeg',
          bio: 'OBGYN based in Maine. Formerly worked with medical students and residents; enjoys serving at critical access hospitals. Featured on This American Life.',
        },
        {
          name: 'Rosamund "Rosie" Davis, M.D.',
          role: 'Director',
          photo:
            'https://static.wixstatic.com/media/2f2616_cac2940e904f45488e18791f646ed083~mv2.png/v1/fill/w_710,h_1075,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/2f2616_cac2940e904f45488e18791f646ed083~mv2.png',
          bio: 'Board-certified pediatric hospitalist at MaineGeneral Medical Center. Spearheading the HAND-Philippines Neonatal Resuscitation Project. Active in pediatric disaster preparedness.',
        },
      ],
    },
    {
      label: 'HAND Officers (Executive Committee)',
      people: [
        {
          name: 'Reynerio "Lance" Lanoy, MD, MPH, FACP',
          role: 'Co-Founder & President',
          photo:
            'https://static.wixstatic.com/media/e9ba0e_9b1cd136773e4cbcb01e44753c3c5071~mv2.jpg/v1/fill/w_710,h_931,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/e9ba0e_9b1cd136773e4cbcb01e44753c3c5071~mv2.jpg',
          bio: 'Board-certified internal medicine physician and Fellow of the American College of Physicians. Hospitalist at MaineGeneral Medical Center and Clinical Assistant Professor. Leads medical and surgical missions since founding HAND-Philippines in 2014.',
        },
        {
          name: 'Esther Tutor-Garcia, MD',
          role: 'Co-Founder & Acting VP, Philippine Operations',
          photo: '',
          bio: 'Physician at Kaiser Permanente Fontana Medical Center in Southern California. Committed to improving lives of the underserved through healthcare excellence, leadership, and sustainable humanitarian initiatives.',
        },
        {
          name: 'Sarah Jordaan, RN, ASN',
          role: 'Co-Founder & VP of External Affairs',
          photo: '',
          bio: 'Over 27 years of healthcare experience. Former ED charge nurse and ACLS/PALS instructor. Develops sustainable education programs that equip local healthcare workers with life-saving skills.',
        },
        {
          name: 'Johannes "Henk" Jordaan, M.D.',
          role: 'Treasurer',
          photo: '',
          bio: 'Serves as Treasurer Officer for HAND-Philippines.',
        },
        {
          name: 'Arlene Almazan, M.D.',
          role: 'Officer',
          photo: '',
          bio: 'Board-certified psychiatrist and Medical Director at Kennebec Behavioral Health. Completed residency at Baylor College of Medicine and Integrative Psychiatry Fellowship. Practices in Skowhegan, Waterville, and Augusta, Maine.',
        },
      ],
    },
    { label: 'Committees & Workgroups', people: [] },
    { label: 'Staff', people: [] },
    { label: 'Helping Hands', people: [] },
  ],
  photoNote:
    'Portraits are added as they are shared with us. Committee, staff, and volunteer listings are being completed.',
};

/* ---- Get Involved ----------------------------------------------------- */
export const getInvolved = [
  {
    id: 'volunteer-philippines',
    icon: 'hands',
    tone: 'blue',
    title: 'Volunteer for projects in the Philippines',
    text:
      'A general category for volunteering beyond medical mission clinical work — lecturing, helping with infrastructure projects and rebuilds, supporting training programs for healthcare workers, and helping with research projects.',
  },
  {
    id: 'volunteer-us-events',
    icon: 'star',
    tone: 'sun',
    title: 'Volunteer for our events in the US',
    text: 'For youth volunteers, Gala volunteers, and Art Sale volunteers.',
  },
  {
    id: 'youth-school-groups',
    icon: 'cap',
    tone: 'blue',
    title: 'Youth / School Groups',
    text: 'For youth and school organizations that want to partner with HAND-Philippines.',
  },
  {
    id: 'artists',
    icon: 'brush',
    tone: 'sun',
    title: 'Artists wanting to donate artwork',
    text: 'Art donation opportunities for our events and auctions.',
  },
  {
    id: 'auction-donors',
    icon: 'gavel',
    tone: 'blue',
    title: 'Auction donors for the Gala',
    text: 'Donation opportunities for auction items.',
  },
  {
    id: 'corporate-partnership',
    icon: 'building',
    tone: 'sun',
    title: 'Corporate & Institutional Partnership',
    text:
      'A high-touch presentation is available, virtual or in person. This is a plain contact — not a multi-step application form.',
    contacts: [
      { label: 'Partnerships', value: org.partnershipsEmail, href: `mailto:${org.partnershipsEmail}` },
      { label: org.leadership.name, value: org.leadership.role },
    ],
  },
  {
    id: 'updates',
    icon: 'bell',
    tone: 'blue',
    title: 'Sign up for updates',
    text: 'Hear about upcoming missions, events, and programs. No newsletter engine — just an email list.',
  },
];

/* ---- Donate ----------------------------------------------------------- */
export const daf = {
  title: 'Donate through a Donor-Advised Fund (DAF)',
  intro:
    'Giving through a Donor-Advised Fund lets you direct a grant from an existing fund. The secure DAF Direct tool is available for the providers below.',
  providers: ['Fidelity Charitable', 'DAFgiving360 (formerly Schwab Charitable)', 'BNY Mellon Charitable Gift Fund'],
  manual: {
    heading: 'Sending a DAF grant by mail',
    note:
      'If your provider does not use DAF Direct, you can have your fund send a check directly to us. Funds remain unconfirmed until they are received and recorded by a Finance Admin.',
    fields: [
      { label: 'Official Legal Name', value: org.legalName },
      { label: 'Employer Identification Number (EIN)', value: org.ein },
      { label: 'Mailing Address for Grant Checks', value: org.mailingAddress.full },
    ],
  },
};

export const mailACheck = {
  title: 'Donate by mailing a check',
  intro:
    'It is old school, but it has ZERO platform fees — and every dollar goes directly to the work.',
  steps: [
    'Make your check payable to the official legal name below.',
    'Mail the check to our PO Box with a note identifying your name, email, and any designation.',
    'Once the check is received and recorded by a Finance Admin, a receipt is issued.',
  ],
  fields: [
    { label: 'Payable to', value: org.legalName },
    { label: 'EIN', value: org.ein },
    { label: 'Mailing Address', value: org.mailingAddress.full },
  ],
  note:
    'Funds remain unconfirmed until they are received. This path never fabricates a verified online payment state.',
};

/* ---- Inquiry topics --------------------------------------------------- */
/**
 * Every form on the site opens in the shared modal layer (the Contact page is
 * the one deliberate exception and keeps its inline form). A trigger button
 * names its own purpose - data-modal-topic - and this catalog turns that into
 * the dialog's copy, the backend message type, and the line stored with the
 * message so the admin sees why the person wrote in.
 */
export const inquiryTopics = {
  general: {
    eyebrow: 'General inquiry',
    title: 'Ask us anything',
    lead: 'A volunteer reads every message and replies personally.',
    type: 'General Inquiry',
    typeLabel: 'General inquiry',
    lane: 'contact',
    source: 'modal-general',
    submitLabel: 'Send message',
  },
  governance: {
    eyebrow: 'Governance',
    title: 'Request governance disclosures',
    lead: 'Annual report, financial statements, IRS determination letter, or the current board list.',
    type: 'General Inquiry',
    typeLabel: 'Governance & disclosures',
    lane: 'contact',
    source: 'modal-governance',
    submitLabel: 'Request disclosures',
  },
  volunteer: {
    eyebrow: 'Get involved',
    title: 'Tell us how you want to help',
    lead: 'Choose the option that fits you best, then tell us a little about yourself.',
    type: 'Volunteer',
    typeLabel: 'Get involved',
    lane: 'interest',
    source: 'modal-get-involved',
    submitLabel: 'Send',
    showTypeSelect: true,
    presets: [
      { value: 'volunteer-philippines', label: 'Volunteer for projects in the Philippines' },
      { value: 'volunteer-us-events', label: 'Volunteer for our events in the US' },
      { value: 'youth-school-groups', label: 'Youth / School Groups' },
      { value: 'artists', label: 'Artists wanting to donate artwork' },
      { value: 'auction-donors', label: 'Auction donors for the Gala' },
      { value: 'corporate-partnership', label: 'Corporate & Institutional Partnership' },
      { value: 'updates', label: 'Sign up for updates' },
    ],
  },
  'volunteer-philippines': {
    eyebrow: 'Volunteer',
    title: 'Volunteer for projects in the Philippines',
    lead: 'Lecturing, rebuilds, health-worker training, and research projects.',
    type: 'Volunteer',
    typeLabel: 'Volunteer (Philippines)',
    lane: 'interest',
    source: 'modal-volunteer-ph',
    submitLabel: 'Send',
  },
  'volunteer-us-events': {
    eyebrow: 'Volunteer',
    title: 'Volunteer at our events in the US',
    lead: 'Gala, Art Among the Meadows, registration, hosting, and follow-up.',
    type: 'Volunteer',
    typeLabel: 'Volunteer (US events)',
    lane: 'interest',
    source: 'modal-volunteer-us',
    submitLabel: 'Send',
  },
  'youth-school-groups': {
    eyebrow: 'Youth & schools',
    title: 'Partner with us as a youth or school group',
    lead: 'Tell us about your group, the ages involved, and what you would like to do.',
    type: 'Volunteer',
    typeLabel: 'Youth / school group',
    lane: 'interest',
    source: 'modal-youth-school',
    submitLabel: 'Send',
  },
  artists: {
    eyebrow: 'Artists',
    title: 'Donate artwork',
    lead: 'Reach out with the medium and size of the piece - we will confirm whether it fits the event format.',
    type: 'Donation',
    typeLabel: 'Artwork donation',
    lane: 'interest',
    source: 'modal-artist',
    submitLabel: 'Send inquiry',
  },
  'auction-donors': {
    eyebrow: 'Auction donors',
    title: 'Donate an auction item',
    lead: 'Items for the Gala and Auction. Tell us what you have in mind and we will follow up.',
    type: 'Donation',
    typeLabel: 'Auction item donation',
    lane: 'interest',
    source: 'modal-auction',
    submitLabel: 'Send inquiry',
  },
  'corporate-partnership': {
    eyebrow: 'Partnerships',
    title: 'Corporate or institutional partnership',
    lead: 'A high-touch conversation first, virtual or in person - not a multi-step application.',
    type: 'Partnership',
    typeLabel: 'Corporate partnership',
    lane: 'interest',
    source: 'modal-corporate',
    submitLabel: 'Start the conversation',
  },
  updates: {
    eyebrow: 'Stay in touch',
    title: 'Sign up for updates',
    lead: 'Missions, events, and programs. No newsletter engine - just an email list.',
    type: 'General Inquiry',
    typeLabel: 'Update sign-up',
    lane: 'interest',
    source: 'modal-updates',
    submitLabel: 'Sign up',
  },
  'reserve-2027': {
    eyebrow: 'Medical Mission 2027',
    title: 'Reserve your place, or ask first',
    lead: 'This is an interest form, not clinical registration. Full registration is handled administratively after review.',
    type: 'Volunteer',
    typeLabel: 'Medical Mission 2027 reservation interest',
    lane: 'interest',
    source: 'modal-reserve-2027',
    submitLabel: 'Submit interest',
  },
  'mission-question': {
    eyebrow: 'Medical Mission',
    title: 'Question about the mission',
    lead: 'Dates, roles, clinical registration, travel, or anything else about Bohol 2027.',
    type: 'General Inquiry',
    typeLabel: 'Medical Mission 2027 question',
    lane: 'contact',
    source: 'modal-mission-question',
    submitLabel: 'Send question',
  },
  'p2p-fundraising': {
    eyebrow: 'Fundraising',
    title: 'Fundraise with us (P2P)',
    lead: 'Raise funds through your own network and give the mission a wider reach.',
    type: 'Volunteer',
    typeLabel: 'P2P fundraising interest',
    lane: 'interest',
    source: 'modal-p2p',
    submitLabel: 'Send interest',
  },
  'program-question': {
    eyebrow: 'Programs',
    title: 'Ask about a program',
    lead: 'A volunteer will get back to you. For urgent mission questions, call or text us.',
    type: 'General Inquiry',
    typeLabel: 'Program question',
    lane: 'contact',
    source: 'modal-program-question',
    submitLabel: 'Send question',
  },
  'gala-tickets': {
    eyebrow: 'Gala & Auction',
    title: 'Reserve your seat at the table',
    lead: 'Tell us how many guests and we will confirm your table and send payment details.',
    type: 'General Inquiry',
    typeLabel: 'Gala ticket reservation',
    lane: 'contact',
    source: 'modal-gala-tickets',
    submitLabel: 'Request seats',
  },
  'gala-sponsor': {
    eyebrow: 'Gala sponsorship',
    title: 'Sponsor the Gala',
    lead: 'Tell us about your organization and how you would like to be involved.',
    type: 'Partnership',
    typeLabel: 'Gala sponsorship inquiry',
    lane: 'contact',
    source: 'modal-gala-sponsor',
    submitLabel: 'Start the conversation',
  },
  'art-inquiry': {
    eyebrow: 'Art Among the Meadows',
    title: 'Artist inquiry',
    lead: 'Tell us about the work you would like to donate and we will follow up.',
    type: 'Donation',
    typeLabel: 'Art Among the Meadows inquiry',
    lane: 'contact',
    source: 'modal-art-inquiry',
    submitLabel: 'Send inquiry',
  },
  'daf-help': {
    eyebrow: 'Donor-Advised Fund',
    title: 'Ask about giving through your DAF',
    lead: 'We will email you the grant recommendation details for your provider.',
    type: 'Donation',
    typeLabel: 'DAF giving',
    lane: 'contact',
    source: 'modal-daf',
    submitLabel: 'Send request',
  },
  'donation-help': {
    eyebrow: 'Giving',
    title: 'Question about donating',
    lead: 'Anything about gifts, receipts, designations, or matching.',
    type: 'Donation',
    typeLabel: 'Donation question',
    lane: 'contact',
    source: 'modal-donation-help',
    submitLabel: 'Send question',
  },
};

export const donationAmounts = [25, 50, 100, 250, 500, 1000];

export const designations = [
  { id: 'where-needed', label: 'Where it is needed most' },
  { id: 'medical-mission-2027', label: 'Medical Mission 2027' },
  { id: 'adopt-a-rhu', label: 'Adopt-a-Rural Health Unit' },
  { id: 'pwh-cargo', label: 'PWH Cargo Delivery' },
  { id: 'vela-neonatal', label: 'Vela Neonatal Resuscitation' },
  { id: 'disaster-response', label: 'Disaster Response & Rebuilding' },
  { id: 'gala-2026', label: 'Gala 2026' },
];

/* ---- Impact map (service areas, text-based — interactive map not
       implemented per document) ---------------------------------------- */
export const serviceAreas = [
  { place: 'Bohol, Philippines', detail: 'Island province — medical missions, mobile clinics, cargo delivery, and health education.', tone: 'blue' },
  { place: 'Tungod, Northern Bohol', detail: 'Densely populated coastal community — rural health station, childcare center, and primary school.', tone: 'sun' },
  { place: 'Small islands off the Bohol coast', detail: 'Reached by banca boat for outreach and research rotations.', tone: 'blue' },
  { place: 'Maine & California, USA', detail: 'Home base of the volunteer network and the annual Gala.', tone: 'sun' },
];
