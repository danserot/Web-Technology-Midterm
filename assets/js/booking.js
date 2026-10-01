const cars = {
  "porsche-macan": {
    name: "Porsche Macan",
    type: "Sporty SUV",
    category: "Performance",
    price: 164,
    image: "assets/images/porsche_macan.png"
  },

  "polestar-2": {
    name: "Polestar 2",
    type: "Electric fastback",
    category: "Electric",
    price: 109,
    image: "assets/images/polestar_2.png"
  },

  "range-rover-evoque": {
    name: "Range Rover Evoque",
    type: "Premium SUV",
    category: "Luxury",
    price: 148,
    image: "assets/images/range_rover_evoque.png"
  }
};


const params = new URLSearchParams(window.location.search);

const selectedCarId = params.get("car");

const selectedCar = cars[selectedCarId] || cars["porsche-macan"];


document.getElementById("summaryCarImage").src = selectedCar.image;
document.getElementById("summaryCarImage").alt = selectedCar.name;

document.getElementById("summaryCarName").textContent =
  selectedCar.name;

document.getElementById("summaryCarType").textContent =
  selectedCar.type;

document.getElementById("summaryCarCategory").textContent =
  selectedCar.category;

document.getElementById("summaryPricePerDay").textContent =
  `$${selectedCar.price} / day`;