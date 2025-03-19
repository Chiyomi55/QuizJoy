from flask import Blueprint, jsonify, request
from app.models.problem import Problem, UserProblemStatus, DailyUserSubmission
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import json

bp = Blueprint('problems', __name__, url_prefix='/api/problems')

@bp.route('/', methods=['GET', 'OPTIONS'])
def get_problems():
    """
    获取题目列表
    - 无需JWT认证
    - 返回所有题目基本信息
    - 如果用户已登录，包含用户的做题状态
    """
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        # 查询所有题目
        problems = Problem.query.all()
        
        # 获取用户ID(如果已登录)
        auth_header = request.headers.get('Authorization')
        user_id = None
        if auth_header and auth_header.startswith('Bearer '):
            try:
                token = auth_header.split(' ')[1]
                user_id = get_jwt_identity()
            except:
                pass
        
        # 如果用户已登录，获取做题状态
        problem_statuses = {}
        if user_id:
            problem_statuses = {
                status.problem_id: status.status
                for status in UserProblemStatus.query.filter_by(user_id=int(user_id)).all()
            }
        
        # 构建返回数据
        result = [{
            'id': p.id,
            'title': p.title,
            'type': p.type,
            'difficulty': p.difficulty,
            'topics': p.topics.split(',') if p.topics else [],
            'options': json.loads(p.options) if p.options else [],
            'status': problem_statuses.get(p.id, '未完成') if user_id else None
        } for p in problems]
        
        return jsonify(result)
        
    except Exception as e:
        import traceback
        print("Error details:")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:problem_id>', methods=['GET'])
def get_problem(problem_id):
    """获取单个题目的详细信息"""
    try:
        problem = Problem.query.get_or_404(problem_id)
        return jsonify({
            'id': problem.id,
            'title': problem.title,
            'content': problem.content,
            'type': problem.type,
            'options': json.loads(problem.options) if problem.options else [],  # 解析JSON字符串
            'topics': problem.topics.split(',') if problem.topics else [],
            'difficulty': problem.difficulty
        })
    except Exception as e:
        print(f"Error fetching problem: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/', methods=['POST'])
def create_problem():
    """
    创建新题目
    - 接收题目的所有必要信息
    - 创建新的题目记录
    - 返回新创建的题目ID
    - TODO: 应该添加JWT认证和教师权限验证
    """
    data = request.get_json()
    problem = Problem(
        title=data['title'],
        content=data['content'],
        type=data['type'],
        difficulty=data['difficulty'],
        topics=','.join(data['topics']),
        options=data.get('options'),
        correct_answer=data['correctAnswer'],
        explanation=data.get('explanation')
    )
    db.session.add(problem)
    db.session.commit()
    return jsonify({'id': problem.id}), 201

@bp.route('/<int:id>/submit', methods=['POST'])
@jwt_required()
def submit_answer(id):
    try:
        user_id = get_jwt_identity()
        print(f"Processing submission for user {user_id}, problem {id}")
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        answer = data.get('answer')
        if answer is None:
            return jsonify({'error': 'No answer provided'}), 400
            
        print(f"Received answer: {answer}")
        
        problem = Problem.query.get_or_404(id)
        print(f"Problem found: {problem.id}, correct answer: {problem.correct_answer}")
        
        # 检查答案正确性
        is_correct = answer == problem.correct_answer
        print(f"Answer is correct: {is_correct}")
        
        # 更新或创建做题记录
        status = UserProblemStatus.query.filter_by(
            user_id=user_id,
            problem_id=id
        ).first()
        
        if not status:
            status = UserProblemStatus(
                user_id=user_id,
                problem_id=id,
                status='正确' if is_correct else '错误'
            )
            db.session.add(status)
        else:
            status.status = '正确' if is_correct else '错误'
            status.submitted_at = datetime.utcnow()
        
        # 更新每日提交记录
        today = datetime.now().date()
        daily_submission = DailyUserSubmission.query.filter_by(
            user_id=user_id,
            submission_date=today
        ).first()
        
        if not daily_submission:
            daily_submission = DailyUserSubmission(
                user_id=user_id,
                submission_date=today,
                count=1
            )
            db.session.add(daily_submission)
        else:
            daily_submission.count += 1
        
        db.session.commit()
        print(f"Status and daily submission updated successfully")
        
        response_data = {
            'correct': is_correct,
            'correct_answer': problem.correct_answer,
            'explanation': problem.explanation
        }
        print(f"Sending response: {response_data}")
        
        return jsonify(response_data)
        
    except Exception as e:
        import traceback
        print("Error in submit_answer:")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 