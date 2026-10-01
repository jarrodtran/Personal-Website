export const siteUrl = "https://jarrodtran.com";

/** Official current title. Every surface (hero, bio, experience, JSON-LD) reads this one value. */
const currentTitle = "Lead, AI Enablement & Factory Strategy";

export type Audience = "tech" | "vc" | "consulting" | "startup";

export interface ImpactBullet {
  text: string;
  metric?: string;
  audiences?: Audience[];
}

export interface SectionCopy {
  eyebrow: string;
  title: string;
  description: string;
}

export interface WorkPanel {
  kicker: string;
  value: string;
  label: string;
}

export interface Role {
  title: string;
  dates: string;
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
  context: string;
  constraints: string[];
  decisions: string[];
  /** Longer outcome narrative; figures must stay on the résumé ledger. */
  outcomeDetail: string;
  /** What Jarrod personally owned. Prefer dropping a claim over inventing credit. */
  role: string[];
  /** Who else was in the room. No invented titles. */
  team: string[];
}

export interface SelectedWorkItem {
  /** Stable URL segment under /work/[slug]. */
  slug: string;
  title: string;
  problem: string;
  contribution: string;
  outcome: string;
  tags: string[];
  panel: WorkPanel;
  link?: { label: string; href: string };
  caseStudy: CaseStudy;
}

