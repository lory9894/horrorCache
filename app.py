import base64
import math
import os
from datetime import datetime
from flask import Flask, request, render_template, session
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

@app.route('/chatgpt')
def chatgpt():
    return render_template('chatgpt.html')

def get_audio(audio_id):
    audio = ""
    with app.open_resource(f"static/audio/{audio_id}.mp3", "rb") as file:
        audio = base64.b64encode(file.read())
    return str(audio)[2:-1]  # remove b' and '


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
        response['error_message'] = 'time'
        response['audio'] = None
        response['coord'] = None
        return response

    are_coords_ok, are_coords_near, id_or_coord = check_coordinates((float(lat), float(long)))

    if are_coords_ok is False:
        response['error'] = 'True'
        response['audio'] = None
        if are_coords_near:
            response['error_message'] = 'generic'
            response['coords'] = id_or_coord
        else:
            response['error_message'] = 'location'
            response['coords'] = None
        return response

    #not error
    response['error'] = 'False'
    response['error_message'] = ''

    response['audio'] = get_audio(id_or_coord)

    '''token implementation
    token = os.urandom(24).hex()
    session[response['audio']] = token
    response['token'] = token
    print(f"Token: {token}")
    '''

    return response


def check_time():
    update_sun_times()
    global sunrise, sunset
    time = datetime.now().time().replace(microsecond=0)

    print(f"Time: {time}, Sunrise: {sunrise}, Sunset: {sunset}")
    print()

    #return time > sunset or time < sunrise
    return True  #testing


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
    waypoints = [(40.95337 , 9.56702), (45.0806526, 7.5117741), (45.0806526, 7.5117741)]

    for i in range(len(waypoints)):
        if check_distance_audio(user_coord, waypoints[i]):
            return True, True, f"audio_{i+1}"

    for i in range(len(waypoints)):
        if check_distance_coord(user_coord, waypoints[i]):
            return False, True, waypoints[i]


    return False, False, "audio_error"


def check_distance_audio(user_coord, wp_coord):
    max_distance = 0.00005 # 5m
    distance = math.sqrt((user_coord[0] - wp_coord[0]) ** 2 + (user_coord[1] - wp_coord[1]) ** 2)
    print(distance)
    return distance < max_distance

def check_distance_coord(user_coord, wp_coord):
    max_distance = 0.001 #100m
    distance = math.sqrt((user_coord[0] - wp_coord[0]) ** 2 + (user_coord[1] - wp_coord[1]) ** 2)
    print(distance)
    return distance < max_distance

'''token implementation
@app.route('/audio/<audioID>', methods=['GET'])
def download_audio():
    token = request.args.get('token')
    print(f"Token: {token}")
'''


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, ssl_context='adhoc')
