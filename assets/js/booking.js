const summaryImage = document.getElementById("summaryImage");
const summaryName = document.getElementById("summaryName");
const summaryDescription = document.getElementById("summaryDescription");
const summaryBadge = document.getElementById("summaryBadge");
const pickupInput = document.getElementById("pickupDate");
const returnInput = document.getElementById("returnDate");
const summaryPickup = document.getElementById("summaryPickup");
const summaryReturn = document.getElementById("summaryReturn");
const summaryDays = document.getElementById("summaryDays");
const summaryTotal = document.getElementById("summaryTotal");


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

function calculateTotalPrice(pricePerDay, days) {
  return pricePerDay * days;
}

function getDays(pickup, dropoff) {
  if (!pickup || !dropoff) return 0;
  const difference = new Date(dropoff) - new Date(pickup);
  const days = Math.round(difference / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

function updateSummary() {
  const days = getDays(pickupInput.value, returnInput.value);
  const total = calculateTotalPrice(selectedCar.price, days);

  summaryPickup.textContent = formatDate(pickupInput.value);
  summaryReturn.textContent = formatDate(returnInput.value);
  summaryDays.textContent = `${days} days x $${selectedCar.price} / day`;
  summaryTotal.textContent = `$${total}`;
}

pickupInput.addEventListener("change", updateSummary);
returnInput.addEventListener("change", updateSummary);


selectedCar = getSelectedCar();
showSelectedCar(selectedCar);
updateSummary();