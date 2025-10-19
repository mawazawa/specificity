export interface ExpertLink {
  type: 'twitter' | 'linkedin' | 'youtube' | 'website' | 'biography';
  url: string;
  label: string;
}

export interface Expert {
  id: string;
  name: string;
  title: string;
  role: string;
  avatar: string;
  bio: string;
  expertise: string[];
  alive: boolean;
  links: ExpertLink[];
  color: string;
}

export const EXPERTS: Expert[] = [
  {
    id: 'steve',
    name: 'Steve Jobs',
    title: 'Product Visionary',
    role: 'Product Vision & Design Philosophy',
    avatar: '/src/assets/steve-jobs-nobg.png',
    bio: 'Co-founder of Apple Inc. Revolutionized personal computing, mobile phones, and digital publishing. Known for relentless focus on user experience, simplicity, and the intersection of technology and liberal arts.',
    expertise: ['Product Design', 'User Experience', 'Innovation', 'Simplicity'],
    alive: false,
    links: [
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc', label: '2005 Stanford Commencement' },
      { type: 'biography', url: 'https://en.wikipedia.org/wiki/Steve_Jobs', label: 'Biography' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=oeqPrUmVz-o', label: 'Lost Interview (1995)' }
    ],
    color: 'from-blue-500 via-cyan-500 to-teal-500'
  },
  {
    id: 'elon',
    name: 'Elon Musk',
    title: 'First Principles Thinker',
    role: 'First Principles & Scalability',
    avatar: '/src/assets/elon-musk-nobg.png',
    bio: 'CEO of Tesla, SpaceX, and X (formerly Twitter). Pioneer in electric vehicles, space exploration, and neural interfaces. Champions first principles thinking and ambitious goal-setting.',
    expertise: ['First Principles', 'Engineering', 'Scale', 'Innovation'],
    alive: true,
    links: [
      { type: 'twitter', url: 'https://twitter.com/elonmusk', label: '@elonmusk' },
      { type: 'website', url: 'https://www.tesla.com', label: 'Tesla' },
      { type: 'website', url: 'https://www.spacex.com', label: 'SpaceX' }
    ],
    color: 'from-purple-500 via-fuchsia-500 to-pink-500'
  },
  {
    id: 'oprah',
    name: 'Oprah Winfrey',
    title: 'Human Impact Expert',
    role: 'Human Connection & Impact',
    avatar: '/src/assets/oprah-nobg.png',
    bio: 'Media mogul, philanthropist, and cultural icon. Built billion-dollar media empire focused on human stories, empowerment, and authentic connection. Expert in understanding audience needs and creating meaningful impact.',
    expertise: ['Empathy', 'Storytelling', 'Impact', 'Authenticity'],
    alive: true,
    links: [
      { type: 'twitter', url: 'https://twitter.com/Oprah', label: '@Oprah' },
      { type: 'website', url: 'https://www.oprah.com', label: 'Oprah.com' },
      { type: 'linkedin', url: 'https://www.linkedin.com/in/oprah-winfrey', label: 'LinkedIn' }
    ],
    color: 'from-amber-500 via-orange-500 to-red-500'
  },
  {
    id: 'bartlett',
    name: 'Steven Bartlett',
    title: 'Growth Strategist',
    role: 'Growth & Marketing Strategy',
    avatar: '/src/assets/steven-bartlett-nobg.png',
    bio: 'Entrepreneur, investor, and host of "The Diary of a CEO" podcast. Built Social Chain from his bedroom to a publicly traded company. Expert in digital marketing, growth hacking, and building viral products.',
    expertise: ['Growth', 'Marketing', 'Virality', 'Strategy'],
    alive: true,
    links: [
      { type: 'twitter', url: 'https://twitter.com/SteveBartlettSC', label: '@SteveBartlettSC' },
      { type: 'linkedin', url: 'https://www.linkedin.com/in/stevenbartlett-123', label: 'LinkedIn' },
      { type: 'youtube', url: 'https://www.youtube.com/@TheDiaryOfACEO', label: 'The Diary of a CEO' }
    ],
    color: 'from-red-500 via-rose-500 to-pink-500'
  },
  {
    id: 'jony',
    name: 'Jony Ive',
    title: 'Design Craftsman',
    role: 'Simplicity & Craftsmanship',
    avatar: '/src/assets/jony-ive-nobg.png',
    bio: 'Former Chief Design Officer at Apple. Designed iconic products including iPhone, iPad, and MacBook. Believes in removing complexity until only the essential remains. Champion of minimalism and attention to detail.',
    expertise: ['Industrial Design', 'Minimalism', 'Craft', 'Detail'],
    alive: true,
    links: [
      { type: 'website', url: 'https://www.lovefrom.com', label: 'LoveFrom' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=4xzLr7xSr-g', label: 'Design Philosophy' },
      { type: 'biography', url: 'https://en.wikipedia.org/wiki/Jony_Ive', label: 'Biography' }
    ],
    color: 'from-slate-400 via-zinc-400 to-neutral-500'
  },
  {
    id: 'amal',
    name: 'Amal Clooney',
    title: 'Ethics & Law Expert',
    role: 'Legal Frameworks & Ethics',
    avatar: '/src/assets/amal-clooney-nobg.png',
    bio: 'International human rights lawyer specializing in international law and human rights. Represents clients at the International Court of Justice and European Court of Human Rights. Expert in compliance, ethics, and legal risk.',
    expertise: ['Law', 'Ethics', 'Compliance', 'Risk'],
    alive: true,
    links: [
      { type: 'website', url: 'https://www.doughtystreet.co.uk/barristers/amal-clooney', label: 'Law Profile' },
      { type: 'biography', url: 'https://en.wikipedia.org/wiki/Amal_Clooney', label: 'Biography' },
      { type: 'linkedin', url: 'https://www.linkedin.com/in/amal-clooney', label: 'LinkedIn' }
    ],
    color: 'from-indigo-500 via-violet-500 to-purple-500'
  }
];
