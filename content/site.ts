export const siteUrl = "https://jarrodtran.com";

/** Official current title. Every surface (bio, experience, JSON-LD) reads this one value. */
const currentTitle = "Lead, AI Enablement & Factory Strategy";

export interface ImpactBullet {
  text: string;
  metric?: string;
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
    intro: string;
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
  about: {
    bio: string[];
  };
  experience: Employer[];
  selectedWork: SelectedWorkItem[];
  sections: {
    work: { title: string };
    about: { title: string };
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
    headline: "Notes on AI, judgment, and building",
    intro:
      "I lead an AI product team at Tesla Energy. I write about how teams decide what to build and learn whether it helps.",
    documentTitle: "Jarrod Tran · Worth Mulling",
    valueProp:
      "Worth Mulling is my publication about AI products, judgment, and how teams make decisions.",
    status: "Worth Mulling",
    location: "Houston, TX",
    currentRole: currentTitle,
  },
  substack: {
    name: "Worth Mulling",
    url: "https://jarrodtran.substack.com",
  },
  about: {
    bio: [
      `My official title at Tesla Energy is ${currentTitle}. I brought product and engineering together and set up reporting to see which tools people use and where they save time. Before that, I helped launch iPhone in India at Apple and led Engineering Operations planning at Waymo.`,
    ],
  },
  experience: [
    {
      company: "Tesla",
      note: "Rejoined in 2023 after Apple and Waymo.",
      roles: [
        {
          title: currentTitle,
          dates: "Aug 2023 - Present",
          summary:
            "I own Tesla Energy’s AI enablement strategy and the product team that ships it: roadmap, rules, and what I report to leadership.",
          bullets: [
            {
              text: "Built and lead a product and engineering team at Tesla Energy, scaling adoption to 1,000+ active users across 20+ production AI tools: RAG troubleshooting, automated reporting, workflow automation, and decision support.",
              metric: "1,000+",
            },
            {
              text: "Modeled AI productivity at roughly 540 hours reclaimed per week and $1.6M in annualized value, with more upside as automation adoption grows.",
              metric: "$1.6M",
            },
            {
              text: "Owned the global investment roadmap across California, Texas, and Shanghai: scaled Megapack 3.2×, allocated $23M across 50+ initiatives for $156M in incremental annual profit, and led a separate program that delivered $260M in annualized savings.",
              metric: "$156M",
            },
            {
              text: "Mitigated $550M in projected tariff exposure by redesigning the product and investment plan, then built and promoted successors so I could focus on AI enablement.",
              metric: "$550M",
            },
          ],
        },
        {
          title: "Program Manager, Special Projects",
          dates: "Jun 2018 - Jun 2021",
          summary:
            "I ran new programs at Tesla, including the 4680 launch and the Model 3 and Model Y scale-up.",
          bullets: [
            {
              text: "Advanced Project Roadrunner, Tesla's 4680 program, from early pilot to launch readiness through Battery Day, running stage gates and readiness reviews across teams.",
            },
            {
              text: "Designed and launched a $3.5M/month coordination platform (“Warehouse on Wheels”) to protect product availability during rapid scale-up.",
              metric: "$3.5M/month",
            },
            {
              text: "Led planning and recovery across Model 3 and Model Y programs through demand surges and supply disruptions.",
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
              text: "Led annual planning, OKRs, and quarterly business reviews for Engineering Operations. Turned org priorities into resource plans, targets, and milestones.",
            },
            {
              text: "Got hardware, software, fleet, Product, Legal, and Engineering onto the same facts, including safety and regulatory work for commercial autonomous-vehicle deployment.",
            },
            {
              text: "Built leadership dashboards for performance, fleet health, and program milestones so senior leaders weren't stuck in ad-hoc reporting.",
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
              text: "Led the 0→1 iPhone India launch from market entry and partner qualification through readiness and scaled delivery, under tight quality, regulatory, and timing requirements.",
            },
            {
              text: "Supported 293% year-over-year growth (4.3M → 16.9M units) and a program whose reported revenue grew from $2B to $10B by translating demand into investment and readiness plans.",
              metric: "293%",
            },
            {
              text: "Expanded iPhone India exports from 6 to 40+ countries, building a second-source network that reduced geographic concentration risk.",
              metric: "40+",
            },
          ],
        },
      ],
    },
  ],
  selectedWork: [
    {
      slug: "tesla-energy-ai-product",
      preview:
        "Turning scattered AI experiments into tools teams use every week.",
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
          "Build a dedicated product and engineering team",
          "Sequence the backlog by hours reclaimed and decision quality",
          "Ship training plus weekly adoption reporting with each release",
        ],
        outcomeDetail:
          "We reached 1,000+ active users across 20+ production AI tools, modeling roughly 540 hours saved each week and $1.6M in annualized productivity value.",
        role: [
          "Owned the enablement roadmap and what leadership saw each week",
          "Hired and led the AI product and engineering team",
          "Set prioritization rules, governance, and adoption metrics",
        ],
      },
    },
    {
      slug: "tesla-energy-portfolio",
      preview: "Ranking investment requests by their expected return.",
      title: "Tesla Energy: which dollar moves the P&L",
      problem:
        "50+ initiatives competed for a $23M budget, and leadership needed a clear rule for which dollars moved the P&L.",
      contribution:
        "I built Python and Tableau models linking investment, labor, cost, and timing. We funded the work with the best return and killed the rest. The same logic ranks AI use cases today.",
      outcome:
        "Megapack scaled 3.2× and tariff exposure fell by a projected $550M. A separate program saved $260M on an annualized basis.",
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
          "The funded portfolio delivered $156M in incremental annual profit. Megapack scaled 3.2×. A separate program delivered $260M in annualized savings. Changes to what we built and where we invested mitigated $550M in projected tariff exposure.",
        role: [
          "Owned the Energy investment roadmap and review cadence",
          "Built the models executives used to compare asks",
          "Ran the tradeoff meetings that killed low-return work",
        ],
      },
    },
    {
      slug: "apple-iphone-india",
      preview:
        "Balancing demand, partner readiness, and risk during a new market launch.",
      title: "Apple: 0→1 iPhone India",
      problem:
        "India had to go from plan to scaled launch while market entry, partner readiness, and demand were all still moving.",
      contribution:
        "I drove market-entry decisions, partner qualification, and launch readiness, and kept demand, quality, and geopolitical risk in one plan.",
      outcome:
        "Program revenue grew from $2B to $10B, and exports expanded from 6 to 40+ countries.",
      panel: {
        kicker: "Apple",
        value: "293%",
        label: "Year-over-year growth, 4.3M → 16.9M units",
      },
      link: { label: "Apple India", href: "https://www.apple.com/in/" },
      caseStudy: {
        context:
          "Launching iPhone in India meant qualifying local partners, clearing regulatory gates, and scaling volume at the same time instead of in sequence.",
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
          "Reported program revenue moved from $2B to $10B while volume grew 293% year over year (4.3M → 16.9M units). Exports reached 40+ countries.",
        role: [
          "Led the India launch program end to end",
          "Kept entry, partners, and readiness on one schedule",
          "Brought quality, regulatory, and timing risks to leadership",
        ],
      },
    },
    {
      slug: "waymo-engineering-ops",
      preview: "Getting six teams to plan and report from the same numbers.",
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
          "Each function tracked goals in its own spreadsheets, turning leadership reviews into debates over whose numbers were right.",
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
  sections: {
    about: {
      title: "About",
    },
    work: {
      title: "Selected work",
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
    { label: "Work", href: "#work" },
    { label: "Contact", href: "#contact" },
  ],
  contact: {
    email: "jarrodtran@outlook.com",
    linkedin: "https://www.linkedin.com/in/jarrodtran/",
    github: "https://github.com/jarrodtran",
    resumeHref: "/resume.pdf",
    resumeFilename: "Jarrod-Tran-Resume.pdf",
    intro:
      "I’m based in Houston. Send me a note if you’d like to talk about something I’ve written or share what you’re working on.",
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
