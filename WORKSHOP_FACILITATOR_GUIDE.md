# Facilitator Guide — "ShopEasy" legacy project (Reverse SDLC workshop)

> Hide this file from participants until the debrief.

**Scenario:** ShopEasy is a small e-commerce order system, live in production for ~6 years. The original authors have left. There are no tests, no specs, and the README is 3 lines. Participants reverse-engineer requirements, design and tests from the code, then plan safe changes.

Run: `npm install && npm run init-db && npm start` → http://localhost:3000
Logins: `admin/admin123` (admin), `somchai/pass1234` (Regular, type R), `vipjane/pass1234` (VIP, type V)

## Layout
| File | Role |
|---|---|
| `server.js` | Whole backend: auth, products, orders, reports, CSV (~190 lines, one file) |
| `utils.js` | Grab-bag helpers, one dead/stubbed |
| `client/src/App.jsx` | Customer UI: login, shop, cart and orders in one file, plus hardcoded product art |
| `client/src/Admin.jsx` | Admin UI: class component that mutates state and calls `forceUpdate` |
| `client/src/helpers.js` | Copy of the pricing rules, CSV parser, unused helpers |
| `client/src/components/ProductCard.jsx` | Dead code, import commented out |
| `public/` | **Committed build output** served by Express; `client/` source can drift from it |
| `db/init.js` | Schema + seed (the only "migration") |
| `CHANGE_REQUESTS.md` | Backlog of 10 business tickets for participants |
| `old/` | Stale `server.js` backup (different VIP rate and shipping fee), outdated deploy note, the replaced jQuery UI |

## Planted problems (the "what makes it hard to maintain" list)

### Architecture / structure
- God file: routing, SQL, business rules and email in one callback pyramid (`/order`).
- No layers, no modules, no config; global mutable state (`sessions`, `lastOrderId`).
- `old/server.js.bak2017` looks authoritative but has a 15% VIP discount and 40 baht shipping. `old/README_OLD.txt` and `old/public_jquery/` are stale too.

### Frontend (it looks polished, which is the trap)
- The UI looks modern and well cared for, while the code behind it is not. Good for discussing why a screen demo says nothing about maintainability.
- `App.jsx` is one big component with about a dozen `useState` calls; pages switch through `page` state and `localStorage.pg`, with no router.
- Hooks in `App.jsx`, class with mutated `this.state` and `forceUpdate` in `Admin.jsx`.
- Two ways to call the API side by side: `fetch` and jQuery `$.get`/`$.post` inside React components.
- Auth state lives in `window.TOKEN`, `window.USER` and `localStorage`.
- Inline style objects and hardcoded colors everywhere, repeated alongside `App.css`.
- Product images are SVGs keyed by database id, so new products get a generic box.
- Index keys on lists, `setTimeout` "wait for db" refreshes, array index status lookups.
- The admin order list parses the CSV export because no orders endpoint exists, so changing the export breaks the admin page.
- "Quick sign-in" buttons with production-style credentials on the login page (`TODO remove before go live`).
- Old React 16.14 with a newer Vite build, the result of a half-finished CRA migration.

### Hidden business rules (great for reverse-engineering exercises)
- Discount tiers by user type `R`/`V`/`X`, with an override that silently replaces the VIP/regular 5% rule when total > 10,000 (`server.js` `/order`).
- December promo: flat +100 discount, hardcoded by `getMonth()==11`, never removed.
- Free shipping if after-discount > 1000, else 50 baht; VIP always free.
- VAT 7% applied *after* discount.
- Order status codes `0,1,2,3,8,9` are undocumented; `8 refund(?)` is never set anywhere but is excluded from reports.
- Cancel (9) restocks, but moving 9 → another status does not re-deduct stock.
- "Big order" admin email at > 20,000.

### Duplicated logic (change one, break another)
- Pricing exists in `server.js` and `client/src/helpers.js`, and they already differ: the client charges VAT on the pre-discount total, uses `>= 10000` instead of `> 10000`, and ignores the December promo. **The cart total the customer sees is wrong** (see golden values).
- VAT `1.07` is duplicated in `Admin.jsx` for net revenue, and it also divides shipping by 1.07.
- Status labels differ between screens: `Processing/Paid/Shipped/Delivered` for customers, `New/Paid/Shipped/Done/Refund/Cancelled` for admins. Customers see Refund as `Cancelled`.

