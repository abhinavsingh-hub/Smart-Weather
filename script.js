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