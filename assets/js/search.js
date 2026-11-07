const searchForm = document.querySelector(".search-form");

function loadSavedSearch() {
  const saved = window.localStorage.getItem("rentalSearch");
  if (!saved) return;

  const search = JSON.parse(saved);
  searchForm.elements["location"].value = search.location;
  searchForm.elements["pickup"].value = search.pickup;
  searchForm.elements["return"].value = search.return;
}

searchForm.addEventListener("submit", function(event){
  const rentalSearch = {
    location: searchForm.elements["location"].value.trim(),
    pickup: searchForm.elements["pickup"].value,
    return: searchForm.elements["return"].value,
  };

  if (rentalSearch.return <= rentalSearch.pickup) {
    event.preventDefault();
    alert("Return date must be later than pick-up date");
    return;
  }

  window.localStorage.setItem("rentalSearch", JSON.stringify(rentalSearch));
});

loadSavedSearch();