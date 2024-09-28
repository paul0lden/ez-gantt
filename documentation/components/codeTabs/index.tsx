import React, { useState } from 'react'

export function CodeTabs({ children }): React.ReactNode {
  const [activeIndex, setActiveIndex] = useState(0)

  const tabs = React.Children.map(children, (child) => {
    const { title, children: content } = child.props

    return { title, content }
  })

  return (
    <div className="my-4 flex gap-2 flex-col rounded-lg">
      {/* Render tab buttons */}
      <div className="flex gap-0.5 rounded-lg overflow-hidden w-fit bg-gray-950">
        {tabs.map((tab, index) => (
          <button
            type="button"
            key={`${index}-${tab.title}`}
            className={`font-bold py-1 px-4 ${index === activeIndex ? 'bg-gray-500' : 'bg-gray-800'}`}
            onClick={() => setActiveIndex(index)}
            disabled={activeIndex === index}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Render the active tab's content */}
      <div className="view">
        {tabs[activeIndex].content}
      </div>
    </div>
  )
}
