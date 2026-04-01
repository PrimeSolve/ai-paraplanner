# AI Paraplanner Design System

> **Master design system for the AI Paraplanner internal platform at app.aiparaplanner.com.au.**
> Every page must follow these rules exactly. No deviations.
> Every subsequent prompt references this file.

---

## TECH STACK

- React/Vite frontend
- Framer Motion for animations
- DM Sans + Syne fonts (already loaded globally)
- Light/dark mode toggle — OS preference auto-detected, user can override in Settings
- axiosInstance handles camelCase ↔ snake_case conversion automatically
- **NEVER add `PostConfigure<JwtBearerOptions>` to Program.cs**

---

## COLOUR SYSTEM

### Light mode

| Token                | Value                        |
|----------------------|------------------------------|
| Page background      | `#F0F3F8`                    |
| Card background      | `#ffffff`                    |
| Card border          | `0.5px solid #E0E6F0`       |
| Topbar background    | `#ffffff`                    |
| Topbar border        | `0.5px solid #E0E6F0`       |
| Primary text         | `#0A1628`                    |
| Secondary text       | `#3A4A6B`                    |
| Muted text           | `#8A9BBE`                    |
| Hint text            | `#B0BCCF`                    |
| Input background     | `#F8FAFB`                    |
| Input border         | `0.5px solid #E0E6F0`       |
| Input focus border   | `rgba(0,201,177,0.5)`       |
| Input focus shadow   | `0 0 0 3px rgba(0,201,177,0.08)` |
| Table row hover      | `#FAFBFD`                    |
| Table row border     | `0.5px solid #F5F7FB`       |
| Section header bg    | `#FAFBFD`                    |

### Dark mode

| Token                | Value                                             |
|----------------------|---------------------------------------------------|
| Page background      | `#060D1A`                                         |
| Card background      | `rgba(13,25,41,0.8)` + `backdrop-filter: blur(10px)` |
| Card border          | `1px solid rgba(255,255,255,0.06)`                |
| Topbar background    | `rgba(6,13,26,0.95)` + `backdrop-filter: blur(20px)` |
| Topbar border        | `1px solid rgba(0,201,177,0.08)`                  |
| Primary text         | `#F0F4FF`                                         |
| Secondary text       | `rgba(176,196,222,0.75)`                          |
| Muted text           | `rgba(176,196,222,0.45)`                          |
| Hint text            | `rgba(176,196,222,0.3)`                           |
| Input background     | `rgba(255,255,255,0.04)`                          |
| Input border         | `1px solid rgba(255,255,255,0.08)`                |
| Input focus border   | `rgba(0,201,177,0.4)`                             |
| Table row hover      | `rgba(255,255,255,0.03)`                          |
| Table row border     | `1px solid rgba(255,255,255,0.04)`                |
| Section header bg    | `rgba(0,0,0,0.2)`                                 |

### Brand colours (same in both modes)

| Name          | Value                                          |
|---------------|------------------------------------------------|
| Teal primary  | `#00C9B1`                                      |
| Teal dark     | `#00A693`                                      |
| Teal gradient | `linear-gradient(135deg, #00C9B1, #00A693)`   |
| Blue          | `#1E88E5`                                      |
| Purple        | `#8C50FF`                                      |
| Amber         | `#F5A623`                                      |
| Red           | `#E24B4A`                                      |
| Green         | `#1D9E75`                                      |

---

## TYPOGRAPHY

### Fonts

- **Display/headings:** `'Syne', sans-serif` — font-weight 700
- **Body:** `'DM Sans', sans-serif` — weights 300, 400, 500, 600

### Scale

| Element            | Styles                                                                                      |
|--------------------|---------------------------------------------------------------------------------------------|
| Page title         | `font-family: Syne; font-size: 22px; font-weight: 700; letter-spacing: -0.5px`             |
| Section title      | `font-size: 13px; font-weight: 600`                                                        |
| Table header       | `font-size: 10px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase`      |
| Body               | `font-size: 12px; font-weight: 400`                                                        |
| Label              | `font-size: 11px; font-weight: 500`                                                        |
| Hint/sub           | `font-size: 10px; font-weight: 400`                                                        |
| KPI numbers        | `font-size: 22px; font-weight: 600; letter-spacing: -0.3px; font-variant-numeric: tabular-nums` |

