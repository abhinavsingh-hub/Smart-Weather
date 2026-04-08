### 🌦️ Smart City Weather Dashboard

### Project Overview
The Smart City Weather Dashboard is an interactive web application that provides real-time weather data along with intelligent lifestyle suggestions.

Unlike traditional weather apps, this dashboard not only shows temperature and forecasts but also gives practical advice such as:
- What to wear 
- What to carry 
- Overall weather mood 

The application focuses on combining data with user experience through dynamic UI and animations.

---

### Objective
The goal of this project is to demonstrate:
- JavaScript fundamentals
- API integration using `fetch`
- Use of array higher-order functions (map, filter, sort, reduce)
- Responsive and dynamic UI design

---

### Public API Used
- OpenWeatherMap API  
  https://openweathermap.org/api

This API provides:
- Current weather data
- 5-day / 3-hour forecast data
- Weather conditions (rain, temperature, humidity, wind, etc.)

---

### Features

### Core Features
- Search weather by city name
- Display current weather conditions
- Show 5-day weather forecast
- Dynamic weather icons

---

### Smart Features
- “What to Wear” suggestions based on temperature
- “What to Carry” suggestions (umbrella, sunscreen, etc.)
- “Weather Mood” system (e.g., Rain → Calm, Sunny → Energetic)
- Feels-like vs actual temperature comparison

---

### Data Handling Features
- Filter forecast (e.g., only rainy days)
- Sort temperatures (ascending/descending)
- Calculate average temperature using `reduce()`

---

### UI & Dynamic Features
- Background color changes based on temperature
- Day/Night mode based on time
- Smooth transitions and animations
- Interactive forecast cards (hover effects)

---

### Advanced Feature
- Detect user's location using Geolocation API
- Automatically load local weather

---

### Additional Features (Planned)
- Save favorite cities using localStorage
- Weather insights (e.g., hottest day, rain alerts)
- Animated weather effects (rain, snow, sun)

---

### Technologies Used
- HTML
- CSS (or Tailwind / Bootstrap)
- JavaScript (Vanilla JS)
- OpenWeatherMap API

---

## Project Structure
project-folder/
│── index.html
│── style.css
│── script.js
│── README.md

---

## How to Run the Project

1. Clone the repository: http://github.com/abhinavsingh-hub/Smart-Weather


2. Open the project folder

3. Open `index.html` in your browser

---

## 🔑 Setup Requirements

- Generate an API key from OpenWeatherMap:
  https://home.openweathermap.org/users/sign_up

- Replace the API key in `script.js`:
```javascript
const API_KEY = "YOUR_API_KEY_HERE";
