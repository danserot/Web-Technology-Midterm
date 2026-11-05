// Shared catalog. Other pages can read window.RentoCar.cars and getCarById(id).
// Prices are demonstration rental rates per day in USD.
const cars = [
  { id: 1, name: "Porsche Macan", category: "suv", price: 164, seats: 5, fuel: "Petrol", transmission: "Automatic", description: "Sporty SUV", badge: "Performance", image: "assets/images/porsche_macan.png" },
  { id: 2, name: "Polestar 2", category: "electric", price: 109, seats: 5, fuel: "Electric", transmission: "Automatic", description: "Electric fastback", image: "assets/images/polestar_2.png" },
  { id: 3, name: "Range Rover Evoque", category: "luxury", price: 148, seats: 5, fuel: "Hybrid", transmission: "Automatic", description: "Premium SUV", image: "assets/images/range_rover_evoque.png" },
  { id: 4, name: "Volvo XC60", category: "suv", price: 98, seats: 5, fuel: "Hybrid", transmission: "Automatic", description: "Premium SUV", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlOdlu71ZZ2i5xS2vHNFt2tLXBSMDR_Jz5rIzFX7y0TQ&s=10" },
  { id: 5, name: "BMW i4", category: "electric", price: 112, seats: 5, fuel: "Electric", transmission: "Automatic", description: "Electric sedan", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJTaeYFiBJMJAAwqMEveewNAwle1cLhKsLvfTJ86ePEQ&s=10" },
  { id: 6, name: "Mini Cooper", category: "compact", price: 64, seats: 4, fuel: "Petrol", transmission: "Automatic", description: "City compact", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRc4uH-8_i523bAkQ47e6mEgyS-Pg3BjgzUnu84etKtALOhAIOVVhjEtIW7&s=10" },
  { id: 7, name: "Toyota RAV4", category: "suv", price: 95, seats: 5, fuel: "Hybrid", transmission: "Automatic", description: "Versatile family SUV", image: "assets/images/suv-illustration.svg" },
  { id: 8, name: "Hyundai Tucson", category: "suv", price: 89, seats: 5, fuel: "Petrol", transmission: "Automatic", description: "Comfortable crossover", image: "assets/images/suv-illustration.svg" },
  { id: 9, name: "Tesla Model 3", category: "electric", price: 119, seats: 5, fuel: "Electric", transmission: "Automatic", description: "Electric sedan", image: "assets/images/electric-illustration.svg" },
  { id: 10, name: "Hyundai Ioniq 5", category: "electric", price: 125, seats: 5, fuel: "Electric", transmission: "Automatic", description: "Electric crossover", image: "assets/images/electric-illustration.svg" },
  { id: 11, name: "Mercedes-Benz E-Class", category: "luxury", price: 175, seats: 5, fuel: "Petrol", transmission: "Automatic", description: "Executive sedan", image: "assets/images/luxury-illustration.svg" },
  { id: 12, name: "BMW 5 Series", category: "luxury", price: 169, seats: 5, fuel: "Petrol", transmission: "Automatic", description: "Premium sedan", image: "assets/images/luxury-illustration.svg" },
  { id: 13, name: "Toyota Yaris", category: "compact", price: 58, seats: 5, fuel: "Hybrid", transmission: "Automatic", description: "Easy city drive", image: "assets/images/compact-illustration.svg" },
  { id: 14, name: "Honda Jazz", category: "compact", price: 62, seats: 5, fuel: "Hybrid", transmission: "Automatic", description: "Practical hatchback", image: "assets/images/compact-illustration.svg" },
  { id: 15, name: "Volkswagen Polo", category: "compact", price: 60, seats: 5, fuel: "Petrol", transmission: "Automatic", description: "Compact city car", image: "assets/images/compact-illustration.svg" },
  { id: 16, name: "Mazda MX-5", category: "convertible", price: 139, seats: 2, fuel: "Petrol", transmission: "Manual", description: "Open-top roadster", image: "assets/images/convertible-illustration.svg" },
  { id: 17, name: "BMW Z4", category: "convertible", price: 179, seats: 2, fuel: "Petrol", transmission: "Automatic", description: "Sporty roadster", image: "assets/images/convertible-illustration.svg" },
  { id: 18, name: "Mercedes-Benz V-Class", category: "van", price: 189, seats: 7, fuel: "Petrol", transmission: "Automatic", description: "Premium group travel", image: "assets/images/van-illustration.svg" },
  { id: 19, name: "Volkswagen Multivan", category: "van", price: 155, seats: 7, fuel: "Hybrid", transmission: "Automatic", description: "Flexible family van", image: "assets/images/van-illustration.svg" },
  { id: 20, name: "Kia Carnival", category: "van", price: 145, seats: 8, fuel: "Petrol", transmission: "Automatic", description: "Spacious minivan", image: "assets/images/van-illustration.svg" },
];

window.RentoCar = {
  cars,
  getCarById(id) {
    return cars.find((car) => car.id === Number(id));
  },
};
