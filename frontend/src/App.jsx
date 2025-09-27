
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import './App.css'

function App() {


  return (
    <BrowserRouter>
    <AuthProvider>

       <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
       
        <Route path="*" element={<NotFound />} />
       </Routes>
        </AuthProvider>
    </BrowserRouter>
  )
}

export default App
