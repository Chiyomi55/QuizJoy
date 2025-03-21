import React, { useState } from 'react';
import './LoginModal.css';

function LoginModal({ isOpen, onClose, onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [userType, setUserType] = useState('student');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      console.log('开始登录请求...');
      console.log('请求数据:', {
        username: formData.username,
        password: formData.password,
        role: userType
      });

      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: userType
        }),
        credentials: 'same-origin'
      });

      console.log('收到响应:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();
      console.log('响应数据:', data);
      
      if (!response.ok) {
        throw new Error(data.error || data.msg || '登录失败');
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('登录成功，用户数据:', data.user);
      onLogin(data.user);
      onClose();
      
    } catch (error) {
      console.error('登录错误详情:', error);
      setError(error.message || '登录失败，请稍后重试');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>欢迎使用智慧学习系统</h2>
        <div className="user-type-toggle">
          <button 
            className={`type-btn ${userType === 'student' ? 'active' : ''}`}
            onClick={() => {
              setUserType('student');
              setError('');
            }}
          >
            学生端
          </button>
          <button 
            className={`type-btn ${userType === 'teacher' ? 'active' : ''}`}
            onClick={() => {
              setUserType('teacher');
              setError('');
            }}
          >
            教师端
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="请输入用户名"
              required
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="请输入密码"
              required
            />
          </div>
          {!isLoginMode && (
            <div className="form-group">
              <label>确认密码</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="请再次输入密码"
                required
              />
            </div>
          )}
          <button type="submit" className="submit-btn">
            {isLoginMode ? '登录' : '注册'}
          </button>
        </form>
        <div className="modal-footer">
          <button 
            className="switch-mode-btn"
            onClick={() => setIsLoginMode(!isLoginMode)}
          >
            {isLoginMode ? '没有账号？立即注册' : '已有账号？立即登录'}
          </button>
          <button className="close-btn" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

export default LoginModal; 