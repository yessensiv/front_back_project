class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.clear();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetScreen = false;
        this.hasError = false;
    }

    delete() {
        if (this.hasError) {
            this.clear();
            return;
        }
        if (this.shouldResetScreen) return;

        if (this.currentOperand.length === 1 || (this.currentOperand.length === 2 && this.currentOperand.startsWith('-'))) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.slice(0, -1);
        }
    }

    appendNumber(number) {
        if (this.hasError) {
            this.clear();
        }

        if (this.shouldResetScreen) {
            this.currentOperand = '';
            this.shouldResetScreen = false;
        }

        // Prevent multiple dots
        if (number === '.' && this.currentOperand.includes('.')) return;

        // If currently '0' and not adding dot, replace '0'
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number.toString();
            return;
        }

        // Dot after empty string
        if (this.currentOperand === '' && number === '.') {
            this.currentOperand = '0.';
            return;
        }

        // Limit length
        if (this.currentOperand.replace(/[^0-9]/g, '').length >= 15) return;

        this.currentOperand += number.toString();
    }

    chooseOperation(operation) {
        if (this.hasError) return;

        // Allow changing operator if user pressed another operator before entering next number
        if (this.shouldResetScreen && this.previousOperand !== '') {
            this.operation = operation;
            return;
        }

        if (this.previousOperand !== '') {
            this.compute();
            if (this.hasError) return;
        }

        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.shouldResetScreen = true;
    }

    compute() {
        if (this.hasError || this.operation == null || this.previousOperand === '') return;

        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);

        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '×':
                computation = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    this.hasError = true;
                    this.currentOperand = 'Ошибка: деление на 0';
                    this.previousOperand = '';
                    this.operation = undefined;
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }

        // Fix floating point inaccuracies (e.g. 0.1 + 0.2 = 0.3)
        computation = Math.round((computation + Number.EPSILON) * 1e12) / 1e12;

        this.currentOperand = computation.toString();
        this.operation = undefined;
        this.previousOperand = '';
        this.shouldResetScreen = true;
    }

    negate() {
        if (this.hasError || this.currentOperand === '0' || this.currentOperand === '') return;

        if (this.currentOperand.startsWith('-')) {
            this.currentOperand = this.currentOperand.slice(1);
        } else {
            this.currentOperand = '-' + this.currentOperand;
        }
    }

    percent() {
        if (this.hasError || this.currentOperand === '') return;

        const current = parseFloat(this.currentOperand);
        if (isNaN(current)) return;

        const result = current / 100;
        this.currentOperand = (Math.round((result + Number.EPSILON) * 1e12) / 1e12).toString();
        this.shouldResetScreen = true;
    }

    getDisplayNumber(numberStr) {
        if (this.hasError) return numberStr;
        if (!numberStr) return '';

        const isNegative = numberStr.startsWith('-');
        const cleanStr = isNegative ? numberStr.slice(1) : numberStr;

        const parts = cleanStr.split('.');
        const integerPart = parseFloat(parts[0]);
        const decimalPart = parts[1];

        let integerDisplay = '';
        if (isNaN(integerPart)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerPart.toLocaleString('ru-RU');
        }

        let result = '';
        if (decimalPart != null) {
            result = `${integerDisplay}.${decimalPart}`;
        } else {
            result = integerDisplay;
        }

        return isNegative ? '-' + result : result;
    }

    updateDisplay() {
        if (this.hasError) {
            this.currentOperandTextElement.textContent = this.currentOperand;
            this.currentOperandTextElement.style.fontSize = '1.5rem';
            this.previousOperandTextElement.textContent = '';
            return;
        }

        // Adjust font size dynamically for long numbers
        const currentLength = this.currentOperand.length;
        if (currentLength > 12) {
            this.currentOperandTextElement.style.fontSize = '1.6rem';
        } else if (currentLength > 8) {
            this.currentOperandTextElement.style.fontSize = '2.1rem';
        } else {
            this.currentOperandTextElement.style.fontSize = '2.6rem';
        }

        this.currentOperandTextElement.textContent = this.getDisplayNumber(this.currentOperand);

        if (this.operation != null) {
            this.previousOperandTextElement.textContent = 
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandTextElement.textContent = '';
        }
    }
}

// DOM Elements
const previousOperandTextElement = document.getElementById('previous-operand');
const currentOperandTextElement = document.getElementById('current-operand');
const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement);

// Keypad Event Listeners
document.querySelectorAll('[data-number]').forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.dataset.number);
        calculator.updateDisplay();
    });
});

document.querySelectorAll('[data-operator]').forEach(button => {
    button.addEventListener('click', () => {
        calculator.chooseOperation(button.dataset.operator);
        calculator.updateDisplay();
    });
});

document.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', () => {
        const action = button.dataset.action;
        switch (action) {
            case 'clear':
                calculator.clear();
                break;
            case 'delete':
                calculator.delete();
                break;
            case 'negate':
                calculator.negate();
                break;
            case 'percent':
                calculator.percent();
                break;
            case 'equals':
                calculator.compute();
                break;
        }
        calculator.updateDisplay();
    });
});

// Helper to trigger active button animation for keyboard presses
function triggerButtonEffect(selector) {
    const btn = document.querySelector(selector);
    if (btn) {
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 120);
    }
}

// Keyboard Input Support
window.addEventListener('keydown', e => {
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
        calculator.appendNumber(e.key);
        triggerButtonEffect(`[data-number="${e.key}"]`);
    } else if (e.key === ',') {
        calculator.appendNumber('.');
        triggerButtonEffect('[data-number="."]');
    } else if (e.key === '+') {
        calculator.chooseOperation('+');
        triggerButtonEffect('[data-operator="+"]');
    } else if (e.key === '-') {
        calculator.chooseOperation('-');
        triggerButtonEffect('[data-operator="-"]');
    } else if (e.key === '*') {
        calculator.chooseOperation('×');
        triggerButtonEffect('[data-operator="×"]');
    } else if (e.key === '/') {
        e.preventDefault();
        calculator.chooseOperation('÷');
        triggerButtonEffect('[data-operator="÷"]');
    } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculator.compute();
        triggerButtonEffect('[data-action="equals"]');
    } else if (e.key === 'Backspace') {
        calculator.delete();
        triggerButtonEffect('[data-action="delete"]');
    } else if (e.key === 'Escape') {
        calculator.clear();
        triggerButtonEffect('[data-action="clear"]');
    } else if (e.key === '%') {
        calculator.percent();
        triggerButtonEffect('[data-action="percent"]');
    }

    calculator.updateDisplay();
});