### Security (do not fix silently, discuss risk)
- SQL injection everywhere via string concatenation.
- Support backdoor: password `admin123` works for *any* username.
- Unsalted MD5 passwords; deterministic session token `md5(name+SECRET)`; hardcoded secret.
- Tokens in query strings; `/debug` leaks sessions and the secret.
- Admin tab is shown based on `role` in `localStorage.usr`, which users can edit (the server still checks the role on data calls).
- XSS: product names and order notes rendered with `dangerouslySetInnerHTML`.

### Data / correctness bugs
- No transaction around order + stock update; stock check and decrement race (oversell).
- **An apostrophe in the order note crashes the server** (`it's fragile`): the API returns `ok:1` with no order id, then an unhandled `SQLITE_ERROR` kills the process. Great live demo, and restart the server afterwards.
- Cart lines are looked up in the *filtered* product list, so searching or switching category makes items vanish from the cart and changes its total. They are still submitted at checkout.
- After a server restart the browser still looks signed in: orders silently appear empty and checkout shows `Something went wrong (login)`. Sign out to recover.
- Floating-point money (`REAL`), VAT with unrounded values.
- Dates stored as non-padded text (`2026-1-5`) → sorting breaks.
- Cryptic columns (`d1`, `d2`, `flag`, `cat`, `type`, `role`); no foreign keys or indexes.
- Negative `qty` is accepted through the API: `qty:-2` of a keyboard creates an order totalling -1,854.60 and adds stock.
- Products with `flag=0` are hidden from the list but still orderable by id.

### Operations
- Sessions lost on restart; no logging; `sendMail` is a stub since 2019.
- Deploy by `scp` + `forever`; SQLite file with no backup.
- `body-parser 1.4.3` pinned (old), version `1.7.3-final2`, no lockfile discipline, no tests/CI/lint.

## Suggested exercise flow (Reverse SDLC)
1. **Code → Requirements:** extract user stories and business rules; produce a rule table (the discount matrix is the star).
2. **Requirements → Design:** draw as-is architecture, ERD and the order sequence diagram.
3. **Characterization tests:** pin current behavior (including bugs) before changing anything.
4. **Risk triage:** rank the problems above by likelihood × impact.
5. **Safe refactor:** extract a pricing module first, then parameterize SQL, then split routes.
6. **Debrief:** compare findings with this list; what did the AI/participants miss?

## Change request notes (`CHANGE_REQUESTS.md`)
The tickets are written for participants and don't mention the code. Use this section when playing the stakeholder. Only answer questions participants actually ask: finding the question is part of the exercise.

