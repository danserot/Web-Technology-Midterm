(() => {
  const { getCarById, storage, currency } = window.RentoCar;
  const storageKey = "favoriteCarIds";
  const grid = document.querySelector("#favorites-grid");
  const emptyMessage = document.querySelector("#favorites-empty");
  const template = document.querySelector("#favorite-card-template");
  const popularHearts = document.querySelectorAll(
    "[aria-labelledby='popular-title'] .favorite-button"
  );

  function readFavorites() {
    const saved = storage.read(storageKey, [], storage.validators.favoriteIds);
    return new Set(saved.map((id) => getCarById(id)?.id).filter(Boolean));
  }

  let favoriteIds = readFavorites();

  function updateHeart(button, car) {
    const isFavorite = favoriteIds.has(car.id);
    button.setAttribute("aria-label", `${car.name} favorite`);
    button.setAttribute("aria-pressed", String(isFavorite));
    button.textContent = isFavorite ? "♥" : "♡";
  }

  function renderFavorites() {
    const cards = document.createDocumentFragment();

    for (const id of favoriteIds) {
      const car = getCarById(id);
      const card = template.content.firstElementChild.cloneNode(true);
      card.dataset.carId = car.id;

      const image = card.querySelector("img");
      image.src = car.image;
      image.alt = car.name;
      card.querySelector("h3").textContent = car.name;
      card.querySelector(".car-details p").textContent = car.description;
      const price = card.querySelector(".favorite-price");
      price.dataset.priceUsd = String(car.price);
      price.textContent = currency.format(car.price);
      card.querySelector(".car-meta span").textContent = car.transmission;
      updateHeart(card.querySelector(".favorite-button"), car);
      cards.append(card);
    }

    grid.replaceChildren(cards);
    emptyMessage.hidden = favoriteIds.size > 0;

    for (const button of popularHearts) {
      const car = getCarById(button.closest(".car-card").dataset.carId);
      if (car) updateHeart(button, car);
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".favorite-button");
    if (!button) return;

    const car = getCarById(button.closest(".car-card")?.dataset.carId);
    if (!car) return;

    const wasFavorite = favoriteIds.delete(car.id);
    if (!wasFavorite) favoriteIds.add(car.id);

    storage.write(storageKey, [...favoriteIds], storage.validators.favoriteIds);

    const removedFromGrid = grid.contains(button);
    renderFavorites();

    if (removedFromGrid) {
      const nextHeart = document.querySelector(
        `[data-car-id="${car.id}"] .favorite-button`
      ) || grid.querySelector(".favorite-button") || emptyMessage;
      nextHeart.focus();
    }

    if (!wasFavorite) {
      button.dispatchEvent(
        new CustomEvent("rentocar:favorite-added", { bubbles: true })
      );
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === storageKey || event.key === null) {
      favoriteIds = readFavorites();
      renderFavorites();
    }
  });

  renderFavorites();
})();
