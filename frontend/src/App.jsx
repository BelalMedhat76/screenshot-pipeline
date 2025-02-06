import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCamera, FaUpload, FaTrash } from 'react-icons/fa'
import axios from 'axios'

function App() {
  const [isDark, setIsDark] = useState(false)
  const [screenshots, setScreenshots] = useState([])
  const [isCapturing, setIsCapturing] = useState(false)

  useEffect(() => {
    fetchScreenshots()
  }, [])

  const fetchScreenshots = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/screenshots')
      setScreenshots(response.data)
    } catch (error) {
      console.error('Error fetching screenshots:', error)
    }
  }

  const captureScreen = async () => {
    try {
      setIsCapturing(true)
      const stream = await navigator.mediaDevices.getDisplayMedia({ preferCurrentTab: true })
      const video = document.createElement('video')
      video.srcObject = stream
      
      const capture = new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play()
          video.pause()
          
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          
          const ctx = canvas.getContext('2d')
          ctx.drawImage(video, 0, 0)
          
          stream.getTracks().forEach(track => track.stop())
          resolve(canvas.toDataURL('image/png'))
        }
      })

      const imageData = await capture
      const title = new Date().toLocaleString()
      
      await axios.post('http://localhost:5000/api/screenshots', {
        imageData,
        title
      })

      await fetchScreenshots()
      setIsCapturing(false)
    } catch (error) {
      console.error('Error capturing screenshot:', error)
      setIsCapturing(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const imageData = reader.result
        const title = file.name

        await axios.post('http://localhost:5000/api/screenshots', {
          imageData,
          title
        })

        await fetchScreenshots()
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex justify-between items-center w-full mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Screenshot Pipeline
            </h1>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isDark ? '🌞' : '🌙'}
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={captureScreen}
              className="card bg-blue-50 dark:bg-gray-700 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <FaCamera className="text-3xl text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Take Screenshot</h2>
                  <p className="text-gray-600 dark:text-gray-300">Capture your screen instantly</p>
                </div>
              </div>
            </motion.div>

            <label className="cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="card bg-purple-50 dark:bg-gray-700"
              >
                <div className="flex items-center gap-4">
                  <FaUpload className="text-3xl text-purple-600 dark:text-purple-400" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Upload Image</h2>
                    <p className="text-gray-600 dark:text-gray-300">Upload existing screenshots</p>
                  </div>
                </div>
              </motion.div>
            </label>
          </div>

          {/* Screenshots Gallery */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence>
              {screenshots.map((screenshot) => (
                <motion.div
                  key={screenshot.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="card overflow-hidden group relative"
                >
                  <img 
                    src={screenshot.imageData} 
                    alt={screenshot.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{screenshot.title}</p>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isCapturing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App