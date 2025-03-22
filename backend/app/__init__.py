from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os

# 初始化数据库
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # 禁用URL末尾斜杠的严格匹配，避免重定向问题
    app.url_map.strict_slashes = False
    
    # 配置数据库
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 配置JWT
    app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # 请在生产环境中使用安全的密钥
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # 设置token永不过期
    
    # 配置CORS，采用更简洁和稳健的配置
    CORS(app, 
        resources={
            r"/api/*": {
                "origins": ["http://localhost:3000"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
                "allow_headers": ["Content-Type", "Authorization", "Accept"],
                "expose_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True,
                "max_age": 600,
                "send_wildcard": False
            }
        },
        supports_credentials=True
    )
    
    # 初始化扩展
    db.init_app(app)
    JWTManager(app)
    
    # 注册蓝图
    from app.routes import auth, problems, tests, profile, teacher
    app.register_blueprint(auth.bp)
    app.register_blueprint(problems.bp)
    app.register_blueprint(tests.bp)
    app.register_blueprint(profile.bp)
    app.register_blueprint(teacher.bp)
    
    # 确保实例文件夹存在
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
        
    # 创建数据库表
    with app.app_context():
        db.create_all()
        
    return app 