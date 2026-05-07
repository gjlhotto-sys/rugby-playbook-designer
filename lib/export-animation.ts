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

  const fps = 15
  const totalFrames = Math.ceil((duration / 1000) * fps)
  const frameDelay = Math.round(duration / totalFrames)

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
        // Add final frame held for 2 seconds
        const finalCanvas = await captureFrame()
        gif.addFrame(finalCanvas, { delay: 2000, copy: true })
        gif.render()
        return
      }

      try {
        const canvas = await captureFrame()
        gif.addFrame(canvas, { delay: frameDelay, copy: true })
        frameCount++
        onProgress?.(frameCount / totalFrames)
        setTimeout(captureNextFrame, frameDelay)
      } catch (err) {
        reject(err)
      }
    }

    captureNextFrame()
  })
}

