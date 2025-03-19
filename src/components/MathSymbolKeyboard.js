import React, { useState } from 'react';
import { Button, Popover, Tabs } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';
import './MathSymbolKeyboard.css';

const symbolGroups = {
    basic: {
        title: '基础',
        symbols: ['+', '-', '×', '÷', '=', '≠', '≈', '±', '∞']
    },
    exponent: {
        title: '指数',
        symbols: ['²', '³', '⁴', '√', '∛', '∜', 'ⁿ', 'ˣ', 'ʸ']
    },
    geometry: {
        title: '几何',
        symbols: ['°', '∠', '⊥', '∥', '△', '□', '○', '∈', '∉']
    },
    calculus: {
        title: '微积分',
        symbols: ['∫', '∑', '∏', '∂', 'δ', 'Δ', '∇', 'lim', '→']
    },
    set: {
        title: '集合',
        symbols: ['∪', '∩', '⊂', '⊃', '⊆', '⊇', '∅', '∀', '∃']
    }
};

const MathSymbolKeyboard = ({ onSymbolSelect }) => {
    const [visible, setVisible] = useState(false);

    const handleSymbolClick = (symbol) => {
        onSymbolSelect(symbol);
        setVisible(false);
    };

    const content = (
        <div className="math-symbol-keyboard">
            <Tabs
                items={Object.entries(symbolGroups).map(([key, group]) => ({
                    key,
                    label: group.title,
                    children: (
                        <div className="symbol-grid">
                            {group.symbols.map((symbol) => (
                                <Button
                                    key={symbol}
                                    className="symbol-button"
                                    onClick={() => handleSymbolClick(symbol)}
                                >
                                    {symbol}
                                </Button>
                            ))}
                        </div>
                    ),
                }))}
            />
        </div>
    );

    return (
        <Popover
            content={content}
            trigger="click"
            visible={visible}
            onVisibleChange={setVisible}
            placement="bottomRight"
            overlayClassName="math-symbol-keyboard-popover"
        >
            <Button
                type="text"
                icon={<CalculatorOutlined />}
                className="math-keyboard-trigger"
            />
        </Popover>
    );
};

export default MathSymbolKeyboard; 