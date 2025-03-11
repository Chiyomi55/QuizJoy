from app import create_app, db
from app.models.user import User
from app.models.problem import Problem
from datetime import datetime
import json

app = create_app()

def init_db():
    with app.app_context():
        # 清空数据库
        db.drop_all()
        db.create_all()

        # 创建测试用户
        teacher = User(
            username='teacher',
            email='teacher@example.com',
            role='teacher'
        )
        teacher.set_password('123456')
        
        student = User(
            username='student',
            email='student@example.com',
            role='student'
        )
        student.set_password('123456')
        
        db.session.add(teacher)
        db.session.add(student)

        # 创建示例题目
        problems = [
            Problem(
                title='三角函数基本角的应用',
                content='已知正弦函数y=sin x的图像上有一点P(α, 0.5)，其中0°≤α≤90°，则α等于？',
                type='选择题',
                difficulty=3,
                topics='三角函数,基础题',
                options=json.dumps(['30°', '45°', '60°', '90°']),
                correct_answer='30°',
                explanation='解析：在[0°,90°]范围内，当sin x = 0.5时，x = 30°'
            ),
            Problem(
                title='数列求和技巧',
                content='求数列1, 1/2, 1/3, ..., 1/n的前n项和的渐近表达式',
                type='解答题',
                difficulty=4,
                topics='数列,求和',
                correct_answer='ln(n) + γ + O(1/n)',
                explanation='这是调和级数的求和...'
            ),
            Problem(
                title='概率统计基础问题',
                content='从一副扑克牌中随机抽取一张牌，抽到红桃的概率是多少？',
                type='选择题',
                difficulty=2,
                topics='概率统计,基础题',
                options=json.dumps(['1/4', '1/13', '1/2', '1/26']),
                correct_answer='1/4',
                explanation='一副扑克牌共52张，红桃13张，所以概率为13/52=1/4'
            )
        ]
        
        # 添加相关推荐
        problems[0].related_problems = '2,3'  # 第一题关联第二、三题
        problems[1].related_problems = '1,3'  # 第二题关联第一、三题
        problems[2].related_problems = '1,2'  # 第三题关联第一、二题

        # 在 problems 列表中添加新题目
        problems.extend([
            Problem(
                title='二次函数图像分析',
                content='已知抛物线y=ax²+bx+c(a≠0)与x轴交点为(-1,0)和(2,0)，顶点的y坐标为-3，求该二次函数的解析式。',
                type='解答题',
                difficulty=4,
                topics='二次函数,解析几何',
                correct_answer='y=-\frac{4}{3}x²+\frac{1}{3}x+2',
                explanation='1. 根据交点坐标，x=-1和x=2是方程ax²+bx+c=0的根\n2. 由韦达定理，-1+2=−\frac{b}{a}，(-1)(2)=\frac{c}{a}\n3. 顶点x坐标为−\frac{b}{2a}，代入得y=-3\n4. 解得a=-\frac{4}{3},b=\frac{1}{3},c=2'
            ),
            Problem(
                title='正弦函数周期性',
                content='函数f(x)=2sin(πx+π/6)的周期是多少？',
                type='填空题',
                difficulty=2,
                topics='三角函数,周期性',
                correct_answer='2',
                explanation='正弦函数y=sin(ax+b)的周期为2π/|a|，此处a=π，所以周期为2'
            ),
            Problem(
                title='立体几何体积计算',
                content='一个圆锥形容器，底面半径为3cm，高为4cm，现在向其中倒入2cm高的水，求水面的半径。',
                type='选择题',
                difficulty=3,
                topics='立体几何,相似',
                options=json.dumps(['1cm', '1.5cm', '2cm', '2.5cm']),
                correct_answer='1.5cm',
                explanation='根据相似三角形原理，水面半径:底面半径=水高:圆锥高，即x:3=2:4，解得x=1.5'
            ),
            Problem(
                title='数列极限计算',
                content='求数列an=n/(n²+1)的极限',
                type='填空题',
                difficulty=4,
                topics='数列,极限',
                correct_answer='0',
                explanation='分子分母同除n²，得到1/n/(1+1/n²)，当n→∞时，1/n→0，所以极限为0'
            ),
            Problem(
                title='概率计算进阶',
                content='袋中有3个红球，2个白球，现在随机取出2个球，求取出的两个球颜色相同的概率。',
                type='选择题',
                difficulty=3,
                topics='概率统计',
                options=json.dumps(['1/5', '2/5', '3/5', '4/5']),
                correct_answer='3/5',
                explanation='总共C(5,2)=10种可能，红球相同C(3,2)=3种，白球相同C(2,2)=1种，概率为4/10=2/5'
            ),
            Problem(
                title='导数应用',
                content='已知函数f(x)=x³-3x²+2在区间[0,2]上的最大值与最小值之差为k，求k的值。',
                type='解答题',
                difficulty=4,
                topics='导数,最值',
                correct_answer='4',
                explanation='1. f\'(x)=3x²-6x=3x(x-2)\n2. 驻点x=0,2\n3. 比较f(0)=2,f(2)=2,f(1)=-2\n4. 最大值2，最小值-2，差值为4'
            ),
            Problem(
                title='向量基础运算',
                content='若向量a=(1,2),b=(0,1),则|2a-b|=?',
                type='填空题',
                difficulty=2,
                topics='向量',
                correct_answer='3',
                explanation='2a-b=(2,4)-(0,1)=(2,3)，向量模长=√(2²+3²)=√13=3'
            ),
            Problem(
                title='圆锥曲线方程',
                content='过焦点F(1,0)的抛物线，准线为x=-1，其方程为？',
                type='选择题',
                difficulty=5,
                topics='圆锥曲线,解析几何',
                options=json.dumps(['y²=4x', 'y²=2x', 'y²=8x', 'y²=6x']),
                correct_answer='y²=8x',
                explanation='抛物线方程y²=4px，其中p为焦点到准线距离的一半。此题中距离为2，所以p=2，代入得y²=8x'
            ),
            Problem(
                title='复数运算',
                content='若复数z满足|z+1|+|z-1|=4，则|z|的最小值为？',
                type='填空题',
                difficulty=5,
                topics='复数,不等式',
                correct_answer='√3',
                explanation='根据复数几何意义，|z+1|+|z-1|=4表示z到点1和-1的距离之和为4，这构成一个椭圆。|z|表示z到原点的距离，最小值在椭圆上的最近点处取得，为√3'
            ),
            Problem(
                title='三角恒等变换',
                content='化简sin⁴x+cos⁴x',
                type='选择题',
                difficulty=3,
                topics='三角函数',
                options=json.dumps(['1', '1/2', '3/4', '1/4']),
                correct_answer='3/4',
                explanation='sin²x+cos²x=1\n平方得sin⁴x+2sin²xcos²x+cos⁴x=1\n所以sin⁴x+cos⁴x=1-2sin²xcos²x=1-2(1/4)=3/4'
            )
        ])

        # 在 problems.extend 中继续添加新题目
        problems.extend([
            Problem(
                title='空间向量垂直性',
                content='已知向量a=(1,1,1), b=(2,-1,k), 若a⊥b，求k的值。',
                type='填空题',
                difficulty=3,
                topics='空间向量,垂直',
                correct_answer='-1',
                explanation='向量垂直时，内积为0。即1×2+1×(-1)+1×k=0，解得k=-1'
            ),
            Problem(
                title='指数函数方程',
                content='解方程：2^(x²-1) = 8^(x-2)',
                type='解答题',
                difficulty=4,
                topics='指数函数,方程',
                correct_answer='x=3',
                explanation='1. 右边8^(x-2)=(2³)^(x-2)=2^(3x-6)\n2. 原方程变为2^(x²-1)=2^(3x-6)\n3. 指数相等，x²-1=3x-6\n4. x²-3x+5=0\n5. 解得x=3'
            ),
            Problem(
                title='几何概型',
                content='在边长为1的正方形内随机取一点，该点到正方形中心距离小于0.5的概率是多少？',
                type='选择题',
                difficulty=4,
                topics='概率统计,几何概型',
                options=json.dumps(['π/4', 'π/8', 'π/2', 'π/16']),
                correct_answer='π/4',
                explanation='符合条件的点构成一个半径为0.5的圆，概率为圆面积/正方形面积=π×0.5²/1=π/4'
            ),
            Problem(
                title='数列通项公式',
                content='数列{an}满足a₁=1，an+1=an+2n，求an的通项公式。',
                type='填空题',
                difficulty=3,
                topics='数列,通项',
                correct_answer='n²',
                explanation='an+1-an=2n，说明相邻项差构成等差数列，通过求和得到an=n²'
            ),
            Problem(
                title='立体几何截面',
                content='正方体被平面截得的截面最多有几个顶点？',
                type='选择题',
                difficulty=3,
                topics='立体几何,截面',
                options=json.dumps(['3', '4', '5', '6']),
                correct_answer='6',
                explanation='平面与正方体最多可以截出正六边形，因此最多有6个顶点'
            ),
            Problem(
                title='导数应用优化',
                content='一个长方形的周长固定为20，求其面积的最大值。',
                type='解答题',
                difficulty=3,
                topics='导数,最值',
                correct_answer='25',
                explanation='1. 设长为x，则宽为10-x\n2. 面积函数S=x(10-x)=-x²+10x\n3. S\'=-2x+10\n4. 令S\'=0解得x=5\n5. 代入得最大面积为25'
            ),
            Problem(
                title='三角函数方程',
                content='解方程：sin²x + sin x - 2 = 0（在区间[0,2π]内）',
                type='填空题',
                difficulty=4,
                topics='三角函数,方程',
                correct_answer='π',
                explanation='令t=sin x，则t²+t-2=0，解得t=-2或t=1\n在[0,2π]内，sin x=1时，x=π/2；sin x=-2无解\n所以x=π'
            ),
            Problem(
                title='椭圆方程',
                content='椭圆x²/9+y²/4=1的离心率是多少？',
                type='选择题',
                difficulty=4,
                topics='圆锥曲线',
                options=json.dumps(['1/3', '√5/3', '2/3', '√3/3']),
                correct_answer='√5/3',
                explanation='椭圆离心率e=√(1-b²/a²)，代入a²=9,b²=4，得e=√5/3'
            ),
            Problem(
                title='不等式证明',
                content='证明：对于任意正实数a,b，总有√(a²+b²)/2 ≥ √ab',
                type='解答题',
                difficulty=5,
                topics='不等式',
                correct_answer='证明略',
                explanation='1. 等价于(a²+b²)/2 ≥ ab\n2. 即a²-2ab+b² ≥ 0\n3. 即(a-b)² ≥ 0\n4. 显然成立'
            ),
            Problem(
                title='复数运算进阶',
                content='若复数z满足|z|=1且arg(z)=π/3，则z³的实部等于多少？',
                type='填空题',
                difficulty=5,
                topics='复数',
                correct_answer='-1',
                explanation='z=cos(π/3)+isin(π/3)，z³=cos(π)+isin(π)=-1+0i，所以实部为-1'
            )
        ])

        for problem in problems:
            db.session.add(problem)

        db.session.commit()
        print("Database initialized with sample problems!")

if __name__ == '__main__':
    init_db() 