const {findCharacteristics, parseHeartRateData} = require('.')

const heartRateServiceUUID = '180d'
const heartRateMeasurementCharacteristicUUID = '2a37'

/**
Serialize an HRV data object (with the fields: bpm, sensor, energyExpended, rr)
to line protocol format, for importing into InfluxDB.
*/
function serializeLineProtocol(hrv, date, measurement='heart', device='polarH7') {
  const fields = [`bpm=${hrv.bpm}i`]
  if (hrv.rr !== undefined) {
    fields.push(`rr=${hrv.rr}i`)
  }
  const timestamp = date.getTime()
  return `${measurement},device=${device} ${fields.join(',')} ${timestamp}`
}

/**
Serialize an HRV data object to JSON format.
*/
function serializeJSON(hrv, date) {
  return JSON.stringify({timestamp: date.toISOString(), ...hrv})
}

/**
Start listening for 'Heart Rate Measurement' characteristics emitted by the
first Bluetooth LE peripheral that implements the 'Heart Rate' service.
*/
function main() {
  findCharacteristics([heartRateServiceUUID],
                      [heartRateMeasurementCharacteristicUUID],
                      (err, characteristics) => {
    if (err) throw err

    const first_characteristic = characteristics[0]

    const serialize = process.argv.includes('--json') ? serializeJSON : serializeLineProtocol

    first_characteristic.notify(true, err => {
      if (err) {
        console.error('characteristic.notify error', err)
      }
      first_characteristic.on('data', data => {
        const now = new Date()
        const hrv = parseHeartRateData(data)
        const output = serialize(hrv, now)
        console.log(output)
      })
    })
  })
}

if (require.main === module) {
  main()
}
