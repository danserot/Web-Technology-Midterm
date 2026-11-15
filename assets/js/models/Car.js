(() => {
  class Car {
    constructor({ id, name, category, price, seats, fuel, transmission, description, image, badge = "" }) {
      if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(seats) || seats <= 0) {
        throw new TypeError("Car id and seats must be positive integers.");
      }
      if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
        throw new TypeError("Car price must be a non-negative USD amount.");
      }
      if ([name, category, fuel, transmission, description, image].some((value) =>
        typeof value !== "string" || value.trim() === ""
      ) || typeof badge !== "string") {
        throw new TypeError("Car characteristics must be non-empty strings.");
      }

      Object.assign(this, { id, name, category, price, seats, fuel, transmission, description, image, badge });
    }

    // Price bands always use the original USD rate, independent of display currency.
    matchesFilters({ category = "all", price = "all", seats = "all", fuel = "all", query = "" } = {}) {
      const priceMatches = price === "all" ||
        (price === "low" && this.price < 100) ||
        (price === "mid" && this.price >= 100 && this.price <= 150) ||
        (price === "high" && this.price > 150);

      return (category === "all" || this.category === category) &&
        priceMatches &&
        (seats === "all" || this.seats === Number(seats)) &&
        (fuel === "all" || this.fuel === fuel) &&
        this.name.toLowerCase().includes(String(query).trim().toLowerCase());
    }

    calculateRentalCost(days) {
      if (!Number.isSafeInteger(days) || days < 0) {
        throw new RangeError("Rental days must be a non-negative integer.");
      }
      const total = this.price * days;
      if (!Number.isFinite(total) || !Number.isSafeInteger(Math.round(total * 100))) {
        throw new RangeError("Rental cost is too large.");
      }
      return Math.round(total * 100) / 100;
    }
  }

  window.RentoCar = window.RentoCar || {};
  window.RentoCar.Car = Car;
})();
