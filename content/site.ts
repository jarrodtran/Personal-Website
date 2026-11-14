import { resumeExperience } from "./resume";

export const siteUrl = "https://jarrodtran.com";

/** Official current title. Every surface (bio, experience, JSON-LD) reads this one value. */
const currentTitle = "Lead, AI Enablement & Factory Strategy";

export interface ImpactBullet {
  text: string;
  metric?: string;
  group?: string;
}

export interface WorkPanel {
  kicker: string;
  value: string;
  label: string;
  /** Two or three supporting figures, each already in this item's copy. */
  supporting?: { value: string; label: string }[];
}

export interface Role {
  title: string;
  dates: string;
  location?: string;
  summary?: string;
  bullets: ImpactBullet[];
}

export interface Employer {
  company: string;
  note?: string;
  roles: Role[];
}

export interface CaseStudy {
  /** Opening scene for the deep page. */
  context: string | string[];
  constraints: string[];
  decisions: string[];
  /** Longer outcome narrative; figures must stay on the résumé ledger. */
  outcomeDetail: string | string[];
  /** What Jarrod personally owned. Prefer dropping a claim over inventing credit. */
  role: string[];
}

export interface SelectedWorkItem {
  /** Stable URL segment under /work/[slug]. */
  slug: string;
  title: string;
  preview: string;
  problem: string;
  contribution: string;
  outcome: string;
  panel: WorkPanel;
  link?: { label: string; href: string };
  caseStudy: CaseStudy;
}

export interface SiteContent {
  positioning: {
    name: string;
    headline: string;
    /** First sentence of the hero, set in the display face. */
    lede: string;
    /** The rest of the hero introduction, set at body size. */
    intro: string;
    documentTitle: string;
    valueProp: string;
    status: string;
    location: string;
    currentRole: string;
    /** Hero primary action while there are no essays. Links to #work. */
    workAction: string;
  };
  /**
   * Public Substack. `url` is the only publication setting: subscribe href,
   * `/feed`, and the allowed https host are all derived from it.
   * `name` drives the #writing heading.
   */
  substack: {
    name: string;
    url: string;
  };
  /** Copy for the latest-essays list, the /writing/ archive, and subscribe prompts. */
  writing: {
    latestTitle: string;
    archiveIntro: string;
    empty: string;
    allEssays: string;
    readLatest: string;
    subscribe: {
      title: string;
      body: string;
      action: string;
      note: string;
      short: string;
    };
    essay: {
      minutes: string;
      onSubstack: string;
    };
  };
  about: {
    bio: string[];
  };
  experience: Employer[];
  selectedWork: SelectedWorkItem[];
  approach: {
    title: string;
    principles: { title: string; body: string }[];
  };
  sections: {
    work: { title: string };
    about: { title: string };
  };
  knowsAbout: string[];
  nav: { label: string; href: string }[];
  contact: {
    email: string;
    linkedin: string;
    github?: string;
    resumeHref: string;
    /** On-site résumé page; every "Résumé" link opens it. */
    resumePage: string;
    resumeFilename: string;
    calendar?: string;
    intro: string;
  };
  /** Paste-ready outreach. Not rendered on the public site. */
  outreach: {
    linkedin: string;
    email: string;
    intro: string;
  };
}

