import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User
from app.models.problem import Problem, UserProblemStatus, DailyUserSubmission
from app.models.test import Test
from datetime import datetime, timedelta
import json
import logging
from app.models.study_record import StudyStatistics

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 自定义活动数据
ACTIVITY_DATA = {
    # 最近一周的数据
    "2024-03-01": 5,
    "2024-03-02": 3,
    "2024-03-03": 7,
    "2024-03-04": 4,
    "2024-03-05": 6,
    "2024-03-06": 8,
    "2024-03-07": 5,
    
    # 上周的数据
    "2024-02-23": 4,
    "2024-02-24": 6,
    "2024-02-25": 3,
    "2024-02-26": 7,
    "2024-02-27": 5,
    "2024-02-28": 4,
    "2024-02-29": 6,
    
    # 本月其他日期的数据
    "2024-02-15": 8,
    "2024-02-16": 5,
    "2024-02-17": 4,
    "2024-02-18": 6,
    "2024-02-19": 7,
    "2024-02-20": 3,
    
    # 上个月的一些数据
    "2024-01-25": 5,
    "2024-01-26": 4,
    "2024-01-27": 6,
    "2024-01-28": 7,
    "2024-01-29": 3,
    "2024-01-30": 5,
    "2024-01-31": 4,
}

# 自定义连续做题天数
STREAK_DAYS = 15

def init_db():
    try:
        app = create_app()
        with app.app_context():
            # 删除所有现有数据
            logger.info("正在清理现有数据...")
            db.drop_all()
            db.create_all()
            logger.info("数据库表已重新创建")
            
            # 添加测试用户
            logger.info("开始创建测试用户...")
            test_student = User(
                username='test_student',
                email='student@test.com',
                role='student',
                nickname='测试学生',
                school='测试中学',
                grade='高二(3)班',
                streak_days=STREAK_DAYS  # 设置连续做题天数
            )
            test_student.set_password('password123')
            
            test_teacher = User(
                username='test_teacher',
                email='teacher@test.com',
                role='teacher',
                nickname='测试教师',
                school='测试中学'
            )
            test_teacher.set_password('password123')
            
            db.session.add(test_student)
            db.session.add(test_teacher)
            db.session.commit()
            logger.info("测试用户创建成功")
            
            # 创建学习统计记录
            student_stats = StudyStatistics(
                user_id=test_student.id,
                total_study_time=180,  # 3小时
                total_problems=100,
                correct_problems=85,
                streak_days=STREAK_DAYS,
                last_study_date=datetime.now().date()
            )
            db.session.add(student_stats)
            db.session.commit()
            logger.info("学习统计记录创建成功")
            
            # 导入题目数据
            problems = load_problems()
            for problem_data in problems:
                # 删除id字段，让数据库自动生成
                if 'id' in problem_data:
                    del problem_data['id']
                problem = Problem(**problem_data)
                db.session.add(problem)
            logger.info(f"已加载 {len(problems)} 道题目")
            db.session.commit()
            
            # 导入测试数据
            tests = load_tests()
            for test_data in tests:
                # 删除id字段，让数据库自动生成
                if 'id' in test_data:
                    del test_data['id']
                test = Test(**test_data)
                db.session.add(test)
            logger.info(f"已加载 {len(tests)} 份测试")
            db.session.commit()
            
            # 添加做题记录和活动数据
            logger.info("开始添加做题记录和活动数据...")
            # 获取所有可用的题目
            all_problems = Problem.query.all()
            problem_ids = [p.id for p in all_problems]
            
            if len(problem_ids) > 0:
                # 使用字典记录每天的做题数量
                # 键：日期对象
                # 值：当天的做题数量
                daily_submissions = {}  
                
                # 遍历每道题目，创建做题记录
                for i, problem_id in enumerate(problem_ids):
                    # 计算提交日期：将题目分散到最近30天内
                    # 使用 i % 30 确保日期在30天范围内循环
                    submission_date = datetime.now().date() - timedelta(days=i % 30)
                    
                    # 创建做题状态记录
                    # 每三道题设置一道错误（i % 3 == 0 时为错误）
                    # submitted_at 设置为当天的开始时间（00:00:00）
                    status = UserProblemStatus(
                        user_id=test_student.id,
                        problem_id=problem_id,
                        status='正确' if i % 3 != 0 else '错误',
                        submitted_at=datetime.combine(submission_date, datetime.min.time())
                    )
                    db.session.add(status)
                    
                    # 统计每天的做题数量
                    # 如果这个日期已经有记录，就加1
                    # 如果这个日期还没有记录，就初始化为1
                    if submission_date in daily_submissions:
                        daily_submissions[submission_date] += 1
                    else:
                        daily_submissions[submission_date] = 1
                    
                    # 性能优化：每10条记录提交一次
                    # 避免一次性提交太多记录导致数据库压力过大
                    if (i + 1) % 10 == 0:
                        db.session.commit()
                
                # 根据统计的每日做题数量，创建活动记录
                for date, count in daily_submissions.items():
                    # 创建每日提交记录
                    # 这些记录将用于前端显示活动热力图
                    daily_record = DailyUserSubmission(
                        user_id=test_student.id,
                        submission_date=date,
                        count=count  # 使用统计的做题数量
                    )
                    db.session.add(daily_record)
                    logger.info(f"添加活动数据: 日期={date}, 提交次数={count}")
                
                # 最后提交所有未提交的记录
                db.session.commit()
            
            # 更新用户的连续做题天数
            test_student.streak_days = STREAK_DAYS
            db.session.commit()
            
            logger.info("数据库初始化成功！")
            logger.info(f"- 添加了2个测试用户（学生和教师账号）")
            logger.info(f"- 添加了 {len(problems)} 道题目")
            logger.info(f"- 添加了 {len(tests)} 份测试")
            logger.info(f"- 添加了活动数据和对应的做题记录")
            logger.info(f"- 设置了 {STREAK_DAYS} 天的连续做题天数")
            
    except Exception as e:
        logger.error(f"初始化数据库时出错: {e}")
        try:
            db.session.rollback()
        except:
            logger.error("回滚失败，但这不影响数据库的重新初始化")
        raise  # 重新抛出异常，确保错误不会被静默处理

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