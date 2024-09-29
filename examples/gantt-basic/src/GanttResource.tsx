import React from 'react'

function Resource({ name, avatar }: any): React.ReactNode {
  return (
    <div className="w-full h-full flex hover:bg-gray-400">
      <div className="py-2 mx-4 resource w-full flex justify-start gap-2 items-center">
        <img width={32} height={32} className='rounded-full' src={avatar} />
        <div className="w-max flex">
          {name}
        </div>
      </div>
    </div>
  )
}

export default React.memo(Resource) as typeof Resource
