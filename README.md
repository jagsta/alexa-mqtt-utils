# alexa-mqtt-utils
Lambda function and node.js proxy for getting Amazon Alexa requests to/from you local network via MQTT

Alexa Custom Skills are a great way to integrate Amazon's Alexa voice recognition with your own software or home automation, 
the problem is custom Alexa skills need to be reachable from Alexa, and therefore from the internet. 
If your skill interfaces wth other cloud hosted or internet facing systems, it's not so much of a problem, 
but if you want to drive your home automation, control Kodi, or interact with anything on your local LAN then it's undesirable.

These utility scripts can be used help mitigate the risk of interacting with Alexa

# lambda-mqtt
is a python script which when run in Amazon Lambda can be used as the endpoint for your custom skill.
It will verify the request is from the Alexa application you expect, and post the JSON request untouched to an MQTT message queue.
It will listen to another MQTT message queue for a response, and pass this back to Alexa

# alexa-mqtt-proxy
is a node.js script which you run as a service on your local network. It can connect to the same MQTT message queues
you configured lambda-mqtt to use. 
When lambda-mqtt publishes an Alexa JSON request, it will read this from the message queue and proxy it to an HTTP listener as the body of a POST request. 
When the response is received from the HTTP listener it will publish this message on the queue specified, allowing lambda-mqtt to return this to Alexa.

Obviously the magic of a custom skill is what you do with the Alexa Intents, Utterances and the code to act on those. These scripts do none of that!
