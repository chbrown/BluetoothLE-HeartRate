const noble = require('noble')

/**
Ensure that noble is ready, then scan for peripherals implementing the given service UUIDs.

@param {string[]} serviceUUIDs - Array of service UUIDs to search for
@param {string} state - Current noble.state
@param {function} callback - Callback taking arguments: (error, peripheral)
*/
function findFirstPeripheral(serviceUUIDs, state, callback) {
  //console.error('noble.state:', state)
  // the state has to be 'poweredOn' before we start scanning (IDK why)
  if (state != 'poweredOn') {
    // listening for the stateChange event is enough to trigger it
    return noble.once('stateChange', state => findFirstPeripheral(serviceUUIDs, state, callback))
  }
  //console.error('scanning for:', serviceUUIDs)
  // set up scanning listener
  noble.on('discover', peripheral => {
    // as soon as the first peripheral is discovered, stop scanning
    noble.stopScanning()
    callback(null, peripheral)
  })
  // the second argument to startScanning, allowDuplicates, defaults to false
  // the third argument, the callback, is only called if noble is not in the
  // right state, but not if xpc fails for any other reason, so it's not very useful.
  noble.startScanning(serviceUUIDs, false, err => {
    if (err) return callback(err)
  })
}

/**
Find the first matching peripheral, connect to it, discover the matching service
& characteristic UUIDs, and callback with the first characteristic found.

@param {string[]} serviceUUIDs - Array of service UUIDs to search for and filter by
@param {string[]} characteristicUUIDs - Array of characteristic UUIDs to filter by
@param {function} callback - Callback taking arguments: (error, characteristics)
*/
function findCharacteristics(serviceUUIDs, characteristicUUIDs, callback) {
  findFirstPeripheral(serviceUUIDs, noble.state, (err, peripheral) => {
    if (err) return callback(err)
    // connect to the first found peripheral
    peripheral.connect(err => {
      if (err) return callback(err)
      peripheral.discoverSomeServicesAndCharacteristics(serviceUUIDs, characteristicUUIDs, (err, services, characteristics) => {
        //console.error('discovered characteristics:', characteristics)
        // just ignore the services
        callback(err, characteristics)
      })
    })
  })
}

const sampleCorrection = 1000.0 / 1024.0 // = 0.9765625

/**
Parse the raw bytes representing data according to the
Bluetooth LE "Heart Rate Measurement" characteristic specification.

@param {Buffer} data - buffer emitted by the characteristic's 'data' event.
*/
function parseHeartRateData(data) {
  let cursor = 0
  function readNext(byteLength) {
    const value = (byteLength > 0) ? data.readUIntLE(cursor, byteLength) : undefined
    cursor += byteLength
    return value
  }
  // the first byte of data is the mandatory "Flags" value,
  // which indicates how to read the rest of the data buffer.
  const flags = readNext(1)
  // 0b00010110
  //          ^ 0 => Heart Rate Value Format is set to UINT8. Units: beats per minute (bpm)
  //            1 => Heart Rate Value Format is set to UINT16. Units: beats per minute (bpm)
  //        ^^ 00 or 01 => Sensor Contact feature is not supported in the current connection
  //           10       => Sensor Contact feature is supported, but contact is not detected
  //           11       => Sensor Contact feature is supported and contact is detected
  //       ^ 0 => Energy Expended field is not present
  //         1 => Energy Expended field is present (units are kilo Joules)
  //      ^ 0 => RR-Interval values are not present
  //        1 => One or more RR-Interval values are present
  //   ^^^ Reserved for future use
  const valueFormat =          (flags >> 0) & 0b01
  const sensorContactStatus =  (flags >> 1) & 0b11
  const energyExpendedStatus = (flags >> 3) & 0b01
  const rrIntervalStatus =     (flags >> 4) & 0b01

  const bpm = readNext(valueFormat === 0 ? 1 : 2)
  const sensor = (sensorContactStatus === 2) ? 'no contact' : ((sensorContactStatus === 3) ? 'contact' : 'N/A')
  const energyExpended = readNext(energyExpendedStatus === 1 ? 2 : 0)
  const rrSample = readNext(rrIntervalStatus === 1 ? 2 : 0)
  // RR-Interval is provided with "Resolution of 1/1024 second"
  const rr = rrSample && (rrSample * sampleCorrection) | 0
  return {bpm, sensor, energyExpended, rr}
}

module.exports = {findCharacteristics, parseHeartRateData}
