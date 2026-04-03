import DesignLayout from '@/components/design/DesignLayout'
import DesignSideBar from '@/components/design/DesignSideBar'
import StyleLayout from '@/components/design/StyleLayout'
import SimilotaorMain from '@/simulator/pages/SimilotaorMain'
import React from 'react'

export default function page() {
  return (
    <div className=''>
      {/* <StyleLayout />
      <div className="h-[calc(100vh-122px)] flex">
        <DesignLayout />
        <DesignSideBar />
      </div> */}
      <SimilotaorMain />
    </div>
  )
}
