(() => {
  const list = document.getElementById("myBookingsList");
  if (!list) return;

  const { bookings, getCarById, currency } = window.RentoCar;
  const status = document.getElementById("myBookingsStatus");
  const template = document.getElementById("bookingCardTemplate");

  function renderBookings() {
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

    status.textContent = `${saved.length} saved ${saved.length === 1 ? "booking" : "bookings"}.`;
    const cards = document.createDocumentFragment();

    for (const booking of [...saved].reverse()) {
      const card = template.content.cloneNode(true);
      const car = getCarById(booking.carId);
      const extras = [];
      if (booking.extras.insurance) extras.push("Insurance");
      if (booking.extras.childSeat) extras.push("Child seat");

      card.querySelector(".booking-card").dataset.bookingId = booking.id;
      card.querySelector("[data-booking-car]").textContent = car?.name ?? `Car #${booking.carId}`;
      card.querySelector("[data-booking-trip]").textContent =
        `${booking.pickup} → ${booking.dropoff} · ${booking.location}`;
      card.querySelector("[data-booking-extras]").textContent = `Extras: ${extras.join(", ") || "None"}`;
      card.querySelector("[data-booking-contact]").textContent =
        `${booking.contact.name} · ${booking.contact.email} · ${booking.contact.phone}`;

      const total = card.querySelector("[data-booking-total]");
      total.dataset.priceUsd = String(booking.totalUSD);
      total.textContent = currency.format(booking.totalUSD);
      cards.append(card);
    }

    list.append(cards);
  }

  window.addEventListener("rentocar:bookings-change", renderBookings);
  renderBookings();
})();
