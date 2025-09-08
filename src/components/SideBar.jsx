import React from 'react'

const AppLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-500">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SideBar = () => {
  return (
    <aside className="w-64 flex-shrink-0 bg-zinc-900 border-r border-slate-700 flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-700">
            <AppLogo />
            <span className="ml-3 text-lg font-semibold text-slate-400">CivicWatch</span>
          </div>
          <nav className="flex-1 px-4 py-4">
            <ul>
              <li>
                <a href="#" className="flex items-center px-4 py-2 text-slate-200 bg-indigo-500 rounded-lg font-semibold">
                  Dashboard
                </a>
              </li>
              {/* Future navigation links can go here */}
            </ul>
          </nav>
        </aside>
  )
}

export default SideBar