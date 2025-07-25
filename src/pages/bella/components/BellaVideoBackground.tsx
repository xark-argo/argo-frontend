import {useVideoConfig} from '../hooks'

function BellaVideoBackground() {
  const {videoRef} = useVideoConfig()

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <video
        ref={videoRef}
        className="h-full object-cover transition-opacity duration-300"
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 opacity-25" />
    </div>
  )
}

BellaVideoBackground.displayName = 'BellaVideoBackground'

export default BellaVideoBackground
