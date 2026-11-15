const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const validRates = () => [
  { date: "2026-11-09", base: "USD", quote: "EUR", rate: 0.9 },
  { date: "2026-11-09", base: "USD", quote: "GBP", rate: 0.75 },
];

function createBrowser({ saved = {}, fetch, timers = {} } = {}) {
  const values = new Map(Object.entries(saved));
  const events = [];
  const listeners = new Map();
  const window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
    dispatchEvent(event) {
      events.push(event);
      for (const listener of listeners.get(event.type) || []) listener(event);
      return true;
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
  };
  class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  }
  const sandbox = {
    window, CustomEvent, Intl, URLSearchParams, AbortController,
    setTimeout, clearTimeout, queueMicrotask, console,
    fetch: fetch || (async () => ({ ok: true, status: 200, json: async () => validRates() })),
    ...timers,
  };
  window.setTimeout = timers.setTimeout || setTimeout;
  window.clearTimeout = timers.clearTimeout || clearTimeout;
  window.fetch = sandbox.fetch;
  const context = vm.createContext(sandbox);
  function load(relativePath) {
    vm.runInContext(fs.readFileSync(path.join(root, relativePath), "utf8"), context, {
      filename: relativePath,
    });
  }
  return { window, values, events, context, load };
}

function loadStorage(options) {
  const browser = createBrowser(options);
  browser.load("assets/js/services/storageService.js");
  return { ...browser, storage: browser.window.RentoCar.storage };
}

function loadCatalog() {
  const browser = loadStorage();
  browser.window.RentoCar.marker = "existing services";
  browser.load("assets/js/models/Car.js");
  browser.load("assets/js/carsData.js");
  return { ...browser, app: browser.window.RentoCar };
}

function loadCurrency(options) {
  const browser = loadStorage(options);
  browser.load("assets/js/services/currencyService.js");
  return { ...browser, currency: browser.window.RentoCar.currency };
}

test("storage preserves existing JSON keys and returns the supplied fallback for missing data", () => {
  const { storage } = loadStorage({ saved: { selectedCarId: "2", favoriteCarIds: "[1,2]" } });
  const fallback = [];
  assert.equal(storage.read("missing", fallback), fallback);
  assert.equal(storage.lastError, null);
  assert.equal(storage.read("selectedCarId", 1, storage.validators.carId), 2);
  assert.deepEqual(Array.from(storage.read("favoriteCarIds", [], storage.validators.favoriteIds)), [1, 2]);
});

test("storage tolerates corrupt JSON, incompatible structures and throwing validators", () => {
  const { storage, events } = loadStorage({ saved: {
    broken: "{", wrong: '{"unexpected":true}', valid: "[1]",
  } });
  assert.equal(storage.read("broken", "fallback"), "fallback");
  assert.equal(storage.lastError.operation, "read");
  assert.equal(storage.read("wrong", null, storage.validators.favoriteIds), null);
  assert.equal(storage.read("valid", null, () => { throw new Error("bad validator"); }), null);
  assert.equal(events.filter((event) => event.type === "rentocar:storage-error").length, 3);
});

test("storage handles disabled browser storage, quota errors and remove errors", () => {
  const { storage, window } = loadStorage();
  Object.defineProperty(window, "localStorage", { get() { throw new Error("SecurityError"); } });
  assert.equal(storage.read("key", 42), 42);
  assert.equal(storage.write("key", { value: 1 }), false);
  assert.equal(storage.remove("key"), false);

  const quota = loadStorage();
  quota.window.localStorage.setItem = () => { throw new Error("QuotaExceededError"); };
  assert.equal(quota.storage.write("key", "value"), false);
  assert.equal(quota.storage.lastError.operation, "write");
});

test("storage safely writes and removes JSON without silently corrupting unsupported values", () => {
  const { storage, values } = loadStorage();
  assert.equal(storage.write("selectedCarId", 3, storage.validators.carId), true);
  assert.equal(values.get("selectedCarId"), "3");
  assert.equal(storage.write("selectedCarId", -1, storage.validators.carId), false);
  assert.equal(values.get("selectedCarId"), "3");
  const cyclic = {};
  cyclic.self = cyclic;
  for (const value of [undefined, NaN, Infinity, 1n, () => {}, Symbol("value"), cyclic, { missing: undefined }]) {
    assert.equal(storage.write("bad", value), false);
  }
  assert.equal(values.has("bad"), false);
  assert.equal(storage.remove("selectedCarId"), true);
  assert.equal(storage.read("selectedCarId"), null);
});

