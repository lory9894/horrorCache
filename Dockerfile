FROM python:3.10
LABEL authors="lorenzo"

ADD app app
WORKDIR app

RUN pip install -r requirements.txt

EXPOSE 8000

ENTRYPOINT ["gunicorn", "-w", "4", "-b", "0.0.0.0", "--certfile", "/etc/letsencrypt/live/lorenzodentis.ddns.net/fullchain.pem", "--keyfile","/etc/letsencrypt/live/lorenzodentis.ddns.net/privkey.pem", "app:app"]
