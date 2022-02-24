import * as THREE from 'three'
import {
  calculateBearingBetweenPoints,
  calculateDistanceBetweenPoints,
  coordsToVector3,
  getRandomCoords,
} from './utils'

import { Text } from 'troika-three-text'

class DeviceOrientationControls {
  geoLoc
  watchID
  currentCoords = { latitude: 0, longitude: 0 }
  previousCoords = undefined
  initCoords = undefined

  enabled = true

  alphaOffsetAngle = 0
  betaOffsetAngle = 0
  gammaOffsetAngle = 0
  screenOrientation = 0

  deviceOrientation

  world = { cubes: [], labels: [] }

  constructor({ camera, world }) {
    this.camera = camera
    this.world = world
    // this.camera.rotation.reorder('YXZ')

    this.bind()
    this.connect()
  }

  bind() {
    this.onScreenOrientationChangeEvent =
      this.onScreenOrientationChangeEvent.bind(this)

    this.onDeviceOrientationChangeEvent =
      this.onDeviceOrientationChangeEvent.bind(this)

    this.onDeviceMotionChangeEvent = this.onDeviceMotionChangeEvent.bind(this)

    // this.onPositionUpdate = this.onPositionUpdate.bind(this)

    // this.watchPositionError = this.watchPositionError.bind(this)
  }

  connect() {
    this.onScreenOrientationChangeEvent() // run once on load

    window.addEventListener(
      'orientationchange',
      this.onScreenOrientationChangeEvent,
      true
    )
    window.addEventListener(
      'deviceorientation',
      this.onDeviceOrientationChangeEvent,
      true
    )
    window.addEventListener(
      'devicemotion',
      this.onDeviceMotionChangeEvent,
      true
    )

    // this.watchPosition()

    this.enabled = true
  }

  /**
   * GYRO FUNCTIONS
   */
  onDeviceMotionChangeEvent(event) {
    this.accelerationX = event.acceleration?.x || 0
    this.accelerationY = event.acceleration?.y || 0
    this.accelerationZ = event.acceleration?.z || 0
    this.rotationGamma = event.rotationRate?.gamma || 0
  }

  onDeviceOrientationChangeEvent(event) {
    this.deviceOrientation = event
  }

  onScreenOrientationChangeEvent() {
    this.screenOrientation = window.orientation || 0
  }

  setObjectQuaternion = (function () {
    const zee = new THREE.Vector3(0, 0, 1)
    const euler = new THREE.Euler()
    const q0 = new THREE.Quaternion()
    const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)) // - PI/2 around the x-axis

