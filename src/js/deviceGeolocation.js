import LocalCoordSystem from './localCoordSystem'

import KalmanFilter from 'kalmanjs'

const DEFAULT_F = 1000 // ms

class Device_Geo_Location {
  init({ createWorldObjects, camera, updateWorld }) {
    this.kf = new KalmanFilter()
    this.kfData = []

    this.updateWorld = updateWorld
    this.createWorldObjects = createWorldObjects
    this.camera = camera

    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    const fParams = urlParams.get('f')
    const timeout = fParams ? Number(fParams) : DEFAULT_F

    // Dom
    this.updateDom = document.getElementById('val1') // Frequency defined for every update/interval
    this.speedDom = document.getElementById('val2')
    this.accDom = document.getElementById('val3') // accuracy
    this.latDom = document.getElementById('val4') // latitude
    this.lngDom = document.getElementById('val5') // longitude

    this.isInit = false
    this.isWorking = false
    this.initCoords = undefined
    this.watchID = undefined
    this.speed = 0
    this.accuracy = 0
    this.longitude = 0
    this.latitude = 0
    this.frequency = timeout
    this.geoLoc = navigator.geolocation
    this.options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      // timeout,
    }

    this.bind()
    this.updatePosition()
  }

  watchPositionError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error('User denied the request for Geolocation.')
        break
      case error.POSITION_UNAVAILABLE:
        console.error('Location information is unavailable.')
        break
      case error.TIMEOUT:
        console.error('The request to get user location timed out.')
        break
      case error.UNKNOWN_ERROR:
        console.error('An unknown error occurred.')
        break
    }
  }

  domUpdate() {
    const f = this.frequency || 0
    this.updateDom.innerText = `update: ${f}ms`

    const s = this.speed || 0
    this.speedDom.innerText = `speed: ${s.toFixed(4)}m/s`

    const a = this.accuracy || 0
    this.accDom.innerText = `accuracy: ${a.toFixed(2)}m`

    const lat = this.latitude || 0
    this.latDom.innerText = `lat: ${lat.toFixed(5)}°`

    const lng = this.longitude || 0
    this.lngDom.innerText = `lng: ${lng.toFixed(5)}°`
  }

  watchPositionUpdate(data) {
    console.log({ data })
    console.time('time')
    const {
      coords: { longitude, latitude, speed, accuracy },
    } = data
    this.speed = speed
    this.accuracy = accuracy
    this.longitude = longitude
    this.latitude = latitude

    console.log({ longitude, latitude })

    // First time: store initial coordiantes
    if (!this.initCoords) {
      this.initCoords = {
        longitude,
        latitude,
      }

      LocalCoordSystem.setOrigin(latitude, longitude)
      this.createWorldObjects()
      this.isInit = true
    }

    // Once setup done: keep updating the camera position
    if (this.isInit) {
      LocalCoordSystem.getPosition(this.camera.position, latitude, longitude)
      this.updateWorld()

      // if (this.kfData.length <= 3) {
      //   this.kfData.push({ latitude, longitude })
      // } else {
      //   let lat
      //   let lng

      //   console.log({ data: this.kfData })

      //   this.kfData.forEach((d) => {
      //     lat = this.kf.filter(d.latitude)
      //     lng = this.kf.filter(d.longitude)
      //   })

      //   this.kfData = []

      //   console.log({ lat, lng })

      //   LocalCoordSystem.getPosition(this.camera.position, lat, lng)
      //   this.updateWorld()
      // }
    }

    this.domUpdate()
  }

  updatePosition() {
    const frequency = this.frequency

    console.log('debug - updatePosition()', {
      frequency,
      options: this.options,
    })

    this.interval = setInterval(() => {
      this.watchID = this.geoLoc.getCurrentPosition(
        this.watchPositionUpdate,
        this.watchPositionError,
        this.options
      )
    }, frequency)

    // this.watchID = this.geoLoc.watchPosition(
    //   this.watchPositionUpdate,
    //   this.watchPositionError,
    //   this.options
    // )
  }

  bind() {
    this.domUpdate = this.domUpdate.bind(this)
    this.updatePosition = this.updatePosition.bind(this)
    this.watchPositionUpdate = this.watchPositionUpdate.bind(this)
    this.watchPositionError = this.watchPositionError.bind(this)
    this.domUpdate = this.domUpdate.bind(this)
  }

  dispose() {
    if (this.geoLoc) this.geoLoc.clearWatch(this.watchID)
    if (this.interval) clearInterval(this.interval)
  }

  update() {}
}

const DeviceGeoLocation = new Device_Geo_Location()
export default DeviceGeoLocation
