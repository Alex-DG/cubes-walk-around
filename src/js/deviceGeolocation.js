import LocalCoordSystem from './localCoordSystem'

const FREQUENCY = 500 // ms

class Device_Geo_Location {
  init({ createWorldObjects, camera, updateWorld }) {
    this.updateWorld = updateWorld
    this.createWorldObjects = createWorldObjects
    this.camera = camera

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
    if (this.speedDom && this.speed) {
      this.speedDom.innerText = `speed: ${this.speed.toFixed(4)}m/s`
    }
  }

  watchPositionUpdate({ coords: { longitude, latitude, speed } }) {
    // Only trigger timeout when the previous one is done
    if (!this.isWorking) {
      if (this.timeout) clearTimeout(this.timeout)

      this.isWorking = true

      this.timeout = setTimeout(() => {
        console.log('watchPositionUpdate > update every 500ms')
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
          LocalCoordSystem.getPosition(
            this.camera.position,
            latitude,
            longitude
          )
          this.updateWorld()
        }

        this.domUpdate()

        this.isWorking = false
      }, FREQUENCY)
    }
  }

  updatePosition() {
    this.watchID = this.geoLoc.getCurrentPosition(
      this.watchPositionUpdate,
      this.watchPositionError,
      this.options
    )

    // this.interval = setInterval(() => {
    //   this.watchID = this.geoLoc.getCurrentPosition(
    //     this.watchPositionUpdate,
    //     this.watchPositionError,
    //     this.options
    //   )
    // }, FREQUENCY)
  }

  bind() {
    this.watchPositionUpdate = this.watchPositionUpdate.bind(this)
    this.watchPositionError = this.watchPositionError.bind(this)
    this.domUpdate = this.domUpdate.bind(this)
  }

  dispose() {
    if (this.geoLoc) this.geoLoc.clearWatch(this.watchID)
    if (this.timeout) clearTimeout(this.timeout)
    // clearInterval(this.interval)
  }

  update() {
    this.updatePosition()
  }
}

const DeviceGeoLocation = new Device_Geo_Location()
export default DeviceGeoLocation
