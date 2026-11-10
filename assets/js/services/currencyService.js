(() => {
  const app = window.RentoCar = window.RentoCar || {};
  const endpoint = "https://api.frankfurter.dev/v2/providers/ecb/rates?base=USD&quotes=EUR,GBP";
  const currencies = Object.freeze(["USD", "EUR", "GBP"]);
  const isCurrency = (value) => currencies.includes(value);
  let preferredCurrency = app.storage.read("preferredCurrency", "USD", isCurrency);
  let state = Object.freeze({
    status: "idle", currency: "USD", preferredCurrency,
    rates: Object.freeze({ USD: 1 }), date: null, error: null,
  });
  let pendingRequest = null;
  const formatters = new Map(currencies.map((currency) => [
    currency, new Intl.NumberFormat("en-US", { style: "currency", currency }),
  ]));

  function publish(changes) {
    state = Object.freeze({ ...state, ...changes, preferredCurrency });
    window.dispatchEvent(new CustomEvent("rentocar:currency-change", { detail: state }));
    return state;
  }

  function validateRates(data) {
    if (!Array.isArray(data)) throw new Error("invalid-data");
    if (data.length === 0) return null;
    const rates = { USD: 1 };
    let date = null;
    for (const entry of data) {
      if (!entry || entry.base !== "USD" || !["EUR", "GBP"].includes(entry.quote) ||
          typeof entry.rate !== "number" || !Number.isFinite(entry.rate) || entry.rate <= 0 ||
          typeof entry.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
        throw new Error("invalid-data");
      }
      const parsedDate = new Date(`${entry.date}T00:00:00Z`);
      if (!Number.isFinite(parsedDate.getTime()) ||
          parsedDate.toISOString().slice(0, 10) !== entry.date ||
          (date && date !== entry.date) || rates[entry.quote] !== undefined) {
        throw new Error("invalid-data");
      }
      date = entry.date;
      rates[entry.quote] = entry.rate;
    }
    if (!rates.EUR || !rates.GBP) throw new Error("invalid-data");
    return { rates: Object.freeze(rates), date };
  }

  function loadRates({ force = false } = {}) {
    if (pendingRequest) return pendingRequest;
    if (!force && state.status === "success") return Promise.resolve(state);
    publish({ status: "loading", currency: "USD", rates: Object.freeze({ USD: 1 }), date: null, error: null });
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 10000);

    pendingRequest = Promise.resolve().then(async () => {
      try {
        const response = await fetch(endpoint, { signal: controller.signal, headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("http-error");
        let data;
        try {
          data = await response.json();
        } catch {
          throw new Error("invalid-data");
        }
        const result = validateRates(data);
        if (!result) return publish({ status: "empty", error: "empty-data" });
        return publish({ status: "success", ...result, currency: preferredCurrency, error: null });
      } catch (error) {
        const reason = timedOut ? "timeout" :
          ["http-error", "invalid-data"].includes(error.message) ? error.message : "network-error";
        return publish({ status: "error", currency: "USD", error: reason });
      } finally {
        window.clearTimeout(timeout);
        pendingRequest = null;
      }
    });
    return pendingRequest;
  }

  function setCurrency(currency) {
    if (!isCurrency(currency)) return false;
    preferredCurrency = currency;
    app.storage.write("preferredCurrency", currency, isCurrency);
    publish({ currency: state.status === "success" ? currency : "USD" });
    return true;
  }

  function convert(amountUSD) {
    if (typeof amountUSD !== "number" || !Number.isFinite(amountUSD) || amountUSD < 0) {
      throw new RangeError("Price must be a finite, non-negative USD amount.");
    }
    return amountUSD * state.rates[state.currency];
  }

  app.currency = Object.freeze({
    currencies, loadRates, setCurrency, convert,
    getState: () => state,
    format: (amountUSD) => formatters.get(state.currency).format(convert(amountUSD)),
  });
})();
