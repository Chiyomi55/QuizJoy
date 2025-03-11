import React, { useState, useRef, useEffect } from 'react';
import './ProfileEditor.css';
import { FaCamera, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { fetchWithAuth } from '../utils/api';

function ProfileEditor({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    school: '',
    class: '',
    subject: '',
    title: ''
  });
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetchWithAuth('/api/profile/info');
        const userData = await response.json();
        console.log('Fetched user data:', userData);
        setFormData(userData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetchWithAuth('/api/profile/avatar', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate({ ...user, avatar_url: data.avatar_url });
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting form data:', formData);
      const response = await fetchWithAuth('/api/profile/info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新失败');
      }

      const updatedUser = await response.json();
      console.log('Updated user data:', updatedUser);
      onUpdate(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('更新失败，请重试');
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="profile-editor">
      {user ? (
        <>
          <div className="avatar-section">
            <div className="avatar-container">
              <img 
                src={user.avatar_url || 'default-avatar.png'} 
                alt="用户头像"
                className="avatar"
              />
              <button 
                className="avatar-upload-btn"
                onClick={() => fileInputRef.current.click()}
              >
                <FaCamera />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>昵称</label>
                <input
                  type="text"
                  value={formData.nickname || ''}
                  onChange={e => setFormData({...formData, nickname: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>学校</label>
                <input
                  type="text"
                  value={formData.school || ''}
                  onChange={e => setFormData({...formData, school: e.target.value})}
                />
              </div>
              {user.role === 'student' ? (
                <div className="form-group">
                  <label>班级</label>
                  <input
                    type="text"
                    value={formData.class || ''}
                    onChange={e => setFormData({...formData, class: e.target.value})}
                  />
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>任教科目</label>
                    <input
                      type="text"
                      value={formData.subject || ''}
                      onChange={e => setFormData({...formData, subject: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>职称</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                </>
              )}
              <div className="button-group">
                <button type="submit" className="save-btn">
                  <FaSave /> 保存
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  <FaTimes /> 取消
                </button>
              </div>
            </form>
          ) : (
            <div className="info-display">
              <button 
                className="edit-btn"
                onClick={() => setIsEditing(true)}
              >
                <FaEdit /> 编辑资料
              </button>
              <div className="info-item">
                <label>昵称</label>
                <span>{formData.nickname || '未设置'}</span>
              </div>
              <div className="info-item">
                <label>学校</label>
                <span>{formData.school || '未设置'}</span>
              </div>
              {user.role === 'student' ? (
                <div className="info-item">
                  <label>班级</label>
                  <span>{formData.class || '未设置'}</span>
                </div>
              ) : (
                <>
                  <div className="info-item">
                    <label>任教科目</label>
                    <span>{formData.subject || '未设置'}</span>
                  </div>
                  <div className="info-item">
                    <label>职称</label>
                    <span>{formData.title || '未设置'}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="loading">加载中...</div>
      )}
    </div>
  );
}

export default ProfileEditor; 