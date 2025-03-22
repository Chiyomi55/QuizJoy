from app import db
from datetime import datetime

class Test(db.Model):
    __tablename__ = 'tests'  # 明确指定表名为 tests
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    type = db.Column(db.String(50), nullable=False)  # '月测', '模拟考', '周测', '单元测'
    total_questions = db.Column(db.Integer, nullable=False)
    estimated_time = db.Column(db.Integer, nullable=False)  # 预计完成时间（分钟）
    topics = db.Column(db.String(200))  # 知识点，存储为逗号分隔的字符串
    difficulty = db.Column(db.Integer, nullable=False)  # 1-5星难度
    problem_ids = db.Column(db.String(500))  # 题目ID列表，存储为逗号分隔的字符串
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    deadline = db.Column(db.DateTime, nullable=True)  # 截止时间，练习测试可以没有截止时间
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # 初始化的测试可以没有创建者

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'type': self.type,
            'total_questions': self.total_questions,
            'estimated_time': self.estimated_time,
            'topics': self.topics.split(',') if self.topics else [],
            'difficulty': self.difficulty,
            'problem_ids': [int(pid) for pid in self.problem_ids.split(',')] if self.problem_ids else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'created_by': self.created_by
        }

class TestQuestion(db.Model):
    __tablename__ = 'test_questions'
    
    id = db.Column(db.Integer, primary_key=True)
    test_id = db.Column(db.Integer, db.ForeignKey('tests.id'), nullable=False)
    problem_id = db.Column(db.Integer, db.ForeignKey('problems.id'), nullable=False)
    order = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'test_id': self.test_id,
            'problem_id': self.problem_id,
            'order': self.order
        }

class TestSubmission(db.Model):
    """测试提交记录"""
    __tablename__ = 'test_submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    test_id = db.Column(db.Integer, db.ForeignKey('tests.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    score = db.Column(db.Float, nullable=False)  # 得分
    answers = db.Column(db.Text, nullable=False)  # JSON格式存储答案
    duration = db.Column(db.Integer, default=0)  # 做题时长（秒）
    submit_time = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'test_id': self.test_id,
            'user_id': self.user_id,
            'score': self.score,
            'submit_time': self.submit_time.isoformat() if self.submit_time else None,
            'duration': self.duration,
            'answers': self.answers
        } 