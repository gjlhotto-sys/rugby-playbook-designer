export async function exportPlayAsGif(
  fieldElement: HTMLElement,
  duration: number,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const GIF = (await import('gif.js')).default
  
  // Find the SVG element inside the field container
  const svgElement = fieldElement.querySelector('svg')
  if (!svgElement) throw new Error('No SVG found')
  
  const svgWidth = svgElement.clientWidth || 600
  const svgHeight = svgElement.clientHeight || 800
  
  const gif = new GIF({
    workers: 2,
    quality: 6,
    width: svgWidth,
    height: svgHeight,
    workerScript: '/gif.worker.js',
  })

  const FRAME_DELAY_MS = 100 // capture a frame every 100ms
  const RENDER_WAIT_MS = 80 // wait for React to paint before capture
  
  // Calculate total frames based on duration
  const totalFrames = Math.ceil(duration / FRAME_DELAY_MS)
  
  // Each GIF frame delay should match capture interval
  // to play back at the same speed as real animation
  const gifFrameDelay = FRAME_DELAY_MS

  const captureFrame = (): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      // Serialize SVG to string
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = svgWidth
        canvas.height = svgHeight
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#14532d' // dark green background
        ctx.fillRect(0, 0, svgWidth, svgHeight)
        ctx.drawImage(img, 0, 0, svgWidth, svgHeight)
        URL.revokeObjectURL(url)
        resolve(canvas)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        // Return blank canvas on error
        const canvas = document.createElement('canvas')
        canvas.width = svgWidth
        canvas.height = svgHeight
        resolve(canvas)
      }
      img.src = url
    })
  }

  return new Promise((resolve, reject) => {
    let frameCount = 0

    const captureNextFrame = async () => {
      if (frameCount >= totalFrames) {
        gif.on('finished', (blob: Blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${filename}.gif`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          resolve()
        })
        gif.on('error', reject)
        gif.render()
        return
      }

      try {
        // Wait for React to render, THEN capture
        setTimeout(async () => {
          const canvas = await captureFrame()
          gif.addFrame(canvas, { delay: gifFrameDelay, copy: true })
          frameCount++
          onProgress?.(frameCount / totalFrames)
          // Schedule next frame
          captureNextFrame()
        }, RENDER_WAIT_MS)
      } catch (err) {
        reject(err)
      }
    }

    captureNextFrame()
  })
}

