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

## Quick behavior checks (golden values, outside December)
| Customer | Cart | Cart screen shows | Actually charged |
|---|---|---|---|
| `somchai` | 2× Monitor (11,800) | 11,682.00 (VAT 826.00) | **11,615.92** (discount 944, VAT 759.92, free delivery) |
| `vipjane` | 2× Monitor (11,800) | 11,446.00 (VAT 826.00) | **11,363.40** (discount 1,180, VAT 743.40, free delivery) |

The difference is visible in the UI: the order confirmation shows a different total from the cart. A good first thread to pull. The `somchai` row was run against the app; the `vipjane` row is calculated from the code.

Verified live: SQL injection (`/products?s=zzz' OR 1=1 --` also returns the hidden webcam), backdoor login, `/debug` leaking the secret, ordering a hidden product, negative quantity, and the apostrophe crash.

**Reset between groups:** `npm run init-db` wipes all orders and products back to the seed. Restart the server if it crashed.
