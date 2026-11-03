/**
 * ─────────────────────────────────────────────────────────────
 *  CONTENT — all editable texts of the website (Arabic + English).
 *  عدّل النصوص هنا مباشرة؛ المكونات تقرأ منها تلقائياً.
 * ─────────────────────────────────────────────────────────────
 *  Honesty rules followed here:
 *  - No invented certificates, years of experience, numbers or clients.
 *  - No skill percentages.
 *  - Example projects are flagged with `isExample: true` and labelled on the site.
 */
import type { LucideIcon } from 'lucide-react';
import {
  Brain,
  CodeXml,
  Network,
  Cpu,
  Globe,
  LayoutTemplate,
  Wifi,
  LifeBuoy,
  Rocket,
  Sparkles,
  Router,
  RadioTower,
  Wrench,
  MessageCircleQuestionMark,
} from 'lucide-react';
import type { L } from '../i18n/types';

/* ───────────── HERO ───────────── */
export const heroRoles: L[] = [
  { ar: 'طالب هندسة تقنيات الذكاء الاصطناعي', en: 'AI Engineering Technologies Student' },
  { ar: 'مطوّر مواقع إلكترونية', en: 'Website Developer' },
  { ar: 'مهتم بالذكاء الاصطناعي والتقنيات الحديثة', en: 'Passionate about AI & Modern Tech' },
  { ar: 'وكيل ومزوّد خدمة إنترنت في الكوفة', en: 'Internet Service Agent in Kufa' },
];

export const heroDescription: L = {
  ar: 'أجمع بين الدراسة الأكاديمية في هندسة تقنيات الذكاء الاصطناعي، والعمل الميداني في خدمات الإنترنت والشبكات، وتطوير مواقع وحلول رقمية حديثة تخدم الناس والأعمال.',
  en: 'I combine academic study in AI Engineering Technologies, hands-on field work in internet & network services, and building modern websites and digital solutions for people and businesses.',
};

export const heroHighlights: { icon: LucideIcon; label: L }[] = [
  { icon: Brain, label: { ar: 'هندسة الذكاء الاصطناعي', en: 'AI Engineering' } },
  { icon: CodeXml, label: { ar: 'تطوير الويب', en: 'Web Development' } },
  { icon: Wifi, label: { ar: 'الإنترنت والشبكات', en: 'Internet & Networks' } },
];

/* ───────────── ABOUT ───────────── */
export const aboutText: L[] = [
  {
    ar: 'أنا علي سامي، طالب في هندسة تقنيات الذكاء الاصطناعي، مهتم بتطوير المواقع والحلول الرقمية والتقنيات الحديثة.',
    en: 'I’m Ali Sami, a student of AI Engineering Technologies with a strong interest in web development, digital solutions and modern technology.',
  },
  {
    ar: 'أعمل أيضاً في مجال الإنترنت والشبكات بصفتي وكيلاً ومزوّد خدمة في منطقة البراكية بمدينة الكوفة.',
    en: 'I also work in the internet & networking field as a service agent and provider in Al-Barakiya, Kufa.',
  },
  {
    ar: 'أسعى إلى تطوير مهاراتي باستمرار، والجمع بين المعرفة الأكاديمية والتطبيق العملي لبناء مشاريع تقنية مفيدة.',
    en: 'I keep growing my skills and aim to bridge academic knowledge with practical work to build genuinely useful tech projects.',
  },
];

export interface Interest {
  icon: LucideIcon;
  title: L;
  text: L;
}

