# ShopEasy change request backlog

These requests came in from the business. ShopEasy is live, customers order every day, and nobody who built it still works here. The requesters know what they want, not how the system works.

The scenario is fictional, including the VAT change in CR-009.

Prices below are in baht. Unless a request says otherwise, totals assume an order placed outside December.

| ID | Request | From | Priority | Needed by |
|---|---|---|---|---|
| [CR-001](#cr-001-server-goes-down-when-a-customer-types-an-apostrophe) | Server goes down when a customer types an apostrophe | Customer Support | Critical | Today |
| [CR-002](#cr-002-security-audit-findings) | Security audit findings | IT Security | Critical | 30 Nov 2026 |
| [CR-003](#cr-003-the-price-in-the-cart-is-not-the-price-we-charge) | The price in the cart is not the price we charge | Customer Support | High | 20 Nov 2026 |
| [CR-004](#cr-004-we-keep-selling-stock-we-do-not-have) | We keep selling stock we do not have | Warehouse | High | 30 Nov 2026 |
| [CR-005](#cr-005-year-end-sale) | Year-end sale | Marketing | High | 15 Dec 2026 |
| [CR-006](#cr-006-gold-membership-tier) | Gold membership tier | Sales | Medium | 15 Jan 2027 |
| [CR-007](#cr-007-customers-can-view-and-cancel-their-own-orders) | Customers can view and cancel their own orders | Customer Support | Medium | 31 Jan 2027 |
| [CR-008](#cr-008-monthly-finance-report-and-a-better-export) | Monthly finance report and a better export | Finance | Medium | 31 Jan 2027 |
| [CR-009](#cr-009-vat-is-changing-to-8) | VAT is changing to 8% | Finance | High | 1 Jan 2027 |
| [CR-010](#cr-010-real-product-photos) | Real product photos | Marketing | Low | No date |

---

## CR-001: Server goes down when a customer types an apostrophe

**From:** Customer Support | **Priority:** Critical | **Needed by:** Today

**Background:** The shop has gone down several times this week, usually for a few minutes until someone restarts it. A customer told us it happened right after they asked for delivery to "O'Brien Tower". They also said the order looked successful, but it isn't in their order list.

**Request:** Customers must be able to write anything in the order note without affecting the shop.

**Acceptance criteria**
- An order with the note `Deliver to O'Brien Tower` is saved, and the note appears exactly as typed in My Orders.
- The shop keeps running if a database error occurs, and the customer sees a clear failure message rather than a success.
- A customer is never told an order succeeded when it was not saved.

---

## CR-002: Security audit findings

**From:** IT Security | **Priority:** Critical | **Needed by:** 30 Nov 2026

**Background:** An external audit reported the findings below. We must close them to keep our payment partner's approval.

**Request:** Fix these findings:
1. Signing in to any customer's account is possible with one shared password.
2. Text typed into the product search can change the database query, and other input may be affected too.
3. A public diagnostic page exposes active sessions and a secret key.
4. Passwords are stored with a weak, unsalted hash.
5. Session tokens are predictable and appear in URLs.
6. Saved text can run as script in another user's browser.
7. The login page offers one-click sign-in to real accounts, including admin.

**Acceptance criteria**
- `vipjane` cannot sign in with the password `admin123`.
- Searching for `zzz' OR 1=1 --` returns no products.
- `/debug` no longer exists.
- All existing customers can still sign in with their current password, with no forced reset.
- Two sign-ins by the same user produce different session tokens, and tokens are not sent in URLs.
- A product named `<img src=x onerror=alert(1)>` displays as plain text.
- CSV export still works for admins.

---

## CR-003: The price in the cart is not the price we charge

**From:** Customer Support | **Priority:** High | **Needed by:** 20 Nov 2026

**Background:** Customers complain that the confirmation shows a different total from the cart. Some are asking for refunds of the difference. Others say items disappear from their cart while they browse, and then turn up on the order anyway.

**Request:** What the customer sees in the cart must be exactly what they are charged, and the cart must always show everything in it.

**Acceptance criteria**

| Customer | Cart | Cart total and amount charged |
|---|---|---|
| `somchai` | 2 × Monitor 24in | 11,615.92 |
| `vipjane` | 2 × Monitor 24in | 11,363.40 |
| `somchai` | 1 × a product priced at 10,000.00 | 10,165.00 |

- The same match holds for orders placed in December.
- Searching or changing category does not change the cart's contents or total.
- A future pricing change should only have to be made in one place.

---

## CR-004: We keep selling stock we do not have

**From:** Warehouse | **Priority:** High | **Needed by:** 30 Nov 2026

**Background:** During busy periods we confirm orders for items that aren't on the shelf, and the stock count in the system sometimes goes below zero. We then have to call customers and apologize. We have also found orders for products we stopped selling, and stock counts that went up for no reason.

**Request:** Stop us selling what we don't have, and keep the stock count reliable.

**Acceptance criteria**
- With 3 units in stock, if 3 customers each order 3 at the same moment, exactly one order succeeds and stock ends at 0.
- An order for several items is all-or-nothing: if one item can't be supplied, nothing is ordered and no stock changes.
- Quantities of zero, below zero, or with decimals are rejected.
- Products hidden by an admin cannot be ordered.

---

## CR-005: Year-end sale

**From:** Marketing | **Priority:** High | **Needed by:** 15 Dec 2026

**Background:** We're planning a year-end sale, and we want to run promotions like this without waiting for a developer each time.

**Request:** From 20 Dec 2026 to 5 Jan 2027 inclusive, Thailand time, take 200 off every order of 1,000 or more before discount. The dates and amount must be changeable without a code change. The banner on the shop page should advertise the sale only while it is running. It replaces all earlier promotions.

**Acceptance criteria** (`somchai`, during the sale)

| Cart | Discount | Delivery | VAT | Total |
|---|---|---|---|---|
| Keyboard + Mouse | 200.00 | Free | 72.80 | 1,112.80 |
| Antivirus 1yr + Mouse | 200.00 | 50.00 | 59.50 | 959.50 |
| Mouse | 0.00 | 50.00 | 24.50 | 424.50 |

- The sale starts and ends correctly across New Year.
- Outside the sale dates, no promotion applies, including in December.
- The cart shows the same total as the order (see CR-003).

---

## CR-006: Gold membership tier

**From:** Sales | **Priority:** Medium | **Needed by:** 15 Jan 2027

**Background:** Regular customers often ask what they need to do to get better terms, but VIP is by invitation only. We want a tier in between.

**Request:** Add a Gold tier. Gold customers get 7% off every order and free delivery when the discounted amount is over 500. They should see a Gold badge. Admins must be able to change a customer's tier without a developer.

**Acceptance criteria** (a Gold customer)

| Cart | Discount | Delivery | VAT | Total |
|---|---|---|---|---|
| Keyboard | 62.30 | Free | 57.94 | 885.64 |
| 2 × Mouse | 49.00 | Free | 45.57 | 696.57 |

- A single Mouse is charged 50.00 delivery.
- An admin can change a customer's tier, and the new terms apply to their next order.
- Regular and VIP customers' prices do not change.

---

## CR-007: Customers can view and cancel their own orders

**From:** Customer Support | **Priority:** Medium | **Needed by:** 31 Jan 2027

**Background:** Most of our calls are "what did I order?" and "please cancel my order." Customers should be able to handle both themselves.

**Request:** In My Orders, a customer can see the items, quantities and prices in each order, and can cancel an order until it has been paid.

**Acceptance criteria**
- Each order shows its items at the price paid, even if the product's price has since changed.
- A customer can cancel only their own orders, and only before payment.
- Cancelled items return to stock exactly once, however many times cancel is requested.
- Order status wording matches what Support and admins see, so everyone uses the same terms.
- Admin stock counts stay correct if an admin reverses a cancellation.

---

## CR-008: Monthly finance report and a better export

**From:** Finance | **Priority:** Medium | **Needed by:** 31 Jan 2027

**Background:** Every month we copy the CSV export into a spreadsheet and work out the figures by hand. The net revenue on the Back Office page doesn't match our numbers.

**Request:** Add a report for a chosen date range showing gross sales, discounts, VAT, delivery fees and net revenue. Also change the CSV export so that the date is the first column, followed by order ID, customer, customer email, subtotal, discount, VAT, delivery, total and status.

**Acceptance criteria**
- A report for 1 to 31 October includes every October order and none from other months.
- Cancelled and refunded orders are excluded.
- Net revenue excludes both VAT and delivery fees.
- For each order, subtotal − discount + VAT + delivery equals the total.
- Dates in the export use `YYYY-MM-DD`.
- Everything else that uses the order data keeps working.

---

## CR-009: VAT is changing to 8%

**From:** Finance | **Priority:** High | **Needed by:** 1 Jan 2027

**Background:** We have been told VAT goes from 7% to 8% for orders placed from 1 Jan 2027, Thailand time.

**Request:** Charge the correct rate according to the order date. This must not need another code change next time the rate changes.

**Acceptance criteria** (with no promotion running)

| Customer | Cart | Placed | VAT | Total |
|---|---|---|---|---|
| `somchai` | 2 × Monitor 24in | 31 Dec 2026 | 759.92 | 11,615.92 |
| `somchai` | 2 × Monitor 24in | 1 Jan 2027 | 868.48 | 11,724.48 |
| `vipjane` | 2 × Monitor 24in | 1 Jan 2027 | 849.60 | 11,469.60 |

- The rate shown to customers is correct on every screen.
- Reports show correct net revenue for orders placed under either rate.
- Past orders do not change.

---

## CR-010: Real product photos

**From:** Marketing | **Priority:** Low | **Needed by:** No date

**Background:** New products all show the same generic box, which looks unfinished, and adding a picture means asking a developer.

**Request:** Admins can upload a photo when adding or editing a product, and the shop shows it. Products with no photo keep their current picture.

**Acceptance criteria**
- An uploaded photo appears on the shop page without a code change.
- Photos are still there after a server restart and after the next release.
- Only images up to 2 MB are accepted, and only admins can upload.
- The five existing products look the same until someone uploads a photo for them.
