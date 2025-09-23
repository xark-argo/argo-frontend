import React from 'react'

interface RightDrawerProps {
  refreshBot: () => void
  visible: boolean
}

function RightDrawer({ refreshBot, visible }: RightDrawerProps) {
  if (!visible) return null

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">Settings</h3>
      <p className="text-gray-600">Right drawer content will be implemented here.</p>
    </div>
  )
}

export default RightDrawer
