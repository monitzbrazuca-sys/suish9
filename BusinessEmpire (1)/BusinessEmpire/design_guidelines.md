# Design Guidelines: Meu Império de Negócios

## Design Approach
**Design System Foundation:** Material Design principles adapted for premium business dashboard aesthetics, emphasizing data clarity and professional sophistication with the specified black, gold, and white palette.

## Core Design Elements

### A. Typography
- **Primary Font:** Inter or DM Sans (Google Fonts)
- **Accent Font:** Montserrat for headings
- **Hierarchy:**
  - H1 (Dashboard titles): 2.5rem, bold (600-700)
  - H2 (Section headers): 1.75rem, semibold (600)
  - H3 (Card titles): 1.25rem, medium (500)
  - Body: 1rem, regular (400)
  - Small/Captions: 0.875rem, regular (400)
  - Numbers/Metrics: Use tabular-nums for alignment

### B. Color System
- **Background:** Pure white (#FFFFFF) for main content areas
- **Cards/Elevated surfaces:** Subtle gray (#F8F9FA) or white with shadows
- **Primary accent:** Gold (#FFD700) for CTAs, highlights, important metrics
- **Dark elements:** Deep black (#0A0A0A) for headers, navigation, text
- **Text hierarchy:** Black for primary, #4A4A4A for secondary, #858585 for tertiary
- **Success:** #10B981, Warning: #F59E0B, Error: #EF4444
- **Chart colors:** Gold primary, black secondary, grays (#E5E7EB, #9CA3AF, #6B7280) for additional data series

### C. Layout System
- **Spacing Scale:** Tailwind units of 1, 2, 3, 4, 6, 8, 12, 16 for consistent rhythm
- **Container:** max-w-7xl with px-4 md:px-6 lg:px-8
- **Card padding:** p-6 lg:p-8
- **Section spacing:** py-6 to py-12
- **Grid gaps:** gap-4 for cards, gap-6 for major sections

### D. Component Library

**Navigation:**
- Sidebar: Fixed dark (#0A0A0A) sidebar, w-64, with gold accent on active items
- Top bar: White background, shadow-sm, contains user profile and notifications
- Mobile: Collapsible hamburger menu

**Dashboard Cards:**
- Elevated cards: White background, rounded-xl, shadow-lg
- Stat cards: Large number (3rem, bold) in black, label below in gray, gold icon/border accent
- Grid: 3-4 columns on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)

**Data Visualization:**
- Charts: Recharts or Chart.js library
- Line graphs: Gold lines, black/gray axis, white background
- Bar charts: Gold bars with black outlines for emphasis
- Comparison graphs: Gold vs black/gray color coding
- Trend indicators: Up/down arrows with success/error colors

**Forms & Inputs:**
- Input fields: border-2 border-gray-300, rounded-lg, focus:border-gold, px-4 py-3
- Labels: text-sm font-medium text-black, mb-2
- Buttons Primary: bg-gold text-black hover:bg-gold-600, rounded-lg, px-6 py-3, font-semibold
- Buttons Secondary: border-2 border-black text-black hover:bg-black hover:text-white

**Tables:**
- Header: bg-black text-white or bg-gray-100 text-black, font-semibold
- Rows: Alternating white and #F9FAFB, hover:bg-gold-50
- Borders: Subtle gray (#E5E7EB)
- Action buttons: Gold text/icons

**Modals & Overlays:**
- Backdrop: bg-black/50
- Modal: White, rounded-2xl, shadow-2xl, max-w-2xl
- Header: pb-4 border-b with gold accent line

**Filters & Controls:**
- Date pickers: Clean white with gold selection
- Dropdowns: Rounded, shadow-md on open
- Search: Prominent with gold focus ring

### E. Page-Specific Layouts

**Dashboard Geral:**
- Hero metrics row: 4-column grid with large stat cards (Entradas, Saídas, Lucro Líquido, Total Geral)
- Charts section: 2-column grid (Lucro Temporal + Comparação Categorias)
- Recent activity table below charts

**Product Management Sections (PLR Nacional/Internacional/Roupas):**
- Action bar: Add product button (gold), filters, search (top of section)
- Product grid/table: Cards or table rows with image thumbnail, details, edit/delete actions
- Form modal: Multi-step for complex entries

**Relatórios:**
- Filter panel: Left sidebar or top bar with date range, category selects
- Preview area: Large central area showing filtered data
- Export buttons: PDF/Excel buttons in gold with download icons

### F. Responsive Behavior
- Desktop (lg): Full sidebar, 4-column grids, expanded charts
- Tablet (md): Collapsed sidebar icon-only, 2-column grids
- Mobile: Hidden sidebar with menu, single column stacks, horizontal scroll for tables

### G. Interactions
- **Minimal animations:** Smooth transitions (150-300ms) on hovers and state changes only
- Card hover: subtle shadow elevation increase
- Button hover: slight darkening, no complex effects
- Loading states: Gold spinner or skeleton screens

**Quality Standards:**
Premium dashboard aesthetic that balances data density with visual breathing room. Every element serves a functional purpose. Gold accents used strategically for importance hierarchy, not decoration. Professional, trustworthy, efficient.