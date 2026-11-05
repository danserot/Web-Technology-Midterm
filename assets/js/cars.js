const carGrid = document.getElementById("carGrid");
const resultsCount = document.getElementById("resultsCount");
const carsEmpty = document.getElementById("carsEmpty");

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

renderCars(window.RentoCar.cars);
