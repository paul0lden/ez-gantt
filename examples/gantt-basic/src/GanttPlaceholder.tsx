import React from 'react'

function Placeholder(_: any): React.ReactNode {
  return <div className="h-8 bg-green-300 rounded-s" />
}

export default React.memo(Placeholder) as typeof Placeholder
