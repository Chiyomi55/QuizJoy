from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
import os

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # 简化 CORS 配置
    CORS(app, 
         origins="http://localhost:3000",
         allow_headers=["Content-Type", "Authorization"],
         supports_credentials=True)
    
    db.init_app(app)
    jwt.init_app(app)
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Token has expired',
            'msg': '登录已过期，请重新登录'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'error': 'Invalid token',
            'msg': '无效的登录信息'
        }), 401
    
    from app.routes import auth, problems, tests, profile
    app.register_blueprint(auth.bp)
    app.register_blueprint(problems.bp)
    app.register_blueprint(tests.bp)
    app.register_blueprint(profile.bp)
    
    # 添加静态文件服务
    app.config['UPLOAD_FOLDER'] = Config.UPLOAD_FOLDER
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    return app 