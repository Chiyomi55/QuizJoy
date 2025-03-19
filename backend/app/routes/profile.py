from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import json
from app.models.user import User
from app.models.study_record import StudyRecord, StudyStatistics, UserKnowledgeStatus
from app.models.problem import DailyUserSubmission, Problem, UserProblemStatus
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func

bp = Blueprint('profile', __name__, url_prefix='/api/profile')

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@bp.route('/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        user_id = get_jwt_identity()
        filename = f"avatar_{user_id}_{secure_filename(file.filename)}"
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        user = User.query.get(int(user_id))
        user.avatar_url = f"/uploads/{filename}"
        db.session.commit()
        
        return jsonify({'avatar_url': user.avatar_url})
    
    return jsonify({'error': 'File type not allowed'}), 400

@bp.route('/info', methods=['GET', 'PUT', 'PATCH'])
@jwt_required()
def handle_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if request.method == 'GET':
            # 获取用户所有信息
            response_data = user.to_dict()
            print(f"GET response data for {user.role}:", response_data)  # 添加角色信息
            return jsonify(response_data)
        
        if request.method in ['PUT', 'PATCH']:
            try:
                data = request.get_json()
                print(f"Received update data for {user.role}:", data)  # 添加角色信息
                print("Current user data before update:", user.to_dict())
                
                # 更新基本信息
                if 'nickname' in data:
                    user.nickname = data['nickname']
                    print(f"Updated nickname to: {data['nickname']}")
                if 'school' in data:
                    user.school = data['school']
                    print(f"Updated school to: {data['school']}")
                if 'bio' in data:
                    user.bio = data['bio']
                    print(f"Updated bio to: {data['bio']}")
                if 'phone' in data:
                    user.phone = data['phone']
                    print(f"Updated phone to: {data['phone']}")
                if 'email' in data:
                    user.email = data['email']
                    print(f"Updated email to: {data['email']}")
                
                # 根据角色更新特定字段
                if user.role == 'student':
                    if 'class' in data:
                        user.grade = data['class']  # 前端用 class，后端用 grade
                        print(f"Updated grade to: {data['class']}")
                elif user.role == 'teacher':
                    print("Processing teacher-specific fields...")  # 添加日志
                    if 'subject' in data:
                        print(f"Found subject in data: {data['subject']}")  # 添加日志
                        user.subject = data['subject']
                        print(f"Updated subject to: {user.subject}")  # 添加日志
                    if 'title' in data:
                        print(f"Found title in data: {data['title']}")  # 添加日志
                        user.title = data['title']
                        print(f"Updated title to: {user.title}")  # 添加日志
                
                # 更新成就
                if 'achievements' in data:
                    user.achievements = json.dumps(data['achievements'])
                
                print("User data before commit:", user.to_dict())
                db.session.commit()
                print("Database committed successfully")
                
                # 验证更新是否成功
                updated_user = User.query.get(int(user_id))
                print("User data after commit:", updated_user.to_dict())
                
                return jsonify(updated_user.to_dict())
                
            except Exception as e:
                db.session.rollback()
                print("Error details:", str(e))
                return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500
                
    except Exception as e:
        print("General error:", str(e))
        return jsonify({'error': str(e)}), 500

@bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_statistics():
    user_id = get_jwt_identity()
    stats = StudyStatistics.query.filter_by(user_id=int(user_id)).first()
    
    if not stats:
        stats = StudyStatistics(user_id=int(user_id))
        db.session.add(stats)
        db.session.commit()
    
    return jsonify({
        'total_study_time': stats.total_study_time,
        'total_problems': stats.total_problems,
        'correct_problems': stats.correct_problems,
        'streak_days': stats.streak_days
    })

@bp.route('/activity', methods=['GET'])
@jwt_required()
def get_activity():
    """获取用户的做题活动记录"""
    user_id = get_jwt_identity()
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=180)
    
    # 获取用户在时间范围内的每日提交记录
    submissions = DailyUserSubmission.query.filter(
        DailyUserSubmission.user_id == user_id,
        DailyUserSubmission.submission_date >= start_date,
        DailyUserSubmission.submission_date <= end_date
    ).all()
    
    # 转换为前端需要的格式
    activity_data = [submission.to_dict() for submission in submissions]
    
    return jsonify(activity_data)

@bp.route('/knowledge_status', methods=['GET'])
@jwt_required()
def get_knowledge_status():
    """获取用户知识点掌握度数据"""
    try:
        user_id = get_jwt_identity()
        print(f"Getting knowledge status for user {user_id}")
        
        # 获取用户所有做题记录
        problem_statuses = UserProblemStatus.query.filter_by(user_id=user_id).all()
        print(f"Found {len(problem_statuses)} problem statuses")
        
        # 统计每个知识点的正确率
        knowledge_stats = {}
        for status in problem_statuses:
            problem = Problem.query.get(status.problem_id)
            if not problem or not problem.topics:
                continue
                
            topics = problem.topics.split(',')
            for topic in topics:
                topic = topic.strip()  # 去除可能的空格
                if not topic:  # 跳过空字符串
                    continue
                    
                if topic not in knowledge_stats:
                    knowledge_stats[topic] = {'correct': 0, 'total': 0}
                
                knowledge_stats[topic]['total'] += 1
                if status.status == '正确':
                    knowledge_stats[topic]['correct'] += 1
        
        print(f"Knowledge stats: {knowledge_stats}")
        
        # 计算掌握度
        result = []
        for topic, stats in knowledge_stats.items():
            mastery = (stats['correct'] / stats['total']) * 100 if stats['total'] > 0 else 0
            result.append({
                'topic': topic,
                'mastery': round(mastery, 2)
            })
        
        print(f"Returning result: {result}")
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in get_knowledge_status: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/difficulty_distribution', methods=['GET'])
@jwt_required()
def get_difficulty_distribution():
    """获取用户不同难度题目的完成情况"""
    try:
        user_id = get_jwt_identity()
        print(f"Getting difficulty distribution for user {user_id}")
        
        # 获取用户所有做题记录
        problem_statuses = UserProblemStatus.query.filter_by(user_id=user_id).all()
        print(f"Found {len(problem_statuses)} problem statuses")
        
        # 统计每个难度的完成情况
        difficulty_stats = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        total_problems = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        
        for status in problem_statuses:
            problem = Problem.query.get(status.problem_id)
            if not problem:
                continue
                
            difficulty = problem.difficulty
            if difficulty not in difficulty_stats:  # 确保难度值在有效范围内
                continue
                
            total_problems[difficulty] += 1
            if status.status == '正确':
                difficulty_stats[difficulty] += 1
        
        print(f"Difficulty stats: {difficulty_stats}")
        print(f"Total problems: {total_problems}")
        
        # 计算完成率
        result = []
        for difficulty in range(1, 6):
            completion_rate = (difficulty_stats[difficulty] / total_problems[difficulty] * 100) if total_problems[difficulty] > 0 else 0
            result.append({
                'difficulty': difficulty,
                'completed': difficulty_stats[difficulty],
                'total': total_problems[difficulty],
                'completion_rate': round(completion_rate, 2)
            })
        
        print(f"Returning result: {result}")
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in get_difficulty_distribution: {str(e)}")
        return jsonify({'error': str(e)}), 500 