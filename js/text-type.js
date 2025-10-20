class TextType {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      text: options.text || ['Text typing effect'],
      typingSpeed: options.typingSpeed || 75,
      initialDelay: options.initialDelay || 0,
      pauseDuration: options.pauseDuration || 1500,
      deletingSpeed: options.deletingSpeed || 30,
      loop: options.loop !== undefined ? options.loop : true,
      showCursor: options.showCursor !== undefined ? options.showCursor : true,
      hideCursorWhileTyping: options.hideCursorWhileTyping || false,
      cursorCharacter: options.cursorCharacter || '|',
      cursorBlinkDuration: options.cursorBlinkDuration || 0.5,
      textColors: options.textColors || [],
      variableSpeed: options.variableSpeed || null,
      onSentenceComplete: options.onSentenceComplete || null,
      startOnVisible: options.startOnVisible || false,
      reverseMode: options.reverseMode || false
    };

    this.displayedText = '';
    this.currentCharIndex = 0;
    this.isDeleting = false;
    this.currentTextIndex = 0;
    this.isVisible = !this.options.startOnVisible;
    this.timeout = null;
    this.cursorTimeline = null;

    this.init();
  }

  init() {
    // 创建文本容器
    this.textSpan = document.createElement('span');
    this.textSpan.className = 'text-type__content';
    this.element.appendChild(this.textSpan);

    // 创建光标
    if (this.options.showCursor) {
      this.cursorSpan = document.createElement('span');
      this.cursorSpan.className = 'text-type__cursor';
      this.cursorSpan.textContent = this.options.cursorCharacter;
      this.element.appendChild(this.cursorSpan);
      this.initCursorBlink();
    }

    // 设置可见性观察器
    if (this.options.startOnVisible) {
      this.setupIntersectionObserver();
    } else {
      this.startTyping();
    }
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.isVisible) {
            this.isVisible = true;
            this.startTyping();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(this.element);
  }

  initCursorBlink() {
    if (this.cursorTimeline) {
      this.cursorTimeline.kill();
    }

    this.cursorTimeline = gsap.timeline({ repeat: -1, yoyo: true });
    this.cursorTimeline.to(this.cursorSpan, {
      opacity: 0,
      duration: this.options.cursorBlinkDuration,
      ease: 'power2.inOut'
    });
  }

  getRandomSpeed() {
    if (!this.options.variableSpeed) return this.options.typingSpeed;
    const { min, max } = this.options.variableSpeed;
    return Math.random() * (max - min) + min;
  }

  getCurrentTextColor() {
    if (this.options.textColors.length === 0) return '';
    return this.options.textColors[this.currentTextIndex % this.options.textColors.length];
  }

  updateDisplay() {
    this.textSpan.textContent = this.displayedText;
    const color = this.getCurrentTextColor();
    if (color) {
      this.textSpan.style.color = color;
    }

    // 控制光标显示/隐藏
    if (this.options.showCursor && this.options.hideCursorWhileTyping) {
      const textArray = Array.isArray(this.options.text) ? this.options.text : [this.options.text];
      const currentText = textArray[this.currentTextIndex];
      const shouldHide = this.currentCharIndex < currentText.length || this.isDeleting;
      this.cursorSpan.style.display = shouldHide ? 'none' : 'inline-block';
    }
  }

  startTyping() {
    if (!this.isVisible) return;

    const delay = this.currentCharIndex === 0 && !this.isDeleting && this.displayedText === '' 
      ? this.options.initialDelay 
      : 0;

    this.timeout = setTimeout(() => {
      this.executeTypingAnimation();
    }, delay);
  }

  executeTypingAnimation() {
    const textArray = Array.isArray(this.options.text) ? this.options.text : [this.options.text];
    const currentText = textArray[this.currentTextIndex];
    const processedText = this.options.reverseMode 
      ? currentText.split('').reverse().join('') 
      : currentText;

    if (this.isDeleting) {
      // 删除模式
      if (this.displayedText === '') {
        this.isDeleting = false;
        
        // 检查是否完成所有文本且不循环
        if (this.currentTextIndex === textArray.length - 1 && !this.options.loop) {
          return;
        }

        // 回调
        if (this.options.onSentenceComplete) {
          this.options.onSentenceComplete(textArray[this.currentTextIndex], this.currentTextIndex);
        }

        // 切换到下一个文本
        this.currentTextIndex = (this.currentTextIndex + 1) % textArray.length;
        this.currentCharIndex = 0;
        
        this.timeout = setTimeout(() => {
          this.executeTypingAnimation();
        }, this.options.pauseDuration);
      } else {
        // 删除一个字符
        this.displayedText = this.displayedText.slice(0, -1);
        this.updateDisplay();
        
        this.timeout = setTimeout(() => {
          this.executeTypingAnimation();
        }, this.options.deletingSpeed);
      }
    } else {
      // 输入模式
      if (this.currentCharIndex < processedText.length) {
        // 添加一个字符
        this.displayedText += processedText[this.currentCharIndex];
        this.currentCharIndex++;
        this.updateDisplay();
        
        const speed = this.options.variableSpeed 
          ? this.getRandomSpeed() 
          : this.options.typingSpeed;
        
        this.timeout = setTimeout(() => {
          this.executeTypingAnimation();
        }, speed);
      } else if (textArray.length > 1) {
        // 输入完成，准备删除
        this.timeout = setTimeout(() => {
          this.isDeleting = true;
          this.executeTypingAnimation();
        }, this.options.pauseDuration);
      }
    }
  }

  destroy() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    if (this.cursorTimeline) {
      this.cursorTimeline.kill();
    }
    this.element.innerHTML = '';
  }
}

// 导出到全局作用域
window.TextType = TextType;

