#!/usr/bin/env nodejs

/*
The MIT License (MIT)
Copyright (c) 2015 Maker Musings && m0ngr31
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
*/


var posix = require('posix');
var argv = require('yargs').argv;
var http = require('http');
var fs    = require('fs'),
    nconf = require('nconf');
var request = require('request');

nconf.argv().file({ file: '/usr/local/etc/alexa-mqtt-proxy.json' })
nconf.defaults({
  "secure":"true",
  "user":"mqttuser",
  "pass":"mqttpass",
  "host":"mqtthost",
  "port":"1883",
  "cid":"clientid",
  "khost":"127.0.0.1",
  "kport":"80",
  "kuser":"user",
  "kpass":"pass",
  "kpath":"/",
  "subtopic":"request_topic",
  "pubtopic":"response_topic"
})

var syslogMsg ="";
posix.openlog('alexa-mqtt-proxy.js', { cons: false, ndelay:true, pid:true }, 'local0');
  

if (nconf.get('secure') == 'true') { 
  var connectstring = 'mqtts://';
} 
else {
  var connectstring = 'mqtt://';
}

connectstring = connectstring + nconf.get('user') + ':' + nconf.get('pass') + '@' + nconf.get('host') + ':' + nconf.get('port') + '?clientId=' + nconf.get('cid')

var mqtt = require('mqtt');
var client = mqtt.connect(connectstring);
posix.syslog('debug','Connecting with: ' +connectstring);

var publish_topic = nconf.get('pubtopic')
var subscribe_topic = nconf.get('subtopic').split(",")

var kodiHost = nconf.get('khost')
var kodiPort = nconf.get('kport')
var kodiUser = nconf.get('kuser')
var kodiPass = nconf.get('kpass')
var kodiPath = nconf.get('kpath')

var requestStub = 'http://' + kodiHost + ':' + kodiPort + kodiPath

client.on('connect', function () {
  client.subscribe(subscribe_topic, function(err, granted) {
    posix.syslog('debug','subscribed with response error: ' +err +' granted: ' +granted)
  })
})
if (Array.isArray(subscribe_topic)) { 
  posix.syslog('debug','subscribing to topics: ' +subscribe_topic);
}
else {
  posix.syslog('debug','subscribing to topic: ' +subscribe_topic);
}
posix.syslog('debug','publishing to topic: ' +publish_topic);

var options = {
  url: requestStub,
  headers: {
    'Content-Type': 'application/json'
  }
};


client.on('message', function(topic, message) {
  posix.syslog('info','Received message, topic: ' + topic + ' message: ' + message);
  posix.syslog('debug',requestStub)
  request({
    url: requestStub,
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: message
}, parseResponse);
});

function parseResponse(error, response, body) {
  if (!error && response.statusCode == 200) {
    client.publish(publish_topic, body);
    posix.syslog('info','good reply, ' +JSON.stringify(body));
  }
  else {
    posix.syslog('info','bad reply, status: ' +response.statusCode +' error: ' +error);
  }
}
