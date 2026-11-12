import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HelpPage from './pages/HelpPage'
import TasksPage from './pages/TasksPage'
import { variant } from './research/experiment'

// Variants C and D (cross-page data flow) are not implemented yet.
const IMPLEMENTED = new Set(['A', 'B'])

export default function App() {
  if (!IMPLEMENTED.has(variant)) {
    return (
      <Layout>
        <p role="alert">{`변형 ${variant}은(는) 아직 구현되지 않았습니다. VITE_STUDYFLOW_VARIANT를 A 또는 B로 설정하세요.`}</p>
      </Layout>
    )
  }
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="*" element={<p role="alert">페이지를 찾을 수 없습니다.</p>} />
      </Routes>
    </Layout>
  )
}
