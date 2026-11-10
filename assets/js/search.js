const searchForm = document.querySelector(".search-form");
const searchStorage = window.RentoCar.storage;

function loadSavedSearch() {
  const search = searchStorage.read("rentalSearch", null, searchStorage.validators.rentalSearch);
  if (!search) return;
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

  searchStorage.write("rentalSearch", rentalSearch, searchStorage.validators.rentalSearch);
});

loadSavedSearch();