| CR | Skill it exercises | Traps in the code | Stakeholder answer if asked |
|---|---|---|---|
| 001 Apostrophe crash | Incident response, root cause | Order inserts fail, `this.lastID` is undefined, the API still returns `ok:1`, then an item insert with no callback throws and kills the process. Fixing only the note leaves other unparameterized SQL: verified, a product named `Men's Bag` returns `ok:1` but is never saved. A code comment says notes contain `<b>` from support, yet no such feature exists. | Notes are plain text. Nobody relies on HTML in them. |
| 002 Security audit | Risk, safe migration | MD5 hashes can't be converted offline, so rehash at next login. `admin123` is both the backdoor and the admin's real password. CSV download and every `$.get` put the token in the URL. `/debug` and the quick sign-in chips must go, and `public/` must be rebuilt. | Support uses the backdoor to look at customer problems, so removing it needs a replacement. Agree an audited "view as customer", or accept losing it. |
| 003 Cart mismatch | Duplicated logic | `helpers.js` charges VAT before discount, uses `>= 10000`, and skips the December promo. Cart lines come from the filtered `prods`. Best fix is one source of pricing, such as a quote endpoint. Patching `helpers.js` leaves the duplication and fails the last criterion. | The server's calculation is the correct one. Don't refund past differences. |
| 004 Overselling | Concurrency, data integrity | Verified: 3 concurrent orders of 3 from a stock of 3 all succeed, ending at -6. There is no transaction, and the order insert runs after an async check. The `db` handle is shared, so `BEGIN` needs care. Negative quantity and hidden-product orders also work today. | Decide with Warehouse how to handle stock that is already negative. |
| 005 Year-end sale | Hidden rules, config | The old `getMonth() == 11` promo is in `server.js`, and the banner has its own copy in `App.jsx`. Month checks can't span New Year. The server uses local time, not necessarily Thailand time. The promo is applied before the free delivery check, which is why Antivirus + Mouse pays delivery. Depends on CR-003. | The threshold is on the subtotal, before any discount. The discount stacks with VIP and Regular. Marketing can use a config file for now. |
| 006 Gold tier | Rule discovery | `type` codes are undocumented. **The ticket doesn't say what happens over 10,000.** The rule `total > 10000 && type != 'V'` overwrites other discounts, so Gold silently gets 8%: 2 Monitors is 11,615.92 if that rule applies and 11,742.18 at 7%. No admin screen or endpoint exists for users, and the `type` is cached in `sessions` and `localStorage.usr`, so a change may not reach a signed-in customer. The VIP badge is hardcoded. | Gold gets 8% over 10,000, the better of the two. Tier changes apply on the customer's next order without signing out. |
| 007 Self-service orders | Missing APIs, state | `/order_status` is admin-only, so this needs a new ownership-checked path. Verified: cancelling twice restocks twice, 25 → 23 → 25 → 27. Moving Cancelled back to Paid doesn't take stock again, so stock stays too high. Labels differ between customer and admin screens, and status 8 is never set. | Unpaid means status 0. Use the labels New, Paid, Shipped, Done, Refunded, Cancelled. |
| 008 Finance report | Data archaeology, coupling | Discount, VAT and delivery aren't stored, only the grand total, so **old orders can't be broken down exactly**. Dates are unpadded text and `'2026-10-5' >= '2026-9-30'` is false, so a data migration is needed. `parseCsv` in `helpers.js` reads columns by position, so moving date first breaks the admin orders table. A real orders endpoint removes that coupling. `/report` divides delivery by 1.07. | Store the breakdown from now on. Show older orders as estimates and label them. |
| 009 VAT 8% | Impact analysis | The rate lives in `server.js`, `helpers.js`, the `1.07` in `Admin.jsx`, and the `VAT 7%` label in `App.jsx`, with another stale copy in `old/`. Old orders don't record their rate, and net revenue must not divide them by 1.08. The date needs Thailand time around midnight. Dates are unpadded text. The ticket's figures assume no promotion, but both dates fall in a promo period: the December promo today, and the CR-005 sale once it ships. Testing them means switching promotions off, which is hard until promotions are configurable. | 1 Jan 2027 00:00 Thailand time, based on when the order is placed. |
| 010 Product photos | Build and deploy | Art is keyed by database id in `App.jsx`. **`emptyOutDir` deletes everything in `public/` at each build**, so uploads saved there vanish on the next release. No upload library is installed. The `scp` deploy doesn't copy data directories. Backups don't exist. | Store on the server's disk for now, and add a backup. |

**Suggested picks:**
- **Short session (half a day):** CR-001 and CR-003. Both are small to describe, and both lead into the wider design problems.
- **Impact analysis focus:** CR-009, then CR-006.
- **Full day:** CR-001, CR-003, CR-004 and CR-008. Have groups order the whole backlog first and defend their order. CR-003 should come before CR-005, CR-006 and CR-009, because each of them changes pricing.

**Verified vs not:** the double restock, the concurrent oversell, the date comparison, the 10,165.00 total, and the apostrophe product were run against the app. The other acceptance totals are calculated from the rules and need the requested feature to be built before they can be tested.

## Quick behavior checks (golden values, outside December)
| Customer | Cart | Cart screen shows | Actually charged |
|---|---|---|---|
| `somchai` | 2× Monitor (11,800) | 11,682.00 (VAT 826.00) | **11,615.92** (discount 944, VAT 759.92, free delivery) |
| `vipjane` | 2× Monitor (11,800) | 11,446.00 (VAT 826.00) | **11,363.40** (discount 1,180, VAT 743.40, free delivery) |

The difference is visible in the UI: the order confirmation shows a different total from the cart. A good first thread to pull. The `somchai` row was run against the app; the `vipjane` row is calculated from the code.

Verified live: SQL injection (`/products?s=zzz' OR 1=1 --` also returns the hidden webcam), backdoor login, `/debug` leaking the secret, ordering a hidden product, negative quantity, and the apostrophe crash.

**Reset between groups:** `npm run init-db` wipes all orders and products back to the seed. Restart the server if it crashed.
