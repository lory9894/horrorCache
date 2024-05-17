const options = {
  enableHighAccuracy: true,
  timeout: 60000,
  maximumAge: 0
};

window.onload = function() {
    let promises = [];
    $('#btn').click(function() {
        var alt_audio = document.getElementById('alt_audio');
        alt_audio.innerText = "ricerco trasmissioni"
        alt_audio.hidden = false;
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