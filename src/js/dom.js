export const hideContainer = () => {
  const container = document.querySelector('.permissions-container')
  container.style.display = 'none'
}

export const showData = () => {
  const container = document.querySelector('.debug-container')
  container.style.display = 'flex'
}

export const cameraFeed = (stream) => {
  const video = document.querySelector('.video')
  video.srcObject = stream
  video.play()
}
