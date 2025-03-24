from app import db
from app.models.test import Test, TestSubmission, TestResult, QuestionStat
from app.models.user import User
from datetime import datetime
import json

def calculate_test_statistics(test_id):
    """计算测试的统计数据"""
    # 获取测试信息
    test = Test.query.get(test_id)
    if not test:
        return None
        
    # 获取所有学生提交记录
    submissions = TestSubmission.query.filter_by(test_id=test_id).all()
    if not submissions:
        return None
        
    # 计算基本统计数据
    total_students = User.query.filter_by(role='student').count()
    completed_count = len(submissions)
    total_score = sum(sub.score for sub in submissions)
    total_time = sum(sub.duration for sub in submissions)
    
    # 计算平均分和平均用时
    average_score = round(total_score / completed_count, 1) if completed_count > 0 else 0
    average_time = round(total_time / completed_count / 60) if completed_count > 0 else 0  # 转换为分钟
    
    # 计算完成率和及格率
    completion_rate = round(completed_count / total_students * 100, 1) if total_students > 0 else 0
    passed_count = sum(1 for sub in submissions if sub.score >= 60)
    pass_rate = round(passed_count / completed_count * 100, 1) if completed_count > 0 else 0
    
    # 计算分数分布
    score_distribution = {
        '90-100': sum(1 for sub in submissions if sub.score >= 90),
        '80-89': sum(1 for sub in submissions if 80 <= sub.score < 90),
        '60-79': sum(1 for sub in submissions if 60 <= sub.score < 80),
        '0-59': sum(1 for sub in submissions if sub.score < 60)
    }
    
    # 更新或创建测试结果记录
    test_result = TestResult.query.filter_by(test_id=test_id).first()
    if not test_result:
        test_result = TestResult(test_id=test_id)
        
    test_result.total_students = total_students
    test_result.completed_count = completed_count
    test_result.average_score = average_score
    test_result.average_time = average_time
    test_result.completion_rate = completion_rate
    test_result.pass_rate = pass_rate
    test_result.score_distribution = score_distribution
    test_result.last_updated = datetime.utcnow()
    
    db.session.add(test_result)
    
    # 计算每道题的统计数据
    problem_ids = [int(pid) for pid in test.problem_ids.split(',')]
    for problem_id in problem_ids:
        # 获取该题目的所有答案
        answers = [json.loads(sub.answers).get(str(problem_id)) for sub in submissions]
        correct_count = sum(1 for ans in answers if ans.get('is_correct', False))
        total_time = sum(ans.get('time_spent', 0) for ans in answers if ans.get('time_spent'))
        
        # 计算正确率和平均用时
        correct_rate = round(correct_count / len(answers), 2) if answers else 0
        avg_time = round(total_time / len(answers) / 60, 1) if answers else 0  # 转换为分钟
        
        # 更新或创建题目统计记录
        question_stat = QuestionStat.query.filter_by(
            test_id=test_id,
            question_id=problem_id
        ).first()
        
        if not question_stat:
            question_stat = QuestionStat(
                test_id=test_id,
                question_id=problem_id
            )
            
        question_stat.correct_rate = correct_rate
        question_stat.average_time = avg_time
        question_stat.last_updated = datetime.utcnow()
        
        db.session.add(question_stat)
    
    try:
        db.session.commit()
        return test_result.to_dict()
    except Exception as e:
        db.session.rollback()
        raise e

def get_test_statistics(test_id):
    """获取测试的统计数据"""
    # 获取基本统计数据
    test_result = TestResult.query.filter_by(test_id=test_id).first()
    if not test_result:
        # 如果没有统计数据，重新计算
        return calculate_test_statistics(test_id)
        
    # 获取题目统计数据
    question_stats = QuestionStat.query.filter_by(test_id=test_id).all()
    
    return {
        **test_result.to_dict(),
        'question_stats': [stat.to_dict() for stat in question_stats]
    }

def update_all_test_statistics():
    """更新所有测试的统计数据"""
    tests = Test.query.all()
    results = []
    for test in tests:
        try:
            result = calculate_test_statistics(test.id)
            if result:
                results.append(result)
        except Exception as e:
            print(f"更新测试 {test.id} 的统计数据时出错: {str(e)}")
    return results 