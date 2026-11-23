# WEB-PAGE-PROJECT
Quad Reckoner is a client-side web application built with semantic HTML5, responsive CSS Grid/Flexbox, and modular vanilla JavaScript that unifies four interactive computational tools inside a single browser-based workspace.

Core Functional ModulesMulti-Category Unit & Currency Converter
Converts values across 15 measurement systems: Temperature, Length, Weight, Volume, Area, Speed, Time, Data, Energy, Power, Pressure, Force, Angle, Fuel Economy, and Currency.

Features cross-category instant search, one-click unit swapping, dynamic formula/ratio explanations, and live USD-based exchange rate synchronization (open.er-api.com) with localStorage caching for offline use.

Income Tax Calculator

Computes annual or monthly-scaled (× 12) income tax using pure HTML <input> controls (zero prompt() dialogs) across a 6-tier progressive tax schedule: 0% (up to ₱250,000), 20% over ₱250,000, ₱30,000 + 25% over ₱400,000, ₱130,000 + 30% over ₱800,000, ₱490,000 + 32% over ₱2,000,000, and ₱2,410,000 + 35% over ₱8,000,000.

Displays the active bracket rule, basic-plus-excess tax breakdown, annual tax payable, net income, and an interactive Reference Tax Table where clicking any sample row auto-fills and calculates the test case.

Looping Constructs Visualizer

Evaluates entry-controlled (while factorial), exit-controlled (do...while sum), and counter-controlled (for average) loops for whole numbers $n \in [0, 170]$ with adjustable animation speeds (Normal, Fast, Instant) and replay support.

Renders three synchronized visual engines—1. Execution Tape, 2. Interactive Control-Flow SVG Flowcharts, and 3. Visual Math Block Builder—complete with individual Show/Hide toggles and Only This solo-focus controls.

Dynamic Payroll System

Captures Employee Name, Days Worked, Daily Rate, and Deduction Amount via validated HTML form inputs.

Automatically computes Gross Pay = Days Worked × Daily Rate and Net Pay = Gross Pay − Deduction, renders a dynamically numbered (No.) ledger table, supports record removal by Line Number (No.) as well as per-row delete buttons, and updates footer summary totals in real time.

UI/UX & Technical Architecture

Landing & Workspace Shell: Combines a sticky navigation header (with mobile drawer), a Z-pattern hero section featuring a live Quick FX & Mini Loop sandbox, a 2×2 Bento module grid, feature spotlights, a 3-step workflow section, an FAQ accordion, and a status footer.

Session Scratchpad: Includes a collapsible sidebar inside the workspace that automatically logs recent calculations across all four modules alongside quick reference constants.Client-Side Reliability: Executes 100% in the browser without external libraries or backend dependencies, incorporating input validation, XSS-safe HTML escaping, ARIA live regions for screen readers, and responsive mobile breakpoints.
