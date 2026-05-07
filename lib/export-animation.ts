export async function exportPlayAsVideo(
  svgElement: SVGSVGElement,
  duration: number,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const svgWidth = svgElement.clientWidth || 600
  const svgHeight = svgElement.clientHeight || 800

  // Create offscreen canvas
  const canvas = document.createElement('canvas')
  canvas.width = svgWidth
  canvas.height = svgHeight
  const ctx = canvas.getContext('2d')!

  // Set up MediaRecorder on canvas stream
  const stream = canvas.captureStream(30) // 30fps
  
  // Try MP4 first, fall back to WebM
  const mimeType = MediaRecorder.isTypeSupported('video/mp4')
    ? 'video/mp4'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm'
  
  const recorder = new MediaRecorder(stream, { 
    mimeType,
    videoBitsPerSecond: 2500000
  })
  
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
    link.download = `${filename}.${ext}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Start recording
  recorder.start()

  const startTime = performance.now()
  let lastProgress = 0

  // Render loop - draw SVG to canvas each frame
  const renderFrame = () => {
    const elapsed = performance.now() - startTime
    const progress = Math.min(elapsed / duration, 1)

    // Draw dark green background
    ctx.fillStyle = '#14532d'
    ctx.fillRect(0, 0, svgWidth, svgHeight)

    // Draw current SVG state to canvas
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { 
      type: 'image/svg+xml;charset=utf-8' 
    })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0, svgWidth, svgHeight)
      URL.revokeObjectURL(url)
      
      // Report progress
      if (progress - lastProgress > 0.05) {
        onProgress?.(progress)
        lastProgress = progress
      }

      if (progress < 1) {
        requestAnimationFrame(renderFrame)
      } else {
        // Hold final frame for 1.5 seconds
        setTimeout(() => {
          recorder.stop()
        }, 1500)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      if (progress < 1) requestAnimationFrame(renderFrame)
      else recorder.stop()
    }
    img.src = url
  }

  requestAnimationFrame(renderFrame)

  // Return promise that resolves when recording stops
  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
      link.download = `${filename}.${ext}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      resolve()
    }
  })
}

