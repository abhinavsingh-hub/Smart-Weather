import { Application } from '@splinetool/runtime';

// Use environment variables or global constants
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN || "";

const canvas = document.getElementById('canvas3d');
const app = new Application(canvas);

app.load('./r_4_x_bot.splinecode')
    .then(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
        console.log('Spline scene loaded!');
    });

/* Weather interpretation and icon mapping (WMO codes) */
const WMO_MAPPING = {
    0: { main: "Clear", icon: "fa-sun", class: "sunny" },
    1: { main: "Clouds", icon: "fa-cloud-sun", class: "sunny" },
    2: { main: "Clouds", icon: "fa-cloud", class: "cloudy" },
    3: { main: "Clouds", icon: "fa-cloud", class: "cloudy" },
    45: { main: "Mist", icon: "fa-smog", class: "cloudy" },
    48: { main: "Mist", icon: "fa-smog", class: "cloudy" },
    51: { main: "Rain", icon: "fa-cloud-rain", class: "rainy" },
    53: { main: "Rain", icon: "fa-cloud-rain", class: "rainy" },
    55: { main: "Rain", icon: "fa-cloud-rain", class: "rainy" },
    61: { main: "Rain", icon: "fa-cloud-showers-heavy", class: "rainy" },
    63: { main: "Rain", icon: "fa-cloud-showers-heavy", class: "rainy" },
    65: { main: "Rain", icon: "fa-cloud-showers-heavy", class: "rainy" },
    71: { main: "Snow", icon: "fa-snowflake", class: "cloudy" },
    73: { main: "Snow", icon: "fa-snowflake", class: "cloudy" },
    75: { main: "Snow", icon: "fa-snowflake", class: "cloudy" },
    80: { main: "Rain", icon: "fa-cloud-rain", class: "rainy" },
    81: { main: "Rain", icon: "fa-cloud-rain", class: "rainy" },
    82: { main: "Rain", icon: "fa-cloud-rain", class: "rainy" },
    95: { main: "Thunderstorm", icon: "fa-bolt", class: "stormy" },
    96: { main: "Thunderstorm", icon: "fa-bolt", class: "stormy" },
    99: { main: "Thunderstorm", icon: "fa-bolt", class: "stormy" },
};

let forecastData = [];

/* UI Elements */
const aiBubble = document.getElementById("ai-chat-bubble");
const aiResponse = document.getElementById("ai-response");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const forecastOverlay = document.getElementById("forecast-overlay");
const smartPanel = document.getElementById("smart-panel");

const searchOverlay = document.getElementById("search-overlay");
const citySearchInput = document.getElementById("city-search-input");
const citySearchBtn = document.getElementById("city-search-btn");
const myLocationBtn = document.getElementById("my-location-btn");
const searchError = document.getElementById("search-error");
const closeSearch = document.querySelector(".close-search");

/* --- AI / LLM Logic --- */

async function queryAI(data) {
    if (!HF_TOKEN || HF_TOKEN === "your_hf_token_here") {
        return { choices: [{ message: { content: "AI requires a valid VITE_HF_TOKEN in your environment." } }] };
    }
    try {
        const response = await fetch(
            "https://router.huggingface.co/v1/chat/completions",
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify(data),
            }
        );
        if (response.status === 401) return { choices: [{ message: { content: "Auth failed (401). Check HF_TOKEN." } }] };
        const result = await response.json();
        return result;
    } catch (error) {
        return { error: "Failed to connect to AI" };
    }
}

async function getBotResponse(userMsg) {
    showBubble("Thinking...");
    const res = await queryAI({
        messages: [{ role: "system", content: "Friendly weather bot. Brief answers." }, { role: "user", content: userMsg }],
        model: "meta-llama/Llama-3.1-8B-Instruct:novita",
    });
    if (res.choices && res.choices[0]) showBubble(res.choices[0].message.content);
    else showBubble("Oops! I hit a snag.");
}

let bubbleTimeout;

function showBubble(text) {
    aiResponse.innerText = text;
    aiBubble.classList.remove("hidden");

    // Clear any existing timeout
    if (bubbleTimeout) clearTimeout(bubbleTimeout);

    // Auto-hide after 10 seconds (if not still "Thinking...")
    if (text !== "Thinking...") {
        bubbleTimeout = setTimeout(() => {
            aiBubble.classList.add("hidden");
        }, 30000);
    }
}

/* --- Weather Logic (Open-Meteo) --- */

