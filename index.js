const { exec } = require('child_process')
const fs = require('fs')
const mqtt = require('mqtt')

const configFilePath = './config.json'

function isIPAddressConnected (ip) {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? `ping ${ip} -n 1` : `ping ${ip} -c 1`

    exec(command, (error, stdout, stderr) => {
      if (error) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

async function checkIPAddresses (ipAddresses) {
  const result = {}

  for (const ipAddress of ipAddresses) {
    const { Id, IpAddress } = ipAddress
    const isConnected = await isIPAddressConnected(IpAddress)
    result[Id] = isConnected
  }

  return result
}

async function main () {
  try {
    // Read the configuration file
    const config = JSON.parse(fs.readFileSync(configFilePath))

    // Connect to the MQTT broker
    const { connectUrl, clientId, username, password, topic } = config.MQTTConnection
    const client = mqtt.connect(connectUrl, { clientId, username, password })

    // Check IP addresses and send the result to MQTT every second
    setInterval(async () => {
      const ipAddresses = config.IpAddresses
      const result = await checkIPAddresses(ipAddresses)

      client.publish(topic, JSON.stringify(result))
    }, 1000)
  } catch (error) {
    console.error(error)
  }
}

main()
