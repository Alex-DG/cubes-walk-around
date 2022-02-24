import * as THREE from 'three'

import { Text } from 'troika-three-text'

import '../style.css'
import DeviceOrientationControls from './controls'

import { cameraFeed, hideContainer, showData } from './dom.js'
import { createCubeLabel, createCubePosition } from './cube.js'

import DeviceGeolocation from './deviceGeolocation'

/**
 * BASE
 */
let camera, scene, renderer, controls

const objects = []
let labels = []

const vertex = new THREE.Vector3()
const color = new THREE.Color()

let prevTime = performance.now()

// Camera parameters
const options = {
  audio: false,
  video: {
    width: {
      min: 1280,
      ideal: 1920,
      max: 2560,
    },
    height: {
      min: 720,
      ideal: 1080,
      max: 1440,
    },
    facingMode: {
      exact: 'environment',
    },
  },
}

/**
 * INIT EXPERIENCE
 */
const init = () => {
  navigator.mediaDevices.getUserMedia(options).then((stream) => {
    start(stream)
    animate()
  })
}

/**
 * Handle permissions ios.............
 */
const btnAccess = document.getElementById('btn-access')
btnAccess.addEventListener('click', function () {
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then((permissionState) => {
        if (permissionState === 'granted') {
          if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
              .then((permissionState) => {
                if (permissionState === 'granted') {
                  init()
                }
              })
              .catch(console.error)
          } else {
            init()
          }
        }
      })
      .catch(console.error)
  } else {
    init()
  }
})

/**
 * START EXPERIENCE: create 3d world
 *
 * @stream - camera feed
 */
function start(stream) {
  console.log({ stream })
  /**
   * DOM
   */
  hideContainer()
  showData()
  cameraFeed(stream)

  /**
   * CAMERA
   */
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  )
  camera.position.y = 10

  scene = new THREE.Scene()
  // scene.background = new THREE.Color(0xffffff)
  scene.fog = new THREE.Fog(0xffffff, 0, 750)

  const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75)
  light.position.set(0.5, 1, 0.75)
  scene.add(light)

  // Callback: once init corrdinates set
  const createWorldObjects = () => {
    /**
     * CUBES
     */
    const MAX_CUBES = 20

    const northCube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true })
    )
    northCube.position.set(0, 0, 10)
    scene.add(northCube)

    const worldCube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    )
    Array.from({ length: MAX_CUBES }).forEach(() => {
      const cube = worldCube.clone()
      const { object, label } = createCubePosition(cube, camera) // cube + label

      // Add 3d objects to the scene
      scene.add(object)
      objects.push(object)

      scene.add(label)
      labels.push(label)

      // object.lookAt(camera.position)
      label.lookAt(camera.position)
    })

    /**
     * FLOOR
     */
    let floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100)
    floorGeometry.rotateX(-Math.PI / 2)

    // vertex displacement
    let position = floorGeometry.attributes.position

    for (let i = 0, l = position.count; i < l; i++) {
      vertex.fromBufferAttribute(position, i)

      vertex.x += Math.random() * 20 - 10
      vertex.y += Math.random() * 2
      vertex.z += Math.random() * 20 - 10

      position.setXYZ(i, vertex.x, vertex.y, vertex.z)
    }

    floorGeometry = floorGeometry.toNonIndexed() // ensure each face has unique vertices
    position = floorGeometry.attributes.position

    const colorsFloor = []
    for (let i = 0, l = position.count; i < l; i++) {
      color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
      colorsFloor.push(color.r, color.g, color.b)
    }
    floorGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colorsFloor, 3)
    )

    // console.log({ objects, initCoords: DeviceGeolocation.initCoords })

    const floorMaterial = new THREE.MeshBasicMaterial({ vertexColors: true })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.position.y = -5
    scene.add(floor)
  }

  // Callback: every geolocation update
  const updateWorld = () => {
    const tempLabels = []

    objects.forEach((cube, index) => {
      // Get cube label
      const cubeLabel = labels[index]

      // Get new distance
      const newDistance = cube.position.distanceTo(camera.position)

      // Dipose label
      scene.remove(cubeLabel)
      cubeLabel.dispose()

      // Create new label
      const newLabel = createCubeLabel(cube.position, newDistance)
      newLabel.lookAt(camera.position)

      // Add new label to scene
      scene.add(newLabel)
      tempLabels.push(newLabel)
    })

    // Update [labels]
    labels = tempLabels
  }

  /**
   * Init. watch position: geolocation sensor start
   */
  DeviceGeolocation.init({
    createWorldObjects,
    camera,
    updateWorld,
  })

  /**
   * CONTROLS: gyro camera and more
   */
  controls = new DeviceOrientationControls({
    camera,
    world: {
      cubes: objects,
      labels,
      scene,
    },
  })

  /**
   * RENDERER
   */
  const canvas = document.querySelector('canvas.webgl')
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas, alpha: true })

  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)

  window.addEventListener('resize', onWindowResize)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
}

/**
 * FRAME LOOP!
 */
function animate() {
  requestAnimationFrame(animate)

  const time = performance.now()

  const delta = (time - prevTime) / 1000

  controls.update(delta)

  /**
   * Update label text
   */
  labels.forEach((label) => label?.sync())

  prevTime = time

  renderer.render(scene, camera)
}
