(() => {
  const { getCarById } = window.RentoCar;
  const storageKey = "favoriteCarIds";
  const grid = document.querySelector("#favorites-grid");
  const emptyMessage = document.querySelector("#favorites-empty");
  const template = document.querySelector("#favorite-card-template");
  const popularHearts = document.querySelectorAll(
    "[aria-labelledby='popular-title'] .favorite-button"
  );

  function readFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved)) {
        return new Set(saved.map((id) => getCarById(id)?.id).filter(Boolean));
      }
    } catch {
   
    }
    return new Set();
  }

})