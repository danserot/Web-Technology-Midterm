(() => {
  const app = window.RentoCar;
  const { storage, getCarById } = app;
  const storageKey = "rentalBookings";
  const rates = Object.freeze({ insurancePerDay: 15, childSeatPerTrip: 10 });

  function isDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function rentalDays(pickup, dropoff) {
    if (!isDate(pickup) || !isDate(dropoff) || dropoff <= pickup) return 0;
    return (Date.parse(dropoff) - Date.parse(pickup)) / 86400000;
  }

  
  function quote(car, days, extras) {
    const extrasUSD = days === 0 ? 0 :
      (extras.insurance ? rates.insurancePerDay * days : 0) +
      (extras.childSeat ? rates.childSeatPerTrip : 0);
    return { extrasUSD, totalUSD: car.calculateRentalCost(days) + extrasUSD };
  }

  function isDraft(booking) {
    return Boolean(booking &&
      storage.validators.carId(booking.carId) &&
      rentalDays(booking.pickup, booking.dropoff) > 0 &&
      [booking.location, booking.contact?.name, booking.contact?.email, booking.contact?.phone]
        .every((value) => typeof value === "string" && value.trim().length > 0) &&
      typeof booking.extras?.insurance === "boolean" &&
      typeof booking.extras?.childSeat === "boolean");
  }

  function isBookingList(list) {
    return Array.isArray(list) && list.every((booking) =>
      isDraft(booking) && typeof booking.id === "string" && booking.id.length > 0 &&
      Number.isFinite(booking.totalUSD) && booking.totalUSD >= 0
    ) && new Set(list.map((booking) => booking.id)).size === list.length;
  }

  function list() {
    const bookings = storage.read(storageKey, [], isBookingList);
    return storage.lastError ? null : bookings;
  }

  function create(draft) {
    if (!isDraft(draft)) return false;
    const car = getCarById(draft.carId);
    if (!car) return false;

    const bookings = list();
    if (bookings === null) return false;

    const id = Array.from(window.crypto.getRandomValues(new Uint32Array(4))).join("-");
    const days = rentalDays(draft.pickup, draft.dropoff);
    const { totalUSD } = quote(car, days, draft.extras);

    return storage.write(storageKey, [...bookings, { ...draft, id, totalUSD }], isBookingList);
  }

  function today() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  }

  function update(id, { pickup, dropoff, extras }) {
    const bookings = list();
    if (bookings === null) return false;
    const index = bookings.findIndex((booking) => booking.id === id);
    if (index === -1) return false;

    const updated = { ...bookings[index], pickup, dropoff, extras };
    if (!isDraft(updated) || pickup < today()) return false;
    const car = getCarById(updated.carId);
    if (!car) return false;

    const days = rentalDays(pickup, dropoff);
    const { totalUSD } = quote(car, days, extras);
    bookings[index] = { ...updated, totalUSD };
    return storage.write(storageKey, bookings, isBookingList);
  }

  function remove(id) {
    const bookings = list();
    if (bookings === null) return false;
    const remaining = bookings.filter((booking) => booking.id !== id);
    if (remaining.length === bookings.length) return false;
    return storage.write(storageKey, remaining, isBookingList);
  }

  app.bookings = Object.freeze({ rates, today, rentalDays, quote, list, create, update, remove });
})();