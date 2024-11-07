import React from 'react'

type Props = {}

function Intro({}: Props) {
  return (
    <div className="bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Trending Fashion Styles
        </h2>
        <p className="mt-4 max-w-2xl text-xl text-gray-500">
          Discover the latest trends and styles in fashion. Stay updated with the hottest collections!
        </p>

        {/* Fashion Grid */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Fashion Item */}
          <div className="relative">
            <img
              className="w-full h-96 object-cover rounded-lg shadow-lg"
              src="https://images.unsplash.com/photo-1533898301026-0a2546b285e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHN0cmVldHdlYXJ8ZW58MHx8MHx8fDA%3D"
              alt="Fashion Trend 1"
            />
            <div className="absolute bottom-0 left-0 bg-gray-900 bg-opacity-50 p-4 rounded-b-lg">
              <h3 className="text-lg font-bold text-white">Streetwear Essentials</h3>
              <p className="text-sm text-gray-300">Explore the urban style</p>
            </div>
          </div>

          {/* More items */}
          <div className="relative">
            <img
              className="w-full h-96 object-cover rounded-lg shadow-lg"
              src="https://images.unsplash.com/photo-1624381805840-a88d1510240d?q=80&w=1538&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Fashion Trend 2"
            />
            <div className="absolute bottom-0 left-0 bg-gray-900 bg-opacity-50 p-4 rounded-b-lg">
              <h3 className="text-lg font-bold text-white">Vintage Revival</h3>
              <p className="text-sm text-gray-300">Bring back the classics</p>
            </div>
          </div>

          <div className="relative">
            <img
              className="w-full h-96 object-cover rounded-lg shadow-lg"
              src="https://images.unsplash.com/photo-1600328784656-83c7bc673061?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2xvdGhpbmclMjBtb2RlbHxlbnwwfHwwfHx8MA%3D%3D"
              alt="Fashion Trend 3"
            />
            <div className="absolute bottom-0 left-0 bg-gray-900 bg-opacity-50 p-4 rounded-b-lg">
              <h3 className="text-lg font-bold text-white">Minimalist Chic</h3>
              <p className="text-sm text-gray-300">Simplicity at its finest</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Intro
