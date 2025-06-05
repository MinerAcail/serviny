"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Trash2, Download, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"

interface SignatureCanvasProps {
  value: string | null
  onChange: (value: string | null) => void
  height?: number
  disabled?: boolean
}

export function SignatureCanvas({ 
  value, 
  onChange, 
  height = 150, 
  disabled = false 
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [hasSignature, setHasSignature] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    setCtx(context)

    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    canvas.style.width = canvas.offsetWidth + 'px'
    canvas.style.height = canvas.offsetHeight + 'px'

    if (context) {
      context.scale(window.devicePixelRatio, window.devicePixelRatio)
      context.lineWidth = 2
      context.lineCap = "round"
      context.lineJoin = "round"
      context.strokeStyle = "#000"

      // Load existing signature if provided
      if (value) {
        const img = new Image()
        img.onload = () => {
          context.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
          context.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight)
          setHasSignature(true)
        }
        img.src = value
        img.crossOrigin = "anonymous"
      }
    }

    const handleResize = () => {
      if (!context) return
      const oldData = context.getImageData(0, 0, canvas.width, canvas.height)
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      canvas.style.width = canvas.offsetWidth + 'px'
      canvas.style.height = canvas.offsetHeight + 'px'
      context.scale(window.devicePixelRatio, window.devicePixelRatio)
      context.lineWidth = 2
      context.lineCap = "round"
      context.lineJoin = "round"
      context.strokeStyle = "#000"
      context.putImageData(oldData, 0, 0)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [value])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!ctx || disabled) return

    setIsDrawing(true)
    ctx.beginPath()

    const { offsetX, offsetY } = getCoordinates(e)
    ctx.moveTo(offsetX, offsetY)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx || disabled) return

    const { offsetX, offsetY } = getCoordinates(e)
    ctx.lineTo(offsetX, offsetY)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing || !ctx || disabled) return

    setIsDrawing(false)
    ctx.closePath()
    setHasSignature(true)

    const dataURL = canvasRef.current?.toDataURL("image/png")
    if (dataURL) {
      onChange(dataURL)
    }
  }

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { offsetX: 0, offsetY: 0 }

    const rect = canvas.getBoundingClientRect()

    if ("touches" in e && e.touches && e.touches[0]) {
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top,
      }
    }

    const mouseEvent = e as React.MouseEvent
    return {
      offsetX: mouseEvent.clientX - rect.left,
      offsetY: mouseEvent.clientY - rect.top,
    }
  }

  const clearSignature = () => {
    if (!ctx || !canvasRef.current || disabled) return

    ctx.clearRect(0, 0, canvasRef.current.offsetWidth, canvasRef.current.offsetHeight)
    setHasSignature(false)
    onChange(null)
  }

  const downloadSignature = () => {
    if (!canvasRef.current || !hasSignature) return

    const link = document.createElement('a')
    link.download = 'signature.png'
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  const undoLastStroke = () => {
    // This is a simplified undo - for full undo functionality, 
    // you would need to store drawing history
    clearSignature()
  }

  return (
    <div className="space-y-3">
      <div 
        className={`border border-gray-300 rounded-lg bg-white relative overflow-hidden ${disabled ? 'opacity-50' : ''}`} 
        style={{ height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          className={`w-full h-full ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => {
            e.preventDefault()
            startDrawing(e)
          }}
          onTouchMove={(e) => {
            e.preventDefault()
            draw(e)
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            stopDrawing()
          }}
        />

        {!hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <svg className="h-8 w-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-sm text-gray-400">
                {isMobile ? "Touch and drag to sign" : "Click and drag to sign"}
              </span>
            </div>
          </div>
        )}

        {hasSignature && (
          <div className="absolute top-2 right-2">
            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Signed
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={!hasSignature || disabled}
            className="border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={undoLastStroke}
            disabled={!hasSignature || disabled}
            className="border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Undo
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadSignature}
          disabled={!hasSignature || disabled}
          className="border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <Download className="h-3 w-3 mr-1" />
          Download
        </Button>
      </div>

      {disabled && (
        <p className="text-xs text-gray-500 text-center">
          Signature field is disabled
        </p>
      )}
    </div>
  )
}