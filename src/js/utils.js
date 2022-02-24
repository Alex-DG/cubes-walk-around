import * as THREE from 'three'
import * as TURF from '@turf/turf'

export const getRandomNumber = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const isIOS = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  return isIOS
}

export const coordsToVector3 = (lng, lat) => {
  const out = new THREE.Vector3()

  //flips the Y axis
  lat = Math.PI / 2 - lat

  //distribute to sphere
  out.set(Math.sin(lat) * Math.sin(lng), 10, Math.sin(lat) * Math.cos(lng))

  return out
}

/**
 *
 * @param start
 * @param end
 * @returns angle in degrees
 */
export const calculateBearingBetweenPoints = (start, end) => {
  const point1 = TURF.point([start.longitude, start.latitude])
  const point2 = TURF.point([end.longitude, end.latitude])
  const angle = TURF.bearing(point1, point2)
  return angle
}

/**
 *
 * @param start
 * @param end
 * @returns distance in Kilometers
 */
export const calculateDistanceBetweenPoints = (start, end) => {
  const from = TURF.point([start.longitude, start.latitude])
  const to = TURF.point([end.longitude, end.latitude])
  const distance = TURF.distance(from, to, { units: 'meters' })
  return distance
}