> **NEVER use font-size below 10px**

---

## SIDEBAR (identical on every page, always dark regardless of mode)

- **Width:** 220px
- **Background:** `#040B15`
- **Border-right:** `1px solid rgba(0,201,177,0.08)`

### Logo area

- Padding: `16px`
- Border-bottom: `1px solid rgba(0,201,177,0.08)`
- Logo mark: 30x30px, border-radius 8px, gradient `#00C9B1 → #1E88E5`, "AI" text
- Logo text: 13px Syne 600, "AI" in `#00C9B1`, rest in `#F0F4FF`

### Nav items

- Padding: `8px 12px`
- Border-radius: `8px`
- Margin: `1px 6px`
- Color (default): `rgba(176,196,222,0.45)`
- Color (hover): `#F0F4FF`
- Background (hover): `rgba(255,255,255,0.04)`
- Color (active): `#00C9B1`
- Background (active): `rgba(0,201,177,0.1)`
- Font-weight (active): `500`
- Active left indicator: `position absolute, left -6px, width 3px, border-radius 0 3px 3px 0, background #00C9B1`

### Section labels

- Font-size: `9px`
- Font-weight: `600`
- Color: `rgba(176,196,222,0.25)`
- Letter-spacing: `1.2px`
- Text-transform: `uppercase`
- Padding: `18px 12px 4px`

### SOA Queue count badge

- Background: `rgba(245,166,35,0.12)`
- Color: `#F5A623`
- Font-size: `9px`; font-weight: `700`
- Padding: `2px 6px`; border-radius: `10px`
- Margin-left: `auto`

### Henry AI Assistant (bottom of sidebar)

- Margin: `12px 8px`
- Background: `linear-gradient(135deg, rgba(0,201,177,0.1), rgba(30,136,229,0.06))`
- Border: `1px solid rgba(0,201,177,0.2)`
- Border-radius: `10px`
- Padding: `10px 12px`
- Icon: 28x28px, gradient `#00C9B1 → #00A693`, border-radius 8px, ✦ symbol
- Name: "AI Assistant" — 12px, 600, `#00C9B1`
- Sub: "Ask Henry" — 10px, `rgba(176,196,222,0.4)`
- Badge: 16x16px circle, border `rgba(0,201,177,0.25)`, "?" in `#00C9B1`

### Full sidebar nav structure

```
OVERVIEW
  - Dashboard → /Dashboard
  - SOA Queue → /AdminQueue [count badge: live pending count]

MANAGEMENT
  - Advice Groups → /AdviceGroups
  - Advisers → /Advisers
  - Clients → /Clients

SUPPORT
  - All Tickets → /AllTickets

CONFIGURATION
  - Data Manager → /DataManager
  - SOA Template → /AdminTemplate
  - Team → /AdminTeam
  - Settings → /Settings

[spacer]
[Henry card]
```

---

## TOPBAR (every page)

- **Height:** 52px
- Display: flex, align-items center, justify-content space-between
- Padding: `0 24px`

### Breadcrumb (left side)

- Home icon (SVG house) → › separator → Page name (bold) → optional badge
- Font-size: `12px`
- Home + separators: muted colour
- Current page: primary text, font-weight `500`
- Badge: pill, background `rgba(0,201,177,0.1)`, color `#00C9B1`, border `rgba(0,201,177,0.2)` (dark mode only adds border)

### Right side

- Date string (optional, on Dashboard only)
- User name: 12px, font-weight 500, muted
- Avatar: 30x30px circle, gradient `#1D9E75 → #0F6E56`, initials "TH"

---

## KPI CARDS

### Structure

- Border-radius: `12px`
- Padding: `14px 16px`
- Display: flex, flex-direction column, gap `8px`
- Position relative (for top colour bar)
- **Top colour bar:** position absolute, top 0, left 0, right 0, height `2px`, border-radius `12px 12px 0 0`

### Colours per card type

