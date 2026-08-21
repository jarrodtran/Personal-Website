# jarrodtran.com

Personal site for [Jarrod Tran](https://jarrodtran.com) — product and strategy operator. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, and Motion. Statically exported to GitHub Pages.

## Customize

Positioning rules, the factory-language ban, and ready-to-paste Plan / Build prompts live in [`POSITIONING.md`](POSITIONING.md). Keep one public narrative.

Almost everything you will change lives in two places:

1. **Copy and data** — [`content/site.ts`](content/site.ts)
   - Name, headline, targeting, status badge
   - Highlight stats, bio, experience, selected work, principles, capabilities
   - Section headings on `site.sections`
   - Contact links, resume path, and optional Formspree endpoint
   - `headlineVariants` and `audiences` tags are unused internal data — do not ship four public versions
2. **Accent color** — [`app/globals.css`](app/globals.css)
   - Change `--accent` (and `--ring`) under `:root` and `.dark`

To enable in-page form submit (instead of a pre-filled email draft), create a free [Formspree](https://formspree.io) form and paste the endpoint into `site.contact.formEndpoint`.

After copy edits: `pnpm test` (copy contract), `pnpm check`, `pnpm build`.

## Local development

```bash
pnpm install
pnpm dev
```

Useful scripts: `pnpm check` (TypeScript), `pnpm lint`, `pnpm build` (writes static files to `out/`), `pnpm format`.

## Deploy to GitHub Pages

1. Create a GitHub repo and push this project to `main`.
2. In the repo: **Settings → Pages → Source: GitHub Actions**.
3. The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and publishes `out/` on every push to `main`.

### DNS for jarrodtran.com

At your registrar, point the apex domain at GitHub Pages:

| Type  | Host  | Value                              |
| ----- | ----- | ---------------------------------- |
| A     | `@`   | `185.199.108.153`                  |
| A     | `@`   | `185.199.109.153`                  |
| A     | `@`   | `185.199.110.153`                  |
| A     | `@`   | `185.199.111.153`                  |
| CNAME | `www` | `<your-github-username>.github.io` |

`public/CNAME` already contains `jarrodtran.com`, which GitHub uses to keep the custom domain bound across deploys. Enable **Enforce HTTPS** in Pages settings once DNS has propagated.

Optional IPv6 AAAA records: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
