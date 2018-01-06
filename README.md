# BluetoothLE-HeartRate

`bluetoothle-heartrate` is a Node.js package that listens for heart rate data
from a [Polar H7](https://web.archive.org/web/20160929093756/https://developer.polar.com/wiki/H6_and_H7_Heart_rate_sensors) Bluetooth Low Energy (BLE) heart rate sensor
(using [`noble`](https://github.com/sandeepmistry/noble), a popular **No**de.js library for connecting to **BLE** devices),
formats the data as JSON or InfluxDB's Line Protocol, and writes it to `/dev/stdout`.

`index.js` is loosely derived from [@jakelear/node-h7-hr](https://github.com/jakelear/node-h7-hr) but is now pretty much a rewrite.
I split up functions where it seemed logical, improved error/bounds-checking, and added lots more commentary.


## Instructions

* Clone this repo: `git clone https://github.com/chbrown/BluetoothLE-HeartRate`
* Attach the Polar H7 to its strap and put it on.
* Ensure no other applications or devices are connected (listening) to the Polar H7.
* Run `npm install`, then `node server.js` (or `npm start`, which relies on the default npm script to do the same thing).

Alternatively, the main function in `server.js` checks for a `--json` argument, so run `node server.js --json` to get (line-delimited) JSON output.

This library was developed for the Polar H7 specifically,
but should work with other BLE devices that use the service `180d` and the characteristic `2a37`
(see the [references](#resources-and-references) for links to the official Bluetooth specifications for these identifiers).


### Debugging

On macOS, you can run `system_profiler SPBluetoothDataType` to list the currently paired/configured Bluetooth devices.
For example, while the `node server.js` process is running, that command outputs this on my machine:

    Bluetooth:

          Apple Bluetooth Software Version: 5.0.5f1
          [...]
          Devices (Paired, Configured, etc.):
              [...]
              Polar H7 2A61B41A:
                  Address: 00-22-D0-2A-61-B4
                  Random Address: No
                  Services:
                  Paired: No
                  Configured: No
                  Connected: Yes
                  Class of Device: Low Energy
                  AFH: On
                  AFH Map: ffffffff1f
                  RSSI: -53
                  Role: Central
                  Connection Mode: Active Mode
                  Interval: 0 ms
              [...]


## Resources and references

* Introduction to Core Bluetooth: Building a Heart Rate Monitor:
  <http://www.raywenderlich.com/52080/introduction-core-bluetooth-building-heart-rate-monitor>
  - 2013 article using Objective-C and iOS's CoreBluetooth to build (in Xcode 5) an iPhone app (on iOS 7) to monitor heart rate.
* Apple Developer - Guides and Sample Code: CoreBluetooth Heart Rate Monitor:
  <https://developer.apple.com/library/content/samplecode/HeartRateMonitor/Introduction/Intro.html>
  - 2011 sample app demonstrating using Objective-C to monitor heart rate on Mac OS X 10.7.2 Lion or later
* [`noble` npm package](https://www.npmjs.com/package/noble)
* Service `0x180D` ("Heart Rate"):
  <https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.service.heart_rate.xml>
* Characteristic `0x2A37` ("Heart Rate Measurement"):
  <https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.heart_rate_measurement.xml>


## License

Copyright 2018 Christopher Brown.
[MIT Licensed](https://chbrown.github.io/licenses/MIT/#2018).
