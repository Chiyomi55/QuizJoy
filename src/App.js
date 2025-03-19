import React, { useState, useEffect } from 'react';
import './App.css';
import { BsSun, BsMoon, BsPerson, BsBook, BsPencilSquare, BsPersonCircle } from 'react-icons/bs';
import LoginModal from './components/LoginModal';
import ProfilePage from './components/ProfilePage';
import ProblemBank from './components/ProblemBank';
import TestBank from './components/TestBank';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import TestPaper from './components/TestPaper';
import ProblemDetail from './components/ProblemDetail';
import TeacherProfile from './components/TeacherProfile';
import TeacherTestBank from './components/TeacherTestBank';
import CreateTest from './components/CreateTest';
import TestAnalysis from './components/TestAnalysis';
import TestResult from './components/TestResult';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    const autoLogin = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            setUser(JSON.parse(savedUser));
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Auto login failed:', error);
        }
      }
    };

    autoLogin();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleNavigation = (path) => {
    if (window.location.pathname.startsWith('/test/')) {
      const confirmLeave = window.confirm('测试正在进行中，退出将需要重新开始。确定要退出吗？');
      if (!confirmLeave) {
        return;
      }
    }

    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    setCurrentPage(path);
    window.location.hash = path;
  };

  const renderMainContent = () => {
    switch (currentPage) {
      case 'profile':
        return user?.role === 'teacher' ? (
          <TeacherProfile user={user} />
        ) : (
          <ProfilePage user={user} onLogin={() => setIsLoginModalOpen(true)} />
        );
      case 'test':
        if (!user) {
          return <div className="login-prompt">请先登录</div>;
        }
        return user.role === 'teacher' ? <TeacherTestBank /> : <TestBank />;
      default:
        return <ProblemBank />;
    }
  };

  return (
    <Router>
      <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
        <nav className="navbar">
          <div className="nav-left">
            <h1>智慧学习系统</h1>
          </div>
          <div className="nav-center">
            <Link 
              to="/"
              className={`nav-item ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => handleNavigation('home')}
            >
              <BsBook className="nav-icon" />
              <span>题库</span>
            </Link>
            <Link 
              to="/"
              className={`nav-item ${currentPage === 'test' ? 'active' : ''}`}
              onClick={() => handleNavigation('test')}
            >
              <BsPencilSquare className="nav-icon" />
              <span>小测</span>
            </Link>
            <Link 
              to="/"
              className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`}
              onClick={() => handleNavigation('profile')}
            >
              <BsPersonCircle className="nav-icon" />
              <span>我的</span>
            </Link>
          </div>
          <div className="nav-right">
            <div className="user-avatar">
              {user ? (
                <img 
                  src="https://file.302.ai/gpt/imgs/20250121/7f0cde4d3b0541598dab4244058bb566.jpeg"
                  alt="用户头像"
                  className="avatar-img"
                />
              ) : (
                <BsPerson className="avatar-placeholder" />
              )}
            </div>
            {user ? (
              <button 
                className="login-btn"
                onClick={handleLogout}
              >
                退出登录
              </button>
            ) : (
              <button 
                className="login-btn"
                onClick={() => setIsLoginModalOpen(true)}
              >
                登录/注册
              </button>
            )}
            <button 
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <BsSun /> : <BsMoon />}
            </button>
          </div>
        </nav>

        <LoginModal 
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={handleLogin}
        />

        <Routes>
          <Route path="/" element={renderMainContent()} />
          <Route path="/test/:testId" element={<TestPaper setCurrentPage={setCurrentPage} />} />
          <Route path="/testresult/:testId" element={<TestResult />} />
          <Route path="/problem/:problemId" element={<ProblemDetail />} />
          <Route 
            path="/teacher/create-test" 
            element={user?.role === 'teacher' ? <CreateTest /> : <Navigate to="/" />} 
          />
          <Route 
            path="/teacher/test-analysis/:testId" 
            element={user?.role === 'teacher' ? <TestAnalysis /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 