from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'  # 明确指定表名为 users
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), nullable=False)  # 'student' or 'teacher'
    
    # 共用字段
    nickname = db.Column(db.String(80))
    school = db.Column(db.String(120))
    grade = db.Column(db.String(80))  # 学生的班级
    achievements = db.Column(db.Text)  # JSON格式存储成就列表
    phone = db.Column(db.String(20))   # 添加手机号字段
    
    # 教师特有字段
    subject = db.Column(db.String(80))  # 任教科目
    title = db.Column(db.String(80))    # 职称
    
    # 新增个人资料字段
    avatar_url = db.Column(db.String(256))  # 头像URL
    bio = db.Column(db.Text)  # 个人简介
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)  # 最后登录时间

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'nickname': self.nickname,
            'school': self.school,
            'grade': self.grade,
            'bio': self.bio,
            'avatar_url': self.avatar_url,
            'phone': self.phone,  # 添加手机号
            'subject': self.subject if self.role == 'teacher' else None,
            'title': self.title if self.role == 'teacher' else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        } 