| Type    | Bar colour | Purpose                    |
|---------|------------|----------------------------|
| Teal    | `#00C9B1`  | Primary metric             |
| Blue    | `#1E88E5`  | Secondary/progress metric  |
| Green   | `#1D9E75`  | Completed/positive metric  |
| Amber   | `#F5A623`  | Pending/warning metric     |
| Red     | `#E24B4A`  | Urgent/breach metric       |
| Purple  | `#8C50FF`  | Count/total metric         |

### KPI card content

- Top row: icon (30x30px, border-radius 8px) + badge (pill)
- Number: `22px, DM Sans 600, tabular-nums, letter-spacing -0.3px`
- Label: `11px`, muted colour
- Sub-label: `10px`, hint colour

### Icon backgrounds (light mode)

| Metric | Background  | Icon colour |
|--------|-------------|-------------|
| Teal   | `#E1F5EE`  | `#0F6E56`   |
| Blue   | `#E6F1FB`  | `#185FA5`   |
| Purple | `#EEEDFE`  | `#534AB7`   |
| Amber  | `#FAEEDA`  | `#854F0B`   |
| Red    | `#FCEBEB`  | `#A32D2D`   |
| Green  | `#E8F7F0`  | `#1D9E75`   |

### Icon backgrounds (dark mode)

- All use `rgba([colour-rgb], 0.1)` background
- Icon colour matches the card accent colour

---

## STATUS BADGES

### Light mode

| Status     | Background  | Color     |
|------------|-------------|-----------|
| Approved   | `#E8F7F0`  | `#0F6E56` |
| Issued     | `#E6F1FB`  | `#0C447C` |
| Draft      | `#F1EFE8`  | `#5F5E5A` |
| In Review  | `#EEEDFE`  | `#3C3489` |
| Pending    | `#FAEEDA`  | `#633806` |
| SLA Breach | `#FCEBEB`  | `#A32D2D` |
| Active     | `#E8F7F0`  | `#0F6E56` |
| Inactive   | `#F1EFE8`  | `#5F5E5A` |

### Dark mode (all add `border: 1px solid`)

| Status     | Background                       | Color                       | Border                       |
|------------|----------------------------------|-----------------------------|------------------------------|
| Approved   | `rgba(29,158,117,0.12)`         | `#5DCAA5`                   | `rgba(29,158,117,0.2)`      |
| Issued     | `rgba(30,136,229,0.12)`         | `#85B7EB`                   | `rgba(30,136,229,0.2)`      |
| Draft      | `rgba(255,255,255,0.05)`        | `rgba(176,196,222,0.5)`     | `rgba(255,255,255,0.08)`    |
| In Review  | `rgba(140,80,255,0.12)`         | `#B794FF`                   | `rgba(140,80,255,0.2)`      |
| Pending    | `rgba(245,166,35,0.12)`         | `#FAC775`                   | `rgba(245,166,35,0.2)`      |
| SLA Breach | `rgba(226,75,74,0.12)`          | `#F09595`                   | `rgba(226,75,74,0.2)`       |
| Active     | `rgba(29,158,117,0.12)`         | `#5DCAA5`                   | `rgba(29,158,117,0.2)`      |
| Inactive   | `rgba(255,255,255,0.06)`        | `rgba(176,196,222,0.5)`     | `rgba(255,255,255,0.08)`    |

### Badge style

```css
font-size: 10px;
font-weight: 600;
padding: 3px 9px;
border-radius: 20px;
display: inline-flex;
white-space: nowrap;
```

---

## SLA INDICATORS (SOA Queue + Dashboard)

### Light mode

| Level   | Dot       | Text      | Extra            |
|---------|-----------|-----------|------------------|
| OK      | `#1D9E75` | `#0F6E56` |                  |
| Warning | `#F5A623` | `#854F0B` |                  |
| Breach  | `#E24B4A` | `#A32D2D` | pulsing, fw 600  |

### Dark mode

| Level   | Dot       | Text      | Extra            |
|---------|-----------|-----------|------------------|
| OK      | `#1D9E75` | `#5DCAA5` |                  |
| Warning | `#F5A623` | `#FAC775` |                  |
| Breach  | `#E24B4A` | `#F09595` | pulsing, fw 600  |

