import React from 'react'

function Placeholder(props: any): React.ReactNode {
  const { event } = props ?? {}
  return <div style={{ height: `${event?.height}px`}} className="bg-zinc-600 rounded-lg" />
}

export default React.memo(Placeholder) as typeof Placeholder
