import base64
from datetime import datetime

from flask import Flask, request, g, render_template, url_for
from flask_cors import CORS
import requests

app = Flask(__name__, static_url_path='/static')
CORS(app, resources={r"/*": {"origins": "*"}})
global sunset, sunrise, last_update
sunrise = datetime.strptime("06:00:00", "%H:%M:%S").time()
sunset = datetime.strptime("20:00:00", "%H:%M:%S").time()
last_update = datetime.strptime("00:00:00", "%H:%M:%S").date()


@app.route('/')
def index():  # put application's code here
    update_sun_times()
    return render_template('index.html')


def get_audio(audio_id):
    audio = ""
    with app.open_resource(f"static/audio/{audio_id}.mp3", "rb") as file:
        audio = base64.b64encode(file.read())
    return str(audio)[2:-1] # remove b' and '


@app.route('/location', methods=['POST', 'GET'])
def get_location():
    lat = request.args.get('lat')
    long = request.args.get('long')
    if lat is None or long is None:
        return 'Invalid request'
    response = {
        'lat': lat,
        'long': long,
    }

    if check_time() is False:
        response['error'] = 'True'
        response['error_message'] = 'not the right time'
        response['audio'] = None
        return response

    are_coords_ok,audio_id  = check_coordinates((lat, long))

    if are_coords_ok is False:
        response['error'] = 'True'
        response['error_message'] = 'not the right place'
        response['audio'] = None
        return response

    response['error'] = 'False'
    response['error_message'] = ''


    response['audio'] = get_audio(audio_id)


    return response


def check_time():
    update_sun_times()
    global sunrise, sunset
    time = datetime.now().time().replace(microsecond=0)

    print(f"Time: {time}, Sunrise: {sunrise}, Sunset: {sunset}")
    print()

    #return time > sunset or time < sunrise
    return True #testing

def update_sun_times():
    global sunrise, sunset, last_update
    today = datetime.now().date()
    if today > last_update:
        response = requests.get('https://api.sunrisesunset.io/json?lat=45.00000&lng=007.00000')
        sunrise = response.json()['results']['sunrise']
        sunrise = datetime.strptime(sunrise, "%I:%M:%S %p").time()
        sunset = response.json()['results']['sunset']
        sunset = datetime.strptime(sunset, "%I:%M:%S %p").time()
        # americani del cazzo, ma vi pare che sunset possa essere AM?
        sunset = sunset.replace(hour=sunset.hour + 1)
        # un'ora dopo il tramonto, deve essere buio
        last_update = today

def check_coordinates(user_coord):
    wp1 = ( 0, 0)
    return True, "example_long"


@app.route('/audio/<audioID>', methods=['GET'])
def download_audio():
    return render_template('index.html')





if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, ssl_context='adhoc')