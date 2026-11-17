const carGrid = document.getElementById("carGrid");
const resultsCount = document.getElementById("resultsCount");
const carsEmpty = document.getElementById("carsEmpty");
const carsForm = document.getElementById("carsForm");
const categoryLinks = [...document.querySelectorAll(".type-pill")];
const searchInput = document.getElementById("carSearch");
const priceSelect = document.getElementById("filterPrice");
const seatsSelect = document.getElementById("filterSeats");
const fuelSelect = document.getElementById("filterFuel");
const sortSelect = document.getElementById("sortCars");
const resultsRange = document.getElementById("resultsRange");
const pagination = document.getElementById("carsPagination");
const PAGE_SIZE = 6;
const filters = { category: "all", price: "all", seats: "all", fuel: "all", query: "" };
const view = { sort: "default", page: 1 };
const sorters = {
  "price-asc": (a, b) => a.price - b.price || a.name.localeCompare(b.name),
  "price-desc": (a, b) => b.price - a.price || a.name.localeCompare(b.name),
  name: (a, b) => a.name.localeCompare(b.name),
};
const categoryHashes = new Set(categoryLinks.map((link) => link.hash));

function createCarCard(car) {
  const column = document.createElement("div");
  column.className = "col-12 col-md-6 col-lg-4";
  column.dataset.car = "";
  column.dataset.carId = String(car.id);
  column.dataset.type = car.category;
  column.dataset.price = String(car.price);
  column.dataset.seats = String(car.seats);
  column.dataset.fuel = car.fuel;
  column.dataset.band = car.price < 100 ? "low" : car.price <= 150 ? "mid" : "high";

  const imageAlt = car.image.endsWith(".svg")
    ? `Illustration of ${car.category} vehicle`
    : car.name;
  const badge = car.badge || car.category.charAt(0).toUpperCase() + car.category.slice(1);

  column.innerHTML = `
    <article class="rental-card">
      <div class="rental-image">
        <img src="${car.image}" alt="${imageAlt}" loading="lazy" />
        <span class="car-category">${badge}</span>
      </div>
      <div class="rental-body">
        <div class="rental-header">
          <div>
            <h3>${car.name}</h3>
            <p>${car.description}</p>
          </div>
          <strong><span data-price-usd="${car.price}">${window.RentoCar.currency.format(car.price)}</span> <small>/ day</small></strong>
        </div>
        <ul class="rental-meta">
          <li>${car.seats} seats</li>
          <li>${car.transmission}</li>
          <li>${car.fuel}</li>
        </ul>
        <a class="rental-select" href="booking.html?carId=${car.id}" data-car-id="${car.id}">
          Select this car <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </article>`;

  return column;
}

function renderCars(carsToRender, total, start) {
  const cards = document.createDocumentFragment();
  for (const car of carsToRender) {
    cards.appendChild(createCarCard(car));
  }

  carGrid.replaceChildren(cards);
  resultsCount.textContent = String(total);
  resultsRange.textContent = total > 0
    ? `Showing ${start + 1}\u2013${start + carsToRender.length}`
    : "";
  carsEmpty.hidden = total > 0;
}

function renderPagination(totalPages) {
  pagination.hidden = totalPages <= 1;
  if (totalPages <= 1) {
    pagination.replaceChildren();
    return;
  }

  const items = document.createDocumentFragment();
  const addButton = (label, page, { current = false, disabled = false, ariaLabel = "" } = {}) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "page-button";
    button.textContent = label;
    button.dataset.page = String(page);
    button.disabled = disabled;
    button.setAttribute("aria-label", ariaLabel || `Page ${page}`);
    if (current) button.setAttribute("aria-current", "page");
    items.append(button);
  };

  addButton("Previous", view.page - 1, { disabled: view.page === 1, ariaLabel: "Previous page" });
  for (let page = 1; page <= totalPages; page += 1) {
    addButton(String(page), page, { current: page === view.page });
  }
  addButton("Next", view.page + 1, { disabled: view.page === totalPages, ariaLabel: "Next page" });
  pagination.replaceChildren(items);
}

function filterCars() {
  return window.RentoCar.cars.filter((car) => car.matchesFilters(filters));
}

// Pipeline: filters -> sort (on a copy, the shared catalog stays untouched) -> page slice.
function sortCars(list) {
  const compare = sorters[view.sort];
  return compare ? [...list].sort(compare) : list;
}

function applyFilters({ resetPage = true } = {}) {
  if (resetPage) view.page = 1;

  const result = sortCars(filterCars());
  const totalPages = Math.max(1, Math.ceil(result.length / PAGE_SIZE));
  view.page = Math.min(view.page, totalPages);
  const start = (view.page - 1) * PAGE_SIZE;

  renderCars(result.slice(start, start + PAGE_SIZE), result.length, start);
  renderPagination(totalPages);

  for (const link of categoryLinks) {
    link.setAttribute(
      "aria-current",
      link.hash === `#cat-${filters.category}` ? "true" : "false",
    );
  }
}

function applyCategoryFromHash() {
  filters.category = categoryHashes.has(window.location.hash)
    ? window.location.hash.slice(5)
    : "all";
  applyFilters();
}

for (const link of categoryLinks) {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.hash = link.hash;
    applyCategoryFromHash();
  });
}

window.addEventListener("hashchange", applyCategoryFromHash);

for (const [select, key] of [
  [priceSelect, "price"],
  [seatsSelect, "seats"],
  [fuelSelect, "fuel"],
]) {
  select.addEventListener("change", () => {
    filters[key] = select.value;
    applyFilters();
  });
}

searchInput.addEventListener("input", () => {
  filters.query = searchInput.value.trim().toLowerCase();
  applyFilters();
});

sortSelect.addEventListener("change", () => {
  view.sort = Object.hasOwn(sorters, sortSelect.value) ? sortSelect.value : "default";
  applyFilters();
});

pagination.addEventListener("click", (event) => {
  const button = event.target.closest(".page-button");
  if (!button || button.disabled) return;

  view.page = Number(button.dataset.page);
  applyFilters({ resetPage: false });
  pagination.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
  carGrid.scrollIntoView({ block: "start" });
});

carsForm.addEventListener("reset", (event) => {
  event.preventDefault();
  searchInput.value = "";
  priceSelect.value = "all";
  seatsSelect.value = "all";
  fuelSelect.value = "all";
  sortSelect.value = "default";
  view.sort = "default";
  Object.assign(filters, { category: "all", price: "all", seats: "all", fuel: "all", query: "" });
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  applyFilters();
});

carGrid.addEventListener("click", (event) => {
  const selectLink = event.target.closest(".rental-select");
  if (selectLink) {
    window.RentoCar.storage.write("selectedCarId", Number(selectLink.dataset.carId), window.RentoCar.storage.validators.carId);
  }
});

applyCategoryFromHash();
