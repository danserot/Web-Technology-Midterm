const summaryImage = document.getElementById("summaryImage");
const summaryName = document.getElementById("summaryName");
const summaryDescription = document.getElementById("summaryDescription");
const summaryBadge = document.getElementById("summaryBadge");

let selectedCar = null;

function getSelectedCar() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("carId") || window.localStorage.getItem("selectedCarId") || 1;
  return window.RentoCar.getCarById(id) || window.RentoCar.cars[0];
}

function showSelectedCar(car) {
  summaryImage.src = car.image;
  summaryImage.alt = car.name;
  summaryName.textContent = car.name;
  summaryDescription.textContent = car.description;
  summaryBadge.textContent = car.badge || car.category.charAt(0).toUpperCase() + car.category.slice(1);
  window.localStorage.setItem("selectedCarId", String(car.id));
}

selectedCar = getSelectedCar();
showSelectedCar(selectedCar);