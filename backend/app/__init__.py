from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    # 配置
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # 请更改为安全的密钥
    
    # 初始化扩展
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    db.init_app(app)
    jwt.init_app(app)
    
    # 注册蓝图
    from app.routes.auth import bp as auth
    from app.routes.problems import bp as problems
    from app.routes.tests import bp as tests
    from app.routes.profile import bp as profile
    
    app.register_blueprint(auth)
    app.register_blueprint(problems)
    app.register_blueprint(tests)
    app.register_blueprint(profile)
    
    return app 