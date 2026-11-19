(() => {
  const { currency } = window.RentoCar;
  const panel = document.querySelector("[data-currency-panel]");
  if (!panel) return;
  const nav = panel.closest(".site-nav");
  const toggle = nav.querySelector(".navbar-toggler");
  const desktop = window.matchMedia("(min-width: 992px)");
  const trigger = panel.querySelector("#priceCurrency");
  const symbol = panel.querySelector("[data-currency-symbol]");
  const currencyCode = panel.querySelector("[data-currency-code]");
  const menu = panel.querySelector(".currency-menu");
  const details = panel.querySelector(".currency-details");
  const summary = details.querySelector("summary");
  const status = panel.querySelector("[data-currency-status]");
  const retry = panel.querySelector("[data-currency-retry]");
  const currencies = {
    USD: { symbol: "$", name: "US Dollar" },
    EUR: { symbol: "€", name: "Euro" },
    GBP: { symbol: "£", name: "British Pound" },
  };
  const rate = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

  const options = currency.currencies.map((code) => {
    const currencyInfo = currencies[code];
    const option = document.createElement("button");
    option.type = "button";
    option.className = "dropdown-item currency-option";
    option.dataset.currencyOption = code;
    option.innerHTML = `
      <span class="currency-option-symbol" aria-hidden="true">${currencyInfo.symbol}</span>
      <span class="currency-option-label"><strong>${code}</strong><span>${currencyInfo.name}</span></span>
      <span class="currency-option-check" aria-hidden="true"></span>
    `;
    option.addEventListener("click", () => {
      if (code !== currency.getState().currency) currency.setCurrency(code);
      trigger.focus();
    });
    menu.append(option);
    return option;
  });

  function positionPanel() {
    const focused = document.activeElement;
    if (desktop.matches) {
      nav.append(panel);
    } else if (panel.nextElementSibling !== toggle) {
      toggle.before(panel);
    }
    if (panel.contains(focused)) focused.focus({ preventScroll: true });
  }

  function updatePrices(root = document) {
    for (const element of root.querySelectorAll("[data-price-usd]")) {
      const amount = Number(element.dataset.priceUsd);
      if (Number.isFinite(amount) && amount >= 0) element.textContent = currency.format(amount);
    }
  }

  function render() {
    const state = currency.getState();
    const canRetry = state.status === "empty" || state.status === "error";
    if (canRetry && panel.dataset.state !== state.status) details.open = true;
    panel.dataset.state = state.status;
    currencyCode.textContent = state.currency;
    symbol.textContent = currencies[state.currency].symbol;
    trigger.setAttribute("aria-label", `Price currency (${state.currency})`);
    trigger.disabled = state.status === "loading";
    for (const option of options) {
      const code = option.dataset.currencyOption;
      option.setAttribute("aria-pressed", String(code === state.currency));
      option.disabled = code !== "USD" && state.status !== "success";
    }
    retry.hidden = !canRetry;
    if (state.status === "success") {
      status.textContent = `1 USD = ${rate.format(state.rates.EUR)} EUR · ${rate.format(state.rates.GBP)} GBP\n` +
        `ECB via Frankfurter · ${state.date}\nConverted prices are estimates.`;
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

  trigger.addEventListener("show.bs.dropdown", () => {
    details.open = false;
  });
  retry.addEventListener("click", () => {
    summary.focus();
    currency.loadRates({ force: true });
  });
  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !details.open) return;
    details.open = false;
    summary.focus();
  });
  document.addEventListener("click", (event) => {
    if (details.open && !panel.contains(event.target)) details.open = false;
  });
  desktop.addEventListener("change", positionPanel);
  window.addEventListener("rentocar:currency-change", render);
  positionPanel();
  render();
  currency.loadRates();
})();
