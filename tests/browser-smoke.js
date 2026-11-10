// Run through Playwright CLI after opening the site's cars.html page.
async (page) => {
  const base = new URL(".", page.url()).href;
  const errors = [];
  const brokenResources = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.url().startsWith(base) && response.status() >= 400) brokenResources.push(response.url());
  });
  const assert = (value, message) => { if (!value) throw new Error(message); };
  let mode = "success";
  let requests = 0;
  await page.route("**/v2/providers/ecb/rates?**", async (route) => {
    requests += 1;
    if (mode === "network") return route.abort("failed");
    if (mode === "loading") await new Promise((resolve) => setTimeout(resolve, 500));
    const data = mode === "empty" ? [] : mode === "invalid" ? { rates: {} } : [
      { date: "2026-11-09", base: "USD", quote: "EUR", rate: 0.9 },
      { date: "2026-11-09", base: "USD", quote: "GBP", rate: 0.75 },
    ];
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
  });
  const visit = (path) => page.goto(new URL(path, base).href);
  const waitForState = (status) => page.waitForFunction((expected) =>
    window.RentoCar?.currency?.getState().status === expected, status);
  const text = (selector) => page.locator(selector).first().textContent();

  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("rentalSearch", "{broken");
    localStorage.setItem("favoriteCarIds", "null");
    localStorage.setItem("selectedCarId", "{broken");
    localStorage.setItem("preferredCurrency", '"INVALID"');
  });
  await visit("cars.html");
  await waitForState("success");
  assert(requests === 1, "Catalog must use one shared API request");
  assert(await page.locator("#carGrid [data-car]").count() === 20, "All cars render");
  assert(await page.evaluate(() => window.RentoCar.cars.every((car) => car instanceof window.RentoCar.Car)), "Catalog uses Car instances");
  await page.locator("#priceCurrency").selectOption("EUR");
  await page.locator("#carSearch").fill("Porsche");
  assert(await text("#resultsCount") === "1", "Model filters catalog");
  assert(await text("#carGrid [data-price-usd]") === "€147.60", "EUR catalog price");
  await page.locator(".rental-select").click();
  await waitForState("success");
  assert(await text("#summaryName") === "Porsche Macan", "Selected car survives navigation");
  await page.locator("#pickupDate").fill("2099-03-01");
  await page.locator("#returnDate").fill("2099-03-04");
  assert(await text("#summaryTotal") === "€442.80", "Model calculates three-day EUR total");
  await page.locator("#priceCurrency").selectOption("GBP");
  assert(await text("#summaryTotal") === "£369.00", "Booking total changes currency");
  await page.locator("#fullName").fill("Demo Visitor");
  await page.locator("#email").fill("demo@example.com");
  await page.locator("#phone").fill("+77001234567");
  await page.locator("#terms").check();
  await page.locator("#bookingForm button[type=submit]").click();
  assert(await text("#confirmationText").then((value) => value.includes("£369.00")), "Confirmation price");
  await page.locator("#priceCurrency").selectOption("USD");
  assert(await text("#confirmationText").then((value) => value.includes("$492.00")), "Visible confirmation refreshes");

  await visit("index.html");
  await waitForState("success");
  await page.locator("#priceCurrency").selectOption("EUR");
  await page.locator(".favorite-button").first().click();
  assert(await text("#favorites-grid [data-price-usd]") === "€88.20", "New favorites use chosen currency");
  await page.reload();
  await waitForState("success");
  assert(await page.locator("#favorites-grid .car-card").count() === 1, "Favorites persist");

  await visit("catolog.html");
  await waitForState("success");
  await page.locator("#comparison-car").selectOption("2");
  await page.locator("#comparison-form button").click();
  assert(await text("#comparison-rows [data-price-usd]") === "€98.10", "Comparison uses chosen currency");
  assert(await page.locator(".editor-book-link").nth(1).getAttribute("href") === "booking.html?carId=2", "Curated cards pass car ID");

  for (const [nextMode, expected] of [["empty", "empty"], ["invalid", "error"], ["network", "error"]]) {
    mode = nextMode;
    await visit("cars.html");
    await waitForState(expected);
    assert(await text("#carGrid [data-price-usd]").then((value) => value === "$164.00"), "Failure keeps original USD prices");
    assert(await page.locator("[data-currency-retry]").isVisible(), "Retry is available");
    mode = "success";
    await page.locator("[data-currency-retry]").click();
    await waitForState("success");
    assert(await text("#carGrid [data-price-usd]").then((value) => value === "€147.60"), "Retry restores saved currency");
  }

  mode = "loading";
  await visit("cars.html");
  await waitForState("loading");
  assert(await page.locator("#priceCurrency").isDisabled(), "Loading state is visible");
  await waitForState("success");
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No mobile horizontal overflow");
  await page.locator(".navbar-toggler").click();
  assert(await page.getByRole("link", { name: "Booking", exact: true }).isVisible(), "Mobile navigation works");

  // A blocked storage getter must not stop any page's scripts.
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", {
    get() { throw new DOMException("Storage disabled", "SecurityError"); },
  }));
  for (const path of ["index.html", "cars.html", "catolog.html", "booking.html", "categories.html", "home.html"]) {
    await visit(path);
    if (await page.locator("[data-currency-panel]").count()) await waitForState("success");
    await page.locator(".navbar-toggler").click();
    assert(await page.getByRole("link", { name: "Booking", exact: true }).isVisible(), `Mobile navigation: ${path}`);
  }
  assert(errors.length === 0, `Page errors: ${errors.join(", ")}`);
  assert(brokenResources.length === 0, `Broken local resources: ${brokenResources.join(", ")}`);
  return { passed: true, requests, pages: 6, scenarios: "currency, filters, booking, favorites, comparison, API states, retry, corrupt/blocked storage, mobile navigation", errors, brokenResources };
}
