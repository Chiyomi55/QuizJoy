from app import db
from datetime import datetime
import json

class Problem(db.Model):
    __tablename__ = 'problems'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 题目类型：multiple_choice, fill_blank, solution
    difficulty = db.Column(db.Integer, nullable=False)  # 难度：1-5
    topics = db.Column(db.String(200))  # 知识点，用逗号分隔
    options = db.Column(db.Text)  # 选项，JSON格式存储
    correct_answer = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text)  # 解析
    related_problems = db.Column(db.String(200))  # 相关题目ID，用逗号分隔
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'type': self.type,
            'difficulty': self.difficulty,
            'topics': self.topics.split(',') if self.topics else [],
            'options': self.options,
            'correct_answer': self.correct_answer,
            'explanation': self.explanation,
            'related_problems': self.related_problems.split(',') if self.related_problems else [],
            'created_at': self.created_at.isoformat()
        }

class UserProblemStatus(db.Model):
    __tablename__ = 'user_problem_status'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    problem_id = db.Column(db.Integer, db.ForeignKey('problems.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False)  # 状态：正确、错误
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'problem_id': self.problem_id,
            'status': self.status,
            'submitted_at': self.submitted_at.isoformat()
        }

class DailyUserSubmission(db.Model):
    __tablename__ = 'daily_user_submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    submission_date = db.Column(db.Date, nullable=False)
    count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'date': self.submission_date.isoformat(),
            'count': self.count
        } 