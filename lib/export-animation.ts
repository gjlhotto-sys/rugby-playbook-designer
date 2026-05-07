export async function exportPlayAsVideo(
  svgElement: SVGSVGElement,
  duration: number,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const svgWidth = svgElement.clientWidth || 600
      const svgHeight = svgElement.clientHeight || 800

      const canvas = document.createElement('canvas')
      canvas.width = svgWidth * 2  // 2x for quality
      canvas.height = svgHeight * 2
      const ctx = canvas.getContext('2d', { alpha: false })!
      ctx.scale(2, 2)

      const stream = canvas.captureStream(24)
      
      const mimeType = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8', 
        'video/webm',
      ].find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm'

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 4000000
      })

      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.mp4`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        resolve()
      }

      // Pre-load SVG as image ONCE, then update each frame
      // This avoids the async image load per frame
      let currentImg: HTMLImageElement | null = null
      let imgReady = false

      const updateSvgImage = (): Promise<void> => {
        return new Promise((res) => {
          const svgData = new XMLSerializer().serializeToString(svgElement)
          const blob = new Blob(
            ['<?xml version="1.0" encoding="UTF-8"?>', svgData], 
            { type: 'image/svg+xml' }
          )
          const url = URL.createObjectURL(blob)
          const img = new Image()
          img.onload = () => {
            if (currentImg) URL.revokeObjectURL(currentImg.src)
            currentImg = img
            imgReady = true
            URL.revokeObjectURL(url)
            res()
          }
          img.onerror = () => {
            URL.revokeObjectURL(url)
            res()
          }
          img.src = url
        })
      }

      // Draw current image to canvas
      const drawFrame = () => {
        ctx.fillStyle = '#14532d'
        ctx.fillRect(0, 0, svgWidth, svgHeight)
        if (currentImg && imgReady) {
          ctx.drawImage(currentImg, 0, 0, svgWidth, svgHeight)
        }
      }

      recorder.start(100) // collect data every 100ms

      const startTime = performance.now()
      let running = true

      // Main render loop - runs every 40ms (25fps)
      // Updates SVG snapshot and draws to canvas
      const renderLoop = async () => {
        if (!running) return
        
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Update SVG snapshot
        await updateSvgImage()
        drawFrame()
        
        onProgress?.(progress)

        if (progress < 1) {
          setTimeout(renderLoop, 40) // ~25fps
        } else {
          // Hold final frame
          running = false
          drawFrame()
          await new Promise(r => setTimeout(r, 1500))
          recorder.stop()
        }
      }

      // Draw initial frame
      await updateSvgImage()
      drawFrame()
      
      // Start render loop
      setTimeout(renderLoop, 40)
    } catch (err) {
      reject(err)
    }
  })
}