export interface SiteContent {
  positioning: {
    name: string;
    headline: string;
    headlineVariants: Record<Audience, string>;
    documentTitle: string;
    valueProp: string;
    status: string;
    location: string;
    currentRole: string;
    currentCompany: string;
  };
  highlights: { value: string; label: string; source?: string }[];
  about: {
    bio: string[];
    lookingFor: string[];
    lookingForIntro: string;
    strengths: string[];
    education: string;
    photo: { src: string; alt: string };
  };
  experience: Employer[];
  selectedWork: SelectedWorkItem[];
  principles: { title: string; description: string }[];
  capabilities: { group: string; items: string[] }[];
  sections: {
    experience: SectionCopy;
    work: SectionCopy;
    about: Omit<SectionCopy, "description">;
    approach: SectionCopy;
    capabilities: SectionCopy;
    contact: SectionCopy;
  };
  knowsAbout: string[];
  nav: { label: string; href: string }[];
  contact: {
    email: string;
    linkedin: string;
    github?: string;
    phone?: string;
    resumeHref: string;
    resumeFilename: string;
    calendar?: string;
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
    headline:
      "Product and strategy operator who ships AI product work and owns the outcome.",
    headlineVariants: {
      tech: "The person who takes an AI bet from a slide to something people use, with a P&L.",
      vc: "I put capital on the line, kill weak bets, and drive the rest to an outcome.",
      consulting:
        "I break a messy brief into economics, owners, and a weekly decision rhythm.",
      startup:
        "I walk into chaos, set the strategy, and stay until the numbers move.",
    },
    documentTitle: "Jarrod Tran · Product & strategy · Tesla, Apple, Waymo",
    valueProp:
      "I'm a corporate operator: unclear brief, real P&L. At Tesla Energy I lead AI enablement, a product and engineering team whose tools are in production. Previously Apple and Waymo.",
    status: "Open to conversations",
    location: "Houston, TX",
    currentRole: currentTitle,
    currentCompany: "Tesla Energy",
  },
  highlights: [
    {
      value: "1,000+",
      label: "Active users on AI tools I shipped",
      source: "Tesla Energy",
    },
    {
      value: "20+",
      label: "Production AI solutions",
      source: "Tesla Energy",
    },
    {
      value: "$156M",
      label: "Incremental annual profit",
      source: "Tesla Energy",
    },
    {
      value: "$260M",
      label: "Annualized savings",
      source: "Tesla Energy",
    },
  ],
  about: {
    bio: [
      "I take an unclear brief, set the approach, and stay until the numbers move.",
      `I work at Tesla Energy as ${currentTitle}. I built the team that ships our AI tools, got people using them, and put reporting in place so leadership can see whether the tools move the business.`,
      "Before that: Apple's 0→1 iPhone launch in India, Engineering Operations planning at Waymo, and Tesla Special Projects through the 4680 launch. When a staff meeting needs real numbers, I still build the model in Python or Tableau myself.",
    ],
    lookingForIntro:
      "I want a seat where product judgment and cross-functional leadership change the outcome.",
    lookingFor: [
      "A real business outcome and a named decision-maker, not a slide deck",
      "AI product work that reaches real users, past the pilot stage",
      "Ownership that runs from the plan through the result",
    ],
    strengths: [
      "Cross-functional leadership without waiting on an org chart",
      "AI products from the first use case to production",
      "Portfolio calls with a P&L attached",
      "Structured problem-solving a leadership team can actually run",
    ],
    education:
      "University at Buffalo · B.S. Business Administration, Finance · Cum Laude",
    photo: {
      src: "/avatar.webp",
      alt: "Jarrod Tran presenting on stage",
    },
  },
  experience: [
    {
      company: "Tesla",
      note: "Rejoined in 2023 after Apple and Waymo.",
      roles: [
        {
          title: currentTitle,
          dates: "Aug 2023 – Present",
          summary:
            "I own Tesla Energy’s AI enablement strategy and the product team that ships it: roadmap, governance, and executive reporting.",
          bullets: [
            {
              text: "Built and lead a forward-deployed AI product and engineering org at Tesla Energy, scaling adoption to 1,000+ active users across 20+ production AI solutions: RAG troubleshooting, automated reporting, workflow automation, and decision-support.",
              metric: "1,000+",
              audiences: ["tech", "startup"],
            },
            {
              text: "Modeled an AI productivity framework at roughly 540 reclaimed hours per week and $1.6M in annualized value, with MCP-based automation as additional upside as adoption grows.",
              metric: "$1.6M",
              audiences: ["tech", "vc"],
            },
            {
              text: "Owned the global investment roadmap across California, Texas, and Shanghai: scaled Megapack 3.2×, allocated $23M across 50+ initiatives for $156M in incremental annual profit, and led a separate program that delivered $260M in annualized savings.",
              metric: "$156M",
              audiences: ["vc", "consulting"],
            },
            {
              text: "Mitigated $550M in projected tariff exposure by redesigning the product and investment plan, then built and promoted successors so I could focus on AI transformation.",
              metric: "$550M",
              audiences: ["consulting", "startup"],
            },
          ],
        },
        {
          title: "Program Manager, Special Projects",
          dates: "Jun 2018 – Jun 2021",
          summary:
            "Special projects with no playbook: new technology and messy scale-ups.",
          bullets: [
            {
              text: "Advanced Project Roadrunner, Tesla's 4680 program, from early pilot to a launch-ready platform. Stage gates, readiness reviews, and cross-functional ownership through Battery Day.",
              audiences: ["startup", "tech"],
            },
            {
              text: "Designed and launched a $3.5M/month coordination platform (“Warehouse on Wheels”) to protect product availability during rapid scale-up.",
              metric: "$3.5M/month",
              audiences: ["startup", "tech"],
            },
            {
              text: "Led planning and recovery across Model 3 and Model Y programs through demand surges and supply disruptions.",
              audiences: ["startup", "tech"],
            },
          ],
        },
      ],
    },
    {
      company: "Waymo",
      roles: [
        {
          title: "Strategy & Operations Manager",
          dates: "Oct 2022 – May 2023",
          bullets: [
            {
              text: "Led annual planning, OKRs, and quarterly business reviews for Engineering Operations. Turned org priorities into resource plans, targets, and milestones.",
              audiences: ["consulting", "tech"],
            },
            {
              text: "Got hardware, software, fleet, Product, Legal, and Engineering onto the same facts, including safety and regulatory work for commercial autonomous-vehicle deployment.",
              audiences: ["consulting", "startup"],
            },
            {
              text: "Built leadership dashboards for performance, fleet health, and program milestones so senior leaders weren't stuck in ad-hoc reporting.",
              audiences: ["tech", "vc"],
            },
          ],
        },
      ],
    },
    {
      company: "Apple",
      roles: [
        {
          title: "Strategic Operations Program Manager",
          dates: "Jun 2021 – Jun 2022",
          bullets: [
            {
              text: "Led the 0→1 iPhone India launch from market entry and partner qualification through readiness and scaled delivery, under tight quality, regulatory, and timing requirements.",
              audiences: ["startup", "tech"],
            },
            {
              text: "Supported 293% year-over-year growth (4.3M → 16.9M units) and a program whose reported revenue grew from $2B to $10B by translating demand into investment and readiness plans.",
              metric: "293%",
              audiences: ["tech", "vc"],
            },
            {
              text: "Expanded iPhone India exports from 6 to 40+ countries, building a second-source network that reduced geographic concentration risk.",
              metric: "40+",
              audiences: ["consulting", "tech"],
            },
          ],
        },
      ],
    },
  ],
  selectedWork: [
    {
      slug: "tesla-energy-ai-product",
      title: "Tesla Energy: AI product that got used",
      problem:
        "Tesla Energy needed AI tools people would actually use. Priorities were scattered, use cases had no owners, and there was no way to tell whether adoption changed results.",
      contribution:
        "I stood up the product and engineering team, ranked the use cases, and set up training and adoption reporting for everything we shipped.",
      outcome:
        "Modeled at ~540 hours reclaimed per week and $1.6M in annualized productivity value.",
      tags: ["AI Product", "Organizational Design", "Executive Alignment"],
      panel: {
        kicker: "Tesla Energy",
        value: "1,000+",
        label: "Active users across 20+ production AI solutions",
      },
      link: { label: "Tesla Energy", href: "https://www.tesla.com/energy" },
      caseStudy: {
        context:
          "Scattered experiments sat next to real Energy work with no shared definition of done. Leaders wanted tools inside daily jobs, not another pilot deck.",
        constraints: [
          "Adoption had to be scored against workflows, not vanity installs",
          "Finite roadmap capacity meant every use case needed a named owner",
          "Security and data boundaries could not bend for release speed",
        ],
        decisions: [
          "Stand up a dedicated product-and-engineering squad instead of a side project",
          "Sequence the backlog by hours reclaimed and decision quality",
          "Ship training plus weekly adoption reporting with each release",
        ],
        outcomeDetail:
          "The portfolio reached 1,000+ active users across 20+ production AI solutions. Modeled impact sits near 540 hours given back each week and $1.6M in annualized productivity value.",
        role: [
          "Owned the enablement roadmap plus the executive reporting loop",
          "Hired and led the product-and-engineering squad",
          "Set prioritization rules, governance, and adoption metrics",
        ],
        team: [
          "Forward-deployed engineers embedded with Energy teams",
          "Product managers sequencing the use-case backlog",
          "Business sponsors who owned train-the-trainer coverage",
        ],
      },
    },
    {
      slug: "tesla-energy-portfolio",
      title: "Tesla Energy: make the portfolio executable",
      problem:
        "Demand outran what we could fund. 50+ asks. $23M to spend. Which dollar moved the P&L?",
      contribution:
        "I built Python and Tableau models linking investment, labor, cost, and timing. We funded the work with the best return and killed the rest. The same logic ranks AI use cases today.",
      outcome:
        "3.2× scale on Megapack, $260M in annualized savings, and $550M in tariff exposure mitigated.",
      tags: ["Capital Allocation", "Decision Models", "Executive Alignment"],
      panel: {
        kicker: "Tesla Energy",
        value: "$156M",
        label: "Incremental annual profit from a $23M portfolio",
      },
      link: { label: "Tesla Megapack", href: "https://www.tesla.com/megapack" },
      caseStudy: {
        context:
          "Capital requests ran ahead of the budget. Dozens of initiatives competed for the same dollars with weak ties to profit.",
        constraints: [
          "Only $23M was available against 50+ competing requests",
          "Leaders needed a transparent kill-or-fund rule, not a popularity contest",
          "Labor, cost, and timing had to live in one decision model",
        ],
        decisions: [
          "Wire each ask to return and risk inside Python and Tableau models",
          "Fund the highest-return work and stop the rest in public reviews",
          "Reuse the ranking method later when sequencing AI use cases",
        ],
        outcomeDetail:
          "The funded set delivered $156M in incremental annual profit, with 3.2× Megapack scale, $260M in annualized savings, and $550M in tariff exposure mitigated.",
        role: [
          "Owned the Energy investment roadmap and review cadence",
          "Built the models executives used to compare asks",
          "Facilitated the tradeoff sessions that stopped low-return work",
        ],
        team: [
          "Finance partners stress-testing cost and return assumptions",
          "Site and program leads accountable for execution",
          "Leadership sponsors who enforced the kill list",
        ],
      },
    },
    {
      slug: "apple-iphone-india",
      title: "Apple: 0→1 iPhone India",
      problem:
        "India had to go from plan to scaled launch while market entry, partner readiness, and demand were all still moving.",
      contribution:
        "I drove market-entry decisions, partner qualification, and launch readiness, and kept demand, quality, and geopolitical risk in one plan.",
      outcome:
        "Program revenue grew from $2B to $10B, and exports expanded from 6 to 40+ countries.",
      tags: ["0→1 Launch", "Geographic Strategy", "Cross-Functional Delivery"],
      panel: {
        kicker: "Apple",
        value: "293%",
        label: "Year-over-year growth, 4.3M → 16.9M units",
      },
      link: { label: "Apple India", href: "https://www.apple.com/in/" },
      caseStudy: {
        context:
          "India had to leave the slideware stage and become a live, scaled iPhone footprint while partners and demand kept shifting.",
        constraints: [
          "Quality and regulatory bars could not slip to buy speed",
          "Partner readiness trailed the volume curve",
          "Geopolitical risk had to sit inside the same plan as demand",
        ],
        decisions: [
          "Treat entry calls, partner checks, and go-live gates as one program",
          "Convert volume signals into funding and readiness plans leaders could run weekly",
          "Seed alternate sources so exports were not pinned to one geography",
        ],
        outcomeDetail:
          "Reported program revenue moved from $2B to $10B while volume grew 293% year over year (4.3M → 16.9M units). Exports reached 40+ countries.",
        role: [
          "Led the India launch program end to end",
          "Kept entry, partners, and readiness on one schedule",
          "Brought quality, regulatory, and timing risks to leadership",
        ],
        team: [
          "Operations and quality partners closest to the work",
          "Commercial and planning stakeholders sizing demand",
          "Leadership reviewers on stage gates",
        ],
      },
    },
    {
      slug: "waymo-engineering-ops",
      title: "Waymo: one plan, six functions",
      problem:
        "Each function ran its own planning, and leadership settled conflicts with data nobody else trusted.",
      contribution:
        "I built the annual planning, OKR, resource-plan, QBR, and dashboard rhythm that every function worked from.",
      outcome:
        "A shared Engineering Operations rhythm that forced tradeoffs into the open and cut the ad-hoc reporting.",
      tags: ["Operating Model", "Executive Cadence", "Decision Systems"],
      panel: {
        kicker: "Waymo",
        value: "One plan",
        label: "Six functions on one shared scoreboard",
      },
      link: { label: "Waymo", href: "https://waymo.com/" },
      caseStudy: {
        context:
          "Planning lived in silos. Leaders reconciled conflicting numbers in meetings that rarely produced a single source of truth.",
        constraints: [
          "Safety and regulatory work had to stay first-class in every plan",
          "Six functions needed shared targets without private scorekeeping",
          "Senior time was burning on one-off decks",
        ],
        decisions: [
          "Install one cadence covering OKRs, resources, QBRs, and dashboards",
          "Move tradeoffs into scheduled reviews instead of private escalations",
          "Publish dashboards covering performance, vehicle health, and milestones",
        ],
        outcomeDetail:
          "Cross-functional plans finally shared one calendar and one set of numbers. Escalations moved into scheduled reviews, and one-off reporting requests fell.",
        role: [
          "Facilitated planning and QBR cycles for Engineering Operations",
          "Built the scoreboard leadership used instead of ad-hoc pulls",
          "Aligned targets and resources across functions",
        ],
        team: [
          "Engineering Operations partners who ran the cadence",
          "Function leads accountable for their slice of the plan",
          "Senior leaders who consumed the shared scoreboard",
        ],
      },
    },
  ],
  principles: [
    {
      title: "Ground truth",
      description:
        "Get the outcome, constraints, economics, and assumptions on the table before anyone spends. Structured problem-solving starts there.",
    },
    {
      title: "System map",
      description:
        "Follow the dependencies, incentives, and bottlenecks. Most of the time the strategy is fine and the handoffs are not.",
    },
    {
      title: "Simplify",
      description:
        "Cut work that doesn't serve the outcome. On Megapack that was 50+ requests down to a ranked $23M portfolio.",
    },
    {
      title: "Commit",
      description:
        "Name the tradeoff, the owner, and the next move. If you can't run it, it isn't a strategy.",
    },
    {
      title: "Compound",
      description:
        "Put in the feedback, and the automation, that lets the system get better as it grows. That includes AI, when it earns the slot.",
    },
  ],
  capabilities: [
    {
      group: "Strategy & Product",
      items: [
        "Problem framing",
        "Capital allocation",
        "0→1 launches",
        "New product introduction",
        "Portfolio management",
        "Geographic expansion",
        "Business cases",
        "Stage-gate design",
      ],
    },
    {
      group: "AI & Analytics",
      items: [
        "AI product strategy",
        "AI enablement",
        "Forward-deployed engineering",
        "Use-case prioritization",
        "Decision models",
      ],
    },
    {
      group: "Leadership & Influence",
      items: [
        "Cross-functional leadership",
        "Executive reporting",
        "Stakeholder alignment",
        "Workforce planning",
        "Organizational design",
        "Special projects",
        "Change management",
        "OKRs & QBRs",
      ],
    },
    {
      group: "Tools & Platforms",
      items: ["Python", "Tableau", "Excel to executive-ready", "SQL"],
    },
  ],
  sections: {
    experience: {
      eyebrow: "01 / Career",
      title: "Experience",
      description:
        "Tesla, Apple, Waymo. I lead with the result, then how we got it.",
    },
    work: {
      eyebrow: "02 / Case studies",
      title: "Selected work",
      description:
        "AI at Tesla Energy, the investment portfolio behind it, iPhone India, and Waymo planning. Same job each time: name the problem, model the economics, pick an owner, ship.",
    },
    about: {
      eyebrow: "03 / Profile",
      title: "About Jarrod",
    },
    approach: {
      eyebrow: "04 / Approach",
      title: "How I work",
      description:
        "I start from the facts, then build a system the team can run.",
    },
    capabilities: {
      eyebrow: "05 / Toolkit",
      title: "Capabilities",
      description:
        "AI product work, structured problem-solving, and the leadership to make both stick.",
    },
    contact: {
      eyebrow: "06 / Contact",
      title: "Let's talk about product, strategy, and AI roles.",
      description:
        "Open to growth-stage tech, consulting, early-stage startups, and VC-adjacent operator seats. Houston-based; I'll relocate for the right role.",
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
    { label: "Experience", href: "#experience" },
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ],
  contact: {
    email: "jarrodtran@outlook.com",
    phone: "(607) 760-2068",
    linkedin: "https://www.linkedin.com/in/jarrodtran/",
    github: "https://github.com/jarrodtran",
    resumeHref: "/resume.pdf",
    resumeFilename: "Jarrod-Tran-Resume.pdf",
  },
  outreach: {
    linkedin:
      "I do product and strategy work, including AI product, at Tesla Energy after Apple and Waymo. 1,000+ people on tools we shipped. Looking at growth-stage tech, consulting, early-stage startups, and VC-adjacent seats. Happy to compare notes.",
    email:
      "I'm a corporate operator doing product, strategy, and AI product work. I lead AI enablement at Tesla Energy (1,000+ users, $1.6M modeled annualized value) after Apple and Waymo. Exploring growth-stage tech, consulting, early-stage startups, or a VC-adjacent operator role if the brief is real.",
    intro:
      "Jarrod Tran is a corporate operator for product and strategy. He leads AI enablement at Tesla Energy, with AI product work in use by 1,000+ people and $156M incremental profit on the business side. He's looking at growth-stage tech, consulting, early-stage startups, and VC-adjacent operator seats.",
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
