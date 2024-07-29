// Example coordinates
const targetCoordinates = { lat: 40.95337 , lon: 9.56702 }; // Target coordinates


const options = {
  enableHighAccuracy: true,
  timeout: 60000,
  maximumAge: 0
};

window.onload = function() {
    updateSignalAndDirection();
    setInterval(updateSignalAndDirection, 5000);


}

function getPosition() {
    return new Promise(function(resolve, reject) {
        navigator.geolocation.getCurrentPosition(resolve, reject, options)
    });
}
// Function to calculate distance using  formula
function calculateDistance(currentCoords, targetCoords) {
    return Math.sqrt(Math.pow(currentCoords.lat - targetCoords.lat, 2) + Math.pow(currentCoords.lon - targetCoords.lon, 2));
    //Haversine? nah, pitagora, siamo terrapiattisti qui.
}

// Function to calculate angle (bearing) using initial bearing formula
function calculateAngle(currentCoords, targetCoords) {
    const φ1 = currentCoords.lat * Math.PI / 180;
    const φ2 = targetCoords.lat * Math.PI / 180;
    const λ1 = currentCoords.lon * Math.PI / 180;
    const λ2 = targetCoords.lon * Math.PI / 180;

    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);

    const θ = Math.atan2(y, x);
    const bearing = (θ * 180 / Math.PI + 360) % 360; // in degrees
    return bearing;
}

// Simulate updating the signal strength and direction
function updateSignalAndDirection() {
    const currentCoords = { lat: 37.7749, lon: -122.4194 }; // Current coordinates (San Francisco)
    let promises = [];
    promises.push(getPosition());
    Promise.all(promises).then(function(values) {
            const distance = calculateDistance({lat: values[0].coords.latitude, lon: values[0].coords.longitude }, targetCoordinates);
            const angle = calculateAngle({lat: values[0].coords.latitude, lon: values[0].coords.longitude}, targetCoordinates);
            console.log(distance);

            updateSignalStrength(distance);
            updateDirectionIndicator(angle);

    });

}

function updateSignalStrength(distance) {
    const signalStrengthElement = document.getElementById('signal-strength');
    signalStrengthElement.innerHTML = '';
    const strength = Math.max(0, 100 - distance * 1000);

    // Define the colors for the bars from red to green
    const colors = [
        '#ff0000', // Red
        '#ff3300', // Slightly less red
        '#ff6600', // Orange-red
        '#ff9900', // Orange
        '#ffcc00', // Yellow-orange
        '#ffff00', // Yellow
        '#ccff00', // Yellow-green
        '#99ff00', // Light green
        '#66ff00', // Greenish
        '#33ff00'  // Green
    ];

    for (let i = 0; i < 10; i++) {
        const bar = document.createElement('div');
        bar.classList.add('signal-bar');
        if (i < strength / 10) {
            bar.style.backgroundColor = colors[i];
        } else {
            bar.style.backgroundColor = 'transparent';
        }
        signalStrengthElement.appendChild(bar);
    }
}

function updateDirectionIndicator(angle) {
    const arrow = document.getElementById('arrow');
    arrow.style.transform = `rotate(${angle}deg)`;
}
