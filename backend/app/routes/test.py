from flask import Blueprint, jsonify, request
from app.models.test import Test, TestSubmission
from app.services.test_service import calculate_test_statistics, get_test_statistics, update_all_test_statistics
from app.utils.auth import login_required, teacher_required
from app import db
from functools import wraps

test_bp = Blueprint('test', __name__, url_prefix='/api/tests')

def handle_options(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if request.method == 'OPTIONS':
            return '', 200
        return f(*args, **kwargs)
    return wrapped

@test_bp.route('', methods=['GET'])
@login_required
def get_tests():
    """获取测试列表"""
    try:
        # 如果是教师，获取自己创建的测试
        user_id = request.user_id
        if request.user_role == 'teacher':
            tests = Test.query.filter_by(created_by=user_id).all()
        # 如果是学生，获取所有测试
        else:
            tests = Test.query.all()
            
        return jsonify({
            'success': True,
            'data': [test.to_dict() for test in tests]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取测试列表失败: {str(e)}'
        }), 500

@test_bp.route('/<int:test_id>/statistics', methods=['GET', 'OPTIONS'])
@handle_options
@login_required
@teacher_required
def get_test_stats(test_id):
    """获取测试的统计数据"""
    try:
        stats = get_test_statistics(test_id)
        if not stats:
            return jsonify({
                'success': False,
                'message': '未找到测试或暂无统计数据'
            }), 404
            
        return jsonify({
            'success': True,
            'data': stats
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取测试统计数据失败: {str(e)}'
        }), 500

@test_bp.route('/<int:test_id>/statistics/refresh', methods=['POST', 'OPTIONS'])
@handle_options
@login_required
@teacher_required
def refresh_test_stats(test_id):
    """刷新测试的统计数据"""
    try:
        stats = calculate_test_statistics(test_id)
        if not stats:
            return jsonify({
                'success': False,
                'message': '未找到测试或暂无提交记录'
            }), 404
            
        return jsonify({
            'success': True,
            'data': stats
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'刷新测试统计数据失败: {str(e)}'
        }), 500

@test_bp.route('/statistics/refresh-all', methods=['POST', 'OPTIONS'])
@handle_options
@login_required
@teacher_required
def refresh_all_test_stats():
    """刷新所有测试的统计数据"""
    try:
        results = update_all_test_statistics()
        return jsonify({
            'success': True,
            'data': results
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'刷新所有测试统计数据失败: {str(e)}'
        }), 500 