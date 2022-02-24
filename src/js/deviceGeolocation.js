class Device_Geo_Location {
  init({ createWorldObjects, camera, updateWorld, localCoordSystem }) {
    this.updateWorld = updateWorld
    this.createWorldObjects = createWorldObjects
    this.localCoordSystem = localCoordSystem
    this.camera = camera

    this.isInit = false
    this.initCoords = undefined
    this.watchID = undefined
    this.geoLoc = navigator.geolocation
    this.options = {
      enableHighAccuracy: true,
    }

    this.bind()
    this.start()
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

  watchPositionUpdate({ coords: { longitude, latitude } }) {
    // First time: store initial coordiantes
    if (!this.initCoords) {
      this.initCoords = {
        longitude,
        latitude,
      }

      this.localCoordSystem.setOrigin(latitude, longitude)
      this.createWorldObjects()
      this.isInit = true
    }

    // Once setup done: keep updating the camera position
    if (this.isInit) {
      this.localCoordSystem.getPosition(
        this.camera.position,
        latitude,
        longitude
      )
      this.updateWorld()
    }
  }

  start() {
    console.log('[ START WATCH POSITION ]')
    setInterval(() => {
      this.watchID = this.geoLoc.getCurrentPosition(
        this.watchPositionUpdate,
        this.watchPositionError,
        this.options
      )
    }, 1000)
  }

  bind() {
    this.watchPositionUpdate = this.watchPositionUpdate.bind(this)
    this.watchPositionError = this.watchPositionError.bind(this)
  }

  dispose() {
    this.geoLoc?.clearWatch(this.watchID)
  }
}

const DeviceGeoLocation = new Device_Geo_Location()
export default DeviceGeoLocation
