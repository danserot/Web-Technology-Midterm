(() => {
  const app = window.RentoCar = window.RentoCar || {};
  let lastError = null;

  function reportError(operation, key, reason) {
    lastError = { operation, key, reason };
    window.dispatchEvent(new CustomEvent("rentocar:storage-error", { detail: lastError }));
  }

  function isDateValue(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?$/.test(value)) return false;
    const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value.slice(0, 10)) return false;
    return value.length === 10 || (Number(value.slice(11, 13)) < 24 && Number(value.slice(14, 16)) < 60);
  }

  const validators = Object.freeze({
    carId: (value) => Number.isSafeInteger(value) && value > 0,
    rentalSearch: (value) => value !== null && typeof value === "object" && !Array.isArray(value)
      && typeof value.location === "string" && value.location.trim().length > 0
      && isDateValue(value.pickup) && isDateValue(value.return),
    favoriteIds: (value) => Array.isArray(value)
      && value.every((id) => Number.isSafeInteger(id) && id > 0),
  });

  app.storage = Object.freeze({
    validators,
    get lastError() { return lastError; },

    read(key, fallback = null, validate = () => true) {
      lastError = null;
      try {
        const saved = window.localStorage.getItem(key);
        if (saved === null) return fallback;
        const value = JSON.parse(saved);
        if (!validate(value)) {
          reportError("read", key, "invalid-data");
          return fallback;
        }
        return value;
      } catch {
        reportError("read", key, "unreadable-data");
        return fallback;
      }
    },

    write(key, value, validate = () => true) {
      lastError = null;
      try {
        if (!validate(value)) {
          reportError("write", key, "invalid-data");
          return false;
        }
        const saved = JSON.stringify(value, (_key, item) => {
          if (["undefined", "function", "symbol", "bigint"].includes(typeof item)
            || (typeof item === "number" && !Number.isFinite(item))) {
            throw new TypeError("Only JSON data can be saved");
          }
          return item;
        });
        window.localStorage.setItem(key, saved);
        return true;
      } catch {
        reportError("write", key, "storage-unavailable");
        return false;
      }
    },

    remove(key) {
      lastError = null;
      try {
        window.localStorage.removeItem(key);
        return true;
      } catch {
        reportError("remove", key, "storage-unavailable");
        return false;
      }
    },
  });
})();