### Row left border (SOA Queue table)

- **Breach:** `border-left: 3px solid rgba(226,75,74,0.7)` (dark) / `#E24B4A` (light)
- **Warning:** `border-left: 3px solid rgba(245,166,35,0.6)` (dark) / `#F5A623` (light)
- **OK:** no left border

### Pulse animation

```css
@keyframes slaPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(226,75,74,0.4); }
  50% { box-shadow: 0 0 0 4px rgba(226,75,74,0); }
}
```

---

## TABLE PATTERN

### Table header row

- Padding: `10px 16px`
- Border-bottom: mode border
- Background: section header colour

### Table rows

- Padding: `11px 16px`
- Border-bottom: mode border
- Cursor: `pointer`
- Transition: `background 0.1s`
- Hover: row hover colour

### Avatar circles in tables

- Width/height: `28-32px`
- Border-radius: `8px` (square-ish, not circles)
- Font-size: `10-11px`, font-weight `700`, color `#fff`

### Action buttons in tables

| Type     | Style                                                                        |
|----------|------------------------------------------------------------------------------|
| View     | transparent bg, border mode border, text muted → teal on hover              |
| Approve  | `rgba(29,158,117,0.08)` bg, border `rgba(29,158,117,0.25)`, text green     |
| Assign   | `rgba(30,136,229,0.08)` bg, border `rgba(30,136,229,0.25)`, text blue      |
| View As  | blue variant                                                                 |
| More (⋯) | 26x26px, border-radius 6px, border mode border                             |

### Pagination

- Display: flex, align-items center, justify-content space-between
- Padding: `12px 16px`
- Border-top: mode border
- Background: section header colour
- Page buttons: `28x28px`, border-radius `7px`, border mode border
- Active page: background `#00C9B1`, border `#00C9B1`, color `#060D1A`, font-weight `600`
- Hover: border teal, color teal

---

## FILTERS BAR

### Search input

- Icon: magnifying glass SVG, muted colour
- Input: transparent background, no border
- Wrapper: flex, background input bg, border input border, border-radius `8-9px`, padding `8px 12px`
- Focus: border-color `rgba(0,201,177,0.3-0.5)`
- Placeholder: hint colour

### Filter selects

- Background: input bg colour
- Border: input border
- Border-radius: `8-9px`
- Padding: `8px 28px 8px 12px`
- Appearance: none with custom chevron SVG

### Add/New button (on pages that have it)

```css
background: linear-gradient(135deg, #00C9B1, #00A693);
color: #060D1A;
border: none;
border-radius: 9px;
padding: 9-10px 16-18px;
font-weight: 600;
/* hover */
transform: translateY(-1px);
box-shadow: 0 6px 20px rgba(0,201,177,0.35);
```

---

## MODALS (Add Group, etc.)

### Dark mode (used everywhere)

- Overlay: `rgba(0,0,0,0.6)` + `backdrop-filter: blur(4px)`
- Modal background: `#0D1929`
- Border-radius: `16px`
- Border: `1px solid rgba(0,201,177,0.15)`
- Padding: `28px`
- Max-width: `480px`
- Box-shadow: `0 40px 80px rgba(0,0,0,0.6)`

### Form inputs in modal

- Background: `rgba(255,255,255,0.04)`
- Border: `1px solid rgba(255,255,255,0.1)`
- Border-radius: `9px`
- Padding: `10px 14px`
- Font-size: `13px`
- Focus: border `rgba(0,201,177,0.4)`, background `rgba(0,201,177,0.03)`

### Modal action buttons

- **Cancel:** transparent, border `rgba(255,255,255,0.1)`, color muted
- **Create/Confirm:** gradient `#00C9B1 → #00A693`, color `#060D1A`, font-weight `600`

---

## DARK/LIGHT MODE IMPLEMENTATION

### JavaScript (App.jsx or theme context)

```jsx
const [theme, setTheme] = useState(() => {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
});

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}, [theme]);
```

### CSS Variables (index.css)

