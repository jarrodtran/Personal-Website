export const siteUrl = "https://jarrodtran.com";

/** Official current title. Every surface (bio, experience, JSON-LD) reads this one value. */
const currentTitle = "Lead, AI Enablement & Factory Strategy";

export type Audience = "tech" | "vc" | "consulting" | "startup";

export interface ImpactBullet {
  text: string;
  metric?: string;
  audiences?: Audience[];
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
}

export interface SelectedWorkItem {
  /** Stable URL segment under /work/[slug]. */
  slug: string;
  title: string;
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
    headlineVariants: Record<Audience, string>;
    documentTitle: string;
    valueProp: string;
    status: string;
    location: string;
    currentRole: string;
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
  highlights: { value: string; label: string; source?: string }[];
  about: {
    bio: string[];
    lookingFor: string[];
    lookingForIntro: string;
    strengths: string[];
    education: string;
  };
  experience: Employer[];
  selectedWork: SelectedWorkItem[];
  principles: { title: string; description: string }[];
  sections: {
    experience: { title: string };
    work: { title: string };
    about: { title: string };
    approach: { title: string };
    contact: { title: string };
  };
  knowsAbout: string[];
  nav: { label: string; href: string }[];
  contact: {
    email: string;
    linkedin: string;
    github?: string;
    resumeHref: string;
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
    headline: "I write about AI product work, judgment, and making a P&L move.",
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
      "I lead AI enablement at Tesla Energy. The tools are in use by 1,000+ people. Before that: Apple and Waymo.",
    status: "Houston, TX",
    location: "Houston, TX",
    currentRole: currentTitle,
  },
  substack: {
    name: "Worth Mulling",
    url: "https://jarrodtran.substack.com",
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
      `I work at Tesla Energy as ${currentTitle}. I built the team that ships our AI tools, got people using them, and put reporting in place so leadership can see whether the tools move the business. Before that: Apple's 0→1 iPhone launch in India, Engineering Operations planning at Waymo, and Tesla Special Projects through the 4680 launch.`,
    ],
    lookingForIntro:
      "I want a seat where my judgment changes the outcome, not just the deck.",
    lookingFor: [
      "A real business outcome and a named decision-maker",
      "AI product work that real people use (past the pilot)",
      "Own the plan and stay through the result",
    ],
    strengths: [
      "Lead across functions without waiting on an org chart",
      "Take AI products from first use case to production",
      "Make portfolio calls with a P&L attached",
      "Solve messy problems in a way a leadership team can run",
    ],
    education:
      "University at Buffalo · B.S. Business Administration, Finance · Cum Laude",
  },
  experience: [
    {
      company: "Tesla",
      note: "Rejoined in 2023 after Apple and Waymo.",
      roles: [
        {
          title: currentTitle,
          dates: "Aug 2023 - Present",
          bullets: [
            {
              text: "Stood up a forward-deployed product and engineering team. The team shipped 20+ production AI solutions.",
              metric: "20+",
              audiences: ["tech", "startup"],
            },
            {
              text: "Reported weekly adoption for those solutions. Active users reached 1,000+.",
              metric: "1,000+",
              audiences: ["tech", "startup"],
            },
            {
              text: "Led AI enablement for 10,000 Tesla Energy employees, from the current workflow through handoff to a sustaining team.",
              metric: "10,000",
              audiences: ["tech", "consulting"],
            },
            {
              text: "Modeled about 540 hours reclaimed per week. Annualized value of that estimate: $1.6M.",
              metric: "$1.6M",
              audiences: ["tech", "vc"],
            },
            {
              text: "Sequenced a $23M portfolio of 50+ initiatives. Incremental annual profit: $156M.",
              metric: "$156M",
              audiences: ["vc", "consulting"],
            },
            {
              text: "Kept annualized savings as a separate line on that portfolio. The line is $260M.",
              metric: "$260M",
              audiences: ["vc", "consulting"],
            },
            {
              text: "Sequenced the portfolio through launch. Megapack scale reached 3.2×.",
              metric: "3.2×",
              audiences: ["vc", "consulting"],
            },
            {
              text: "Redesigned the build plans for the tariff program. Projected tariff exposure mitigated: $550M.",
              metric: "$550M",
              audiences: ["consulting", "startup"],
            },
            {
              text: "Handed the portfolio playbooks to sustaining owners. The review now sits with them.",
              audiences: ["consulting", "startup"],
            },
          ],
        },
        {
          title: "Program Manager, Special Projects",
          dates: "Jun 2018 - Jun 2021",
          bullets: [
            {
              text: "Took Project Roadrunner, the 4680 program, from early pilot to a launch-ready platform. Stage gates and launch ownership then moved to engineering and production.",
              audiences: ["startup", "tech"],
            },
            {
              text: "Designed and launched Warehouse on Wheels, a $3.5M/month coordination platform. It protected battery and drivetrain flow during scale-up.",
              metric: "$3.5M",
              audiences: ["startup", "tech"],
            },
            {
              text: "Sustained Model 3 and Model Y rates through demand surges and supply disruptions.",
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
          dates: "Oct 2022 - May 2023",
          bullets: [
            {
              text: "Replaced ad-hoc Engineering Operations reporting with one decision system. Hardware, software, fleet, product, and legal work from it.",
              audiences: ["consulting", "tech"],
            },
            {
              text: "Set the cadence on that system: annual planning, OKRs, resource plans, business reviews, and decision milestones.",
              audiences: ["consulting", "startup"],
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
          dates: "Jun 2021 - Jun 2022",
          bullets: [
            {
              text: "Built the 0→1 iPhone India launch plan. Quality, regulatory, and timing requirements stayed in that plan.",
              audiences: ["startup", "tech"],
            },
            {
              text: "Shipped the volume ramp. Units grew 293% year over year, from 4.3M to 16.9M.",
              metric: "293%",
              audiences: ["tech", "vc"],
            },
            {
              text: "Shipped the revenue ramp on that same launch. Reported program revenue grew from $2B to $10B.",
              metric: "$10B",
              audiences: ["tech", "vc"],
            },
            {
              text: "Expanded iPhone India exports from 6 countries to 40+ countries.",
              metric: "40+",
              audiences: ["consulting", "tech"],
            },
            {
              text: "Handed the running launch to the plant teams.",
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
        "Tesla Energy needed AI tools people would actually use. Priorities were scattered, nobody owned the use cases, and we couldn't tell if adoption changed results.",
      contribution:
        "I stood up the product and engineering team, ranked the use cases, and set up training and adoption reporting for everything we shipped.",
      outcome:
        "Modeled at ~540 hours reclaimed per week and $1.6M in annualized productivity value.",
      panel: {
        kicker: "Tesla Energy",
        value: "1,000+",
        label: "Active users across 20+ production AI solutions",
      },
      link: { label: "Tesla Energy", href: "https://www.tesla.com/energy" },
      caseStudy: {
        context:
          'Scattered experiments sat next to real Energy work with no shared bar for "done." Leaders wanted tools people used in their daily work.',
        constraints: [
          "Adoption was measured by use in real workflows",
          "Finite roadmap capacity meant every use case needed a named owner",
          "Security and data boundaries could not bend for release speed",
        ],
        decisions: [
          "Build a dedicated product-and-engineering team",
          "Sequence the backlog by hours reclaimed and decision quality",
          "Ship training plus weekly adoption reporting with each release",
        ],
        outcomeDetail:
          "We hit 1,000+ active users across 20+ production AI solutions. Modeled impact: about 540 hours back each week and $1.6M in annualized productivity value.",
        role: [
          "Owned the enablement roadmap and what leadership saw each week",
          "Hired and led the product-and-engineering squad",
          "Set prioritization rules, governance, and adoption metrics",
        ],
      },
    },
    {
      slug: "tesla-energy-portfolio",
      title: "Tesla Energy: which dollar moves the P&L",
      problem:
        "Demand outran what we could fund. 50+ asks. $23M to spend. Which dollar moved the P&L?",
      contribution:
        "I built Python and Tableau models linking investment, labor, cost, and timing. We funded the work with the best return and killed the rest. The same logic ranks AI use cases today.",
      outcome:
        "Yearly profit on the funded set: $156M.",
      panel: {
        kicker: "Tesla Energy",
        value: "$156M",
        label: "Incremental annual profit from a $23M portfolio",
      },
      link: { label: "Tesla Megapack", href: "https://www.tesla.com/megapack" },
      caseStudy: {
        context:
          "Capital asks ran ahead of the budget. Dozens of initiatives fought for the same dollars with weak ties to profit.",
        constraints: [
          "Only $23M was available against 50+ competing requests",
          "Leaders needed one clear rule for what got funded and what got cut",
          "Labor, cost, and timing had to live in one decision model",
        ],
        decisions: [
          "Tie each ask to return and risk in Python and Tableau models",
          "Fund the highest-return work and stop the rest in public reviews",
          "Reuse the ranking method later when sequencing AI use cases",
        ],
        outcomeDetail:
          "The $23M portfolio of 50+ initiatives returned $156M in incremental annual profit. Annualized savings on that portfolio were $260M, counted on their own line. Megapack scale reached 3.2×. A separate plan mitigated $550M in projected tariff exposure.",
        role: [
          "Owned the Energy investment roadmap and review cadence",
          "Built the models executives used to compare asks",
          "Ran the tradeoff meetings that killed low-return work",
        ],
      },
    },
    {
      slug: "apple-iphone-india",
      title: "Apple: 0→1 iPhone India",
      problem:
        "India had to go from plan to scaled launch while market entry, partner readiness, and demand were all still moving.",
      contribution:
        "I led market-entry decisions, partner qualification, and launch readiness, and kept demand, quality, and timing risk in one plan.",
      outcome:
        "Revenue on the India launch moved from $2B to $10B. Exports went from 6 countries to 40+.",
      panel: {
        kicker: "Apple",
        value: "293%",
        label: "Year-over-year growth, 4.3M → 16.9M units",
      },
      link: { label: "Apple India", href: "https://www.apple.com/in/" },
      caseStudy: {
        context:
          "India had to move from slides to a live, scaled iPhone launch while partners and demand kept shifting.",
        constraints: [
          "Quality and regulatory bars could not slip to buy speed",
          "Partner readiness trailed the volume curve",
          "Geopolitical risk had to sit inside the same plan as demand",
        ],
        decisions: [
          "Treat entry calls, partner checks, and go-live gates as one program",
          "Convert volume signals into funding and readiness plans leaders could run weekly",
          "Build second sources so exports weren't pinned to one geography",
        ],
        outcomeDetail:
          "Reported program revenue moved from $2B to $10B. Volume grew 293% year over year, from 4.3M to 16.9M units. Exports reached 40+ countries.",
        role: [
          "Led the India launch program end to end",
          "Kept entry, partners, and readiness on one schedule",
          "Brought quality, regulatory, and timing risks to leadership",
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
      panel: {
        kicker: "Waymo",
        value: "One plan",
        label: "Six functions on one shared scoreboard",
      },
      link: { label: "Waymo", href: "https://waymo.com/" },
      caseStudy: {
        context:
          "Planning lived in silos. Leaders argued over conflicting numbers in meetings that rarely left one shared set of facts.",
        constraints: [
          "Every plan had to account for safety and regulatory work",
          "Six functions needed shared targets without private scorekeeping",
          "Senior leaders spent too much time on one-off decks",
        ],
        decisions: [
          "Set one rhythm for OKRs, resources, QBRs, and dashboards",
          "Move tradeoffs into scheduled reviews instead of private escalations",
          "Publish dashboards covering performance, vehicle health, and milestones",
        ],
        outcomeDetail:
          "Plans finally shared one calendar and one set of numbers. Escalations moved into scheduled reviews, and one-off reporting requests dropped.",
        role: [
          "Facilitated planning and QBR cycles for Engineering Operations",
          "Built the scoreboard leadership used instead of ad-hoc pulls",
          "Aligned targets and resources across functions",
        ],
      },
    },
  ],
  principles: [
    {
      title: "Count users every week",
      description:
        "Training ships with the tool, and leadership sees the weekly adoption count.",
    },
    {
      title: "One ranked review",
      description:
        "Every request goes on one list. The highest return stays. The rest stop in that same meeting.",
    },
    {
      title: "A sustaining owner",
      description:
        "The person who keeps the result gets the playbook before the next build starts.",
    },
  ],
  sections: {
    about: {
      title: "About",
    },
    experience: {
      title: "Experience",
    },
    work: {
      title: "Selected work",
    },
    approach: {
      title: "How I work",
    },
    contact: {
      title: "Contact",
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
    { label: "Writing", href: "#writing" },
    { label: "About", href: "#about" },
    { label: "Experience", href: "#experience" },
    { label: "Work", href: "#work" },
    { label: "Contact", href: "#contact" },
  ],
  contact: {
    email: "jarrodtran@outlook.com",
    linkedin: "https://www.linkedin.com/in/jarrodtran/",
    github: "https://github.com/jarrodtran",
    resumeHref: "/resume.pdf",
    resumeFilename: "Jarrod-Tran-Resume.pdf",
    intro: "",
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
