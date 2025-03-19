import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User
from app.models.problem import Problem
from app.models.test import Test
from datetime import datetime
import json
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    try:
        app = create_app()
    with app.app_context():
            # 创建所有表
        db.create_all()

            # 添加测试用户
            test_user = User(
                username='test_student',
                email='test_student@example.com',
            role='student'
            )
            test_user.set_password('password123')
            
            test_teacher = User(
                username='test_teacher',
                email='test_teacher@example.com',
                role='teacher'
            )
            test_teacher.set_password('password123')
            
            db.session.add(test_user)
            db.session.add(test_teacher)
            
            # 导入题目数据
            problems = load_problems()
            for problem_data in problems:
                problem = Problem(**problem_data)
            db.session.add(problem)

            # 导入测试数据
            tests = load_tests()
            for test_data in tests:
                test = Test(**test_data)
                db.session.add(test)
            
        db.session.commit()
            print("Database initialized successfully!")
            print(f"Imported {len(problems)} problems and {len(tests)} tests")
            
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.session.rollback()

def load_problems():
    problem_types = ['multiple_choice', 'fill_blank', 'solution']
    problems = []
    
    for type_name in problem_types:
        file_path = os.path.join('data', 'problems', f'{type_name}.json')
        full_path = os.path.join(os.getcwd(), '..', file_path)
        logger.info(f"尝试读取文件: {full_path}")
        
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # 确保data是一个字典，并且包含problems键
                if isinstance(data, dict) and 'problems' in data:
                    for problem in data['problems']:
                        # 处理选项，确保是JSON字符串
                        if 'options' in problem:
                            problem['options'] = json.dumps(problem['options'])
                        # 处理topics，确保是逗号分隔的字符串
                        if 'topics' in problem and isinstance(problem['topics'], list):
                            problem['topics'] = ','.join(problem['topics'])
                        problems.append(problem)
                elif isinstance(data, list):
                    # 如果直接是列表，就直接处理每个题目
                    for problem in data:
                        if 'options' in problem:
                            problem['options'] = json.dumps(problem['options'])
                        if 'topics' in problem and isinstance(problem['topics'], list):
                            problem['topics'] = ','.join(problem['topics'])
                        problems.append(problem)
        except FileNotFoundError:
            logger.warning(f"Warning: {file_path} not found")
        except json.JSONDecodeError:
            logger.warning(f"Warning: {file_path} is not valid JSON")
        except Exception as e:
            logger.error(f"Error processing {file_path}: {e}")
    
    return problems

def load_tests():
    file_path = os.path.join('data', 'tests', 'test_papers.json')
    full_path = os.path.join(os.getcwd(), '..', file_path)
    logger.info(f"尝试读取测试题单文件: {full_path}")
    
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            tests = []
            # 确保data是一个字典，并且包含tests键
            if isinstance(data, dict) and 'tests' in data:
                test_list = data['tests']
            else:
                test_list = data
                
            for test_data in test_list:
                # 处理topics，确保是逗号分隔的字符串
                if 'topics' in test_data and isinstance(test_data['topics'], list):
                    test_data['topics'] = ','.join(test_data['topics'])
                # 处理problem_ids，确保是逗号分隔的字符串
                if 'problem_ids' in test_data and isinstance(test_data['problem_ids'], list):
                    test_data['problem_ids'] = ','.join(map(str, test_data['problem_ids']))
                # 处理日期字段
                if 'created_at' in test_data:
                    test_data['created_at'] = datetime.fromisoformat(test_data['created_at'].replace('Z', '+00:00'))
                if 'deadline' in test_data and test_data['deadline']:
                    test_data['deadline'] = datetime.fromisoformat(test_data['deadline'].replace('Z', '+00:00'))
                tests.append(test_data)
            return tests
    except FileNotFoundError:
        logger.warning(f"Warning: {file_path} not found")
        return []
    except json.JSONDecodeError:
        logger.warning(f"Warning: {file_path} is not valid JSON")
        return []
    except Exception as e:
        logger.error(f"Error loading tests: {str(e)}")
        return []

if __name__ == '__main__':
    init_db() 