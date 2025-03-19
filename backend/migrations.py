from app import create_app, db
from app.models.user import User
from app.models.problem import Problem, UserProblemStatus
from app.models.test import Test, TestQuestion, TestSubmission
from app.models.study_record import StudyRecord, StudyStatistics, KnowledgePoint, UserKnowledgeStatus

app = create_app()

def upgrade_db():
    with app.app_context():
        # 删除所有表
        db.drop_all()
        
        # 创建新表
        db.create_all()
        
        # 创建默认知识点
        knowledge_points = [
            KnowledgePoint(name='三角函数', category='函数'),
            KnowledgePoint(name='数列', category='代数'),
            KnowledgePoint(name='概率统计', category='统计'),
            KnowledgePoint(name='立体几何', category='几何'),
        ]
        
        for kp in knowledge_points:
            db.session.add(kp)
        
        # 创建测试用户
        teacher = User(
            username='teacher',
            email='teacher@example.com',
            role='teacher',
            nickname='张老师',
            school='第一中学',
            subject='数学',
            title='高级教师'
        )
        teacher.set_password('123456')
        
        student = User(
            username='student',
            email='student@example.com',
            role='student',
            nickname='小明',
            school='第一中学',
            grade='高三(1)班'
        )
        student.set_password('123456')
        
        db.session.add(teacher)
        db.session.add(student)
        db.session.commit()

if __name__ == '__main__':
    upgrade_db() 