async function updateAllWeather(city) {
    if (!city || !city.trim()) return;
    searchError.classList.add("hidden");

    try {
        // 1. Geocoding: City to Lat/Lon
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            searchError.innerText = `City not found: "${city}"`;
            searchError.classList.remove("hidden");
            return;
        }

        const { latitude, longitude, name } = geoData.results[0];

        // 2. Fetch Weather & Forecast
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const data = await weatherRes.json();

        const currentData = {
            name: name,
            main: {
                temp: data.current.temperature_2m,
                feels_like: data.current.apparent_temperature,
                humidity: data.current.relative_humidity_2m
            },
            wind: { speed: data.current.wind_speed_10m },
            weather: [WMO_MAPPING[data.current.weather_code] || { main: "Clouds", icon: "fa-cloud", class: "cloudy" }]
        };

        updateUI(currentData);

        // Map daily forecast to OWM format for renderForecast
        forecastData = data.daily.time.map((time, i) => ({
            dt: new Date(time).getTime() / 1000,
            main: { temp: (data.daily.temperature_2m_max[i] + data.daily.temperature_2m_min[i]) / 2 },
            weather: [WMO_MAPPING[data.daily.weather_code[i]] || { main: "Clouds", icon: "fa-cloud", class: "cloudy" }],
            dt_txt: time // simplified
        }));

        renderForecast(forecastData);
        concludeSmartFeatures(currentData, forecastData);
        searchOverlay.classList.add("hidden");
    } catch (err) {
        console.error(err);
        searchError.innerText = "Network error. Try again.";
        searchError.classList.remove("hidden");
    }
}

function updateUI(data) {
    if (!data.main) return;

    const weather = data.weather[0];
    document.getElementById("city").innerText = data.name;
    document.getElementById("temp").innerText = `${Math.round(data.main.temp)}°C`;
    document.getElementById("condition").innerText = weather.main;

    document.getElementById("feels").innerText = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById("humidity").innerText = `${data.main.humidity}%`;
    document.getElementById("wind").innerText = `${data.wind.speed} m/s`;

    const icon = weather.icon || "fa-cloud";
    document.getElementById("weatherIcon").className = `fa-solid ${icon}`;

    updateBackground(data.main.temp, weather);
    if (data.sys) updateDayNightMode(data.sys);
}

async function concludeSmartFeatures(current, forecast) {
    smartPanel.classList.remove("hidden");

    // Check if token exists before querying AI for suggestions
    if (!HF_TOKEN || HF_TOKEN === "your_hf_token_here") {
        useFallbackSuggestions(current);
        return;
    }

    const prompt = {
        messages: [
            {
                role: "system",
                content: `Provide 3 short JSON values: { "wear": "...", "carry": "...", "mood": "..." }. 
                Weather: ${current.main.temp}°C, ${current.weather[0].main}`
            },
            {
                role: "user",
                content: `Suggest what to wear, carry, and the weather mood.`,
            },
        ],
        model: "meta-llama/Llama-3.1-8B-Instruct:novita",
        response_format: { type: "json_object" }
    };

    const res = await queryAI(prompt);
    try {
        const advice = JSON.parse(res.choices[0].message.content);
        document.querySelector("#suggestion-wear p").innerText = advice.wear;
        document.querySelector("#suggestion-carry p").innerText = advice.carry;
        document.querySelector("#suggestion-mood p").innerText = advice.mood;
    } catch (e) {
        useFallbackSuggestions(current);
    }
}

function useFallbackSuggestions(current) {
    document.querySelector("#suggestion-wear p").innerText = current.main.temp < 15 ? "Heavy Jacket" : "Light T-shirt";
    document.querySelector("#suggestion-carry p").innerText = current.weather[0].main === "Rain" ? "Umbrella" : "Sunglasses";
    document.querySelector("#suggestion-mood p").innerText = "Chilled";
}

