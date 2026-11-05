const carGrid = document.getElementById("carGrid");
const resultsCount = document.getElementById("resultsCount");
const carsEmpty = document.getElementById("carsEmpty");
const carsForm = document.getElementById("carsForm");
const categoryLinks = [...document.querySelectorAll(".type-pill")];
const searchInput = document.getElementById("carSearch");
const priceSelect = document.getElementById("filterPrice");
const seatsSelect = document.getElementById("filterSeats");
const fuelSelect = document.getElementById("filterFuel");
const filters = { category: "all", price: "all", seats: "all", fuel: "all", query: "" };
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
          <strong>$${car.price} <small>/ day</small></strong>
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

function renderCars(carsToRender) {
  const cards = document.createDocumentFragment();
  for (const car of carsToRender) {
    cards.appendChild(createCarCard(car));
  }

  carGrid.replaceChildren(cards);
  resultsCount.textContent = String(carsToRender.length);
  carsEmpty.hidden = carsToRender.length > 0;
}

function filterCars() {
  return window.RentoCar.cars.filter((car) => {
    const categoryMatches = filters.category === "all" || car.category === filters.category;
    const priceMatches =
      filters.price === "all" ||
      (filters.price === "low" && car.price < 100) ||
      (filters.price === "mid" && car.price >= 100 && car.price <= 150) ||
      (filters.price === "high" && car.price > 150);
    const seatsMatch = filters.seats === "all" || car.seats === Number(filters.seats);
    const fuelMatches = filters.fuel === "all" || car.fuel === filters.fuel;
    const nameMatches = car.name.toLowerCase().includes(filters.query);

    return categoryMatches && priceMatches && seatsMatch && fuelMatches && nameMatches;
  });
}

function applyFilters() {
  renderCars(filterCars());
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

carsForm.addEventListener("reset", (event) => {
  event.preventDefault();
  searchInput.value = "";
  priceSelect.value = "all";
  seatsSelect.value = "all";
  fuelSelect.value = "all";
  Object.assign(filters, { category: "all", price: "all", seats: "all", fuel: "all", query: "" });
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  applyFilters();
});

carGrid.addEventListener("click", (event) => {
  const selectLink = event.target.closest(".rental-select");
  if (selectLink) {
    window.localStorage.setItem("selectedCarId", selectLink.dataset.carId);
  }
});

applyCategoryFromHash();
