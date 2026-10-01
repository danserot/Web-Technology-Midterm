const cars = {
  "porsche-macan": {
    name: "Porsche Macan",
    type: "Sporty SUV",
    category: "Performance",
    price: 164,
    image: "assets/images/porsche_macan.png"
  },

  "polestar-2": {
    name: "Polestar 2",
    type: "Electric fastback",
    category: "Electric",
    price: 109,
    image: "assets/images/polestar_2.png"
  },

  "range-rover-evoque": {
    name: "Range Rover Evoque",
    type: "Premium SUV",
    category: "Luxury",
    price: 148,
    image: "assets/images/range_rover_evoque.png"
  }
};


const params = new URLSearchParams(window.location.search);

const selectedCarId = params.get("car");

const selectedCar = cars[selectedCarId] || cars["porsche-macan"];


document.getElementById("summaryCarImage").src = selectedCar.image;
document.getElementById("summaryCarImage").alt = selectedCar.name;

document.getElementById("summaryCarName").textContent =
  selectedCar.name;

document.getElementById("summaryCarType").textContent =
  selectedCar.type;

document.getElementById("summaryCarCategory").textContent =
  selectedCar.category;


const bookingForm = document.getElementById("bookingForm");

const pickupDate = document.getElementById("pickupDate");
const returnDate = document.getElementById("returnDate");

const summaryPickup = document.getElementById("summaryPickup");
const summaryReturn = document.getElementById("summaryReturn");
const summaryCalculation = document.getElementById("summaryCalculation");
const summaryTotal = document.getElementById("summaryTotal");

const bookingConfirmation =
  document.getElementById("bookingConfirmation");

const confirmationMessage =
  document.getElementById("confirmationMessage");


function calculateBooking() {

  if (!pickupDate.value || !returnDate.value) {
    return null;
  }

  const start = new Date(pickupDate.value);
  const end = new Date(returnDate.value);

  const difference = end - start;

  const days = difference / (1000 * 60 * 60 * 24);

  if (days <= 0) {
    return null;
  }

  const total = days * selectedCar.price;

  return {
    days: days,
    total: total
  };
}

function updateSummary() {
    
    returnDate.setCustomValidity("");

  summaryPickup.textContent =
    pickupDate.value || "Choose date";

  summaryReturn.textContent =
    returnDate.value || "Choose date";

  const booking = calculateBooking();

  if (!booking) {
    summaryCalculation.textContent =
      "Select valid dates to calculate total";

    summaryTotal.textContent = "—";

    return;
  }

  summaryCalculation.textContent =
    `${booking.days} days × $${selectedCar.price}`;

  summaryTotal.textContent =
    `$${booking.total}`;
}
returnDate.addEventListener("change", function () {
  returnDate.setCustomValidity("");
  updateSummary();
});

pickupDate.addEventListener("change", function () {

  returnDate.setCustomValidity("");

  returnDate.min = pickupDate.value;

  if (
    returnDate.value &&
    returnDate.value <= pickupDate.value
  ) {
    returnDate.value = "";
  }

  updateSummary();
});


bookingForm.addEventListener("submit", function (event) {

  event.preventDefault();

  if (!bookingForm.checkValidity()) {
    bookingForm.reportValidity();
    return;
  }

  const booking = calculateBooking();

  if (!booking) {
    returnDate.setCustomValidity(
      "Return date must be after the pick-up date."
    );

    returnDate.reportValidity();

    return;
  }

  returnDate.setCustomValidity("");

  const fullName =
    document.getElementById("fullName").value;

  confirmationMessage.textContent =
    `${fullName}, your ${selectedCar.name} rental for ` +
    `${booking.days} days has a demo total of $${booking.total}.`;

  bookingConfirmation.classList.remove("d-none");

  bookingConfirmation.scrollIntoView({
    behavior: "smooth"
  });
});