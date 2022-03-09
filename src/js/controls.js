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
  calibrated = false
  alphaOffsetAngle = 0
  betaOffsetAngle = 0
  gammaOffsetAngle = 0
  screenOrientation = 0

  deviceOrientation

  sensor

  scene = null

  DEG2RAD = Math.PI / 180;

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

    if (isIOS()) {
      window.addEventListener(
        'deviceorientation',
        this.onDeviceOrientationChangeEvent,
        true
      )
    } else {
      window.addEventListener(
        'deviceorientationabsolute',
        this.onDeviceOrientationChangeEvent,
        true
      )
    }

    window.addEventListener(
      'devicemotion',
      this.onDeviceMotionChangeEvent,
      true
    )

    this.enabled = true
  }

  calibrateScene(){
    const event = this.deviceOrientation
    if (event) {
    const initialHeading = this.getTrueHeading(event)

      
      this.scene.rotation.y = -initialHeading * this.DEG2RAD
      this.calibrated = true
    }
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

    let headingDegrees = 0
    const event = this.deviceOrientation



    if (event) {
    if(!this.calibrated)  this.calibrateScene()

    headingDegrees = this.getTrueHeading(event)
 
     
     
     this.headingDom.innerHTML = `headingDeg: ${headingDegrees?.toFixed(2)}°`;
    //  this.camera.rotation.y = DEG2RAD * -headingDegrees;

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
    }
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

  getTrueHeading(event){
    let headingDegrees = 0

    if (event.webkitCompassHeading !== undefined) {
            if (event.webkitCompassAccuracy < 50) {
                headingDegrees = event.webkitCompassHeading;
            } else {
                console.warn('webkitCompassAccuracy is event.webkitCompassAccuracy');
            }
        } else if (event.alpha !== null) {
            if (event.absolute === true || event.absolute === undefined) {
                headingDegrees = this.computeCompassHeading(event.alpha, event.beta, event.gamma);
            } else {
                console.warn('alpha event.absolute === false');
            }
        } else {
            console.warn('alpha event.alpha === null');
        }

    return headingDegrees
  }

  computeCompassHeading(alpha, beta, gamma) {

        // Convert degrees to radians
        var alphaRad = alpha * (Math.PI / 180);
        var betaRad = beta * (Math.PI / 180);
        var gammaRad = gamma * (Math.PI / 180);

        // Calculate equation components
        var cA = Math.cos(alphaRad);
        var sA = Math.sin(alphaRad);
        var sB = Math.sin(betaRad);
        var cG = Math.cos(gammaRad);
        var sG = Math.sin(gammaRad);

        // Calculate A, B, C rotation components
        var rA = - cA * sG - sA * sB * cG;
        var rB = - sA * sG + cA * sB * cG;

        // Calculate compass heading
        var compassHeading = Math.atan(rA / rB);

        // Convert from half unit circle to whole unit circle
        if (rB < 0) {
            compassHeading += Math.PI;
        } else if (rA < 0) {
            compassHeading += 2 * Math.PI;
        }

        // Convert radians to degrees
        compassHeading *= this.DEG2RAD;

        return compassHeading;
  }

}

export default DeviceOrientationControls
