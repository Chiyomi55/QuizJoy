from flask import Blueprint, jsonify, request
from app.models import db, Problem, UserProblemStatus, DailyUserSubmission, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import json

bp = Blueprint('problems', __name__, url_prefix='/api/problems')

@bp.route('', methods=['GET'])
@jwt_required()
def get_problems():
    """获取所有题目列表"""
    try:
        print("\n=== 开始处理获取题目列表请求 ===")
        print("请求头:", dict(request.headers))
        print("Authorization头:", request.headers.get('Authorization'))
        
        current_user_id = get_jwt_identity()
        if not current_user_id:
            print("未找到用户ID")
            return jsonify({'error': '未找到用户信息'}), 401
            
        print(f"当前用户ID: {current_user_id}")
        
        # 获取所有题目
        problems = Problem.query.all()
        print(f"从数据库查询到 {len(problems)} 个题目")
        
        if not problems:
            print("没有找到任何题目")
            return jsonify([])
        
        result = [{
            'id': problem.id,
            'title': problem.title,
            'content': problem.content,
            'type': problem.type,
            'difficulty': problem.difficulty,
            'topics': problem.topics.split(',') if problem.topics else [],
            'options': json.loads(problem.options) if problem.options else None
        } for problem in problems]
        
        print(f"返回 {len(result)} 个题目数据")
        return jsonify(result)
        
    except Exception as e:
        print(f"\n!!! 获取题目列表时发生错误 !!!")
        print(f"错误类型: {type(e).__name__}")
        print(f"错误信息: {str(e)}")
        import traceback
        print(f"错误堆栈:\n{traceback.format_exc()}")
        return jsonify({'error': '获取题目列表失败', 'msg': str(e)}), 500

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