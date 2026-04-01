// script.js
import { Application } from '@splinetool/runtime';

const canvas = document.getElementById('canvas3d');
const app = new Application(canvas);

app.load('./r_4_x_bot.spline')
    .then(() => {
        // Hide the loader once the scene is ready
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');

        // This is where you "edit" objects via code
        const bot = app.findObjectByName('Bot'); // Replace with the name of an object in your scene
        if (bot) {
            bot.position.y = 50;
            bot.rotation.x = Math.PI / 4;
        }
        console.log('Spline scene loaded and bot modified!');
    });

const myObj = app.findObjectByName('YOUR_OBJECT_NAME');
if (myObj) {
    myObj.position.x = 100; // Move it
    myObj.rotation.y += 0.5; // Rotate it
    myObj.scale.set(2, 2, 2); // Resize it
}

const buttons = document.querySelectorAll(".glass-btn");
const content = document.getElementById("content");

/* Weather icon mapping */
const weatherIcons = {
  Clear: "fa-sun",
  Clouds: "fa-cloud",
  Rain: "fa-cloud-rain",
  Thunderstorm: "fa-bolt",
  Snow: "fa-snowflake",
  Mist: "fa-smog",
  Haze: "fa-smog",
};

/* Style recommendation */
function getStyleAdvice(temp, condition) {
  if (condition === "Rain") return "Carry an umbrella ☔";
  if (temp < 15) return "Wear a jacket 🧥";
  if (temp < 25) return "Light hoodie 👕";
  return "Stay cool 😎";
}

/* Button actions */
buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;

    if (action === "search") {
      const city = prompt("Enter city name:");
      if (city) fetchWeather(city);
    }

    if (action === "style") {
      content.innerHTML = `<h2>Style Recommendation</h2><p>${getStyleAdvice(30, "Clear")}</p>`;
    }

    if (action === "forecast") {
      content.innerHTML = `<h2>5-Day Forecast</h2><p>Coming soon...</p>`;
    }
  });
});

/* Fetch Weather (OpenWeather API) */
async function fetchWeather(city) {
  const apiKey = API_KEY;

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
  );

  const data = await res.json();
  console.log(data);
  const icon = weatherIcons[data.weather[0].main] || "fa-cloud";

  document.getElementById("content").innerHTML = `
    <h2>${data.name}</h2>
    <i class="fa-solid ${icon}" style="font-size:40px;"></i>
    <p>${data.main.temp}°C</p>
    <p>${data.weather[0].main}</p>
  `;
}

document.querySelectorAll(".glass-btn").forEach((btn) => {
  btn.addEventListener("mousemove", (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    btn.style.transform = `
      perspective(500px)
      rotateX(${(y - rect.height / 2) / 10}deg)
      rotateY(${-(x - rect.width / 2) / 10}deg)
      scale(1.05)
    `;
  });

  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "scale(1)";
  });
});

// {coord: {…}, weather: Array(1), base: 'stations', main: {…}, visibility: 5000, …}
// base
// : 
// "stations"
// clouds
// : 
// {all: 20}
// cod
// : 
// 200
// coord
// : 
// {lon: 80.9167, lat: 26.85}
// dt
// : 
// 1775053207
// id
// : 
// 1264733
// main
// : 
// feels_like
// : 
// 30.49
// grnd_level
// : 
// 992
// humidity
// : 
// 37
// pressure
// : 
// 1006
// sea_level
// : 
// 1006
// temp
// : 
// 30.99
// temp_max
// : 
// 30.99
// temp_min
// : 
// 30.99
// [[Prototype]]
// : 
// Object
// name
// : 
// "Lucknow"
// sys
// : 
// {type: 1, id: 9176, country: 'IN', sunrise: 1775003246, sunset: 1775047973}
// timezone
// : 
// 19800
// visibility
// : 
// 5000
// weather
// : 
// Array(1)
// 0
// : 
// {id: 721, main: 'Haze', description: 'haze', icon: '50n'}
// length
// : 
// 1
// [[Prototype]]
// : 
// Array(0)
// wind
// : 
// {speed: 2.57, deg: 330}
// [[Prototype]]
// : 
// Object