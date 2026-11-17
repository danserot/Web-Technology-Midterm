(() => {
  
  const { storage, currency, getCarById, cars, bookings } = window.RentoCar;
  const byId = (id) => document.getElementById(id);
  const form = byId("bookingForm");
  if (!form) return;

  const panels = [...form.querySelectorAll("[data-booking-step]")];
  const progressSteps = [...document.querySelectorAll(".booking-progress .progress-step")];
  const progressLines = [...document.querySelectorAll(".booking-progress .progress-line")];
  const backButton = byId("bookingBack");
  const continueButton = byId("bookingContinue");
  const confirmation = byId("confirmation");

  const pickup = byId("pickupDate");
  const dropoff = byId("returnDate");
  const fullName = byId("fullName");
  const email = byId("email");
  const phone = byId("phone");
  const terms = byId("terms");
  const insurance = byId("insurance");
  const childSeat = byId("childSeat");

  const { insurancePerDay, childSeatPerTrip } = bookings.rates;
  const requestedId = new URLSearchParams(window.location.search).get("carId");
  const requestedCar = requestedId === null ? null : getCarById(requestedId);
  const storedCarId = storage.read("selectedCarId", 1, storage.validators.carId);
  const selectedCar = requestedCar || getCarById(storedCarId) || cars[0];
  let currentStep = 0;
  let confirmed = false;

  function today() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  }

  function rentalDays() {
    return bookings.rentalDays(pickup.value, dropoff.value);
  }

  function selectedExtras() {
    return { insurance: insurance.checked, childSeat: childSeat.checked };
  }

  function formatDate(value) {
    return value ? new Date(value).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
    }) : "—";
  }

  function updateSummary() {
  
    const days = rentalDays();
    const { extrasUSD, totalUSD } = bookings.quote(selectedCar, days, selectedExtras());

    byId("insurancePrice").textContent = currency.format(insurancePerDay);
    byId("childSeatPrice").textContent = currency.format(childSeatPerTrip);
    byId("summaryPickup").textContent = formatDate(pickup.value);
    byId("summaryReturn").textContent = formatDate(dropoff.value);
    byId("summaryDays").textContent = days > 0
      ? `${days} ${days === 1 ? "day" : "days"} × ${currency.format(selectedCar.price)} / day`
      : "Choose dates to calculate the total.";
    byId("summaryExtras").textContent = days > 0 ? currency.format(extrasUSD) : "—";
    byId("summaryTotal").textContent = days > 0 ? currency.format(totalUSD) : "—";

    const trip = `${selectedCar.name} · ${formatDate(pickup.value)} – ${formatDate(dropoff.value)}`;
    const extras = [];
    if (insurance.checked) extras.push("Insurance");
    if (childSeat.checked) extras.push("Child seat");

    byId("bookingReviewTrip").textContent = trip;
    byId("bookingReviewExtras").textContent = `Extras: ${extras.join(", ") || "None"}`;
    byId("bookingReviewContact").textContent =
      `${fullName.value.trim()} · ${email.value.trim()} · ${phone.value.trim()}`;
    byId("bookingReviewTotal").textContent = `Total: ${currency.format(totalUSD)}`;

    if (confirmed) {
      byId("confirmationText").textContent = `${trip} · ${currency.format(totalUSD)}`;
    }
  }

  const stepFields = [
    [
      { input: pickup, validate: () => {
        if (!pickup.value) return "Choose a pick-up date";
        return pickup.value < today() ? "Pick-up date cannot be in the past" : "";
      } },
      { input: dropoff, validate: () => {
        if (!dropoff.value) return "Choose a return date";
        return rentalDays() === 0 ? "Return date must be after pick-up date" : "";
      } },
    ],
    [
      { input: fullName, validate: () =>
        fullName.value.trim().length < 3 ? "Name must be at least 3 characters" : "" },
      { input: email, validate: () =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())
          ? "" : "Enter a valid email, e.g. you@example.com" },
      { input: phone, validate: () => {
        const value = phone.value.trim();
        const digits = value.replace(/\D/g, "");
        return /^\+?[0-9\s()-]+$/.test(value) && digits.length >= 10 && digits.length <= 15
          ? "" : "Enter a valid phone, e.g. +7 700 000 00 00";
      } },
    ],
    [
      { input: terms, validate: () => terms.checked ? "" : "You must agree to the terms" },
    ],
  ];

  function validateField({ input, validate }) {
    const message = validate();
    byId(`${input.id}Error`).textContent = message;
    input.classList.toggle("is-invalid", Boolean(message));
    input.setAttribute("aria-invalid", String(Boolean(message)));
    return message === "";
  }

  function updateProgress() {
    progressSteps.forEach((step, index) => {
      const active = index === currentStep && !confirmed;
      const completed = index < currentStep || confirmed;
      step.classList.toggle("active", active);
      step.classList.toggle("completed", completed);
      step.querySelector(".step-number").textContent = completed ? "✓" : String(index + 1);

      if (active) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    });
    progressLines.forEach((line, index) => {
      line.classList.toggle("completed", index < currentStep || confirmed);
    });
  }

  function showStep(step, moveFocus = true) {
    currentStep = step;
    panels.forEach((panel, index) => { panel.hidden = index !== step; });
    backButton.hidden = step === 0;
    continueButton.textContent = step === panels.length - 1 ? "Confirm booking" : "Continue";
    updateProgress();
    updateSummary();
    if (moveFocus) panels[step].querySelector("h2").focus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (confirmed) return;

    const fields = stepFields[currentStep];
    const invalidIndex = fields.map(validateField).indexOf(false);
    if (invalidIndex !== -1) {
      fields[invalidIndex].input.focus();
      return;
    }

    if (currentStep < panels.length - 1) {
      showStep(currentStep + 1);
      return;
    }

    const saveError = byId("bookingSaveError");
    saveError.textContent = "";

    const saved = bookings.create({
      carId: selectedCar.id,
      pickup: pickup.value,
      dropoff: dropoff.value,
      location: byId("summaryLocation").textContent.trim(),
      contact: {
        name: fullName.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
      },
      extras: selectedExtras(),
    });

    if (!saved) {
      saveError.textContent = "We couldn't save your booking in this browser. Please try again.";
      return;
    }

    confirmed = true;
    form.hidden = true;
    confirmation.classList.add("show");
    updateProgress();
    updateSummary();
    byId("bookingConfirmedHeading").focus();
    window.dispatchEvent(new Event("rentocar:bookings-change"));
  });

  backButton.addEventListener("click", () => showStep(currentStep - 1));

  for (const field of stepFields.flat()) {
    field.input.setAttribute("aria-describedby", `${field.input.id}Error`);
    field.input.addEventListener("input", () => validateField(field));
    field.input.addEventListener("change", () => validateField(field));
  }

  pickup.addEventListener("change", () => {
    if (dropoff.value) validateField(stepFields[0][1]);
    updateSummary();
  });
  dropoff.addEventListener("change", updateSummary);
  insurance.addEventListener("change", updateSummary);
  childSeat.addEventListener("change", updateSummary);
  window.addEventListener("rentocar:currency-change", updateSummary);

  if (requestedId !== null && !requestedCar) {
    const notice = byId("bookingCarNotice");
    notice.textContent = `The requested car was not found. Showing ${selectedCar.name}.`;
    notice.hidden = false;
  }

  byId("summaryImage").src = selectedCar.image;
  byId("summaryImage").alt = selectedCar.name;
  byId("summaryName").textContent = selectedCar.name;
  byId("summaryDescription").textContent = selectedCar.description;
  byId("summaryBadge").textContent = selectedCar.badge ||
    selectedCar.category.charAt(0).toUpperCase() + selectedCar.category.slice(1);
  storage.write("selectedCarId", selectedCar.id, storage.validators.carId);

  pickup.min = today();
  const search = storage.read("rentalSearch", null, storage.validators.rentalSearch);
  if (search) {
    pickup.value = search.pickup.slice(0, 10);
    dropoff.value = search.return.slice(0, 10);
    byId("summaryLocation").textContent = search.location;
  }

  showStep(0, false);
})();