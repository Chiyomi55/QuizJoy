from flask import Blueprint, jsonify, request
from app.models import db, Test
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from datetime import datetime, timedelta
import random

bp = Blueprint('teacher', __name__, url_prefix='/api/teacher')

@bp.route('/tests/<int:test_id>/stats')
def get_test_stats(test_id):
    test = Test.query.get_or_404(test_id)
    
    # 模拟测试统计数据
    total_students = 30
    completed_count = 25
    
    # 生成分数分布数据
    score_ranges = ['0-60', '60-70', '70-80', '80-90', '90-100']
    score_distribution = [
        {'range': score_range, 'count': random.randint(2, 8)}
        for score_range in score_ranges
    ]
    
    # 生成知识点掌握情况数据
    topics = test.topics.split(',')
    topic_mastery = [
        {'topic': topic, 'value': random.randint(60, 95)}
        for topic in topics
    ]
    
    # 生成题目统计数据
    question_stats = []
    for i, problem_id in enumerate(test.problem_ids.split(',')):
        correct_rate = random.randint(50, 95)
        question_stats.append({
            'title': f'第{i+1}题',
            'topics': topics,
            'difficulty': random.randint(1, 5),
            'correct_rate': correct_rate,
            'average_time': round(random.uniform(2, 8), 1),
            'common_mistakes': [
                {
                    'count': random.randint(2, 8),
                    'description': '计算错误' if i % 2 == 0 else '概念理解有误'
                },
                {
                    'count': random.randint(1, 5),
                    'description': '未完成推导' if i % 2 == 0 else '方法使用不当'
                }
            ]
        })
    
    return jsonify({
        'title': test.title,
        'deadline': test.deadline,
        'difficulty': test.difficulty,
        'estimated_time': test.estimated_time,
        'total_students': total_students,
        'completed_count': completed_count,
        'completion_rate': (completed_count / total_students) * 100,
        'average_score': round(random.uniform(75, 85), 1),
        'average_time': random.randint(45, 75),
        'score_distribution': score_distribution,
        'topic_mastery': topic_mastery,
        'question_stats': question_stats
    }) 