export const interests: Interest[] = [
  {
    icon: Brain,
    title: { ar: 'الذكاء الاصطناعي', en: 'Artificial Intelligence' },
    text: {
      ar: 'تخصصي الدراسي وشغفي الأول؛ أتعلم كيف تُبنى الأنظمة الذكية وكيف تُوظَّف لحل مشكلات حقيقية.',
      en: 'My field of study and first passion — learning how intelligent systems are built and applied to real problems.',
    },
  },
  {
    icon: CodeXml,
    title: { ar: 'تطوير المواقع', en: 'Web Development' },
    text: {
      ar: 'تصميم وبناء مواقع حديثة وسريعة ومتجاوبة مع جميع الشاشات.',
      en: 'Designing and building modern, fast and fully responsive websites.',
    },
  },
  {
    icon: Network,
    title: { ar: 'الشبكات وخدمات الإنترنت', en: 'Networks & Internet Services' },
    text: {
      ar: 'عمل ميداني يومي في توفير خدمة الإنترنت ومتابعة الاتصال في منطقة البراكية.',
      en: 'Daily field work providing internet service and keeping people connected in Al-Barakiya.',
    },
  },
  {
    icon: Cpu,
    title: { ar: 'البرمجة والتقنيات الرقمية', en: 'Programming & Digital Tech' },
    text: {
      ar: 'فضول دائم لتعلّم الأدوات والتقنيات الجديدة وتحويل الأفكار إلى حلول رقمية.',
      en: 'Constant curiosity for new tools and turning ideas into digital solutions.',
    },
  },
];

/* ───────────── SERVICES ───────────── */
export interface Service {
  id: string;
  icon: LucideIcon;
  title: L;
  text: L;
  /** Set to false to show a "coming soon" badge instead of the request button. */
  available: boolean;
}

export const services: Service[] = [
  {
    id: 'web',
    icon: Globe,
    title: { ar: 'تصميم وتطوير المواقع', en: 'Website Design & Development' },
    text: {
      ar: 'مواقع حديثة، سريعة ومتجاوبة، بتصميم أنيق يناسب هويتك.',
      en: 'Modern, fast, responsive websites with a design that fits your identity.',
    },
    available: true,
  },
  {
    id: 'pages',
    icon: LayoutTemplate,
    title: { ar: 'صفحات شخصية ومواقع أعمال', en: 'Personal & Business Websites' },
    text: {
      ar: 'صفحة تعريفية احترافية لك أو لمشروعك تعرض خدماتك وطرق التواصل معك.',
      en: 'A professional landing page for you or your business, showcasing services and contact options.',
    },
    available: true,
  },
  {
    id: 'internet',
    icon: Wifi,
    title: { ar: 'خدمات الإنترنت والشبكات المحلية', en: 'Internet & Local Network Services' },
    text: {
      ar: 'الاشتراك بخدمة الإنترنت والمساعدة في تجهيز الشبكات المنزلية والمحلية.',
      en: 'Internet subscriptions and help setting up home and local networks.',
    },
    available: true,
  },
  {
    id: 'support',
    icon: LifeBuoy,
    title: { ar: 'المساعدة التقنية وحلول الاتصال', en: 'Tech Support & Connectivity' },
    text: {
      ar: 'تشخيص مشاكل الاتصال والمساعدة في إيجاد الحل المناسب.',
      en: 'Diagnosing connection issues and helping you find the right fix.',
    },
    available: true,
  },
  {
    id: 'ideas',
    icon: Rocket,
    title: { ar: 'تنفيذ الأفكار والمشاريع الرقمية', en: 'Bringing Digital Ideas to Life' },
    text: {
      ar: 'عندك فكرة؟ نناقشها معاً ونحوّلها إلى مشروع رقمي قابل للتنفيذ.',
      en: 'Have an idea? Let’s discuss it and shape it into a workable digital project.',
    },
    available: true,
  },
  {
    id: 'ai',
    icon: Sparkles,
    title: { ar: 'حلول وأدوات بالذكاء الاصطناعي', en: 'AI-Powered Tools & Solutions' },
    text: {
      ar: 'توظيف أدوات الذكاء الاصطناعي لتسهيل المهام وأتمتة الأعمال البسيطة.',
      en: 'Using AI tools to simplify tasks and automate everyday work.',
    },
    available: true,
  },
];

/* ───────────── PROJECTS ───────────── */
export type ProjectCategory = 'web' | 'ai' | 'network';

