export const hideContainer = () => {
  const container = document.querySelector('.container')
  container.style.display = 'none'
}

export const showData = () => {
  const container = document.querySelector('.data-container')
  container.style.display = 'flex'
}

export const cameraFeed = (stream) => {
  const video = document.querySelector('.video')
  video.srcObject = stream
  video.play()
}
