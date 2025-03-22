from flask import Blueprint, jsonify, request
from app.models.test import Test, TestQuestion, TestSubmission
from app.models.problem import Problem
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import json
from app.models.user import User

# 创建测试蓝图,设置URL前缀
bp = Blueprint('tests', __name__, url_prefix='/api/tests')

@bp.route('', methods=['GET', 'POST'])
@jwt_required()
def handle_tests():
    """处理测试相关的请求"""
    if request.method == 'GET':
        return get_tests()
    elif request.method == 'POST':
        return create_test()

@bp.route('/completed', methods=['GET'])
@jwt_required()
def handle_completed_tests():
    """处理已完成测试相关的请求"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': '未找到用户信息'}), 401
        
        # 获取用户已完成的测试ID列表
        completed_submissions = TestSubmission.query.filter_by(user_id=user_id).all()
        completed_test_ids = [sub.test_id for sub in completed_submissions]
        
        return jsonify(completed_test_ids)
        
    except Exception as e:
        print(f"Error fetching completed tests: {e}")
        return jsonify({'error': str(e)}), 500

def get_tests():
    """获取所有测试列表"""
    try:
        print("\n=== 开始处理获取测试列表请求 ===")
        print("请求头:", dict(request.headers))
        print("Authorization头:", request.headers.get('Authorization'))
        
        user_id = get_jwt_identity()
        print(f"当前用户ID: {user_id}")
        
        if not user_id:
            print("未找到用户ID")
            return jsonify({'error': '未找到用户信息'}), 401
            
        # 获取当前用户信息
        current_user = User.query.get(user_id)
        if not current_user:
            return jsonify({'error': '用户不存在'}), 404
            
        # 根据用户角色获取不同的测试列表
        if current_user.role == 'teacher':
            # 教师只能看到自己创建的测试
            tests = Test.query.filter_by(created_by=user_id).all()
        else:
            # 学生可以看到所有测试
            tests = Test.query.all()
            
        print(f"从数据库查询到 {len(tests)} 个测试")
        
        if not tests:
            print("没有找到任何测试")
            return jsonify([])
            
        # 获取用户已完成的测试ID列表
        completed_submissions = TestSubmission.query.filter_by(user_id=user_id).all()
        completed_test_ids = {sub.test_id for sub in completed_submissions}
        
        # 构建测试列表，并标记是否完成
        result = []
        for test in tests:
            test_data = {
                'id': test.id,
                'title': test.title,
                'description': test.description,
                'type': test.type,
                'total_questions': test.total_questions,
                'estimated_time': test.estimated_time,
                'topics': test.topics.split(',') if test.topics else [],
                'difficulty': test.difficulty,
                'created_at': test.created_at.isoformat() if test.created_at else None,
                'deadline': test.deadline.isoformat() if test.deadline else None,
                'created_by': test.created_by,
                'is_completed': test.id in completed_test_ids
            }
            result.append(test_data)
            
        # 对结果进行排序：未完成的在前，已完成的在后
        result.sort(key=lambda x: (x['is_completed'], -datetime.fromisoformat(x['created_at']).timestamp() if x['created_at'] else 0))
        
        print(f"返回 {len(result)} 个测试数据")
        return jsonify(result)
        
    except Exception as e:
        print(f"\n!!! 获取测试列表时发生错误 !!!")
        print(f"错误类型: {type(e).__name__}")
        print(f"错误信息: {str(e)}")
        import traceback
        print(f"错误堆栈:\n{traceback.format_exc()}")
        return jsonify({'error': '获取测试列表失败', 'msg': str(e)}), 500

def create_test():
    """
    创建新测试
    - 需要JWT认证
    - 仅教师可用
    - 接收测试基本信息和题目列表
    - 创建测试记录和对应的题目关联
    - 返回新创建的测试ID
    """
    try:
        print("\n=== 开始处理创建测试请求 ===")
        print("请求头:", dict(request.headers))
        print("Authorization头:", request.headers.get('Authorization'))
        
        teacher_id = get_jwt_identity()
        if not teacher_id:
            print("未找到用户ID")
            return jsonify({'error': '未找到用户信息'}), 401
            
        print(f"当前教师ID: {teacher_id}")
        
        data = request.get_json()
        print("接收到的数据:", data)
        
        # 验证必填字段
        required_fields = {
            'title': '标题',
            'type': '类型',
            'difficulty': '难度',
            'deadline': '截止日期',
            'estimated_time': '预计时间',
            'questions': '题目列表'
        }
        
        for field, name in required_fields.items():
            if field not in data:
                error_msg = f'缺少必填字段: {name}'
                print(error_msg)
                return jsonify({'error': error_msg}), 400
                
            if field == 'questions' and not data[field]:
                error_msg = '题目列表不能为空'
                print(error_msg)
                return jsonify({'error': error_msg}), 400
        
        # 验证字段类型和范围
        try:
            difficulty = int(data['difficulty'])
            if not 1 <= difficulty <= 5:
                return jsonify({'error': '难度必须在1-5之间'}), 400
                
            estimated_time = int(data['estimated_time'])
            if estimated_time < 1:
                return jsonify({'error': '预计时间必须大于0'}), 400
        except ValueError:
            return jsonify({'error': '难度和预计时间必须是数字'}), 400
            
        # 验证题目ID是否存在
        problem_ids = [str(q['problemId']) for q in data['questions']]
        problems = Problem.query.filter(Problem.id.in_([int(pid) for pid in problem_ids])).all()
        if len(problems) != len(problem_ids):
            print("部分题目ID不存在")
            return jsonify({'error': '部分题目不存在'}), 400
        
        try:
            # 尝试解析截止日期
            deadline = datetime.fromisoformat(data['deadline'].replace('Z', '+00:00'))
        except ValueError as e:
            print(f"截止日期格式错误: {e}")
            return jsonify({'error': '截止日期格式错误'}), 400
        
        # 创建测试基本信息
        test = Test(
            title=data['title'],
            type=data['type'],
            created_by=teacher_id,
            description=data.get('description', ''),
            difficulty=difficulty,
            deadline=deadline,
            estimated_time=estimated_time,
            topics=','.join(data.get('topics', [])),
            total_questions=len(data['questions']),
            problem_ids=','.join(problem_ids)
        )
        
        print("创建测试记录:", test.__dict__)
        db.session.add(test)
        db.session.commit()
        print(f"测试记录创建成功，ID: {test.id}")
        
        # 添加测试题目关联
        for i, q in enumerate(data['questions']):
            test_question = TestQuestion(
                test_id=test.id,
                problem_id=q['problemId'],
                order=i + 1  # 保持题目顺序
            )
            db.session.add(test_question)
            print(f"添加题目 {q['problemId']} 到位置 {i+1}")
        
        db.session.commit()
        print("题目关联创建成功")
        
        return jsonify({
            'id': test.id,
            'message': '测试创建成功'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"\n!!! 创建测试失败 !!!")
        print(f"错误类型: {type(e).__name__}")
        print(f"错误信息: {str(e)}")
        import traceback
        print(f"错误堆栈:\n{traceback.format_exc()}")
        return jsonify({
            'error': '创建测试失败',
            'msg': str(e),
            'type': type(e).__name__
        }), 500

@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_test_detail(id):
    """获取单个测试的详细信息"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': '未找到用户信息'}), 401
            
        test = Test.query.get_or_404(id)
        problem_ids = [int(pid) for pid in test.problem_ids.split(',')]
        problems = Problem.query.filter(Problem.id.in_(problem_ids)).all()
        
        # 按照problem_ids的顺序排序problems
        problems_dict = {p.id: p for p in problems}
        ordered_problems = [problems_dict[pid] for pid in problem_ids]
    
        return jsonify({
            'test_info': {
                'id': test.id,
                'title': test.title,
                'description': test.description,
                'type': test.type,
                'total_questions': test.total_questions,
                'estimated_time': test.estimated_time,
                'topics': test.topics.split(',') if test.topics else [],
                'difficulty': test.difficulty,
                'created_at': test.created_at.isoformat() if test.created_at else None,
                'deadline': test.deadline.isoformat() if test.deadline else None
            },
            'problems': [{
                'id': p.id,
                'title': p.title,
                'content': p.content,
                'type': p.type,
                'options': json.loads(p.options) if p.options else None,
                'topics': p.topics.split(',') if p.topics else []
            } for p in ordered_problems]
        })
    except Exception as e:
        print(f"Error fetching test detail: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>/submit', methods=['POST'])
@jwt_required()
def submit_test(id):
    """提交测试答案"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'answers' not in data:
            return jsonify({'error': 'No answers provided'}), 400
            
        test = Test.query.get_or_404(id)
        problems = Problem.query.filter(Problem.id.in_([int(pid) for pid in test.problem_ids.split(',')])).all()
        problems_dict = {str(p.id): p for p in problems}
        
        # 计算得分
        total_questions = len(problems)
        correct_count = 0
        for problem_id, answer in data['answers'].items():
            if problem_id in problems_dict:
                if str(answer) == str(problems_dict[problem_id].correct_answer):
                    correct_count += 1
        
        score = round((correct_count / total_questions) * 100, 1)  # 四舍五入到一位小数
        
        # 保存提交记录
        submission = TestSubmission(
            test_id=id,
            user_id=user_id,
            score=score,
            answers=json.dumps(data['answers']),
            duration=data.get('duration', 0)  # 添加做题时长
        )
        db.session.add(submission)
        db.session.commit()
        
        return jsonify({
            'score': score,
            'correct_count': correct_count,
            'total_questions': total_questions,
            'duration': data.get('duration', 0)
        })
        
    except Exception as e:
        print(f"Error submitting test: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:test_id>/result', methods=['GET'])
@jwt_required()
def get_test_result(test_id):
    """获取测试结果"""
    try:
        current_user_id = get_jwt_identity()
        
        # 获取测试信息
        test = Test.query.get_or_404(test_id)
        
        # 获取最新的提交记录
        submission = TestSubmission.query.filter_by(
            test_id=test_id,
            user_id=current_user_id
        ).order_by(TestSubmission.submit_time.desc()).first()
        
        if not submission:
            return jsonify({'error': '未找到测试提交记录'}), 404
            
        # 获取用户答案
        user_answers = json.loads(submission.answers)
        
        # 获取题目详情和正确答案
        problem_ids = [int(x) for x in test.problem_ids.split(',')]
        problems_details = []
        topic_stats = {}  # 知识点统计
        
        for pid in problem_ids:
            problem = Problem.query.get(pid)
            if not problem:
                continue
                
            # 处理每个题目的知识点统计
            if problem.topics:
                for topic in problem.topics.split(','):
                    if topic not in topic_stats:
                        topic_stats[topic] = {'correct': 0, 'total': 0}
                    topic_stats[topic]['total'] += 1
                    if str(user_answers.get(str(pid))) == str(problem.correct_answer):
                        topic_stats[topic]['correct'] += 1
            
            problems_details.append({
                'id': problem.id,
                'title': problem.title,
                'content': problem.content,
                'type': problem.type,
                'options': json.loads(problem.options) if problem.options else None,
                'topics': problem.topics.split(',') if problem.topics else [],
                'user_answer': user_answers.get(str(pid)),
                'correct_answer': problem.correct_answer,
                'explanation': problem.explanation,
                'is_correct': str(user_answers.get(str(pid))) == str(problem.correct_answer)
            })
        
        # 计算知识点掌握度
        topic_mastery = {}
        weak_topics = []
        for topic, stats in topic_stats.items():
            if stats['total'] > 0:
                accuracy = stats['correct'] / stats['total']
                topic_mastery[topic] = round(accuracy * 100, 2)
                if accuracy < 0.6:  # 低于60%认为是薄弱知识点
                    weak_topics.append({
                        'topic': topic,
                        'accuracy': accuracy * 100
                    })
        
        return jsonify({
            'test_info': test.to_dict(),
            'submission_info': {
                'score': submission.score,
                'submit_time': submission.submit_time.isoformat(),
                'duration': submission.duration,
                'correct_count': sum(1 for p in problems_details if p['is_correct']),
                'total_count': len(problems_details)
            },
            'topic_analysis': {
                'topic_mastery': topic_mastery,
                'weak_topics': sorted(weak_topics, key=lambda x: x['accuracy'])
            },
            'problems': problems_details
        })
        
    except Exception as e:
        print(f"Error getting test result: {e}")
        return jsonify({'error': str(e)}), 500 