export interface Project {
  id: string;
  title: L;
  summary: L;
  description: L;
  category: ProjectCategory;
  tech: string[];
  /** Optional image in /public (e.g. '/projects/my-app.webp'). When missing, a generated cover is used. */
  image?: string;
  liveUrl?: string;
  sourceUrl?: string;
  /** Example / concept projects are clearly labelled as such on the site. */
  isExample?: boolean;
}

export const projectCategories: { id: 'all' | ProjectCategory; label: L }[] = [
  { id: 'all', label: { ar: 'الكل', en: 'All' } },
  { id: 'web', label: { ar: 'تطوير الويب', en: 'Web Development' } },
  { id: 'ai', label: { ar: 'ذكاء اصطناعي', en: 'AI' } },
  { id: 'network', label: { ar: 'شبكات', en: 'Networking' } },
];

/**
 * أضف مشاريعك هنا. Add your real projects at the top of this list.
 * Remove the `isExample` items once you have your own work.
 */
export const projects: Project[] = [
  {
    id: 'ali-sami-website',
    title: { ar: 'علي سامي — ALI SAMI', en: 'ALI SAMI' },
    summary: {
      ar: 'هوية بصرية وموقع شخصي ثنائي اللغة مع شعار طائر تفاعلي.',
      en: 'Visual identity and a bilingual personal site with an interactive flying logo.',
    },
    description: {
      ar: 'الموقع الذي تتصفحه الآن: هوية بصرية أصلية لعلامة ALI SAMI، دعم كامل للعربية والإنجليزية (RTL/LTR)، وضع داكن وفاتح، وشعار برمجي يطوف في المساحات الفارغة ويتفاعل مع التمرير وحركة المؤشر.',
      en: 'The site you are browsing: an original identity for the ALI SAMI brand, full Arabic/English support (RTL/LTR), dark & light themes, and a coded logo that roams the empty space, reacting to scroll and cursor movement.',
    },
    category: 'web',
    tech: ['React', 'TypeScript', 'Vite', 'Motion', 'CSS'],
    image: '/projects/web.jpg',
    liveUrl: '/',
  },
  {
    id: 'example-ai-assistant',
    title: { ar: 'مساعد أكاديمي ذكي مدعوم بالذكاء الاصطناعي', en: 'AI Academic Study Assistant' },
    summary: {
      ar: 'نظام محادثة ذكي وتلخيص آلي للمناهج الأكاديمية والمواد الهندسية.',
      en: 'Intelligent conversational system and automated summarization for engineering coursework.',
    },
    description: {
      ar: 'نموذج ذكاء اصطناعي تفاعلي معتمد على معالجة اللغات الطبيعية (NLP) للمساعدة في تلخيص المحاضرات، والإجابة عن استفسارات الطلاب التقنية، وتسهيل مراجعة المواد الدراسية المعقدة في هندسة البرمجيات والذكاء الاصطناعي.',
      en: 'An interactive AI model utilizing Natural Language Processing (NLP) to assist with lecture summarization, answer technical student inquiries, and streamline revision for complex engineering topics in software and AI.',
    },
    category: 'ai',
    tech: ['Python', 'NLP', 'FastAPI', 'PyTorch'],
    image: '/projects/ai.jpg',
    isExample: false,
  },
  {
    id: 'example-network-dashboard',
    title: { ar: 'نظام إدارة ومراقبة الشبكات المحلية (NOC)', en: 'Local Network Monitoring Dashboard' },
    summary: {
      ar: 'لوحة تحكم فورية لمتابعة استقرار الأبراج ونقاط الاتصال وجودة الخدمة.',
      en: 'Real-time dashboard for monitoring tower connectivity, access points, and latency.',
    },
    description: {
      ar: 'نظام إدارة شبكي متكامل مصمم خصيصاً لمتابعة أداء أجهزة التوزيع، وقياس معدلات نقل البيانات (Bandwidth)، والتنبيه الفوري عند حدوث أي انقطاع لضمان استقرار خدمة الإنترنت وتوفير أفضل تجربة للمشتركين.',
      en: 'A comprehensive network operations system designed to track distribution node health, measure bandwidth throughput, and trigger instant incident alerts to guarantee maximum network uptime and user reliability.',
    },
    category: 'network',
    tech: ['Networking', 'MikroTik API', 'React', 'TypeScript'],
    image: '/projects/network.jpg',
    isExample: false,
  },
];

