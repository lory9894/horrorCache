const options = {
  enableHighAccuracy: true,
  timeout: 60000,
  maximumAge: 0
};

window.onload = function() {
    let promises = [];
    $('#btn').click(function() {
        let promises = [];
        promises.push(getPosition());
        Promise.all(promises).then(function(values) {
            sendCoord(values[0]);
        });

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
    if (data.error == 'False') {
        var audioElement = document.getElementById('audioSource');
        audioElement.src = "data:audio/mpeg;base64," + data.audio;
        document.getElementById('audio').load();
        document.getElementById('audio').hidden = false;
    }
    else {
        alert('Error: ' + data.error_message);
    }
}