function renderForecast(list) {
    const container = document.getElementById("forecast-cards");
    container.innerHTML = "";

    // Open-Meteo provides daily data directly, so no need to filter by "12:00"
    const daily = list.length > 7 ? list.filter(item => item.dt_txt.includes("12:00:00")) : list;

    daily.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const weatherInfo = item.weather[0];
        const icon = weatherInfo.icon || "fa-cloud";

        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
            <div class="day">${dayName}</div>
            <i class="fa-solid ${icon}"></i>
            <div class="temp">${Math.round(item.main.temp)}°C</div>
            <div class="desc">${weatherInfo.main}</div>
        `;
        container.appendChild(card);
    });

    calculateAverageTemp(daily);
}

function calculateAverageTemp(data) {
    if (data.length === 0) return;
    const avg = data.reduce((acc, curr) => acc + curr.main.temp, 0) / data.length;
    document.getElementById("avg-temp").innerText = `Avg: ${Math.round(avg)}°C`;
}

/* --- UI Interactions --- */

sendBtn.addEventListener("click", () => {
    const msg = chatInput.value;
    if (msg) {
        getBotResponse(msg);
        chatInput.value = "";
    }
});

chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
});

citySearchBtn.addEventListener("click", () => {
    const city = citySearchInput.value;
    if (city) updateAllWeather(city);
});

citySearchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") citySearchBtn.click();
});

myLocationBtn.addEventListener("click", () => {
    getUserLocation();
    searchOverlay.classList.add("hidden");
});

closeSearch.addEventListener("click", () => {
    searchOverlay.classList.add("hidden");
});

document.querySelectorAll(".glass-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        if (action === "search") {
            searchOverlay.classList.remove("hidden");
            citySearchInput.focus();
            searchError.classList.add("hidden");
        }
        if (action === "forecast") {
            forecastOverlay.classList.remove("hidden");
        }
        if (action === "style") {
            smartPanel.classList.toggle("hidden");
        }
    });
});

document.querySelector(".close-forecast").addEventListener("click", () => {
    forecastOverlay.classList.add("hidden");
});

document.getElementById("filter-rainy").addEventListener("click", () => {
    const rainy = forecastData.filter(item => item.weather[0].main === "Rain");
    renderForecast(rainy.length > 0 ? rainy : forecastData);
});

document.getElementById("sort-temp").addEventListener("click", () => {
    const sorted = [...forecastData].sort((a, b) => b.main.temp - a.main.temp);
    renderForecast(sorted);
});

/* --- Visual Effects --- */

function updateBackground(temp, weatherObj) {
    const overlay = document.getElementById("bg-overlay");
    if (!overlay) return;

    // Remove old classes
    overlay.className = "";

    // Add new class based on weather condition
    const weatherClass = weatherObj.class || "cloudy";
    overlay.classList.add(weatherClass);

    // Apply temperature-based tint (subtle)
    let color = "rgba(0,0,0,0)";
    if (temp < 10) color = "rgba(0, 150, 255, 0.1)";
    else if (temp > 25) color = "rgba(255, 100, 0, 0.1)";

    overlay.style.backgroundColor = color;
    overlay.style.background = ""; // clear gradient
}

function updateDayNightMode(sys) {
    const now = Date.now() / 1000;
    const isNight = now < sys.sunrise || now > sys.sunset;
    if (isNight) document.body.classList.add("night-mode");
    else document.body.classList.remove("night-mode");
}

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                fetchByCoords(pos.coords.latitude, pos.coords.longitude);
            },
            () => { updateAllWeather("Lucknow"); }
        );
    }
}

async function fetchByCoords(lat, lon) {
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const data = await weatherRes.json();

        // Use reverse geocoding or just generic name
        const currentData = {
            name: "Your Location",
            main: {
                temp: data.current.temperature_2m,
                feels_like: data.current.apparent_temperature,
                humidity: data.current.relative_humidity_2m
            },
            wind: { speed: data.current.wind_speed_10m },
            weather: [WMO_MAPPING[data.current.weather_code] || { main: "Clouds", icon: "fa-cloud", class: "cloudy" }]
        };

        updateUI(currentData);

        forecastData = data.daily.time.map((time, i) => ({
            dt: new Date(time).getTime() / 1000,
            main: { temp: (data.daily.temperature_2m_max[i] + data.daily.temperature_2m_min[i]) / 2 },
            weather: [WMO_MAPPING[data.daily.weather_code[i]] || { main: "Clouds", icon: "fa-cloud", class: "cloudy" }],
            dt_txt: time
        }));

        renderForecast(forecastData);
        concludeSmartFeatures(currentData, forecastData);
    } catch (err) {
        updateAllWeather("Lucknow");
    }
}

getUserLocation();

// Hover effect from existing code
document.querySelectorAll(".glass-btn").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        btn.style.transform = `perspective(500px) rotateX(${(y - rect.height / 2) / 10}deg) rotateY(${-(x - rect.width / 2) / 10}deg) scale(1.05)`;
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.transform = "scale(1)";
    });
});