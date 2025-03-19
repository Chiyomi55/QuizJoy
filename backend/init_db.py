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
            # 删除所有现有数据
            print("正在清理现有数据...")
            db.drop_all()
            db.create_all()
            print("数据库表已重新创建")
            
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
            print("已添加测试用户")
            
            # 导入题目数据
            problems = load_problems()
            for problem_data in problems:
                # 删除id字段，让数据库自动生成
                if 'id' in problem_data:
                    del problem_data['id']
                problem = Problem(**problem_data)
                db.session.add(problem)
            print(f"已加载 {len(problems)} 道题目")
            
            # 导入测试数据
            tests = load_tests()
            for test_data in tests:
                # 删除id字段，让数据库自动生成
                if 'id' in test_data:
                    del test_data['id']
                test = Test(**test_data)
                db.session.add(test)
            print(f"已加载 {len(tests)} 份测试")
            
            db.session.commit()
            print("数据库初始化成功！")
            
    except Exception as e:
        print(f"初始化数据库时出错: {e}")
        try:
            db.session.rollback()
        except:
            print("回滚失败，但这不影响数据库的重新初始化")

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
                # 删除id字段，让数据库自动生成
                if 'id' in test_data:
                    del test_data['id']
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