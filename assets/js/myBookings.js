(() => {
  const byId = (id) => document.getElementById(id);
  const list = byId("myBookingsList");
  if (!list) return;

  const { bookings, getCarById, currency } = window.RentoCar;
  const status = byId("myBookingsStatus");
  const template = byId("bookingCardTemplate");
  const editor = byId("editBookingForm");
  const pickup = byId("editPickup");
  const dropoff = byId("editDropoff");
  const insurance = byId("editInsurance");
  const childSeat = byId("editChildSeat");
  const editError = byId("editBookingError");
  let editing = null;

  function renderBookings(message = "") {
    const saved = bookings.list();
    list.replaceChildren();

    if (saved === null) {
      status.textContent = "Saved bookings could not be read from this browser.";
      return;
    }

    if (saved.length === 0) {
      status.textContent = "You have no saved bookings yet.";
      return;
    }

    status.textContent = message || `${saved.length} saved ${saved.length === 1 ? "booking" : "bookings"}.`;
    const cards = document.createDocumentFragment();

    for (const booking of [...saved].reverse()) {
      const card = template.content.cloneNode(true);
      const car = getCarById(booking.carId);
      const name = car?.name ?? `Car #${booking.carId}`;
      const extras = [];
      if (booking.extras.insurance) extras.push("Insurance");
      if (booking.extras.childSeat) extras.push("Child seat");

      card.querySelector(".booking-card").dataset.bookingId = booking.id;
      card.querySelector("[data-booking-car]").textContent = name;
      card.querySelector("[data-booking-trip]").textContent =
        `${booking.pickup} → ${booking.dropoff} · ${booking.location}`;
      card.querySelector("[data-booking-extras]").textContent = `Extras: ${extras.join(", ") || "None"}`;
      card.querySelector("[data-booking-contact]").textContent =
        `${booking.contact.name} · ${booking.contact.email} · ${booking.contact.phone}`;
      card.querySelector("[data-booking-edit]").setAttribute("aria-label", `Edit booking for ${name}`);
      card.querySelector("[data-booking-delete]").setAttribute("aria-label", `Delete booking for ${name}`);

      const total = card.querySelector("[data-booking-total]");
      total.dataset.priceUsd = String(booking.totalUSD);
      total.textContent = currency.format(booking.totalUSD);
      cards.append(card);
    }

    list.append(cards);
  }

  function editValues() {
    return {
      pickup: pickup.value,
      dropoff: dropoff.value,
      extras: { insurance: insurance.checked, childSeat: childSeat.checked },
    };
  }

  function updatePreview() {
    if (!editing) return;
    const draft = editValues();
    const days = bookings.rentalDays(draft.pickup, draft.dropoff);
    byId("editInsurancePrice").textContent = currency.format(bookings.rates.insurancePerDay);
    byId("editChildSeatPrice").textContent = currency.format(bookings.rates.childSeatPerTrip);
    byId("editBookingTotal").textContent = days > 0 && draft.pickup >= bookings.today()
      ? currency.format(bookings.quote(editing.car, days, draft.extras).totalUSD)
      : "—";
  }

  function openEditor(id) {
    const booking = bookings.list()?.find((entry) => entry.id === id);
    const car = booking && getCarById(booking.carId);
    if (!car) {
      status.textContent = "This booking could not be opened for editing.";
      return;
    }

    editing = { id, car };
    pickup.min = bookings.today();
    pickup.value = booking.pickup;
    dropoff.value = booking.dropoff;
    insurance.checked = booking.extras.insurance;
    childSeat.checked = booking.extras.childSeat;
    editError.textContent = "";
    byId("editBookingTitle").textContent = `Edit booking for ${car.name}`;
    editor.hidden = false;
    updatePreview();
    pickup.focus();
  }

  function closeEditor() {
    editing = null;
    editor.hidden = true;
  }

  function focusEditButton(id) {
    const button = list.querySelector(`[data-booking-id="${CSS.escape(id)}"] [data-booking-edit]`);
    (button || status).focus();
  }

  editor.addEventListener("input", () => {
    editError.textContent = "";
    updatePreview();
  });

  editor.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!editing) return;
    const draft = editValues();

    if (draft.pickup < bookings.today()) {
      editError.textContent = "Choose a pick-up date from today onward.";
      pickup.focus();
      return;
    }

    if (bookings.rentalDays(draft.pickup, draft.dropoff) === 0) {
      editError.textContent = "Return date must be after pick-up date.";
      dropoff.focus();
      return;
    }

    const { id } = editing;
    if (!bookings.update(id, draft)) {
      editError.textContent = "We couldn't update this booking. Please try again.";
      return;
    }

    closeEditor();
    renderBookings("Booking updated.");
    focusEditButton(id);
  });

  byId("cancelBookingEdit").addEventListener("click", () => {
    const { id } = editing;
    closeEditor();
    focusEditButton(id);
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-booking-edit], [data-booking-delete]");
    if (!button) return;
    const card = button.closest(".booking-card");
    const id = card.dataset.bookingId;

    if (button.hasAttribute("data-booking-edit")) {
      openEditor(id);
      return;
    }

    const name = card.querySelector("[data-booking-car]").textContent;
    if (!window.confirm(`Delete the booking for ${name}?`)) return;
    if (!bookings.remove(id)) {
      status.textContent = "We couldn't delete this booking. Please try again.";
      return;
    }

    if (editing?.id === id) closeEditor();
    renderBookings("Booking deleted.");
    const nextButton = list.querySelector("[data-booking-delete]");
    (nextButton || status).focus();
  });

  window.addEventListener("rentocar:currency-change", updatePreview);
  window.addEventListener("rentocar:bookings-change", () => renderBookings());
  renderBookings();
})();
