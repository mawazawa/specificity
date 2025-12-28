import { AgentType } from "./spec";
import elonAvatar from "@/assets/optimized/elon-musk-nobg.webp";
import steveAvatar from "@/assets/optimized/steve-jobs-nobg.webp";
import oprahAvatar from "@/assets/optimized/oprah-nobg.webp";
import zahaAvatar from "@/assets/optimized/agent-placeholder.webp";
import jonyAvatar from "@/assets/optimized/jony-ive-nobg.webp";
import bartlettAvatar from "@/assets/optimized/steven-bartlett-nobg.webp";
import amalAvatar from "@/assets/optimized/amal-clooney-nobg.webp";

export interface MentorParameter {
  name: string;
  value: number; // 1-10 scale
  icon: string;
  description: string;
}

export interface MentorProfile {
  agent: AgentType;
  name: string;
  title: string;
  avatar: string;
  gradient: string;
  bio: string;
  parameters: MentorParameter[];
}

export const mentorProfiles: Record<AgentType, MentorProfile> = {
  elon: {
    agent: 'elon',
    name: 'Elon Musk',
    title: 'Visionary Engineer',
    avatar: elonAvatar,
    gradient: 'from-red-500/20 via-orange-500/10 to-yellow-500/5',
    bio: 'First principles thinker focused on breakthrough innovation and rapid execution at scale.',
    parameters: [
      { name: 'First Principles', value: 10, icon: '🧠', description: 'Breaks down complex problems to fundamental truths' },
      { name: 'Truth Seeking', value: 10, icon: '🔍', description: 'Relentless pursuit of objective reality' },
      { name: 'Decisive Action', value: 10, icon: '⚡', description: 'Rapid decision-making and execution' },
      { name: 'Moonshot Ideas', value: 10, icon: '🚀', description: 'Ambitious goals that seem impossible' },
      { name: 'Scaling Potential', value: 10, icon: '📈', description: 'Thinks in terms of massive scale' },
      { name: 'Risk Tolerance', value: 9, icon: '🎲', description: 'High appetite for calculated risks' },
      { name: 'Speed to Market', value: 9, icon: '⏱️', description: 'Extreme urgency in execution' },
      { name: 'Vertical Integration', value: 8, icon: '🏗️', description: 'Control the full stack' },
      { name: 'Technical Depth', value: 9, icon: '⚙️', description: 'Deep engineering knowledge' },
      { name: 'Long-term Vision', value: 10, icon: '🔮', description: 'Multi-decade thinking' },
    ]
  },
  steve: {
    agent: 'steve',
    name: 'Steve Jobs',
    title: 'Design Perfectionist',
    avatar: steveAvatar,
    gradient: 'from-slate-500/20 via-gray-500/10 to-zinc-500/5',
    bio: 'Obsessed with elegant simplicity and products that delight users at every interaction.',
    parameters: [
      { name: 'Simplicity', value: 10, icon: '✨', description: 'Ruthless elimination of complexity' },
      { name: 'User Experience', value: 10, icon: '🎨', description: 'Obsessive focus on user delight' },
      { name: 'Perfectionism', value: 10, icon: '💎', description: 'Nothing ships until it\'s perfect' },
      { name: 'Design Integration', value: 10, icon: '🔗', description: 'Hardware and software harmony' },
      { name: 'Taste', value: 10, icon: '👁️', description: 'Impeccable aesthetic judgment' },
      { name: 'Focus', value: 10, icon: '🎯', description: 'Say no to 1000 things to focus on the one' },
      { name: 'Storytelling', value: 9, icon: '📖', description: 'Compelling narrative and vision' },
      { name: 'Innovation', value: 9, icon: '💡', description: 'Intersection of technology and liberal arts' },
      { name: 'Quality', value: 10, icon: '⭐', description: 'Premium materials and craftsmanship' },
      { name: 'Insanely Great', value: 10, icon: '🌟', description: 'Products that make a dent in the universe' },
    ]
  },
  oprah: {
    agent: 'oprah',
    name: 'Oprah Winfrey',
    title: 'Empowerment Leader',
    avatar: oprahAvatar,
    gradient: 'from-purple-500/20 via-pink-500/10 to-rose-500/5',
    bio: 'Champions human connection, empowerment, and creating meaningful impact at scale.',
    parameters: [
      { name: 'Empathy', value: 10, icon: '❤️', description: 'Deep understanding of human needs' },
      { name: 'Authenticity', value: 10, icon: '🌟', description: 'Genuine and transparent communication' },
      { name: 'Empowerment', value: 10, icon: '💪', description: 'Helping others reach their potential' },
      { name: 'Storytelling', value: 10, icon: '📚', description: 'Powerful narrative connection' },
      { name: 'Community', value: 10, icon: '🤝', description: 'Building strong communities' },
      { name: 'Impact', value: 9, icon: '🌍', description: 'Creating lasting social change' },
      { name: 'Trust', value: 10, icon: '🔒', description: 'Building deep audience trust' },
      { name: 'Accessibility', value: 9, icon: '🚪', description: 'Making things available to all' },
      { name: 'Wellness', value: 9, icon: '🧘', description: 'Holistic wellbeing focus' },
      { name: 'Education', value: 9, icon: '📖', description: 'Lifelong learning and growth' },
    ]
  },
  zaha: {
    agent: 'zaha',
    name: 'Zaha Hadid',
    title: 'Architectural Visionary',
    avatar: zahaAvatar,
    gradient: 'from-indigo-500/20 via-violet-500/10 to-purple-500/5',
    bio: 'Pioneering fluid, organic forms that challenge conventions and redefine spatial experiences.',
    parameters: [
      { name: 'Bold Vision', value: 10, icon: '🏛️', description: 'Daring architectural concepts' },
      { name: 'Fluid Forms', value: 10, icon: '🌊', description: 'Organic, flowing designs' },
      { name: 'Spatial Innovation', value: 10, icon: '📐', description: 'Revolutionary use of space' },
      { name: 'Materiality', value: 9, icon: '🪨', description: 'Innovative material exploration' },
      { name: 'Future-Forward', value: 10, icon: '🔮', description: 'Ahead of her time' },
      { name: 'Parametric Design', value: 9, icon: '📊', description: 'Computational design mastery' },
      { name: 'Cultural Synthesis', value: 9, icon: '🌏', description: 'Blending global influences' },
      { name: 'Complexity', value: 8, icon: '🧩', description: 'Embracing intricate solutions' },
      { name: 'Sculptural Quality', value: 10, icon: '🗿', description: 'Architecture as art' },
      { name: 'Breaking Boundaries', value: 10, icon: '💥', description: 'Challenging the impossible' },
    ]
  },
  jony: {
    agent: 'jony',
    name: 'Jony Ive',
    title: 'Chief Design Officer',
    avatar: jonyAvatar,
    gradient: 'from-blue-500/20 via-cyan-500/10 to-sky-500/5',
    bio: 'Master of restraint, creating products where every detail serves a purpose.',
    parameters: [
      { name: 'Minimalism', value: 10, icon: '⚪', description: 'Essential elements only' },
      { name: 'Craftsmanship', value: 10, icon: '🔨', description: 'Attention to every detail' },
      { name: 'Material Honesty', value: 10, icon: '🪵', description: 'True to material nature' },
      { name: 'Precision', value: 10, icon: '📏', description: 'Exact tolerances and fit' },
      { name: 'Tactility', value: 9, icon: '👐', description: 'How it feels matters' },
      { name: 'Timelessness', value: 10, icon: '⏳', description: 'Designs that endure' },
      { name: 'Harmony', value: 10, icon: '☯️', description: 'Perfect balance and proportion' },
      { name: 'Restraint', value: 10, icon: '🎭', description: 'What you don\'t add matters most' },
      { name: 'User Centricity', value: 10, icon: '👤', description: 'Designed for humans' },
      { name: 'Excellence', value: 10, icon: '🏆', description: 'No compromise on quality' },
    ]
  },
  bartlett: {
    agent: 'bartlett',
    name: 'Steven Bartlett',
    title: 'Entrepreneurial Mindset',
    avatar: bartlettAvatar,
    gradient: 'from-green-500/20 via-emerald-500/10 to-teal-500/5',
    bio: 'Building something people want through relentless iteration and psychological understanding.',
    parameters: [
      { name: 'Build for People', value: 10, icon: '👥', description: 'Solve real human problems' },
      { name: 'Psychology', value: 9, icon: '🧠', description: 'Deep understanding of behavior' },
      { name: 'Iteration Speed', value: 9, icon: '🔄', description: 'Rapid test and learn' },
      { name: 'Storytelling', value: 10, icon: '🎬', description: 'Compelling brand narratives' },
      { name: 'Authenticity', value: 10, icon: '💯', description: 'Genuine and transparent' },
      { name: 'Content First', value: 9, icon: '📱', description: 'Content drives everything' },
      { name: 'Community', value: 9, icon: '🌐', description: 'Building engaged audiences' },
      { name: 'Data-Driven', value: 8, icon: '📊', description: 'Metrics guide decisions' },
      { name: 'Hustle', value: 9, icon: '💪', description: 'Relentless work ethic' },
      { name: 'Self-Awareness', value: 9, icon: '🪞', description: 'Understanding strengths/weaknesses' },
    ]
  },
  amal: {
    agent: 'amal',
    name: 'Amal Clooney',
    title: 'Human Rights Advocate',
    avatar: amalAvatar,
    gradient: 'from-amber-500/20 via-yellow-500/10 to-orange-500/5',
    bio: 'Champion of justice, ethics, and building systems that protect human dignity.',
    parameters: [
      { name: 'Justice', value: 10, icon: '⚖️', description: 'Fairness and equality' },
      { name: 'Ethics', value: 10, icon: '🧭', description: 'Strong moral compass' },
      { name: 'Rigor', value: 10, icon: '📚', description: 'Thorough research and preparation' },
      { name: 'Advocacy', value: 10, icon: '📢', description: 'Voice for the voiceless' },
      { name: 'Global Perspective', value: 10, icon: '🌍', description: 'International understanding' },
      { name: 'Diplomacy', value: 9, icon: '🤝', description: 'Strategic negotiation' },
      { name: 'Sustainability', value: 9, icon: '🌱', description: 'Long-term impact focus' },
      { name: 'Inclusivity', value: 10, icon: '🌈', description: 'Everyone has a voice' },
      { name: 'Accountability', value: 10, icon: '✅', description: 'Holding power responsible' },
      { name: 'Protection', value: 10, icon: '🛡️', description: 'Safeguarding vulnerable' },
    ]
  },
  user: {
    agent: 'user',
    name: 'User',
    title: 'Product Owner',
    avatar: '',
    gradient: 'from-gray-500/20 via-gray-400/10 to-gray-300/5',
    bio: 'The user providing product requirements and feedback.',
    parameters: []
  },
  system: {
    agent: 'system',
    name: 'System',
    title: 'System',
    avatar: '',
    gradient: 'from-neutral-500/20 via-neutral-400/10 to-neutral-300/5',
    bio: 'System-generated messages and notifications.',
    parameters: []
  },
};
