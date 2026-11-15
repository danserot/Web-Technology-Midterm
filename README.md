# RentoCar

Responsive car rental coursework by Team SE-2525. Browse 20 cars, combine filters, save favorites, compare vehicles and complete a demonstration booking. No payment or real reservation is made.

## Run locally

No application dependencies or build step are required. From the repository root:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open <http://127.0.0.1:4173/>. Use HTTP rather than opening HTML files directly. Bootstrap, fonts and jQuery load from CDNs; exchange rates need an internet connection.

## Pages

| Page | Features |
| --- | --- |
| index.html | Trip search, popular cars, persistent favorites, FAQ and favorite notifications |
| cars.html | All cars, combined category/price/seats/fuel/name filters and empty results |
| catolog.html | Curated cars and comparison of up to three vehicles |
| categories.html | Category links to the filtered fleet |
| booking.html?carId=2 | Selected car, validated form, rental calculation and demo confirmation |
| home.html | Existing supplementary home page |

USD/EUR/GBP controls appear on Home, Cars, Catalog and Booking. A selection updates card prices, favorites, comparison, booking totals and an already visible confirmation. The preference survives navigation when browser storage is available.

## Artem's implementation

All application JavaScript is inside assets/js.

| File | Responsibility |
| --- | --- |
| models/Car.js | Validated Car constructor, matchesFilters(filters), calculateRentalCost(days) |
| carsData.js | All 20 Car instances; shared cars and getCarById(id) |
| services/storageService.js | Safe JSON reads, writes, deletion and structure validation |
| services/currencyService.js | Shared asynchronous Frankfurter request, timeout, validation, conversion and preference |
| currencyUi.js | Currency control, request status, retry, price and filter-label updates |
| cars.js | Calls Car.matchesFilters for real catalog filtering |
| booking.js | Calls Car.calculateRentalCost for summary and confirmation totals |
| search.js, favorites.js, jqueryUi.js | Existing features integrated with common storage and currency services |

### Model and price rules

```javascript
const car = window.RentoCar.getCarById(1);
car instanceof window.RentoCar.Car; // true
car.matchesFilters({ category: "suv", price: "high", query: "porsche" }); // true
car.calculateRentalCost(3); // 492 USD
```

price always means the original daily USD amount. Rental duration is a non-negative whole number of calendar days; zero days produces zero cost. Invalid or excessively large durations throw RangeError. Booking requires a current or future pick-up date and a later return date. Calendar dates are compared in UTC to avoid daylight saving changes.

Price bands remain based on USD: low < 100, mid 100-150 inclusive, high > 150. Their displayed boundaries are converted together with prices. Currency changes do not change band membership. Conversion always starts from USD; rounded display values are never converted again. The final rental amount is converted once and formatted with Intl.NumberFormat to two decimals.

### Currency service

