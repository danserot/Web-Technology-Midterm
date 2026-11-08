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

   
}
})();