test("saved search validation rejects impossible dates and unexpected types", () => {
  const { storage } = loadStorage();
  const valid = { location: "Astana Downtown", pickup: "2026-11-20T10:00", return: "2026-11-23T10:00" };
  assert.equal(storage.validators.rentalSearch(valid), true);
  for (const value of [null, [], {}, { ...valid, location: " " }, { ...valid, pickup: "2026-02-30" },
    { ...valid, pickup: "2026-11-20T24:00" }, { ...valid, return: 20261123 }]) {
    assert.equal(storage.validators.rentalSearch(value), false);
  }
  assert.equal(storage.validators.favoriteIds([1, 20]), true);
  for (const value of [["1"], [0], [1.5], {}, null]) {
    assert.equal(storage.validators.favoriteIds(value), false);
  }
});

test("all catalog cars are Car instances and retain existing service access", () => {
  const { app, storage } = loadCatalog();
  assert.equal(app.marker, "existing services");
  assert.equal(app.storage, storage);
  assert.equal(app.cars.length, 20);
  assert.equal(new Set(app.cars.map((car) => car.id)).size, 20);
  for (const car of app.cars) {
    assert.equal(car instanceof app.Car, true);
    assert.equal(app.getCarById(String(car.id)), car);
    assert.equal(car.calculateRentalCost(3), car.price * 3);
  }
  assert.equal(app.getCarById("unknown"), undefined);
});

test("Car combines filters, normalizes search text and preserves USD price bands", () => {
  const { app } = loadCatalog();
  const car = app.getCarById(4);
  assert.equal(car.matchesFilters({ category: "suv", price: "low", seats: "5", fuel: "Hybrid", query: "  VOLVO  " }), true);
  assert.equal(car.matchesFilters({ category: "electric" }), false);
  assert.equal(car.matchesFilters({ price: "mid" }), false);
  assert.equal(car.matchesFilters({ seats: "7" }), false);
  assert.equal(car.matchesFilters({ fuel: "Petrol" }), false);
  assert.equal(car.matchesFilters({ query: "unknown model" }), false);
  const base = { ...car };
  for (const [price, expectedBand] of [[99, "low"], [100, "mid"], [150, "mid"], [151, "high"]]) {
    const sample = new app.Car({ ...base, price });
    for (const band of ["low", "mid", "high"]) {
      assert.equal(sample.matchesFilters({ price: band }), band === expectedBand);
    }
  }
});

test("rental cost accepts zero and whole days and rejects invalid durations", () => {
  const { app } = loadCatalog();
  const car = app.getCarById(1);
  assert.equal(car.calculateRentalCost(0), 0);
  assert.equal(car.calculateRentalCost(7), 1148);
  for (const days of [-1, 1.5, NaN, Infinity, "3", null, undefined]) {
    assert.throws(() => car.calculateRentalCost(days));
  }
});

test("currency shares one in-flight request and converts all prices from unchanged USD values", async () => {
  let requests = 0;
  let release;
  const { currency, values, events } = loadCurrency({ fetch: async () => {
    requests += 1;
    return new Promise((resolve) => { release = () => resolve({ ok: true, json: async () => validRates() }); });
  } });
  currency.setCurrency("EUR");
  const first = currency.loadRates();
  const second = currency.loadRates();
  assert.equal(currency.getState().status, "loading");
  await Promise.resolve();
  assert.equal(requests, 1);
  release();
  await Promise.all([first, second]);
  assert.equal(currency.getState().status, "success");
  assert.equal(currency.getState().date, "2026-11-09");
  assert.equal(currency.convert(100), 90);
  assert.equal(currency.format(100), "€90.00");
  assert.equal(values.get("preferredCurrency"), '"EUR"');
  currency.setCurrency("GBP");
  assert.equal(currency.convert(100), 75);
  assert.equal(currency.format(100), "£75.00");
  currency.setCurrency("USD");
  assert.equal(currency.convert(100), 100);
  await currency.loadRates();
  assert.equal(requests, 1);
  assert.ok(events.some((event) => event.type === "rentocar:currency-change"));
});

test("network failures fall back to USD and a retry restores the saved currency", async () => {
  let shouldFail = true;
  const { currency } = loadCurrency({ saved: { preferredCurrency: '"EUR"' }, fetch: async () => {
    if (shouldFail) throw new TypeError("Failed to fetch");
    return { ok: true, json: async () => validRates() };
  } });
  await currency.loadRates();
  assert.equal(currency.getState().status, "error");
  assert.equal(currency.getState().currency, "USD");
  assert.equal(currency.convert(164), 164);
  shouldFail = false;
  await currency.loadRates({ force: true });
  assert.equal(currency.getState().status, "success");
  assert.equal(currency.getState().currency, "EUR");
  assert.equal(currency.convert(100), 90);
});

