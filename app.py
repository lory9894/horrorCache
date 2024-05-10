import base64
from datetime import datetime

from flask import Flask, request, g, render_template, url_for
from flask_cors import CORS
import requests

app = Flask(__name__, static_url_path='/static')
CORS(app, resources={r"/*": {"origins": "*"}})


@app.route('/')
def hello_world():  # put application's code here
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
    response = requests.get('https://worldtimeapi.org/api/ip')
    time = response.json()['datetime'].split("T")[1].split("+")[0].split(".")[0]
    time = datetime.strptime(time, "%H:%M:%S")

    response = requests.get('https://api.sunrisesunset.io/json?lat=45.00000&lng=007.00000')
    sunrise = response.json()['results']['sunrise']
    sunrise = datetime.strptime(sunrise, "%I:%M:%S %p")
    sunset = response.json()['results']['sunset']
    sunset = datetime.strptime(sunset, "%I:%M:%S %p")
    #americani del cazzo, ma vi pare che sunset possa essere AM?

    return time > sunset or time < sunrise

def check_coordinates(user_coord):
    wp1 = ( 0, 0)



    return True, "example_long"



if __name__ == '__main__':
    app.run()
