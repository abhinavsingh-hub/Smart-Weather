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

function updateUI(data) {
    const weather = data.weather[0].main;

    document.getElementById("city").innerText = data.name;
    document.getElementById("temp").innerText = `${data.main.temp}°C`;
    document.getElementById("condition").innerText = weather;

    document.getElementById("feels").innerText = `${data.main.feels_like}°C`;
    document.getElementById("humidity").innerText = `${data.main.humidity}%`;
    document.getElementById("wind").innerText = `${data.wind.speed} m/s`;

    const icon = weatherIcons[weather] || "fa-cloud";
    document.getElementById("weatherIcon").className = `fa-solid ${icon}`;

    updateBackground(weather); 
}

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

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                fetchWeatherByCoords(lat, lon);
            },
            () => {
                alert("Location permission denied ❌");
            }
        );
    }
}

async function fetchWeatherByCoords(lat, lon) {
    const apiKey = API_KEY;

    const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    const data = await res.json();

    updateUI(data);
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

document.body.style.background = "linear-gradient(...)";

function updateBackground(weather) {
    const overlay = document.getElementById("bg-overlay");

    const themes = {
        Clear: "radial-gradient(circle at center, rgba(255,200,0,0.2), transparent 70%)",
        Clouds: "radial-gradient(circle, rgba(200,200,200,0.15), transparent 70%)",
        Rain: "radial-gradient(circle, rgba(0,150,255,0.2), transparent 70%)",
        Thunderstorm: "radial-gradient(circle, rgba(100,0,255,0.25), transparent 70%)",
        Snow: "radial-gradient(circle, rgba(255,255,255,0.25), transparent 70%)",
        Haze: "radial-gradient(circle, rgba(180,180,180,0.2), transparent 70%)",
    };

    overlay.style.background = themes[weather] || "transparent";
}

getUserLocation();