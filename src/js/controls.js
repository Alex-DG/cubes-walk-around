import * as THREE from 'three'
import { isIOS } from './utils'

const DEG2RAD = Math.PI / 180

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

  scene = null

  constructor({ camera, scene }) {
    this.camera = camera
    this.scene = scene

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

    let currHeading = 0

    // use webkitCompassHeading to set camera forward direction to magnetic North
    if (this.deviceOrientation) {
      console.log('ios!')
      console.log({
        deviceOrientation: this.deviceOrientation,
        heading: this.deviceOrientation.webkitCompassHeading,
      })

      this.camera.rotation.y =
        DEG2RAD * -this.deviceOrientation.webkitCompassHeading
      currHeading = this.deviceOrientation.webkitCompassHeading
    }
    // else {
    //   this.camera.rotation.y = alpha
    //   currHeading = alpha
    // }

    // By how much are we off from north
    const delta = -(360 - currHeading)
    const deltaRad = THREE.MathUtils.degToRad(delta)

    // Align the scene rotation with the real world north orientation
    this.scene.rotation.y = deltaRad
    this.scene.updateMatrixWorld()
    console.log('scene orientation')

    // else {
    //   this.setObjectQuaternion(
    //     this.camera.quaternion,
    //     alpha,
    //     beta,
    //     gamma,
    //     orient
    //   )
    // }

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
