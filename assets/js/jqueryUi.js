(() => {
  const form = document.querySelector("#comparison-form");
  if (!form) return;

  const { cars, getCarById } = window.RentoCar;
  const select = document.querySelector("#comparison-car");
  const addButton = form.querySelector("button");
  const status = document.querySelector("#comparison-status");
  const results = document.querySelector("#comparison-results");
  const rows = document.querySelector("#comparison-rows");
  const limit = 3;
  const comparisonIds = new Set();


  for (const car of cars) {
    select.add(new Option(car.name, car.id));
  }

  function renderComparison() {
    rows.replaceChildren();

    for (const id of comparisonIds) {
      const car = getCarById(id);
      const row = rows.insertRow();

      const model = document.createElement("th");
      model.scope = "row";
      model.textContent = car.name;
      row.append(model);

      const category = car.category === "suv"
        ? "SUV"
        : car.category[0].toUpperCase() + car.category.slice(1);

      for (const value of [category, car.seats, car.transmission, `$${car.price}`]) {
        row.insertCell().textContent = value;
      }

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn btn-sm btn-outline-secondary";
      remove.dataset.removeCarId = car.id;
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove ${car.name} from comparison`);
      row.insertCell().append(remove);
    }

   
    for (const option of select.options) {
      option.disabled = comparisonIds.has(Number(option.value));
    }

    select.value = "";
    select.disabled = comparisonIds.size === limit;
    addButton.disabled = true;
    results.hidden = comparisonIds.size === 0;

    if (comparisonIds.size === limit) {
      status.textContent = "3 of 3 cars selected. Remove a car to add another.";
    } else if (comparisonIds.size > 0) {
      status.textContent = `${comparisonIds.size} of 3 cars selected.`;
    } else {
      status.textContent = "No cars selected yet.";
    }
  }

  select.addEventListener("change", () => {
    addButton.disabled = !select.value;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const car = getCarById(select.value);
    if (!car || comparisonIds.has(car.id) || comparisonIds.size >= limit) return;

    comparisonIds.add(car.id);
    renderComparison();

    if (select.disabled) {
      results.focus();
    } else {
      select.focus();
    }
  });


  rows.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-car-id]");
    if (!button) return;

    comparisonIds.delete(Number(button.dataset.removeCarId));
    renderComparison();
    select.focus();
  });
})();