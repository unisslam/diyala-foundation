# مؤسسة نهر ديالى للتنمية المستدامة
## Diyala River Foundation for Sustainable Development

> **أهداف عالمية بأيدي محلية — Global Goals, Local Impact**

A local, independent civil-society organization headquartered in Diyala Governorate, Iraq, dedicated to achieving the **United Nations Sustainable Development Goals (SDGs)** through community empowerment, cross-sector partnerships, and evidence-based programs.

---

## 🌐 SDG Alignment

The Foundation's operational mandate focuses on the following SDGs:

| SDG | Goal | Focus Area |
|-----|------|------------|
| **SDG 4** | Quality Education | Digital literacy, vocational training, non-formal learning |
| **SDG 7** | Affordable & Clean Energy | Renewable energy access in underserved communities |
| **SDG 8** | Decent Work & Economic Growth | Youth employment, micro-enterprise development |
| **SDG 11** | Sustainable Cities & Communities | Urban resilience, local governance capacity |
| **SDG 13** | Climate Action | Environmental advocacy, climate adaptation programs |
| **SDG 17** | Partnerships for the Goals | Strategic alliances, international cooperation |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (strict) |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS v4 (CSS-first `@theme {}`) |
| Animations | Framer Motion |
| Routing | React Router v7 |
| i18n | react-i18next + i18next-browser-languagedetector |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Icons | Lucide React |
| State | Zustand |

---

## 🌍 Internationalization Architecture

The platform is fully bilingual **Arabic (RTL) / English (LTR)**.

```
src/i18n/
├── index.ts                 # i18next initialization + language utils
└── locales/
    ├── ar/                  # Arabic translations (primary)
    │   ├── common.json      # Shared UI strings, footer, accessibility
    │   ├── nav.json         # Navigation labels
    │   ├── home.json        # Landing page copy
    │   ├── about.json       # About page
    │   ├── projects.json    # Projects & initiatives
    │   ├── news.json        # Media center
    │   └── contact.json     # Contact form
    └── en/                  # English translations (secondary)
        └── ...              # Mirror of ar/ structure
```

Language preference is persisted in `localStorage` under the key `diyala_lang`.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/              # Navbar, Footer, RootLayout
│   ├── sections/            # Page-level section components
│   ├── shared/              # Reusable atoms (Button, Card, Badge…)
│   └── ui/                  # Headless UI primitives
├── config/
│   └── sdgsData.ts          # UN SDG definitions (typed, color-coded)
├── hooks/                   # Custom React hooks
├── i18n/                    # i18next config + locale files
├── lib/                     # Supabase client, utilities
├── pages/                   # Route-level page components
├── store/                   # Zustand global state
├── supabase/                # DB schema, RLS policies
├── types/
│   ├── database.types.ts    # Auto-generated Supabase types
│   └── sdg.ts               # SDG TypeScript interfaces
└── index.css                # Tailwind v4 @theme design system
```

---

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type-check
npx tsc --noEmit

# Build for production
npm run build
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📄 License

© 2025 مؤسسة نهر ديالى للتنمية المستدامة. All rights reserved.
