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
      "Some of it is about work and some of it is not. By day I run the team that puts AI to work at Tesla Energy, after earlier stints at Apple and Waymo. I’m based in Houston.",
    documentTitle: "Jarrod Tran · Worth Mulling",
    valueProp:
      "Jarrod Tran writes Worth Mulling, essays on whatever he is thinking through, and leads AI enablement at Tesla Energy.",
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
      "Whatever I’m thinking about, and wherever the rabbit hole goes.",
    empty: "The first essay is coming soon.",
    allEssays: "All essays",
    readLatest: "Read the latest essay",
    subscribe: {
      title: "Get new essays by email",
      body: "Whatever I’m thinking about, or the rabbit hole I went down lately, written up when it’s worth sharing.",
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
      "I’m Jarrod Tran. I live in Houston and write Worth Mulling when something is worth working through on the page, work or not.",
      `By day I’m ${currentTitle} at Tesla Energy, where I built the AI team and the program it runs on from nothing. Before that I worked at Apple, Waymo and Amazon.`,
    ],
  },
  experience: resumeExperience(),
  selectedWork: [
    {
      slug: "tesla-energy-ai-product",
      preview: "How we chose use cases, trained users, and tracked adoption.",
      title: "Tesla Energy: From AI pilots to daily use",
      problem:
        "Tesla Energy had AI pilots, but teams lacked a shared way to choose which ones to ship or measure their value after launch.",
      contribution:
        "I built the team and our forward-deployed engineering program, ranked the use cases, and set up training and adoption reporting for everything we shipped.",
      outcome:
        "Modeled at ~540 hours reclaimed per week and $1.6M in annualized productivity value.",
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
          "Some pilots showed promise. The harder question was whether they would help with work people already did.",
          "I hired the team and decided what gets built. Tools we shipped include an internal agent chat that offloads agentic work, an automated résumé reviewer inside a hiring hub, operations automations, 3D product models in Three.js for onboarding, and executive daily task automations.",
          "I set the program up around forward-deployed engineering: the deployment model, AI training, and architecture and security reviews. The tools run on Claude and Grok.",
        ],
        constraints: [
          "Anything that touches personal data is off the table. People attendance is the example: it involves personally identifiable information, so we say no.",
          "The team was four people, so each use case needed an owner.",
          "Releases had to meet security and data requirements.",
          "Adoption is counted as unique logins, so access alone does not count.",
        ],
        decisions: [
          "Hire a dedicated product and engineering team instead of relying on one-off pilots, so every tool had someone responsible for it.",
          "Fund what saves the most time or improves decisions, and turn down the rest.",
          "Decline every use case that touches personal data, even when the request is reasonable.",
          "Ship training with each release and report adoption every week, because a tool nobody opens saves no time.",
          "Run every tool through architecture review, security review and user feedback testing before release, so nothing ships on enthusiasm alone.",
        ],
        outcomeDetail: [
          "The team has shipped 20+ production AI tools with 1,000+ active users. The program is open to 10,000 eligible employees. Time to hire dropped by 2 weeks with the hiring hub. The team is four people today, and the budget allows 15.",
          "Our productivity model estimates about 540 hours saved per week, worth $1.6M a year. Early on, we used too much technical language. The lesson: people need to know what a tool does for their work, not how it works.",
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
        "I built Python and Tableau models linking investment, labor, cost, and timing. We funded the work with the best return and killed the rest. The same logic ranks AI use cases today.",
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
          "The funding decision depended on how each proposal would affect profit, what it would cost, and when it could deliver.",
          "Some calls were concrete. We funded an automated welding robot install. We cut a plan to add another crane, because installing it required too much downtime.",
        ],
        constraints: [
          "Only $23M was available against 50+ competing requests.",
          "Each project in California was judged on capital cost, feasibility and overall impact on the site.",
          "The extra crane would have needed too much downtime to install.",
          "Tariff rates changed while plans were running, so the timing of imports mattered.",
        ],
        decisions: [
          "Use Python and Tableau models to compare expected returns, so leaders could rank requests on one basis.",
          "Fund the welding robot install and cut the extra crane, because the crane needed too much downtime.",
          "Coordinate the California site investment myself and make the yes or no call on each project, so one person owned the answer.",
          "For battery modules imported from China, time entry to and exit from foreign-trade zones to match tariff rates as they changed, close to a hedge, and fast-track more foreign-trade zones and tariff exclusions.",
        ],
        outcomeDetail: [
          "The funded portfolio delivered $156M in incremental annual profit. The $23M California site investment unlocked 7.5% more capacity and incremental profit for Megapack.",
          "Megapack scaled 3.2×, and the investment plan mitigated $550M in projected tariff exposure. A separate program, built on robotic automation and headcount optimization, saved $260M on an annualized basis.",
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
        "Balancing demand, partner readiness, and risk during a new market launch.",
      title: "Apple: Launching iPhone in India",
      problem:
        "Apple needed to prepare partners for the iPhone launch in India while demand and readiness were changing.",
      contribution:
        "I led production strategy and kept demand, quality, and geopolitical risk in one plan.",
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
          "I owned the production strategy for iPhone in India. Sites began as greenfield and reached full-scale production. The footprint grew across Chennai and Bangalore.",
          "Launch planning also had to account for partner qualification, quality requirements, and regulatory approvals.",
        ],
        constraints: [
          "The schedule had to meet quality and regulatory requirements.",
          "Partner readiness lagged expected volume.",
          "Yield had to be right before shipping, even with a projected launch date to hit.",
          "Demand forecasts and geopolitical risk both shaped readiness decisions.",
        ],
        decisions: [
          "Pause to improve yield, even though it put us behind the projected launch. We wanted the product right before it shipped. This was the hardest call.",
          "Use one schedule for market entry, partner checks, and launch readiness, so timing risks showed up in one place.",
          "Turn demand forecasts into funding and readiness plans for weekly review.",
          "Qualify additional sources to reduce dependence on one geography.",
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
        "I built the annual planning, OKR, resource-plan, QBR, and dashboard rhythm that every function worked from.",
      outcome:
        "A shared Engineering Operations rhythm that forced tradeoffs into the open and cut the ad-hoc reporting.",
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
          "Six functions planned on their own. Reporting was manual or sent by email.",
        ],
        constraints: [
          "Every plan had to account for safety and regulatory work.",
          "Teams needed shared targets and a common way to track them.",
          "Manual and emailed reporting took time away from planning work.",
        ],
        decisions: [
          "Put goals, resource plans, and quarterly reviews on one schedule, so every function worked from the same dates.",
          "Bring decisions about priorities and resources into scheduled reviews, so tradeoffs were made in the open.",
          "Build dashboards and automations covering performance, vehicle health, and milestones in place of manual and emailed reports.",
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
        title: "Start with the work, not the model.",
        body: "We fund tools that cut the most time or improve a decision, and say no to the rest.",
      },
      {
        title: "Give every tool an owner.",
        body: "A team of four cannot babysit pilots, so someone is accountable for each use case before we build it.",
      },
      {
        title: "Review before release.",
        body: "Each tool passes architecture review and security review, then testing with the people who will use it.",
      },
      {
        title: "Count use, not launches.",
        body: "We report active users every week. A tool no one opens saves no time.",
      },
      {
        title: "Decline what touches personal data.",
        body: "Attendance tracking is the standing example. The request is reasonable and we still say no.",
      },
      {
        title: "Say what it does, not how it works.",
        body: "Early on we explained tools in technical language and lost people. People need to see what a tool changes in their day.",
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
      "If an essay connects with something you’re working through, I’d like to hear about it. Email is the best way to reach me.",
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