```css
:root {
  --bg-page: #F0F3F8;
  --bg-card: #ffffff;
  --border-card: 0.5px solid #E0E6F0;
  --text-primary: #0A1628;
  --text-secondary: #3A4A6B;
  --text-muted: #8A9BBE;
  --text-hint: #B0BCCF;
  --bg-input: #F8FAFB;
  --border-input: 0.5px solid #E0E6F0;
  --bg-topbar: #ffffff;
  --border-topbar: 0.5px solid #E0E6F0;
  --bg-row-hover: #FAFBFD;
  --border-row: 0.5px solid #F5F7FB;
  --bg-section-header: #FAFBFD;
}

[data-theme="dark"] {
  --bg-page: #060D1A;
  --bg-card: rgba(13,25,41,0.8);
  --border-card: 1px solid rgba(255,255,255,0.06);
  --text-primary: #F0F4FF;
  --text-secondary: rgba(176,196,222,0.75);
  --text-muted: rgba(176,196,222,0.45);
  --text-hint: rgba(176,196,222,0.3);
  --bg-input: rgba(255,255,255,0.04);
  --border-input: 1px solid rgba(255,255,255,0.08);
  --bg-topbar: rgba(6,13,26,0.95);
  --border-topbar: 1px solid rgba(0,201,177,0.08);
  --bg-row-hover: rgba(255,255,255,0.03);
  --border-row: 1px solid rgba(255,255,255,0.04);
  --bg-section-header: rgba(0,0,0,0.2);
}
```

Apply CSS variables throughout all components so light/dark mode switches automatically.
**The sidebar is ALWAYS dark (`#040B15`) regardless of mode — never use CSS variables for sidebar colours.**

---

## CHART STYLING (Dashboard only)

### Theme-dependent values

```jsx
// Light mode
Chart.defaults.color = '#8A9BBE';
gridColor: '#F0F3F8'
tooltipBg: '#0A1628'

// Dark mode
Chart.defaults.color = 'rgba(176,196,222,0.4)';
gridColor: 'rgba(255,255,255,0.04)'
tooltipBg: 'rgba(4,11,21,0.9)'
tooltipBorderColor: 'rgba(0,201,177,0.2)'
```

### Line chart colours (both modes)

- Completed line: `#00C9B1`, fill `rgba(0,201,177,0.06-0.08)`
- Submitted line: `#1E88E5` dashed, fill `rgba(30,136,229,0.04)`

### Donut chart colours (both modes)

- Approved: `#5DCAA5`
- In Review: `#85B7EB`
- Draft: `#B4B2A9` (light) / `rgba(176,196,222,0.2)` (dark)
- SLA Breach: `#F09595`

---

## BREADCRUMB PATTERN PER PAGE

```
Dashboard:     🏠 › Dashboard [Platform Admin]
SOA Queue:     🏠 › SOA Queue [82 requests]
Advice Groups: 🏠 › Advice Groups [34 groups]
Advisers:      🏠 › Advisers [3 advisers]
Clients:       🏠 › Clients [90 clients]
All Tickets:   🏠 › All Tickets
Data Manager:  🏠 › Data Manager
SOA Template:  🏠 › SOA Templates [6 templates]
Team:          🏠 › Team [7 members]
Settings:      🏠 › Settings [Platform Admin]
```

---

## CRITICAL RULES — READ BEFORE EVERY PROMPT

1. **SIDEBAR IS ALWAYS DARK** — never changes with light/dark mode
2. **KPI numbers:** always `22px DM Sans 600 tabular-nums` — NEVER Syne, NEVER 28px+
3. **Never use orange/purple hero cards** — those are removed. Use the 2px top bar system instead
4. **axiosInstance converts camelCase ↔ snake_case** — always check field names arrive as snake_case in frontend
5. **Every C# entity property needs `.HasColumnName("snake_case")`** in DbContext
6. **NEVER add `PostConfigure<JwtBearerOptions>`** — it breaks Microsoft Identity Web auth
7. **Data showing as zero = RLS issue**, not data loss — check TenantMiddleware.cs
8. **Dark mode cards use `backdrop-filter: blur(10px)`** — requires position relative on parent
9. **Use CSS variables** (`--bg-card`, `--text-primary` etc) for all colours so mode switch works
10. **Sidebar active item has a 3px left border indicator** — position absolute, left -6px
