import { Application } from '@splinetool/runtime';

// Elements
const canvas = document.getElementById('canvas3d');
const loader = document.getElementById('loader');
const tempEl = document.getElementById('temp');
const conditionEl = document.getElementById('condition-text');
const waveBtn = document.getElementById('wave-btn');
const rotateBtn = document.getElementById('rotate-btn');
const resetBtn = document.getElementById('reset-btn');

// Start Spline Application
const app = new Application(canvas);

// Bot Object Placeholder
let botObject = null;

// Initialize the 3D scene
async function initApp() {
    try {
        // Load the .spline file
        await app.load('./r_4_x_bot.spline');
        console.log('Spline scene successfully loaded.');

        // Hide Loader
        loader.classList.add('fade-out');

        // Help the user identify objects in their scene
        const allObjects = app.getAllObjects();
        console.log('--- Objects Available in Scene ---');
        allObjects.forEach(obj => {
            console.log(`Object Name: "${obj.name}" | Type: ${obj.type}`);
        });

        // Attempt to find the main bot object (based on common names)
        // Adjust these names if they are different in your Spline file
        botObject = app.findObjectByName('Bot') || app.findObjectByName('Group') || allObjects[0];

        if (botObject) {
            console.log(`Main Bot Target Selected: "${botObject.name}"`);
            setupInteractions();
        }

    } catch (error) {
        console.error('Failed to load Spline scene:', error);
        loader.innerHTML = `<p style="color:red">Error: Failed to load 3D scene. Ensure the .spline file is in the root directory.</p>`;
    }
}

function setupInteractions() {
    // Example: Edit the bot via code on button click
    waveBtn.addEventListener('click', () => {
        if (!botObject) return;

        // Shake animation using code
        const startY = botObject.rotation.y;
        let t = 0;
        const animate = () => {
            if (t > Math.PI * 4) {
                botObject.rotation.y = startY;
                return;
            }
            botObject.rotation.y = startY + Math.sin(t) * 0.3;
            t += 0.15;
            requestAnimationFrame(animate);
        };
        animate();
    });

    rotateBtn.addEventListener('click', () => {
        if (!botObject) return;
        botObject.rotation.y += Math.PI / 4;
    });

    resetBtn.addEventListener('click', () => {
        if (!botObject) return;
        botObject.rotation.x = 0;
        botObject.rotation.y = 0;
        botObject.rotation.z = 0;
        botObject.position.x = 0;
        botObject.position.y = 0;
        botObject.position.z = 0;
    });
}

// Simple Weather Data Fetching Simulation
function updateWeather() {
    // We can simulate updating the UI based on 3D interactions
    // or external data.
    const temperatures = [22, 24, 26, 21, 25];
    const conditions = ["Clear Sky", "Partly Cloudy", "Foggy"];

    // Just a placeholder for now
    setInterval(() => {
        tempEl.textContent = `${temperatures[Math.floor(Math.random() * temperatures.length)]}°C`;
    }, 10000);
}

initApp();
updateWeather();
