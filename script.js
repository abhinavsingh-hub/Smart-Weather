import { Application } from '@splinetool/runtime';

// Use environment variables or global constants
const API_KEY = import.meta.env.VITE_API_KEY || "";
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN || "";

const canvas = document.getElementById('canvas3d');
const app = new Application(canvas);

app.load('./r_4_x_bot.splinecode')
    .then(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
        console.log('Spline scene loaded!');
    });

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

function showBubble(text) {
    aiResponse.innerText = text;
    aiBubble.classList.remove("hidden");
}

/* --- Weather Logic --- */

async function updateAllWeather(city) {
    if (!city || !city.trim()) return;
    searchError.classList.add("hidden");

    try {
        const currentRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.trim())}&appid=${API_KEY}&units=metric`
        );
        const currentData = await currentRes.json();

        if (currentRes.status !== 200) {
            searchError.innerText = `City not found: "${city}"`;
            searchError.classList.remove("hidden");
            return;
        }

        updateUI(currentData);

        const forecastRes = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city.trim())}&appid=${API_KEY}&units=metric`
        );
        const data = await forecastRes.json();
        forecastData = data.list;
        renderForecast(forecastData);
        concludeSmartFeatures(currentData, forecastData);
        searchOverlay.classList.add("hidden");
    } catch (err) {
        searchError.innerText = "Network error. Try again.";
        searchError.classList.remove("hidden");
    }
}

function updateUI(data) {
    if (!data.main) return;

    const weather = data.weather[0].main;
    document.getElementById("city").innerText = data.name;
    document.getElementById("temp").innerText = `${Math.round(data.main.temp)}°C`;
    document.getElementById("condition").innerText = weather;

    document.getElementById("feels").innerText = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById("humidity").innerText = `${data.main.humidity}%`;
    document.getElementById("wind").innerText = `${data.wind.speed} m/s`;

    const icon = weatherIcons[weather] || "fa-cloud";
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

    const daily = list.filter(item => item.dt_txt.includes("12:00:00"));

    daily.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const icon = weatherIcons[item.weather[0].main] || "fa-cloud";

        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
            <div class="day">${dayName}</div>
            <i class="fa-solid ${icon}"></i>
            <div class="temp">${Math.round(item.main.temp)}°C</div>
            <div class="desc">${item.weather[0].main}</div>
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

function updateBackground(temp, weather) {
    const overlay = document.getElementById("bg-overlay");
    let color = "rgba(0,0,0,0)";
    if (temp < 10) color = "rgba(0, 150, 255, 0.2)";
    else if (temp > 25) color = "rgba(255, 100, 0, 0.2)";
    else color = "rgba(100, 255, 100, 0.1)";

    const themes = {
        Clear: "radial-gradient(circle at center, rgba(255,200,0,0.15), transparent 70%)",
        Clouds: "radial-gradient(circle, rgba(200,200,200,0.1), transparent 70%)",
        Rain: "radial-gradient(circle, rgba(0,100,255,0.2), transparent 70%)",
    };

    const gradient = themes[weather] || "transparent";
    overlay.style.background = `${color}, ${gradient}`;
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
    const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await res.json();
    updateAllWeather(data.name);
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