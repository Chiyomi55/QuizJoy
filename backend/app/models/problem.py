from app import db
from datetime import datetime
import json

class Problem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 选择题、填空题、解答题
    difficulty = db.Column(db.Integer, nullable=False)  # 1-5星难度
    topics = db.Column(db.String(200))  # 知识点，存储为逗号分隔的字符串
    options = db.Column(db.Text)  # JSON格式存储选项
    correct_answer = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text)  # 解析
    related_problems = db.Column(db.String(200))  # 相关推荐题目ID，逗号分隔
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'type': self.type,
            'difficulty': self.difficulty,
            'topics': self.topics.split(',') if self.topics else [],
            'options': json.loads(self.options) if self.options else None,
            'explanation': self.explanation,
            'related_problems': [int(x) for x in self.related_problems.split(',')] if self.related_problems else []
        }

class UserProblemStatus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    problem_id = db.Column(db.Integer, db.ForeignKey('problem.id'), nullable=False)
    status = db.Column(db.String(20))  # '正确', '错误', '未完成'
    submit_count = db.Column(db.Integer, default=0)  # 提交次数
    last_submit_time = db.Column(db.DateTime)
    last_answer = db.Column(db.Text)  # 最后一次提交的答案
    time_spent = db.Column(db.Integer)  # 累计花费时间(秒)
    
    def to_dict(self):
        return {
            'problem_id': self.problem_id,
            'status': self.status,
            'submit_count': self.submit_count,
            'last_submit_time': self.last_submit_time.isoformat() if self.last_submit_time else None,
            'time_spent': self.time_spent
        } 