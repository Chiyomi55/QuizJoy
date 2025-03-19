from flask import Blueprint, jsonify, request
from app.models.test import Test, TestQuestion, TestSubmission
from app.models.problem import Problem
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import json

# 创建测试蓝图,设置URL前缀
bp = Blueprint('tests', __name__, url_prefix='/api/tests')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_tests():
    """获取所有测试列表"""
    try:
        print("\n=== 开始处理获取测试列表请求 ===")
        print("请求头:", dict(request.headers))
        print("Authorization头:", request.headers.get('Authorization'))
        
    user_id = get_jwt_identity()
        print(f"当前用户ID: {user_id}")
        
        if not user_id:
            print("未找到用户ID")
            return jsonify({'error': '未找到用户信息'}), 401
        
    tests = Test.query.all()
        print(f"从数据库查询到 {len(tests)} 个测试")
        
        if not tests:
            print("没有找到任何测试")
            return jsonify([])
        
        result = [{
            'id': test.id,
            'title': test.title,
            'description': test.description,
            'type': test.type,
            'total_questions': test.total_questions,
            'estimated_time': test.estimated_time,
            'topics': test.topics.split(',') if test.topics else [],
            'difficulty': test.difficulty,
            'created_at': test.created_at.isoformat() if test.created_at else None,
            'deadline': test.deadline.isoformat() if test.deadline else None
        } for test in tests]
        
        print(f"返回 {len(result)} 个测试数据")
        return jsonify(result)
        
    except Exception as e:
        print(f"\n!!! 获取测试列表时发生错误 !!!")
        print(f"错误类型: {type(e).__name__}")
        print(f"错误信息: {str(e)}")
        import traceback
        print(f"错误堆栈:\n{traceback.format_exc()}")
        return jsonify({'error': '获取测试列表失败', 'msg': str(e)}), 500

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
def get_test_detail(id):
    """获取单个测试的详细信息"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': '未找到用户信息'}), 401
            
    test = Test.query.get_or_404(id)
        problem_ids = [int(pid) for pid in test.problem_ids.split(',')]
        problems = Problem.query.filter(Problem.id.in_(problem_ids)).all()
        
        # 按照problem_ids的顺序排序problems
        problems_dict = {p.id: p for p in problems}
        ordered_problems = [problems_dict[pid] for pid in problem_ids]
    
    return jsonify({
            'test_info': {
        'id': test.id,
        'title': test.title,
                'description': test.description,
        'type': test.type,
                'total_questions': test.total_questions,
                'estimated_time': test.estimated_time,
                'topics': test.topics.split(',') if test.topics else [],
        'difficulty': test.difficulty,
                'created_at': test.created_at.isoformat() if test.created_at else None,
                'deadline': test.deadline.isoformat() if test.deadline else None
            },
            'problems': [{
                'id': p.id,
                'title': p.title,
                'content': p.content,
                'type': p.type,
                'options': json.loads(p.options) if p.options else None,
                'topics': p.topics.split(',') if p.topics else []
            } for p in ordered_problems]
        })
    except Exception as e:
        print(f"Error fetching test detail: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>/submit', methods=['POST'])
@jwt_required()
def submit_test(id):
    """提交测试答案"""
    try:
    user_id = get_jwt_identity()
    data = request.get_json()
    
        if not data or 'answers' not in data:
            return jsonify({'error': 'No answers provided'}), 400
            
        test = Test.query.get_or_404(id)
        problems = Problem.query.filter(Problem.id.in_([int(pid) for pid in test.problem_ids.split(',')])).all()
        problems_dict = {str(p.id): p for p in problems}
        
        # 计算得分
        total_questions = len(problems)
        correct_count = 0
        for problem_id, answer in data['answers'].items():
            if problem_id in problems_dict:
                if str(answer) == str(problems_dict[problem_id].correct_answer):
                    correct_count += 1
        
        score = (correct_count / total_questions) * 100
        
        # 保存提交记录
    submission = TestSubmission(
        test_id=id,
        user_id=user_id,
            score=score,
            answers=json.dumps(data['answers']),
            duration=data.get('duration', 0)  # 添加做题时长
    )
    db.session.add(submission)
    db.session.commit()
    
        return jsonify({
            'score': score,
            'correct_count': correct_count,
            'total_questions': total_questions,
            'duration': data.get('duration', 0)
        })
        
    except Exception as e:
        print(f"Error submitting test: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:test_id>/result', methods=['GET'])
@jwt_required()
def get_test_result(test_id):
    try:
        current_user_id = get_jwt_identity()
        
        # 获取测试信息
        test = Test.query.get_or_404(test_id)
        
        # 获取最新的提交记录
        submission = TestSubmission.query.filter_by(
            test_id=test_id,
            user_id=current_user_id
        ).order_by(TestSubmission.submit_time.desc()).first()
        
        if not submission:
            return jsonify({'error': '未找到测试提交记录'}), 404
            
        # 获取用户答案
        user_answers = json.loads(submission.answers)
        
        # 获取题目详情和正确答案
        problem_ids = [int(x) for x in test.problem_ids.split(',')]
        problems_details = []
        topic_stats = {}  # 知识点统计
        
        for pid in problem_ids:
            problem = Problem.query.get(pid)
            if not problem:
                continue
                
            # 处理每个题目的知识点统计
            if problem.topics:
                for topic in problem.topics.split(','):
                    if topic not in topic_stats:
                        topic_stats[topic] = {'correct': 0, 'total': 0}
                    topic_stats[topic]['total'] += 1
                    if str(user_answers.get(str(pid))) == str(problem.correct_answer):
                        topic_stats[topic]['correct'] += 1
            
            problems_details.append({
                'id': problem.id,
                'title': problem.title,
                'content': problem.content,
                'type': problem.type,
                'options': json.loads(problem.options) if problem.options else None,
                'topics': problem.topics.split(',') if problem.topics else [],
                'user_answer': user_answers.get(str(pid)),
                'correct_answer': problem.correct_answer,
                'explanation': problem.explanation,
                'is_correct': str(user_answers.get(str(pid))) == str(problem.correct_answer)
            })
        
        # 计算知识点掌握度
        topic_mastery = {}
        weak_topics = []
        for topic, stats in topic_stats.items():
            if stats['total'] > 0:
                accuracy = stats['correct'] / stats['total']
                topic_mastery[topic] = round(accuracy * 100, 2)
                if accuracy < 0.6:  # 低于60%认为是薄弱知识点
                    weak_topics.append({
                        'topic': topic,
                        'accuracy': accuracy * 100
                    })
        
        return jsonify({
            'test_info': test.to_dict(),
            'submission_info': {
                'score': submission.score,
                'submit_time': submission.submit_time.isoformat(),
                'duration': submission.duration,
                'correct_count': sum(1 for p in problems_details if p['is_correct']),
                'total_count': len(problems_details)
            },
            'topic_analysis': {
                'topic_mastery': topic_mastery,
                'weak_topics': sorted(weak_topics, key=lambda x: x['accuracy'])
            },
            'problems': problems_details
        })
        
    except Exception as e:
        print(f"Error getting test result: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/completed', methods=['GET'])
@jwt_required()
def get_completed_tests():
    """获取用户已完成的测试ID列表"""
    try:
        user_id = get_jwt_identity()
        
        # 获取用户所有已完成的测试提交记录
        submissions = TestSubmission.query.filter_by(user_id=user_id).all()
        
        # 提取已完成测试的ID
        completed_test_ids = [submission.test_id for submission in submissions]
        
        return jsonify(completed_test_ids)
        
    except Exception as e:
        print(f"Error getting completed tests: {e}")
        return jsonify({'error': str(e)}), 500 