test("an empty API result is distinct from an HTTP or malformed JSON error", async (t) => {
  for (const [name, response, status] of [
    ["empty", { ok: true, json: async () => [] }, "empty"],
    ["HTTP", { ok: false, status: 503, json: async () => { throw new Error("must not parse"); } }, "error"],
    ["JSON", { ok: true, json: async () => { throw new SyntaxError("invalid JSON"); } }, "error"],
  ]) {
    await t.test(name, async () => {
      const { currency } = loadCurrency({ fetch: async () => response });
      currency.setCurrency("GBP");
      await currency.loadRates();
      assert.equal(currency.getState().status, status);
      assert.equal(currency.getState().currency, "USD");
      assert.equal(currency.convert(100), 100);
    });
  }
});

test("currency rejects partial, invalid and inconsistent rate data", async (t) => {
  const rates = validRates();
  const cases = [null, {}, [rates[0]],
    [rates[0], { ...rates[1], rate: 0 }],
    [rates[0], { ...rates[1], rate: -0.75 }],
    [rates[0], { ...rates[1], rate: "0.75" }],
    [rates[0], { ...rates[1], rate: Infinity }],
    [rates[0], { ...rates[1], base: "EUR" }],
    [rates[0], { ...rates[1], date: "2026-02-30" }],
    [rates[0], { ...rates[1], date: "2026-11-06" }],
  ];
  for (const [index, data] of cases.entries()) {
    await t.test(`invalid payload ${index + 1}`, async () => {
      const { currency } = loadCurrency({ fetch: async () => ({ ok: true, json: async () => data }) });
      await currency.loadRates();
      assert.equal(currency.getState().status, "error");
      assert.equal(currency.getState().currency, "USD");
    });
  }
});

test("currency remains usable when saving a preference fails", async () => {
  const { currency, window } = loadCurrency();
  window.localStorage.setItem = () => { throw new Error("QuotaExceededError"); };
  await currency.loadRates();
  assert.doesNotThrow(() => currency.setCurrency("EUR"));
  assert.equal(currency.convert(100), 90);
});

test("a timed-out currency request settles as an error and keeps original USD prices", async () => {
  let expireRequest;
  const { currency } = loadCurrency({
    timers: {
      setTimeout(callback) { expireRequest = callback; return 1; },
      clearTimeout() {},
    },
    fetch: async (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("AbortError")), { once: true });
    }),
  });
  currency.setCurrency("EUR");
  const request = currency.loadRates();
  await Promise.resolve();
  expireRequest();
  await request;
  assert.equal(currency.getState().status, "error");
  assert.equal(currency.getState().error, "timeout");
  assert.equal(currency.getState().currency, "USD");
  assert.equal(currency.convert(164), 164);
});

test("a failed refresh cannot reuse stale converted prices", async () => {
  let shouldFail = false;
  const { currency } = loadCurrency({ fetch: async () => {
    if (shouldFail) throw new Error("offline");
    return { ok: true, json: async () => validRates() };
  } });
  await currency.loadRates();
  currency.setCurrency("GBP");
  assert.equal(currency.convert(100), 75);
  shouldFail = true;
  await currency.loadRates({ force: true });
  assert.equal(currency.getState().status, "error");
  assert.equal(currency.getState().currency, "USD");
  assert.equal(currency.convert(100), 100);
});

test("a synchronous fetch failure does not leave retries stuck on the failed request", async () => {
  let calls = 0;
  const { currency } = loadCurrency({ fetch: () => {
    calls += 1;
    if (calls === 1) throw new TypeError("synchronous transport failure");
    return Promise.resolve({ ok: true, json: async () => validRates() });
  } });
  await currency.loadRates();
  assert.equal(currency.getState().status, "error");
  await currency.loadRates({ force: true });
  assert.equal(calls, 2);
  assert.equal(currency.getState().status, "success");
});

test("loading listeners share the original request when they call loadRates again", async () => {
  let calls = 0;
  let nestedRequest;
  let requestedInsideListener = false;
  const { currency, window } = loadCurrency({ fetch: async () => {
    calls += 1;
    return { ok: true, json: async () => validRates() };
  } });
  window.addEventListener("rentocar:currency-change", () => {
    if (currency.getState().status === "loading" && !requestedInsideListener) {
      requestedInsideListener = true;
      nestedRequest = currency.loadRates();
    }
  });
  const originalRequest = currency.loadRates();
  await Promise.all([originalRequest, nestedRequest]);
  assert.equal(requestedInsideListener, true);
  assert.equal(originalRequest, nestedRequest);
  assert.equal(calls, 1);
  assert.equal(currency.getState().status, "success");
});
