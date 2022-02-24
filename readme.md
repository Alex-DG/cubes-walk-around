# Minimal example project

What I did so far:
- Populate your surrounding with 3D objects ✅
- Create a gyro camera to see around you all the objects ✅
- Update the camera position using the accelerometer from you phone to to walk around the 3D scene and objects

- In my scene I have X number of cubes placed around me given a distance and an angle as follow:

```
public async randomPosition(object: THREE.Object3D) {
    const normalizedDistance = new THREE.Vector3()
    const randomPosition = new THREE.Vector3()
    const distance = getRandomNumber(1, 10)
    const angleDeg = getRandomNumber(0, 360)

    normalizedDistance.copy(new THREE.Vector3(0, 0, this.distance))
    const angleRad = THREE.MathUtils.degToRad(this.angleDeg)

    randomPosition.copy(normalizedDistance.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRad))
    object.position.copy(this.randomPosition)
  }
}
```

- Then I used a gyro camera and now when I move around with my phone I'm able to see all the cubes around me. For now this code is based on the [DeviceOrientationControls](https://gist.github.com/kopiro/86aac4eb19ac29ae62c950ad2106a10e).

- Finally I would like to use the `devicemotion` event to get the acceleration x/y/z of my device and update the camera's position with those values every frame to be able to walk around my cubes. At the moment I'm doing this:

```
    const normalizedDistance = new THREE.Vector3()
    const currentPosition = new THREE.Vector3()
    const accX = this.findDistance(this.accelerationX, 0.9) // m/s^2 <=> 0.5 * acceleration * time ** 2
    const accY = this.findDistance(this.accelerationY, 0.9) // m/s^2 <=> 0.5 * acceleration * time ** 2
    const accZ = this.findDistance(this.accelerationZ, 0.9) // m/s^2 <=> 0.5 * acceleration * time ** 2

    normalizedDistance.copy(new THREE.Vector3(accX, accY, accZ))
    const angleRad = THREE.MathUtils.degToRad(this.rotationGamma)

    currentPosition.copy(
      normalizedDistance.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRad)
    )

    this.camera.position.copy(currentPosition)
}
```

The result I'm getting at the moment is the camera jiggling a lot and when I'm moving my phone the whole scene is moving at the same time.

## Setup

Download [Node.js](https://nodejs.org/en/download/).
Run this followed commands:

```bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev

# Build for production in the dist/ directory
npm run build
```
