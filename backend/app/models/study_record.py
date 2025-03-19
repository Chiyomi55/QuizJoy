from app import db
from datetime import datetime

class StudyRecord(db.Model):
    __tablename__ = 'study_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    study_time = db.Column(db.Integer)  # 学习时长（分钟）
    problems_solved = db.Column(db.Integer)  # 解决的题目数
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class StudyStatistics(db.Model):
    __tablename__ = 'study_statistics'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    total_study_time = db.Column(db.Integer, default=0)  # 总学习时长
    total_problems = db.Column(db.Integer, default=0)  # 总做题数
    correct_problems = db.Column(db.Integer, default=0)  # 正确题目数
    streak_days = db.Column(db.Integer, default=0)  # 连续学习天数
    last_study_date = db.Column(db.Date)  # 最后学习日期

class KnowledgePoint(db.Model):
    __tablename__ = 'knowledge_points'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    category = db.Column(db.String(32))  # 知识点分类

class UserKnowledgeStatus(db.Model):
    __tablename__ = 'user_knowledge_status'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    knowledge_id = db.Column(db.Integer, db.ForeignKey('knowledge_points.id'), nullable=False)
    mastery_level = db.Column(db.Integer)  # 掌握程度 1-100
    last_practice_date = db.Column(db.DateTime)
    practice_count = db.Column(db.Integer, default=0)  # 练习次数 