const morandiColors = {
    primary: '#F2A6A6',    // 主色调（粉色）
    secondary: '#F7D1D1',  // 浅粉色
    submit: '#A5C9C4'      // 提交按钮 - 莫兰迪绿
};

// 选项按钮样式
const optionStyle = {
    backgroundColor: '#fff',
    borderColor: morandiColors.primary,
    color: morandiColors.primary,
    '&:hover': {
        backgroundColor: morandiColors.secondary,
        borderColor: morandiColors.primary,
        color: morandiColors.primary
    },
    '&.selected': {
        backgroundColor: morandiColors.primary,
        borderColor: morandiColors.primary,
        color: '#fff'
    }
};

// 导航按钮样式
const buttonStyle = {
    next: {
        backgroundColor: morandiColors.primary,
        borderColor: morandiColors.primary,
        color: '#fff',
        '&:hover': {
            backgroundColor: morandiColors.secondary,
            borderColor: morandiColors.primary
        }
    },
    prev: {
        backgroundColor: morandiColors.primary,
        borderColor: morandiColors.primary,
        color: '#fff',
        '&:hover': {
            backgroundColor: morandiColors.secondary,
            borderColor: morandiColors.primary
        }
    },
    submit: {
        backgroundColor: morandiColors.submit,
        borderColor: morandiColors.submit,
        color: '#fff',
        '&:hover': {
            backgroundColor: '#B5D4D0',
            borderColor: '#B5D4D0'
        }
    }
};

<div className="test-navigation">
    <Button 
        type="primary" 
        onClick={handlePrev}
        disabled={currentIndex === 0}
        style={buttonStyle.prev}
    >
        上一题
    </Button>
    <Button 
        type="primary" 
        onClick={handleNext}
        disabled={currentIndex === test.problems.length - 1}
        style={buttonStyle.next}
    >
        下一题
    </Button>
    {currentIndex === test.problems.length - 1 && (
        <Button 
            type="primary" 
            onClick={handleSubmit}
            style={buttonStyle.submit}
        >
            提交
        </Button>
    )}
</div> 