(() => {
  const { storage, currency, getCarById, cars } = window.RentoCar;
  const bookingForm = document.getElementById("bookingForm");
  if (!bookingForm) return;

  const summaryImage = document.getElementById("summaryImage");
  const summaryName = document.getElementById("summaryName");
  const summaryDescription = document.getElementById("summaryDescription");
  const summaryBadge = document.getElementById("summaryBadge");
  const summaryPickup = document.getElementById("summaryPickup");
  const summaryReturn = document.getElementById("summaryReturn");
  const summaryDays = document.getElementById("summaryDays");
  const summaryTotal = document.getElementById("summaryTotal");
  const summaryLocation = document.getElementById("summaryLocation");
  const pickupInput = document.getElementById("pickupDate");
  const returnInput = document.getElementById("returnDate");
  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const termsInput = document.getElementById("terms");
  const confirmationBox = document.getElementById("confirmation");
  const confirmationText = document.getElementById("confirmationText");
  const detailsStep = document.getElementById("detailsStep");
  const confirmationLine = document.getElementById("confirmationLine");
  const confirmationStep = document.getElementById("confirmationStep");

  const params = new URLSearchParams(window.location.search);
  const storedCarId = storage.read("selectedCarId", 1, storage.validators.carId);
  const selectedCar = getCarById(params.get("carId") || storedCarId) || cars[0];

  function getDays(pickup, dropoff) {
    if (!pickup || !dropoff) return 0;
    const days = (Date.parse(dropoff) - Date.parse(pickup)) / 86400000;
    return Number.isSafeInteger(days) && days > 0 ? days : 0;
  }

  function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
    });
  }

  function updateConfirmationText() {
    const days = getDays(pickupInput.value, returnInput.value);
    const total = selectedCar.calculateRentalCost(days);
    confirmationText.textContent =
      `${selectedCar.name} · ${formatDate(pickupInput.value)} – ${formatDate(returnInput.value)}` +
      ` · ${days} days · ${currency.format(total)}`;
  }

  function updateSummary() {
    const days = getDays(pickupInput.value, returnInput.value);
    const total = selectedCar.calculateRentalCost(days);
    summaryPickup.textContent = formatDate(pickupInput.value);
    summaryReturn.textContent = formatDate(returnInput.value);
    summaryDays.textContent = `${days} days x ${currency.format(selectedCar.price)} / day`;
    summaryTotal.textContent = currency.format(total);
    if (confirmationBox.classList.contains("show")) updateConfirmationText();
  }

  function getToday() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  }

  function validateFullName() {
    return fullNameInput.value.trim().length < 3 ? "Name must be at least 3 characters" : "";
  }

  function validateEmail() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())
      ? "" : "Enter a valid email, e.g. you@example.com";
  }

  function validatePhone() {
    const digits = phoneInput.value.replace(/\D/g, "");
    return /^\+?[0-9\s()-]+$/.test(phoneInput.value.trim()) && digits.length >= 10 && digits.length <= 15
      ? "" : "Enter a valid phone, e.g. +7 700 000 00 00";
  }

  function validatePickup() {
    if (!pickupInput.value) return "Choose a pick-up date";
    return pickupInput.value < getToday() ? "Pick-up date cannot be in the past" : "";
  }

  function validateReturn() {
    if (!returnInput.value) return "Choose a return date";
    return returnInput.value <= pickupInput.value ? "Return date must be after pick-up date" : "";
  }

  const fields = [
    { input: fullNameInput, validate: validateFullName },
    { input: emailInput, validate: validateEmail },
    { input: phoneInput, validate: validatePhone },
    { input: pickupInput, validate: validatePickup },
    { input: returnInput, validate: validateReturn },
    { input: termsInput, validate: () => termsInput.checked ? "" : "You must agree to the terms" },
  ];

  function validateField(field) {
    const message = field.validate();
    document.getElementById(`${field.input.id}Error`).textContent = message;
    field.input.classList.toggle("is-invalid", message !== "");
    field.input.setAttribute("aria-invalid", String(message !== ""));
    return message === "";
  }

  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const validFields = fields.map(validateField);
    if (validFields.includes(false)) {
      fields[validFields.indexOf(false)].input.focus();
      return;
    }

    updateConfirmationText();
    bookingForm.hidden = true;
    confirmationBox.classList.add("show");
    detailsStep.classList.remove("active");
    detailsStep.classList.add("completed");
    detailsStep.querySelector(".step-number").textContent = "✓";
    confirmationLine.classList.add("completed");
    confirmationStep.classList.add("active");
    confirmationStep.querySelector(".step-number").textContent = "✓";
  });

  for (const field of fields) {
    field.input.setAttribute("aria-describedby", `${field.input.id}Error`);
    field.input.addEventListener("input", () => validateField(field));
    field.input.addEventListener("change", () => validateField(field));
  }

  pickupInput.addEventListener("change", () => {
    updateSummary();
    if (returnInput.value) validateField(fields[4]);
  });
  returnInput.addEventListener("change", updateSummary);
  window.addEventListener("rentocar:currency-change", updateSummary);

  summaryImage.src = selectedCar.image;
  summaryImage.alt = selectedCar.name;
  summaryName.textContent = selectedCar.name;
  summaryDescription.textContent = selectedCar.description;
  summaryBadge.textContent = selectedCar.badge ||
    selectedCar.category.charAt(0).toUpperCase() + selectedCar.category.slice(1);
  storage.write("selectedCarId", selectedCar.id, storage.validators.carId);
  pickupInput.min = getToday();

  const search = storage.read("rentalSearch", null, storage.validators.rentalSearch);
  if (search) {
    pickupInput.value = search.pickup.slice(0, 10);
    returnInput.value = search.return.slice(0, 10);
    summaryLocation.textContent = search.location || "Astana Downtown";
  }
  updateSummary();
})();
