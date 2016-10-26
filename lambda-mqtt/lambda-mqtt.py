#!/usr/bin/python

"""
The MIT License (MIT)
Copyright (c) 2016 jagsta
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
"""
import os
import json
import paho.mqtt.client as mqtt
import ssl
from yaep import populate_env
from yaep import env

ENV_FILE = os.path.join(os.path.dirname(__file__), ".env")

response=''

def setup_env():
  os.environ['ENV_FILE'] = ENV_FILE
  populate_env()

def verify_appid(appid=None):
  if appid != env('SKILL_APPID'):
    raise ValueError("Invalid Application ID")

def on_message(client, userdata, msg):
  global response
  response = msg.payload
  print("response received: " +str(json.loads(response)))
  client.disconnect()

def on_session_started(session_started_request, session):
  print("on_session_started: requestId=" + session_started_request['requestId'] + ", sessionId=" + session['sessionId'])

def lambda_handler(event, context):
  appid = event['session']['application']['applicationId']
  print("lambda_handler: applicationId=" + appid)
  print("event: " +json.dumps(event))

  setup_env()

  verify_appid(appid)

  if event['session']['new']:
    on_session_started({'requestId': event['request']['requestId']}, event['session'])
  
  CLIENTID = os.getenv('MQTT_CLIENTID', 'clientid')
  PORT = os.getenv('MQTT_PORT', '8883')
  USER = os.getenv('MQTT_USER', 'user')
  PASS = os.getenv('MQTT_PASSWORD', 'pass')
  MQTT = os.getenv('MQTT_ADDRESS', '127.0.0.1')
  PUB = os.getenv('MQTT_PUBTOPIC', 'mypubtopic')
  SUB = os.getenv('MQTT_SUBTOPIC', 'mysubtopic')
  CAFILE = os.getenv('MQTT_CAFILE', 'ca.pem')

  client = mqtt.Client(CLIENTID)
  client.username_pw_set(USER, PASS)
  client.tls_set(CAFILE, certfile=None, keyfile=None, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2)
  client.on_message = on_message
  client.connect(MQTT, PORT, 60)
  client.subscribe(SUB, qos=0)
  client.publish(PUB, json.dumps(event))
  print("published event, waiting on response")
  client.loop_forever()
  return json.loads(response)
