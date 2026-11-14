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
    headline: "Worth Mulling by Jarrod Tran",
    intro:
      "I write Worth Mulling, where I think through whatever I’ve been chewing on lately and the rabbit holes I go down along the way. By day I lead AI enablement at Tesla Energy.",
    documentTitle: "Jarrod Tran · Worth Mulling",
    valueProp: "My thoughts, and whatever rabbit hole I’m down lately.",
    status: "Worth Mulling",
    location: "Houston, TX",
    currentRole: currentTitle,
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
  },
  about: {
    bio: [
      `I’m Jarrod Tran. As ${currentTitle} at Tesla Energy, I hired the team behind our AI tools and set up the reporting that shows whether people use them. Before that, I led the iPhone launch program in India at Apple and planning for Engineering Operations at Waymo.`,
      "Worth Mulling is where I write about whatever I’m thinking about, work or not.",
    ],
  },
  experience: [
    {
      company: "Tesla",
      note: "Rejoined Tesla in 2023 after Apple and Waymo.",
      roles: [
        {
          title: currentTitle,
          dates: "Aug 2023 to Present",
          summary:
            "I own Tesla Energy’s AI enablement strategy and the product team that ships it: roadmap, rules, and what I report to leadership.",
          bullets: [
            {
              text: "Built and lead a 4-person team of AI product managers and engineers that has shipped 20+ production AI tools now used by 1,000+ employees, including RAG-based troubleshooting assistants, automated reporting, workflow automation and decision support.",
              metric: "1,000+",
            },
            {
              text: "Own the roadmap for an AI enablement program reaching 10,000 employees: rank use cases, assign an owner to each, and pair every release with training and weekly adoption reports to leadership.",
              metric: "10,000",
            },
            {
              text: "Freed an estimated 540 hours per week, worth $1.6M a year in productivity, by funding the tools that save the most time or improve decisions.",
              metric: "$1.6M",
            },
            {
              text: "Built the Python and Tableau ROI model executives used to choose among 50+ competing initiatives for a $23M budget. The funded portfolio delivered $156M in incremental annual profit.",
              metric: "$156M",
            },
            {
              text: "Redesigned the investment plan for Megapack, Tesla’s utility-scale battery product, mitigating $550M in projected tariff exposure during a 3.2× scale-up.",
              metric: "$550M",
            },
            {
              text: "Served as Program Champion for a separate program that delivered $260M in annualized savings.",
              metric: "$260M",
            },
          ],
        },
        {
          title: "Program Manager, Special Projects",
          dates: "Jun 2018 to Jun 2021",
          summary:
            "I ran new programs at Tesla, including the 4680 launch and the Model 3 and Model Y scale-up.",
          bullets: [
            {
              text: "Took Project Roadrunner, Tesla’s 4680 battery cell program, from pilot to launch readiness through its public unveiling at Tesla’s 2020 Battery Day.",
            },
            {
              text: "Led Model 3 and Model Y production planning and recovery for two years from launch, ramping each model to 10,000 units per week and hitting every quarterly production and delivery goal.",
              metric: "10,000",
            },
            {
              text: "Designed and launched Warehouse on Wheels, a coordination platform managing $3.5M per month in operating expenses.",
              metric: "$3.5M",
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
          dates: "Oct 2022 to May 2023",
          bullets: [
            {
              text: "Moved six separately planned functions (hardware, software, fleet, Product, Legal and Engineering) onto one Engineering Operations plan, with shared OKRs, resource plans and quarterly business reviews for a 200+ person engineering organization.",
              metric: "200+",
            },
            {
              text: "Aligned those six functions on commercial deployment priorities as Waymo’s driverless ride service expanded.",
            },
            {
              text: "Built the leadership dashboards for fleet health, performance and milestones, cutting one-off reporting requests.",
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
          dates: "Jun 2021 to Jun 2022",
          bullets: [
            {
              text: "Led the iPhone India program end to end from a standing start, keeping market entry, partner readiness and launch timing on one schedule.",
            },
            {
              text: "Supported 293% year-over-year unit growth (4.3M to 16.9M) as program revenue grew from $2B to $10B and exports expanded from 6 to 40+ countries.",
              metric: "293%",
            },
            {
              text: "Turned demand forecasts into weekly funding and readiness plans, and flagged quality, regulatory and timing issues for leadership.",
            },
          ],
        },
      ],
    },
    {
      company: "Amazon",
      roles: [
        {
          title: "Operations Area Manager",
          dates: "Mar 2017 to Apr 2018",
          bullets: [
            {
              text: "Led 100+ associates in a 1M sq ft fulfillment center handling 350K SKUs.",
              metric: "100+",
            },
          ],
        },
      ],
    },
  ],
  selectedWork: [
    {
      slug: "tesla-energy-ai-product",
      preview: "How we chose use cases, trained users, and tracked adoption.",
      title: "Tesla Energy: From AI pilots to daily use",
      problem:
        "Tesla Energy had AI pilots, but teams lacked a shared way to choose which ones to ship or measure their value after launch.",
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
          "Some pilots showed promise. The harder question was whether they would help with work people already did.",
        constraints: [
          "We measured adoption by use in day-to-day work",
          "The team had limited capacity, so each use case needed an owner",
          "Releases had to meet security and data requirements",
        ],
        decisions: [
          "Build a dedicated product and engineering team",
          "Prioritize tools that save time or improve decisions",
          "Pair releases with training and track adoption each week",
        ],
        outcomeDetail:
          "We used adoption data to track usage. Our productivity model estimated about 540 hours saved per week and $1.6M in annualized value.",
        role: [
          "Owned the AI roadmap and reported adoption to leadership",
          "Hired and led the AI product and engineering team",
          "Set prioritization rules, governance, and adoption metrics",
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
      },
      link: { label: "Tesla Megapack", href: "https://www.tesla.com/megapack" },
      caseStudy: {
        context:
          "The funding decision depended on how each proposal would affect profit, what it would cost, and when it could deliver.",
        constraints: [
          "Only $23M was available against 50+ competing requests",
          "Leaders needed a common basis for funding decisions",
          "The model had to account for labor, cost, and timing",
        ],
        decisions: [
          "Use Python and Tableau to compare expected returns and risks",
          "Use funding reviews to choose the highest-return work",
          "Reuse the ranking method later when sequencing AI use cases",
        ],
        outcomeDetail:
          "The funded portfolio delivered $156M in incremental annual profit. Megapack scaled 3.2×. A separate program delivered $260M in annualized savings. Changes to what we built and where we invested mitigated $550M in projected tariff exposure.",
        role: [
          "Owned the Energy investment roadmap and scheduled funding reviews",
          "Built the models executives used to compare proposals",
          "Led the reviews that cut low-return proposals",
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
          "Launch planning had to account for partner qualification, quality requirements, and regulatory approvals.",
        constraints: [
          "The schedule had to meet quality and regulatory requirements",
          "Partner readiness lagged expected volume",
          "Demand forecasts and geopolitical risk both shaped readiness decisions",
        ],
        decisions: [
          "Use one schedule for market entry, partner checks, and launch readiness",
          "Turn demand forecasts into funding and readiness plans for weekly review",
          "Qualify additional sources to reduce dependence on one geography",
        ],
        outcomeDetail:
          "Reported program revenue grew from $2B to $10B, and exports expanded from 6 to 40+ countries.",
        role: [
          "Led the India launch program end to end",
          "Kept entry, partners, and readiness on one schedule",
          "Brought quality, regulatory, and timing risks to leadership",
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
        value: "One plan",
        label: "Six functions on one shared scoreboard",
      },
      link: { label: "Waymo", href: "https://waymo.com/" },
      caseStudy: {
        context:
          "Engineering Operations needed one plan that brought commercial deployment, safety, and regulatory priorities together.",
        constraints: [
          "Every plan had to account for safety and regulatory work",
          "Teams needed shared targets and a common way to track them",
          "One-off reporting took time away from planning",
        ],
        decisions: [
          "Put goals, resource plans, and quarterly reviews on one schedule",
          "Bring decisions about priorities and resources into scheduled reviews",
          "Publish dashboards covering performance, vehicle health, and milestones",
        ],
        outcomeDetail:
          "Teams used the same calendar and figures to make tradeoffs in scheduled reviews. One-off reporting requests dropped.",
        role: [
          "Led planning and quarterly reviews for Engineering Operations",
          "Built the dashboards leaders used to track progress",
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
    { label: "Writing", href: "/writing/" },
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Résumé", href: "/resume.pdf" },
  ],
  contact: {
    email: "jarrodtran@outlook.com",
    linkedin: "https://www.linkedin.com/in/jarrodtran/",
    github: "https://github.com/jarrodtran",
    resumeHref: "/resume.pdf",
    resumeFilename: "Jarrod-Tran-Resume.pdf",
    intro:
      "I’m based in Houston. If an essay connects with your work, I’d like to hear what you’ve learned. Email is the best way to reach me.",
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
