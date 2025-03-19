from flask import Blueprint, jsonify, request
from models import Problem, db
from flask_jwt_extended import jwt_required, get_jwt_identity

problems = Blueprint('problems', __name__)

@problems.route('/api/problems/<int:problem_id>', methods=['GET'])
def get_problem(problem_id):
    try:
        problem = Problem.query.get(problem_id)
        if not problem:
            return jsonify({'message': '题目不存在'}), 404
            
        return jsonify({
            'id': problem.id,
            'title': problem.title,
            'content': problem.content,
            'difficulty': problem.difficulty,
            'knowledge_points': problem.knowledge_points,
            'answer': problem.answer,
            'explanation': problem.explanation
        })
    except Exception as e:
        return jsonify({'message': f'获取题目失败: {str(e)}'}), 500 