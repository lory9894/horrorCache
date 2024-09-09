const options = {
  enableHighAccuracy: true,
  timeout: 60000,
  maximumAge: 0
};
let intervalId = null;
const isIOS = (
  navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
  navigator.userAgent.match(/AppleWebKit/)
);


let targetCoordinates = { lat: 40.95337 , lon: 9.56702 }; // Target coordinates todo:esempio
let positionHandler = null
let angle =0;

window.onload = function() {
    let promises = [];
    $('#btn').click(function() {
        var alt_audio = document.getElementById('alt_audio');
        alt_audio.innerText = "ricerco trasmissioni"
        alt_audio.hidden = false;
        promises.push(getPosition());
        Promise.all(promises).then(function(values) {
            sendCoord(values[0]);
        });
        startCompass()
        // todo :debug per la bussola
        updateSignalAndDirection();
        if (intervalId != null) {
            clearInterval(intervalId);
        }
        intervalId = setInterval(updateSignalAndDirection, 5000);
    });
}

function error(err) {
  console.error(`ERROR(${err.code}): ${err.message}`);
}

function startCompass() {
  if (isIOS) {
    DeviceOrientationEvent.requestPermission()
      .then((response) => {
        if (response === "granted") {
          window.addEventListener("deviceorientation", compass_handler, true);
        } else {
          alert("has to be allowed!");
        }
      })
      .catch(() => alert("not supported"));
  } else {
    window.addEventListener("deviceorientation", compass_handler, true);
  }
}

function compass_handler(e) {
  heading = e.webkitCompassHeading || Math.abs(e.alpha - 360);
  const arrow = $('#arrow')[0];
  const direction =angle-heading;
  //console.log(`angle= ${angle}, heading= ${heading}, direction= ${direction}`)
  arrow.style.transform = `rotate(${direction}deg)`;
}

function getPosition() {
    return new Promise(function(resolve, reject) {
        navigator.geolocation.getCurrentPosition(resolve, reject, options)
    });
}

function sendCoord(position) {
    let positionData = position.coords;
    console.log(positionData)
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
        var audioElemet = document.getElementById('audio')
        audioElemet.hidden = true;
        alt_audio.hidden = false;
        if (data.error_message === 'time') {
            alt_audio.innerText = "non è ancora buio"
        } else if (data.error_message === 'location') {
            alt_audio.innerText = "nessuna trasmissione trovata nelle vicinanze"
        } else if (data.error_message === 'generic'){
            alt_audio.innerText = "trasmissione individuata, avvicinarsi"
            targetCoordinates = { lat: data.coords[0], lon: data.coords[1]}
            if (positionHandler != null) {
                navigator.geolocation.clearWatch(positionHandler)
            }
            positionHandler = navigator.geolocation.watchPosition(function (position) {
                updateSignalAndDirection(position)
        }, error, options);
        }
    }
}

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
            angle = calculateAngle({lat: values[0].coords.latitude, lon: values[0].coords.longitude}, targetCoordinates);
            updateSignalStrength(distance);
            var audioElemet = document.getElementById('audio')

            if (distance <= 5 && audioElemet.hidden === true) { // 5 metri, solo se non è già in riproduzione
                navigator.geolocation.clearWatch(positionHandler)
                let promises = [];
                promises.push(getPosition());
                Promise.all(promises).then(function (values) {
                    sendCoord(values[0]);
                });
            }


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