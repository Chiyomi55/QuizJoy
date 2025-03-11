from flask import Blueprint, jsonify, request
from app.models.test import Test, TestQuestion, TestSubmission
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity

# 创建测试蓝图,设置URL前缀
bp = Blueprint('tests', __name__, url_prefix='/api/tests')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_tests():
    """
    获取测试列表
    - 需要JWT认证
    - 返回所有可见的测试列表
    - 包含测试的基本信息（标题、类型、难度等）
    - 返回ISO格式的截止日期和创建时间
    """
    user_id = get_jwt_identity()
    tests = Test.query.all()
    return jsonify([{
        'id': t.id,
        'title': t.title,
        'type': t.type,
        'difficulty': t.difficulty,
        'deadline': t.deadline.isoformat(),
        'created_at': t.created_at.isoformat()
    } for t in tests])

@bp.route('/', methods=['POST'])
@jwt_required()
def create_test():
    """
    创建新测试
    - 需要JWT认证
    - 仅教师可用
    - 接收测试基本信息和题目列表
    - 创建测试记录和对应的题目关联
    - 返回新创建的测试ID
    """
    teacher_id = get_jwt_identity()
    data = request.get_json()
    
    # 创建测试基本信息
    test = Test(
        title=data['title'],
        type=data['type'],
        teacher_id=teacher_id,
        difficulty=data['difficulty'],
        deadline=data['deadline']
    )
    
    db.session.add(test)
    db.session.commit()
    
    # 添加测试题目
    for i, q in enumerate(data['questions']):
        test_question = TestQuestion(
            test_id=test.id,
            problem_id=q['problemId'],
            order=i + 1  # 保持题目顺序
        )
        db.session.add(test_question)
    
    db.session.commit()
    return jsonify({'id': test.id}), 201

@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_test(id):
    """
    获取单个测试详情
    - 需要JWT认证
    - 返回测试的完整信息
    - 包含所有题目的详细信息
    - 返回ISO格式的截止日期
    """
    test = Test.query.get_or_404(id)
    questions = test.get_questions()
    
    return jsonify({
        'id': test.id,
        'title': test.title,
        'type': test.type,
        'difficulty': test.difficulty,
        'deadline': test.deadline.isoformat(),
        'questions': [{
            'id': q.id,
            'problem_id': q.problem_id,
            'order': q.order
        } for q in questions]
    })

@bp.route('/<int:id>/submit', methods=['POST'])
@jwt_required()
def submit_test(id):
    """
    提交测试答案
    - 需要JWT认证
    - 记录学生的答案和得分
    - 创建提交记录
    - 返回提交记录ID
    - TODO: 应该添加截止日期检查
    - TODO: 应该添加重复提交检查
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    submission = TestSubmission(
        test_id=id,
        user_id=user_id,
        score=data['score'],
        answers=data['answers']  # JSON格式存储所有答案
    )
    
    db.session.add(submission)
    db.session.commit()
    
    return jsonify({'id': submission.id}), 201 