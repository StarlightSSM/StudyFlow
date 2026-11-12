import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="app-header">
        <span className="brand">StudyFlow</span>
        <nav aria-label="주요 메뉴">
          <NavLink to="/tasks">과제</NavLink>
          <NavLink to="/help">도움말</NavLink>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </>
  )
}
