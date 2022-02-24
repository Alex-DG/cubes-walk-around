# Minimal example project - AR Experiment: walk throughout a 3D scene with your phone


- Populate your surrounding with 3D objects ✅
- Create a gyro camera to see around you all the objects ✅
- Update the camera position using the device geolocation callabck and the new coordinates returned => I want to be able to walk around the 3D scene and the objects part of it 🚧

- In my scene I have X number of cubes placed around me given a distance and my current coordiantes lng/lat: [createCubePosition](https://github.com/Alex-DG/cubes-walk-around/blob/c4a46bb389e417af040504db628bd21a56e4834d/src/js/cube.js#L18)

- Then I used a gyro camera and now when I move around with my phone I'm able to see all the cubes around me. For now this code is based on the [DeviceOrientationControls](https://gist.github.com/kopiro/86aac4eb19ac29ae62c950ad2106a10e).

- There is a consistent worldspace coordinate system defined and based on your current coordinates: [localCoordSystem](https://github.com/Alex-DG/cubes-walk-around/blob/main/src/js/localCoordSystem.js)

- Finally I would like to use the device geolocation update to apply a new position to my perspective camera while I'm walking towards or away from a cube so I could walk around the 3D scene and all the objects part of it: [deviceGeoLocation](https://github.com/Alex-DG/cubes-walk-around/blob/main/src/js/deviceGeolocation.js)


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