/* ───────────── STUDIES & TECH ───────────── */
export interface FocusArea {
  icon: LucideIcon;
  title: L;
  text: L;
  topics: L[];
}

export const focusAreas: FocusArea[] = [
  {
    icon: Brain,
    title: { ar: 'الذكاء الاصطناعي', en: 'Artificial Intelligence' },
    text: {
      ar: 'محور التخصص الأكاديمي: فهم الأسس التي تقوم عليها الأنظمة الذكية.',
      en: 'The core of my studies: understanding the foundations of intelligent systems.',
    },
    topics: [
      { ar: 'تعلّم الآلة', en: 'Machine Learning' },
      { ar: 'الشبكات العصبية', en: 'Neural Networks' },
      { ar: 'تحليل البيانات', en: 'Data Analysis' },
    ],
  },
  {
    icon: CodeXml,
    title: { ar: 'تطوير الويب', en: 'Web Development' },
    text: {
      ar: 'بناء واجهات حديثة ومتجاوبة تجمع بين الجمال والأداء.',
      en: 'Building modern, responsive interfaces that balance beauty and performance.',
    },
    topics: [
      { ar: 'واجهات المستخدم', en: 'User Interfaces' },
      { ar: 'التصميم المتجاوب', en: 'Responsive Design' },
      { ar: 'تجربة المستخدم', en: 'User Experience' },
    ],
  },
  {
    icon: Network,
    title: { ar: 'الشبكات', en: 'Networking' },
    text: {
      ar: 'خبرة ميدانية من العمل اليومي في خدمات الإنترنت.',
      en: 'Field experience from day-to-day work in internet services.',
    },
    topics: [
      { ar: 'خدمات الإنترنت', en: 'Internet Services' },
      { ar: 'الشبكات المحلية', en: 'Local Networks' },
      { ar: 'حلول الاتصال', en: 'Connectivity' },
    ],
  },
];

/**
 * Tech strip. Three honest groups — no proficiency levels:
 *  - builtWith: technologies used to build THIS website (fact).
 *  - learning:  fields being studied / explored (interest, not a claim of mastery).
 *  - skills:    EMPTY by default — add only technologies you personally use.
 *               When not empty, a "My skills" row appears automatically.
 */
export const technologies = {
  builtWith: ['HTML5', 'CSS3', 'TypeScript', 'React', 'Vite', 'Motion'],
  learning: ['Python', 'Machine Learning', 'Neural Networks', 'Data Analysis', 'Computer Networks', 'Web Design'],
  skills: [] as string[],
};

/* ───────────── INTERNET SERVICE ───────────── */
export const internetFeatures: { icon: LucideIcon; title: L; text: L }[] = [
  {
    icon: Router,
    title: { ar: 'الاشتراك بالخدمة', en: 'Service Subscription' },
    text: {
      ar: 'الاستفسار عن الاشتراك بخدمة الإنترنت وطريقة البدء.',
      en: 'Ask about subscribing to the internet service and how to get started.',
    },
  },
  {
    icon: RadioTower,
    title: { ar: 'الاستفسار عن التغطية', en: 'Coverage Inquiry' },
    text: {
      ar: 'تواصل معي للتأكد من توفر الخدمة في موقعك.',
      en: 'Get in touch to check whether the service reaches your location.',
    },
  },
  {
    icon: Wrench,
    title: { ar: 'الدعم الفني', en: 'Technical Support' },
    text: {
      ar: 'المساعدة في مشاكل الاتصال وإعداد الشبكة المنزلية.',
      en: 'Help with connection issues and home network setup.',
    },
  },
  {
    icon: MessageCircleQuestionMark,
    title: { ar: 'استشارة سريعة', en: 'Quick Advice' },
    text: {
      ar: 'أي سؤال يخص الإنترنت والشبكات؟ راسلني مباشرة.',
      en: 'Any question about internet or networks? Message me directly.',
    },
  },
];