The app uses [Frankfurter's documented v2 API](https://frankfurter.dev/) with ECB reference rates:

```text
https://api.frankfurter.dev/v2/providers/ecb/rates?base=USD&quotes=EUR,GBP
```

No API key is needed. These are reference rates, not live market quotes or payment prices. The UI shows the date supplied by the API, including when the latest available date precedes today.

One request retrieves both rates for the entire page. Concurrent callers share one pending request; successful results are reused in memory. New pages request fresh data. A ten-second timeout prevents indefinite loading. HTTP failures, malformed JSON, wrong base/currencies, duplicate/missing rates, non-positive/non-finite rates, invalid dates and inconsistent dates are rejected. An empty array has a separate empty state.

```javascript
const { currency } = window.RentoCar;
await currency.loadRates();               // returns state; expected request failures do not reject
currency.setCurrency("EUR");             // boolean; unsupported currencies rejected
currency.convert(164);                    // number in effective display currency
currency.format(164);                     // formatted display price
currency.getState();                      // immutable state and rates snapshot
await currency.loadRates({ force: true }); // explicit refresh/retry
```

State fields: status, currency, preferredCurrency, rates, date, error.

| Status | Visible behavior |
| --- | --- |
| idle / loading | Original USD prices, loading message; selector disabled while loading |
| success | Currency selection enabled; rates, source, date and estimate explanation |
| empty | Empty-data explanation, original USD prices and Try again button |
| error | Network/timeout/invalid-data explanation, USD prices and Try again button |

After failure the effective currency is USD. The saved preference is retained and restored after a successful retry. Previous rates are not presented as a fresh response. rentocar:currency-change is dispatched on window when state or selection changes, with state in event.detail.

Price elements carry data-price-usd. Dynamic renderers format new nodes immediately; currencyUi.js refreshes existing nodes on currency events. Booking listens separately to update calculated totals and confirmation text.

### Safe storage and migration

```javascript
const { storage } = window.RentoCar;
storage.read("selectedCarId", 1, storage.validators.carId); // value or supplied fallback
storage.write("selectedCarId", 2, storage.validators.carId); // boolean
storage.remove("selectedCarId");                           // boolean
storage.lastError; // null or { operation, key, reason }
```

All direct localStorage calls are confined to storageService.js, including access to the storage getter. Missing keys use the supplied fallback. Corrupt JSON, invalid structures, thrown validators, disabled storage, quota failures and deletion errors do not stop the page. Unsupported JSON values and cyclic objects are rejected before writing. Failure dispatches rentocar:storage-error without exposing stored contents. UI interactions continue in memory when persistence is unavailable.

Existing keys are preserved without a destructive migration:

| Key | JSON value | Validation |
| --- | --- | --- |
| selectedCarId | Positive integer | validators.carId; existing raw numeric values such as 2 parse as JSON numbers |
| rentalSearch | { location, pickup, return } | Non-empty location, valid calendar dates/local date-times |
| favoriteCarIds | Array of positive integers | validators.favoriteIds; unknown cars removed when reading favorites |
| preferredCurrency | USD, EUR or GBP string | Supported currency only |

Booking contact details are not persisted. New features should use this service with a suitable validator instead of adding direct localStorage access.

### Integration contract

Local scripts load at the end of body in this order on all four currency pages:

1. services/storageService.js
2. models/Car.js
3. carsData.js
4. services/currencyService.js
5. Page scripts: cars.js, booking.js, or Home/Catalog scripts
6. currencyUi.js

Shared scripts extend window.RentoCar without replacing existing services. jQuery loads before jqueryUi.js. Bootstrap enables mobile navigation on every page. Site links and local asset paths are relative so deployment under a repository subpath works. Curated cards and fleet links pass carId explicitly; the stored selection remains a fallback.

## Verification and demonstrations

Run dependency-free service tests with Node.js:

```powershell
node tests/services.test.cjs
```

The 30 checks cover model instances, combined filters and boundaries, rental totals, legacy/corrupt/blocked storage, failed writes/removal, shared requests, conversion, preference persistence, HTTP/JSON/structure errors, empty data, timeout, retry, synchronous fetch failures and reentrant calls from loading-event listeners.

For browser verification, start the HTTP server, then run:

```powershell
npx --yes --package @playwright/cli playwright-cli -s=rentocar open http://127.0.0.1:4173/cars.html
npx --yes --package @playwright/cli playwright-cli -s=rentocar run-code --filename tests/browser-smoke.js
npx --yes --package @playwright/cli playwright-cli -s=rentocar close
```

The browser script controls API responses through Playwright routing. It checks all request states, retry, filtering, currency persistence, booking/confirmation, favorites, comparison, six pages, corrupt/blocked storage and mobile navigation. Controlled responses are fixtures, not live API proof. It clears storage only in its isolated browser session. Use a separate normal browser visit to verify real Frankfurter rates.

For a manual defense demo, use DevTools Network throttling to show loading; switch offline and reload to show USD fallback; switch online and press Try again. The browser script demonstrates empty and invalid-data states deterministically. To demonstrate corrupt storage, set rentalSearch to {broken or favoriteCarIds to null in DevTools Application > Local Storage and reload. The service tests inject quota/access failures to demonstrate failed writes without changing browser settings.

## Team and contribution guide

Team SE-2525:

- Artem Khloptsev: Car model, external API, common services, integration and release documentation in this change.
- Khasan Abi-Mansur: booking area; existing booking form and confirmation are preserved and integrated with common services.
- Nurumbet Danial: catalog/accessibility area; filtering, categories, favorites and comparison remain available through shared interfaces.

This README describes the current integrated implementation. Separate final contributions from other participants must be checked against their actual branches before counting them as completed new features.

Artem's local working branch is final/artem-api-core. The remote already contains final, which prevents Git from also storing final/artem-api-core; the remote release branch is the existing artem-api-core. Preserve final and teammates' branches. Before merging, agree on shared HTML and window.RentoCar contracts, run the tests, and check navigation and published resource paths.

Use focused commits, for example feat(oop): introduce Car model and catalog instances; feat(storage): add safe JSON storage helpers; feat(api): load exchange rates and handle request states; feat(currency): convert catalog and booking prices.

## Publication

Published site: <https://danserot.github.io/Web-Technology-Midterm/>.

Verified on 10 November 2026 against application commit 43134b0:

- 30 service checks passed, including request deduplication from loading-event listeners.
- Browser scenarios passed on six local pages with no JavaScript exceptions or broken local resources.
- GitHub Pages deployment completed successfully. All six published pages and 39 local resources returned HTTP 200.
- Real Frankfurter requests succeeded on all four currency pages. The supplied rate date was 2026-11-09.
- The published Porsche booking for three days changed from USD 492.00 to EUR 439.56 at the returned rate of 0.89342. Filtering, selected-car navigation and mobile layout passed.

These results describe this release; future network availability and exchange rates can change.

Publish from the root of artem-api-core. .nojekyll preserves the static files; no bundling is required. Keep secrets and personal data out of this public repository. After deployment, check Home, Cars, Catalog, Categories and Booking under the repository subpath, local styles/scripts/images, mobile navigation and a real currency request. Local tests alone do not establish that the published version is current.

## Technologies

HTML5, CSS3, Bootstrap 5.3.3, vanilla JavaScript, fetch/async/await, JSON localStorage, Intl.NumberFormat, and jQuery 3.7.1 for FAQ and notification animations. No framework or backend is required.
