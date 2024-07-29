const options = {
  enableHighAccuracy: true,
  timeout: 60000,
  maximumAge: 0
};

const targetCoordinates = { lat: 40.95337 , lon: 9.56702 }; // Target coordinates todo:esempio


window.onload = function() {
    let promises = [];
    $('#btn').click(function() {
        var alt_audio = document.getElementById('alt_audio');
        alt_audio.innerText = "ricerco trasmissioni"
        alt_audio.hidden = false;
        let promises = [];
        updateSignalAndDirection();
        promises.push(getPosition());
        Promise.all(promises).then(function(values) {
            sendCoord(values[0]);
        });
        setInterval(updateSignalAndDirection, 5000);


    });
}

function getPosition() {
    return new Promise(function(resolve, reject) {
        navigator.geolocation.getCurrentPosition(resolve, reject, options)
    });
}

function sendCoord(position) {
    let positionData = position.coords;
    $.ajax({
        url: '/location',
        type: 'GET',
        data: {
            lat: positionData.latitude,
            long: positionData.longitude
        },
        success: response,
    });
}

function response(data) {
    var alt_audio = document.getElementById('alt_audio');
    if (data.error === 'False') {
        var audioElement = document.getElementById('audioSource');
        audioElement.src = "data:audio/mpeg;base64," + data.audio;
        alt_audio.hidden = true;
        document.getElementById('audio').load();
        document.getElementById('audio').hidden = false;
    }
    else {
        if (data.error_message === 'time') {
            alt_audio.innerText = "non è ancora buio"
        } else if (data.error_message === 'location') {
            alt_audio.innerText = "nessuna trasmissione trovata nelle vicinanze"
        }
    }
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
    let promises = [];
    promises.push(getPosition());
    Promise.all(promises).then(function(values) {
            const distance = calculateDistance({lat: values[0].coords.latitude, lon: values[0].coords.longitude }, targetCoordinates) * 100000;
            const angle = calculateAngle({lat: values[0].coords.latitude, lon: values[0].coords.longitude}, targetCoordinates);
            console.log(values[0].coords)
            console.log(distance);

            updateSignalStrength(distance);
            updateDirectionIndicator(angle);

    });

}

function updateSignalStrength(distance) {
    const signalStrengthElement = document.getElementById('signal-strength');
    signalStrengthElement.innerHTML = '';
    const strength = Math.max(0, 100 - distance);

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