export const site: SiteContent = {
  positioning: {
    name: "Jarrod Tran",
    headline: "Jarrod Tran",
    lede: "I write Worth Mulling, where I think through whatever I’ve been chewing on lately.",
    intro:
      "Sometimes it’s about work, sometimes it’s not. My day job is running the AI team at Tesla Energy. Before that I was at Apple and Waymo. I live in Houston.",
    documentTitle: "Jarrod Tran · Worth Mulling",
    valueProp:
      "Jarrod Tran writes Worth Mulling and leads AI enablement at Tesla Energy. He lives in Houston.",
    status: "Worth Mulling",
    location: "Houston, TX",
    currentRole: currentTitle,
    workAction: "Selected work",
  },
  substack: {
    name: "Worth Mulling",
    url: "https://jarrodtran.substack.com",
  },
  writing: {
    latestTitle: "Latest essays",
    archiveIntro:
      "Thoughts on whatever I’ve been exploring, and the rabbit holes that came with it.",
    empty: "The first essay is coming soon.",
    allEssays: "All essays",
    readLatest: "Read the latest essay",
    subscribe: {
      title: "Get new essays by email",
      body: "I write when I’ve gone down a rabbit hole and come back with something worth sharing.",
      action: "Subscribe",
      note: "Free. Sent through Substack. Unsubscribe anytime.",
      short: "If this was worth mulling, get the next one by email.",
    },
    essay: {
      minutes: "min read",
      onSubstack: "Comment or share on Substack",
    },
  },
  about: {
    bio: [
      "I’m Jarrod. I started Worth Mulling to get my thoughts down on paper and keep the brain rot away. I write about whatever I’ve been exploring, which usually means I fell down a rabbit hole first.",
      "Outside of work I’m a huge sports fan. Manchester City and the New England Patriots are my teams. I also work on AI literacy projects.",
      `At Tesla Energy I’m ${currentTitle}. I built the AI team from scratch, along with the program it runs on. Earlier I worked at Apple and Waymo, did a first stretch at Tesla, and started out at Amazon.`,
    ],
  },
  experience: resumeExperience(),
  selectedWork: [
    {
      slug: "tesla-energy-ai-product",
      preview: "How we picked what to build and got people using it.",
      title: "Tesla Energy: From AI pilots to daily use",
      problem:
        "Tesla Energy had AI pilots but no shared way to decide which ones to ship, or to tell whether they were worth it after launch.",
      contribution:
        "I built the team and our forward-deployed engineering program, ranked the use cases, and set up training and adoption reporting for everything we shipped.",
      outcome:
        "Our model puts it at about 540 hours saved a week, worth $1.6M a year.",
      panel: {
        kicker: "Tesla Energy",
        value: "1,000+",
        label: "Active users across 20+ production AI tools",
        supporting: [
          { value: "2 weeks", label: "Faster time to hire" },
          { value: "~540", label: "Hours reclaimed per week, modeled" },
          { value: "$1.6M", label: "Annualized productivity value" },
        ],
      },
      link: { label: "Tesla Energy", href: "https://www.tesla.com/energy" },
      caseStudy: {
        context: [
          "We had pilots that looked promising. What we didn’t know was whether they’d help with the work people were already doing.",
          "I hired the team and I decide what gets built. So far that includes an internal agent chat that takes on agentic work, a hiring hub with an automated résumé reviewer, operations automations, 3D product models in Three.js for onboarding, and daily task automations for executives.",
          "The program is built around forward-deployed engineering. That covers how we deploy, AI training, and the architecture and security reviews. The tools run on Claude and Grok.",
        ],
        constraints: [
          "We don’t build anything that touches personal data. People attendance is the usual example. It involves personally identifiable information, so we say no.",
          "There were four of us, so every use case needed an owner.",
          "Releases had to meet security and data requirements.",
          "We count adoption by unique logins. Having access doesn’t count.",
        ],
        decisions: [
          "We stopped relying on one-off pilots and hired a dedicated product and engineering team, so every tool has someone responsible for it.",
          "We fund whatever saves the most time or improves a decision. Everything else waits or gets a no.",
          "We turn down any use case involving personal data, even when the request is a reasonable one.",
          "Every release ships with training, and we report adoption weekly.",
          "Before release, each tool gets an architecture review, a security review and user feedback testing.",
        ],
        outcomeDetail: [
          "The team has shipped 20+ production AI tools, and 1,000+ people actively use them. The program is open to 10,000 eligible employees. With the hiring hub, hiring got 2 weeks faster. We’re four people today and have budget for 15.",
          "Our productivity model estimates about 540 hours saved per week, worth $1.6M a year. One thing I’d do differently: we used too much technical language early on. People want to know what a tool does for their work. Most don’t need to hear how it works.",
        ],
        role: [
          "Owned the AI roadmap and reported adoption to leadership",
          "Hired and led the AI product and engineering team",
          "Designed the forward-deployed engineering program and its review process",
          "Set the rules for what we build, including the personal-data limit",
        ],
      },
    },
    {
      slug: "tesla-energy-portfolio",
      preview: "How we compared competing investments and chose what to fund.",
      title: "Tesla Energy: Choosing what to fund",
      problem:
        "50+ initiatives competed for a $23M budget. Leadership needed a way to compare their expected returns.",
      contribution:
        "I built Python and Tableau models that tied together investment, labor, cost and timing. We funded what had the best return and cut the rest. I rank AI use cases the same way today.",
      outcome:
        "Megapack scaled 3.2× and tariff exposure fell by a projected $550M. A separate program saved $260M on an annualized basis.",
      panel: {
        kicker: "Tesla Energy",
        value: "$156M",
        label: "Incremental annual profit from a $23M portfolio",
        supporting: [
          { value: "50+", label: "Competing initiatives" },
          { value: "7.5%", label: "More capacity at the California site" },
          { value: "3.2×", label: "Megapack scale-up" },
        ],
      },
      link: { label: "Tesla Megapack", href: "https://www.tesla.com/megapack" },
      caseStudy: {
        context: [
          "For every proposal we looked at what it would do for profit, what it would cost, and when it could deliver.",
          "Two examples: we funded an automated welding robot install, and we cut a plan to add another crane because putting it in meant too much downtime.",
        ],
        constraints: [
          "Only $23M was available against 50+ competing requests.",
          "Each project in California was judged on capital cost, feasibility and overall impact on the site.",
          "Tariff rates kept changing while plans were in motion, so import timing mattered.",
        ],
        decisions: [
          "We used the models to compare expected returns, which let leaders rank every request the same way.",
          "We funded the welding robots and cut the extra crane.",
          "I coordinated the California site investment and made the yes or no call on each project.",
          "For battery modules imported from China, we timed entry into and exit from foreign-trade zones to match tariff rates as they changed. It worked a lot like a hedge. We also fast-tracked more foreign-trade zones and tariff exclusions.",
        ],
        outcomeDetail: [
          "The funded portfolio delivered $156M in incremental annual profit. The $23M California site investment unlocked 7.5% more capacity and incremental profit for Megapack.",
          "Megapack scaled 3.2×, and the investment plan mitigated $550M in projected tariff exposure. A separate program for robotic automation and headcount optimization saved $260M on an annualized basis.",
        ],
        role: [
          "Owned the Energy investment roadmap and scheduled funding reviews",
          "Ran the California site investment, including each yes or no decision",
          "Built the models executives used to compare proposals",
        ],
      },
    },
    {
      slug: "apple-iphone-india",
      preview:
        "Standing up iPhone production in India, and the call to pause for yield.",
      title: "Apple: Launching iPhone in India",
      problem:
        "Apple was launching iPhone in India and needed partners ready while demand and readiness kept changing.",
      contribution:
        "I led production strategy and kept demand, quality and geopolitical risk in a single plan.",
      outcome:
        "Program revenue grew from $2B to $10B, and exports expanded from 6 to 40+ countries.",
      panel: {
        kicker: "Apple",
        value: "293%",
        label: "Year-over-year growth, 4.3M → 16.9M units",
        supporting: [
          { value: "$2B → $10B", label: "Program revenue" },
          { value: "6 → 40+", label: "Countries exported to" },
        ],
      },
      link: { label: "Apple India", href: "https://www.apple.com/in/" },
      caseStudy: {
        context: [
          "I owned production strategy for iPhone in India. The sites started as greenfield and got to full-scale production, and we expanded across Chennai and Bangalore.",
          "Launch planning also had to account for partner qualification, quality requirements, and regulatory approvals.",
        ],
        constraints: [
          "The schedule had to meet quality and regulatory requirements.",
          "Partner readiness lagged expected volume.",
          "Yield had to be right before we shipped, even with a launch date to hit.",
          "Demand forecasts and geopolitical risk both shaped readiness decisions.",
        ],
        decisions: [
          "We paused to improve yield, which put us behind the projected launch. We wanted the product right before it shipped. It was the hardest call of the program.",
          "We ran market entry, partner checks and launch readiness on one schedule, which put the timing risks in one place.",
          "We turned demand forecasts into funding and readiness plans and reviewed them every week.",
          "We qualified additional sources so we depended less on one geography.",
        ],
        outcomeDetail: [
          "Reported program revenue grew from $2B to $10B, and exports expanded from 6 to 40+ countries. Units grew 293%, from 4.3M to 16.9M.",
          "The yield pause cost us time against the plan. We caught up later through other initiatives.",
        ],
        role: [
          "Owned the production strategy end to end",
          "Expanded the footprint across Chennai and Bangalore",
          "Brought the yield pause and other timing and quality risks to leadership",
        ],
      },
    },
    {
      slug: "waymo-engineering-ops",
      preview: "How we gave engineering leaders a shared view of progress.",
      title: "Waymo: one plan, six functions",
      problem:
        "Six functions planned separately. When their numbers differed, leadership had to reconcile them before making decisions.",
      contribution:
        "I set up the annual planning, OKRs, resource plans, QBRs and dashboards that every function worked from.",
      outcome:
        "Engineering Operations got one shared plan, tradeoffs were made where everyone could see them, and ad-hoc reporting dropped.",
      panel: {
        kicker: "Waymo",
        value: "200+",
        label: "People in one engineering org, working from a single plan",
        supporting: [
          { value: "Six", label: "Functions planning from one calendar" },
        ],
      },
      link: { label: "Waymo", href: "https://waymo.com/" },
      caseStudy: {
        context: [
          "Engineering Operations needed one plan that brought commercial deployment, safety, and regulatory priorities together.",
          "Six functions each planned on their own, and reporting was manual or sent by email.",
        ],
        constraints: [
          "Every plan had to account for safety and regulatory work.",
          "Teams needed shared targets and a common way to track them.",
          "Manual and emailed reporting took time away from planning work.",
        ],
        decisions: [
          "We put goals, resource plans and quarterly reviews on one schedule so every function worked from the same dates.",
          "We moved decisions about priorities and resources into scheduled reviews, where the tradeoffs were visible to all six functions.",
          "We built dashboards and automations for performance, vehicle health and milestones to replace the manual and emailed reports.",
        ],
        outcomeDetail: [
          "Teams used the same calendar and figures to make tradeoffs in scheduled reviews. One plan covered a 200+ person engineering organization.",
          "Dashboards replaced the emailed reports, and one-off reporting requests dropped.",
        ],
        role: [
          "Led planning and quarterly reviews for Engineering Operations",
          "Built the dashboards leaders used to track progress",
          "Aligned targets and resources across functions",
        ],
      },
    },
  ],
  approach: {
    title: "How I deploy AI",
    principles: [
      {
        title: "Start with the work.",
        body: "We look for the tasks eating the most time and the decisions that could be better, and build for those. The rest gets a no.",
      },
      {
        title: "Every tool gets an owner.",
        body: "There are four of us and we can’t babysit pilots. Someone has to own a use case before we build it.",
      },
      {
        title: "It gets reviewed before it ships.",
        body: "Architecture review first, then security review. After that, the people who’ll use the tool test it.",
      },
      {
        title: "We count who uses it.",
        body: "We report active users every week. If nobody opens a tool, it isn’t saving anyone time.",
      },
      {
        title: "We don’t touch personal data.",
        body: "Attendance tracking is the usual example. It’s a fair ask, but it involves personal information, so we turn it down.",
      },
      {
        title: "We explain it in plain language.",
        body: "Early on we got too technical and lost people. What they want to know is what a tool changes in their day.",
      },
    ],
  },
  sections: {
    about: {
      title: "About",
    },
    work: {
      title: "Selected work",
    },
  },
  knowsAbout: [
    "AI product",
    "Cross-functional leadership",
    "Structured problem-solving",
    "Capital allocation",
    "0→1 launches",
  ],
  nav: [
    { label: "Writing", href: "/writing/" },
    { label: "About", href: "#about" },
    { label: "Work", href: "#work" },
    { label: "Résumé", href: "/resume/" },
  ],
  contact: {
    email: "jarrodtran@outlook.com",
    linkedin: "https://www.linkedin.com/in/jarrodtran/",
    github: "https://github.com/jarrodtran",
    resumeHref: "/resume.pdf",
    resumePage: "/resume/",
    resumeFilename: "Jarrod-Tran-Resume.pdf",
    intro:
      "If something I wrote got you thinking, I’d like to hear about it. Email is the best way to reach me.",
  },
  outreach: {
    linkedin:
      "Product and strategy at Tesla Energy (AI product) after Apple and Waymo. 1,000+ people on tools we shipped. Looking at growth-stage tech, consulting, early-stage startups, and VC-adjacent seats. Happy to talk.",
    email:
      "I do product, strategy, and AI product work. I lead AI enablement at Tesla Energy (1,000+ users, $1.6M modeled annualized value) after Apple and Waymo. Open to growth-stage tech, consulting, early-stage startups, or a VC-adjacent operator role when the brief is real.",
    intro:
      "Jarrod Tran does product and strategy work. He leads AI enablement at Tesla Energy: AI tools in use by 1,000+ people, plus $156M incremental profit on the business side. He's looking at growth-stage tech, consulting, early-stage startups, and VC-adjacent operator seats.",
  },
};

export function getSelectedWorkBySlug(
  slug: string,
): SelectedWorkItem | undefined {
  return site.selectedWork.find((item) => item.slug === slug);
}

export function selectedWorkSlugs(): string[] {
  return site.selectedWork.map((item) => item.slug);
}

export function nextSelectedWork(slug: string): SelectedWorkItem | undefined {
  const items = site.selectedWork;
  const index = items.findIndex((item) => item.slug === slug);
  if (index === -1) return undefined;
  return items[(index + 1) % items.length];
}