    return function (quaternion, alpha, beta, gamma, orient) {
      euler.set(beta, alpha, -gamma, 'YXZ') // 'ZXY' for the device, but 'YXZ' for us

      quaternion.setFromEuler(euler) // orient the device

      quaternion.multiply(q1) // camera looks out the back of the device, not the top

      quaternion.multiply(q0.setFromAxisAngle(zee, -orient)) // adjust for screen orientation
    }
  })()

  /**
   * CUBES' POSITION UPDATES BASED ON SENSOR DATA
   */
  // watchPositionError(error) {
  //   switch (error.code) {
  //     case error.PERMISSION_DENIED:
  //       console.error('User denied the request for Geolocation.')
  //       break
  //     case error.POSITION_UNAVAILABLE:
  //       console.error('Location information is unavailable.')
  //       break
  //     case error.TIMEOUT:
  //       console.error('The request to get user location timed out.')
  //       break
  //     case error.UNKNOWN_ERROR:
  //       console.error('An unknown error occurred.')
  //       break
  //   }
  // }

  // onPositionUpdate(data) {
  //   const {
  //     coords: { longitude, latitude },
  //   } = data

  //   // set initial position coordinates lat/long <==> center of the scene (your position)
  //   if (!this.initCoords) {
  //     this.initCoords = {
  //       longitude,
  //       latitude,
  //     }
  //   }

  //   // Current coordinates
  //   this.currentCoords = {
  //     longitude,
  //     latitude,
  //   }

  //   const scene = this.world.scene

  //   // Update cubes
  //   const tempLabels = []
  //   this.world.cubes.forEach((cube, index) => {
  //     const { position, distance, angleDeg, angleRad, coords } = cube.userData // cube data stored on create `randomCube.js`

  //     // TURF - new angle calculation
  //     const bearing = calculateBearingBetweenPoints(
  //       this.currentCoords, // i.e: { latitude: -37.9136, longitude: 144.8631 }
  //       coords // i.e: { latitude: -37.8136, longitude: 144.9631 },
  //     )
  //     // TURF - new distance calculation
  //     const newDistance = calculateDistanceBetweenPoints(
  //       this.currentCoords,
  //       coords
  //     )

  //     const normalizedDistance = new THREE.Vector3()
  //     const newPosition = new THREE.Vector3()

  //     normalizedDistance.copy(
  //       new THREE.Vector3(position.x, position.y, newDistance)
  //     )
  //     newPosition.copy(
  //       normalizedDistance.applyAxisAngle(new THREE.Vector3(0, 1, 0), bearing)
  //     )

  //     cube.position.copy(newPosition) // or later: cube.position.lerp(newPosition, 0.2)

  //     // Update cube stored distance
  //     cube.userData.distance = newDistance

  //     // Clear label
  //     const label = this.world.labels[index] // existing cube label
  //     scene.remove(label)
  //     label.dispose()

  //     // Create new label
  //     const l = new Text()
  //     l.position.copy(newPosition)
  //     l.position.y += 2
  //     l.text = `${newDistance.toFixed(1)}m`
  //     l.fontSize = 0.5
  //     l.color = 0x000000

  //     l.lookAt(this.camera.position)

  //     // Add new label to scene
  //     scene.add(l)
  //     tempLabels.push(l)
  //   })

  //   // Update world labels..
  //   this.world.labels = tempLabels

  //   // const distDom = document.getElementById('val1')
  //   // distDom.innerText = `traveled: ${distance.toFixed(2)}m`
  // }

  // watchPosition() {
  //   this.geoLoc = navigator.geolocation

  //   const options = {
  //     enableHighAccuracy: true,
  //     // timeout
  //     // age
  //   }

  //   setInterval(() => {
  //     this.watchID = navigator.geolocation.getCurrentPosition(
  //       this.onPositionUpdate,
  //       this.watchPositionError,
  //       options
  //     )
  //   }, 1000)

  //   // this.watchID = navigator.geolocation.watchPosition(
  //   //   this.onPositionUpdate,
  //   //   this.watchPositionError,
  //   //   options
  //   // )
  // }

  /**
   * FRAME LOOP
   */
  update(deltaTime) {
    if (this.enabled === false) return

    const alpha = this.deviceOrientation?.alpha
      ? THREE.MathUtils.degToRad(this.deviceOrientation.alpha) +
        this.alphaOffsetAngle
      : 0 // Z
    const beta = this.deviceOrientation?.beta
      ? THREE.MathUtils.degToRad(this.deviceOrientation.beta) +
        this.betaOffsetAngle
      : 0 // X'
    const gamma = this.deviceOrientation?.gamma
      ? THREE.MathUtils.degToRad(this.deviceOrientation.gamma) +
        this.gammaOffsetAngle
      : 0 // Y''
    const orient = this.screenOrientation
      ? THREE.MathUtils.degToRad(this.screenOrientation)
      : 0 // O

    this.setObjectQuaternion(this.camera.quaternion, alpha, beta, gamma, orient)

    this.alphaDeg = this.deviceOrientation?.alpha || 0
    this.alphaRad = alpha
  }

  /**
   * DISPOSE
   */
  dispose() {
    this.disconnect()
  }

  disconnect() {
    window.removeEventListener(
      'orientationchange',
      this.onScreenOrientationChangeEvent,
      false
    )

    window.removeEventListener(
      'deviceorientation',
      this.onDeviceOrientationChangeEvent,
      false
    )

    window.removeEventListener(
      'devicemotion',
      this.onDeviceMotionChangeEvent,
      true
    )

    this.geoLoc?.clearWatch(this.watchID)

    this.enabled = false
  }

  /**
   * OTHERS
   */
  updateAlphaOffsetAngle(angle) {
    this.alphaOffsetAngle = angle
    this.update()
  }

  updateBetaOffsetAngle(angle) {
    this.betaOffsetAngle = angle
    this.update()
  }

  updateGammaOffsetAngle(angle) {
    this.gammaOffsetAngle = angle
    this.update()
  }
}

export default DeviceOrientationControls
