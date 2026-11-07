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
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const termsInput = document.getElementById("terms");
const bookingForm = document.getElementById("bookingForm");
const confirmationBox = document.getElementById("confirmation");
const confirmationText = document.getElementById("confirmationText")

const detailsStep = document.getElementById("detailsStep");
const confirmationLine = document.getElementById("confirmationLine");
const confirmationStep = document.getElementById("confirmationStep");;

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

function getToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function validateFullName() {
  if (fullNameInput.value.trim().length < 3) {
    return "Name must be at least 3 characters";
  }
  return "";
}

function validateEmail() {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(emailInput.value.trim())) {
    return "Enter a valid email, e.g. you@example.com";
  }
  return "";
}

function validatePhone() {
  const pattern = /^\+?[0-9\s()-]+$/;
  const digits = phoneInput.value.replace(/\D/g, "");
  if (!pattern.test(phoneInput.value.trim()) || digits.length < 10 || digits.length > 15) {
    return "Enter a valid phone, e.g. +7 700 000 00 00";
  }
  return "";
}

function validatePickup() {
  if (!pickupInput.value) return "Choose a pick-up date";
  if (pickupInput.value < getToday()) return "Pick-up date cannot be in the past";
  return "";
}

function validateReturn() {
  if (!returnInput.value) return "Choose a return date";
  if (returnInput.value <= pickupInput.value) return "Return date must be after pick-up date";
  return "";
}

function validateTerms() {
  if (!termsInput.checked) return "You must agree to the terms";
  return "";
}

const fields = [
  { input: fullNameInput, validate: validateFullName },
  { input: emailInput, validate: validateEmail },
  { input: phoneInput, validate: validatePhone },
  { input: pickupInput, validate: validatePickup },
  { input: returnInput, validate: validateReturn },
  { input: termsInput, validate: validateTerms },
];

function showError(input, message) {
  const errorBox = document.getElementById(`${input.id}Error`);
  errorBox.textContent = message;
  input.classList.toggle("is-invalid", message !== "");
}

function validateField(field) {
  const message = field.validate();
  showError(field.input, message);
  return message === "";
}

function validateForm() {
  let isValid = true;
  for (const field of fields) {
    if (!validateField(field)) {
      isValid = false;
    }
  }
  return isValid;
}


function showConfirmationStep() {
  detailsStep.classList.remove("active");
  detailsStep.classList.add("completed");
  detailsStep.querySelector(".step-number").textContent = "✓";

  confirmationLine.classList.add("completed");

  confirmationStep.classList.add("active");

  confirmationStep.querySelector(".step-number").textContent = "✓";
}

function showConfirmation() {
  const days = getDays(pickupInput.value, returnInput.value);
  const total = calculateTotalPrice(selectedCar.price, days);

  confirmationText.textContent =
    `${selectedCar.name} · ${formatDate(pickupInput.value)} – ${formatDate(returnInput.value)}` +
    ` · ${days} days · $${total}`;

  bookingForm.hidden = true;
  confirmationBox.classList.add("show");
  showConfirmationStep();
}

bookingForm.addEventListener("submit", function(event){
  event.preventDefault();
  if (validateForm()) {
    showConfirmation();
  }
});

for (const field of fields) {
  field.input.addEventListener("input", function(){ validateField(field); });
  field.input.addEventListener("change", function(){ validateField(field); });
}

pickupInput.addEventListener("change", function() {
  updateSummary();
  if (returnInput.value) validateField(fields[4]);
});
returnInput.addEventListener("change", updateSummary);


selectedCar = getSelectedCar();
showSelectedCar(selectedCar);
pickupInput.min = getToday();

const summaryLocation = document.getElementById("summaryLocation");

function loadRentalSearch() {
  const saved = window.localStorage.getItem("rentalSearch");
  return saved ? JSON.parse(saved) : null;
}

function fillTripData(search) {
  if (!search) return;
  pickupInput.value = (search.pickup || "").slice(0, 10);
  returnInput.value = (search.return || "").slice(0, 10);
  summaryLocation.textContent = search.location || "Astana Downtown";
}
fillTripData(loadRentalSearch());
updateSummary();