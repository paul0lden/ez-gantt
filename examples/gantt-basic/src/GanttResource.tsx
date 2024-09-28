import React from 'react'

function Resource({ name }: any): React.ReactNode {
  return (
    <div className="w-full flex hover:bg-gray-400">
      <div className="py-2 resource w-full items-start border-b-2 border-solid border-gray-500">
        <div className="w-max flex">
          {name}
        </div>
      </div>
    </div>
  )
}

export default React.memo(Resource) as typeof Resource
