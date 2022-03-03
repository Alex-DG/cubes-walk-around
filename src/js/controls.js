import * as THREE from 'three'

// Import the objects you need.
import { Gyroscope, AbsoluteOrientationSensor } from 'motion-sensors-polyfill'

import { isIOS } from './utils'

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

  sensor

  scene = null

  constructor({ camera, scene }) {
    this.camera = camera
    this.scene = scene

    this.headingDom = document.getElementById('val6')

    this.bind()
    this.connect()
  }

  bind() {
    this.onScreenOrientationChangeEvent =
      this.onScreenOrientationChangeEvent.bind(this)

    this.onDeviceOrientationChangeEvent =
      this.onDeviceOrientationChangeEvent.bind(this)

    this.onDeviceMotionChangeEvent = this.onDeviceMotionChangeEvent.bind(this)
  }

  connect() {
    this.onScreenOrientationChangeEvent() // run once on load

    window.addEventListener(
      'orientationchange',
      this.onScreenOrientationChangeEvent,
      true
    )
    // window.addEventListener(
    //   'deviceorientation',
    //   this.onDeviceOrientationChangeEvent,
    //   true
    // )
    window.addEventListener(
      'deviceorientationabsolute',
      this.onDeviceOrientationChangeEvent,
      true
    )

    window.addEventListener(
      'devicemotion',
      this.onDeviceMotionChangeEvent,
      true
    )

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

    // don't use device relative rotations
    //this.setObjectQuaternion(this.camera.quaternion, alpha, beta, gamma, orient)

    let headingDegrees = 0
    const event = this.deviceOrientation
    if (event && event.absolute) {
      // Test1 - not working (need: deviceorientationabsolute)
      // if (event.absolute) {
      //   // apparently this is true on android
      //   // https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent
      //   // https://www.w3.org/2008/geolocation/wiki/images/e/e0/Device_Orientation_%27alpha%27_Calibration-_Implementation_Status_and_Challenges.pdf
      //   headingDegrees = event.alpha
      // } else if (typeof event.webkitCompassHeading !== 'undefined') {
      //   // iOS absolute compass heading
      //   headingDegrees = event.webkitCompassHeading
      // }

      // Test2 not working alpha value is probably wrong/not absolute
      // if (typeof event.webkitCompassHeading !== 'undefined') {
      //   // iOS absolute compass heading
      //   headingDegrees = event.webkitCompassHeading
      // } else {
      //   headingDegrees = event.alpha
      // }
      // this.camera.rotation.y = DEG2RAD * -headingDegrees

      // Test3 - with deviceorientationabsolute
      const DEG2RAD = Math.PI / 180
      // headingDegrees = event.webkitCompassHeading || Math.abs(event.alpha - 360)
      headingDegrees =
        'webkitCompassHeading' in event
          ? event.webkitCompassHeading
          : -event.alpha
      this.headingDom.innerHTML = `headingDeg: ${headingDegrees?.toFixed(2)}°`
      this.camera.rotation.y = DEG2RAD * -headingDegrees
    }

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
