from flask import Blueprint, request, jsonify
from app.models.user import User
from app import db
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity

# 创建认证蓝图,设置URL前缀
bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    """
    用户登录接口
    - 接收用户名、密码和角色
    - 验证用户身份
    - 生成JWT令牌
    - 返回用户信息和令牌
    """
    # 处理预检请求
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        login_role = data.get('role')

        print(f"Login attempt - username: {username}, role: {login_role}")  # 调试日志

        if not username or not password or not login_role:
            return jsonify({"error": "Missing username, password or role"}), 400

        user = User.query.filter_by(username=username).first()
        
        if not user:
            return jsonify({"error": "用户不存在"}), 401
            
        if not user.check_password(password):
            return jsonify({"error": "密码错误"}), 401
            
        if user.role != login_role:
            return jsonify({"error": "账号与所选角色不匹配"}), 401
            
        # 创建 token
        access_token = create_access_token(identity=str(user.id))
        
        print(f"Login successful for user {username}")  # 调试日志
        
        return jsonify({
            'token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'nickname': user.nickname
            }
        })
        
    except Exception as e:
        print(f"Login error: {str(e)}")  # 调试日志
        return jsonify({"error": "登录失败，请稍后重试"}), 500

@bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """
    验证令牌有效性
    - 验证JWT令牌
    - 返回用户信息
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if user:
            return jsonify({
                'valid': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'role': user.role
                }
            })
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return jsonify({'valid': False}), 401
    
    return jsonify({'valid': False}), 401

@bp.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'error': 'Method not allowed'}), 405 