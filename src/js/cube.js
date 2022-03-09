import * as THREE from 'three'

import { Text } from 'troika-three-text'

import { generateRandomPoints } from './randomPoint'
import { calculateBearingBetweenPoints, getRandomNumber } from './utils'
import DeviceGeoLocation from './deviceGeolocation'

const _COLORS = [
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#00ffff',
  '#ff00ff',
]

export const createCubePosition = (cube, camera) => {
  const object = cube
  const { latitude, longitude } = DeviceGeoLocation.initCoords

  // object.material = new THREE.MeshStandardMaterial({
  //   color: _COLORS[(Math.random() * _COLORS.length) | 0],
  // })

  const distance = getRandomNumber(5, 25)

  const randomGeoPoints = generateRandomPoints(
    { lat: latitude, lng: longitude },
    distance,
    1
  )

  // My current position on start
  const start = {
    latitude,
    longitude,
  }
  // Random coordiantes
  const end = {
    latitude: randomGeoPoints[0].lat,
    longitude: randomGeoPoints[0].lng,
  }
  const bearing = calculateBearingBetweenPoints(start, end)

  const normalizedDistance = new THREE.Vector3()
  const position = new THREE.Vector3()

  normalizedDistance.copy(new THREE.Vector3(0, 0, distance))
  const angleRad = THREE.MathUtils.degToRad(bearing)

  position.copy(
    normalizedDistance.applyAxisAngle(new THREE.Vector3(0, 1, 0), bearing)
  )

  // position.y += 10

  object.position.copy(position)

  object.userData = {
    distance,
    angleRad,
    coords: end,
    angleDeg: bearing,
    position: object.position.clone(),
  }

  const camDistance = Math.floor(cube.position.distanceTo(camera.position))

  // Create text label
  const label = createCubeLabel(object.position, camDistance)

  // object.renderOrder = -1

  return { object, label }
}

export const createCubeLabel = (position, distance) => {
  // Create text label
  const label = new Text()

  label.position.copy(position)
  label.position.x += 0.5
  label.position.y -= 2.2

  label.text = `${distance.toFixed(1)}m`
  label.fontSize = 0.4
  label.color = 0xffffff

  label.sync()

  return label
}
