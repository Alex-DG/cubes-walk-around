import LocalCoordSystem from './localCoordSystem'

const DEFAULT_F = 1000 // ms

class Device_Geo_Location {
  init({ createWorldObjects, camera, updateWorld }) {
    this.updateWorld = updateWorld
    this.createWorldObjects = createWorldObjects
    this.camera = camera

    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    const fParams = urlParams.get('f')
    this.frequency = fParams ? Number(fParams) : DEFAULT_F

    // Dom
    this.speedDom = document.getElementById('val1')

    this.isInit = false
    this.isWorking = false
    this.initCoords = undefined
    this.watchID = undefined
    this.speed = 0
    this.geoLoc = navigator.geolocation
    this.options = {
      enableHighAccuracy: true,
      timeout: this.frequency - 100,
      maximumAge: 0,
    }

    console.log('Device_Geo_Location', this.options)

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
    if (this.speedDom) {
      const s = this.speed || 0
      this.speedDom.innerText = `speed: ${s.toFixed(4)}m/s`
    }
  }

  watchPositionUpdate({ coords: { longitude, latitude, speed } }) {
    this.speed = speed

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
  }

  bind() {
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
