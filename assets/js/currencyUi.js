(() => {
  const { currency } = window.RentoCar;
  const panel = document.querySelector("[data-currency-panel]");
  if (!panel) return;
  const select = panel.querySelector("[data-currency-select]");
  const status = panel.querySelector("[data-currency-status]");
  const retry = panel.querySelector("[data-currency-retry]");

  function updatePrices(root = document) {
    for (const element of root.querySelectorAll("[data-price-usd]")) {
      const amount = Number(element.dataset.priceUsd);
      if (Number.isFinite(amount) && amount >= 0) element.textContent = currency.format(amount);
    }
  }

  function render() {
    const state = currency.getState();
    panel.dataset.state = state.status;
    panel.setAttribute("aria-busy", String(state.status === "loading"));
    select.value = state.currency;
    select.disabled = state.status === "loading";
    for (const option of select.options) {
      option.disabled = option.value !== "USD" && state.status !== "success";
    }
    retry.hidden = !["empty", "error"].includes(state.status);
    retry.disabled = state.status === "loading";
    if (state.status === "success") {
      const rate = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });
      status.textContent = `1 USD = ${rate.format(state.rates.EUR)} EUR · ${rate.format(state.rates.GBP)} GBP. ` +
        `ECB reference rates via Frankfurter · ${state.date}. Converted prices are estimates.`;
    } else if (state.status === "empty") {
      status.textContent = "No exchange rates were returned. Original prices in USD are available. Try again.";
    } else if (state.status === "error") {
      const explanation = state.error === "invalid-data" ? "Exchange rate data could not be verified." :
        state.error === "timeout" ? "The exchange rate request timed out." : "Exchange rates are unavailable. Check your connection.";
      status.textContent = `${explanation} Original prices in USD are available. Try again.`;
    } else {
      status.textContent = "Loading reference rates… Original prices are shown in USD.";
    }
    updatePrices();
    const priceFilter = document.getElementById("filterPrice");
    if (priceFilter) {
      priceFilter.querySelector('[value="low"]').textContent = `Under ${currency.format(100)} / day`;
      priceFilter.querySelector('[value="mid"]').textContent = `${currency.format(100)} – ${currency.format(150)} / day`;
      priceFilter.querySelector('[value="high"]').textContent = `Over ${currency.format(150)} / day`;
    }
  }

  select.addEventListener("change", () => currency.setCurrency(select.value));
  retry.addEventListener("click", () => currency.loadRates({ force: true }));
  window.addEventListener("rentocar:currency-change", render);
  render();
  currency.loadRates();
})();
