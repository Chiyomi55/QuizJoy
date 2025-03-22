from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from datetime import timedelta
import os

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    # 配置数据库
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 配置JWT
    app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # 在生产环境中使用更安全的密钥
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    
    # 配置CORS
    CORS(app, 
        resources={
            r"/api/*": {
                "origins": "http://localhost:3000",
                "allow_headers": ["Content-Type", "Authorization", "Accept"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "expose_headers": ["Content-Type", "Authorization"],
                "supports_credentials": False,
                "max_age": 120
            }
        }
    )
    
    # 初始化扩展
    db.init_app(app)
    jwt.init_app(app)
    
    # 注册蓝图
    from .routes import auth, problems, tests, profile
    app.register_blueprint(auth.bp)
    app.register_blueprint(problems.bp)
    app.register_blueprint(tests.bp)
    app.register_blueprint(profile.bp)
    
    return app 