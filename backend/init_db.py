import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User
from app.models.problem import Problem, UserProblemStatus, DailyUserSubmission
from app.models.test import Test, TestResult, QuestionStat
from datetime import datetime, timedelta
import json
import logging
from app.models.study_record import StudyStatistics
import random  # 添加random模块

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 自定义连续做题天数
STREAK_DAYS = 2

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
            
            # 导入测试结果数据
            test_results = load_test_results()
            result_count = 0
            stat_count = 0
            for item_type, item_data in test_results:
                if item_type == 'test_result':
                    result = TestResult(**item_data)
                    db.session.add(result)
                    result_count += 1
                else:  # question_stat
                    stat = QuestionStat(**item_data)
                    db.session.add(stat)
                    stat_count += 1
            db.session.commit()
            logger.info(f"已加载 {result_count} 份测试结果和 {stat_count} 条题目统计数据")
            
            # 添加做题记录和活动数据
            logger.info("开始添加做题记录和活动数据...")
            # 获取所有可用的题目
            all_problems = Problem.query.all()
            problem_ids = [p.id for p in all_problems]
            
            if len(problem_ids) > 0:
                # 使用字典记录每天的做题数量
                daily_submissions = {}
                
                # 生成30天内的随机做题记录
                current_date = datetime.now().date()
                days_range = 120  # 生成30天内的记录
                
                # 生成随机的做题日期
                # 通过在30天范围内随机选择日期来实现不规则间隔
                random_days = sorted(random.sample(range(days_range), 70))  # 在30天内随机选择15天
                
                for day in random_days:
                    submission_date = current_date - timedelta(days=day)
                    # 当天随机做1-10道题
                    daily_count = random.randint(1, 10)
                    
                    # 为这一天生成做题记录
                    for _ in range(daily_count):
                        # 随机选择一道题目
                        problem_id = random.choice(problem_ids)
                        # 随机生成提交时间（当天的随机时刻）
                        random_hour = random.randint(9, 22)  # 假设在9点到22点之间做题
                        random_minute = random.randint(0, 59)
                        submission_time = datetime.combine(
                            submission_date,
                            datetime.min.time()
                        ) + timedelta(hours=random_hour, minutes=random_minute)
                        
                        # 创建做题记录，80%的正确率
                        status = UserProblemStatus(
                            user_id=test_student.id,
                            problem_id=problem_id,
                            status='正确' if random.random() > 0.2 else '错误',
                            submitted_at=submission_time
                        )
                        db.session.add(status)
                    
                    # 记录这一天的做题数量
                    daily_submissions[submission_date] = daily_count
                    
                    # 每天的记录处理完后就提交一次
                    db.session.commit()
                
                # 创建每日提交记录
                for date, count in daily_submissions.items():
                    daily_record = DailyUserSubmission(
                        user_id=test_student.id,
                        submission_date=date,
                        count=count
                    )
                    db.session.add(daily_record)
                
                # 最后提交所有记录
                db.session.commit()
            
            # 更新用户的连续做题天数
            test_student.streak_days = STREAK_DAYS
            db.session.commit()
            
            logger.info("数据库初始化成功！")
            logger.info(f"- 添加了2个测试用户（学生和教师账号）")
            logger.info(f"- 添加了 {len(problems)} 道题目")
            logger.info(f"- 添加了 {len(tests)} 份测试")
            logger.info(f"- 添加了 {result_count} 份测试结果和 {stat_count} 条题目统计数据")
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
                
            # 获取测试教师的ID
            test_teacher = User.query.filter_by(username='test_teacher').first()
            if test_teacher:
                logger.info(f"找到测试教师ID: {test_teacher.id}")
            else:
                logger.warning("未找到测试教师账号")
                
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
                # 处理created_by字段
                if 'created_by' in test_data and test_data['created_by'] == 'teacher1':
                    if test_teacher:
                        test_data['created_by'] = test_teacher.id
                        logger.info(f"将测试 {test_data['title']} 的创建者设置为测试教师(ID: {test_teacher.id})")
                    else:
                        logger.warning(f"未找到测试教师账号，测试 {test_data['title']} 将没有创建者")
                        test_data['created_by'] = None
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

def load_test_results():
    file_path = os.path.join('data', 'tests', 'test_results.json')
    full_path = os.path.join(os.getcwd(), '..', file_path)
    logger.info(f"尝试读取测试结果文件: {full_path}")
    
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            results = []
            if isinstance(data, dict) and 'test_results' in data:
                for test_id, result_data in data['test_results'].items():
                    # 创建测试结果记录
                    test_result = {
                        'test_id': int(test_id),
                        'total_students': result_data['total_students'],
                        'completed_count': result_data['completed_count'],
                        'average_score': result_data['average_score'],
                        'average_time': result_data['average_time'],
                        'completion_rate': result_data['completion_rate'],
                        'pass_rate': result_data['pass_rate'],
                        'score_distribution': json.dumps(result_data['score_distribution'])
                    }
                    results.append(('test_result', test_result))
                    
                    # 为每个题目创建统计记录
                    for question_stat in result_data['question_stats']:
                        stat = {
                            'test_id': int(test_id),
                            'question_id': question_stat['question_id'],
                            'correct_rate': question_stat['correct_rate'],
                            'average_time': question_stat['average_time']
                        }
                        results.append(('question_stat', stat))
            return results
    except FileNotFoundError:
        logger.warning(f"Warning: {file_path} not found")
        return []
    except json.JSONDecodeError:
        logger.warning(f"Warning: {file_path} is not valid JSON")
        return []

if __name__ == '__main__':
    init_db() 