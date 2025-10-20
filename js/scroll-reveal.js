class ScrollReveal {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      scrollContainerRef: options.scrollContainerRef || null,
      enableBlur: options.enableBlur !== undefined ? options.enableBlur : true,
      baseOpacity: options.baseOpacity !== undefined ? options.baseOpacity : 0.1,
      baseRotation: options.baseRotation !== undefined ? options.baseRotation : 3,
      blurStrength: options.blurStrength !== undefined ? options.blurStrength : 4,
      rotationEnd: options.rotationEnd || 'top top+=500px',
      wordAnimationEnd: options.wordAnimationEnd || 'top top+=500px'
    };

    this.init();
  }

  init() {
    if (typeof gsap === 'undefined') {
      return;
    }

    if (typeof ScrollTrigger === 'undefined') {
      return;
    }

    // 注册 ScrollTrigger 插件
    gsap.registerPlugin(ScrollTrigger);

    // 分割文本为单词
    this.splitTextIntoWords();

    // 应用动画
    this.applyAnimations();
  }

  splitTextIntoWords() {
    const text = this.element.textContent;
    // 对于中文和英文混合的文本，按照空格和字符分割
    // 中文按字符分割，英文按单词分割
    const words = [];
    let currentWord = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // 如果是空格，保存当前单词并添加空格
      if (char === ' ' || char === '\n' || char === '\t') {
        if (currentWord) {
          words.push(currentWord);
          currentWord = '';
        }
        words.push(char);
      }
      // 如果是中文字符（包括中文标点）
      else if (char.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/)) {
        if (currentWord) {
          words.push(currentWord);
          currentWord = '';
        }
        words.push(char);
      }
      // 英文字符和数字
      else {
        currentWord += char;
      }
    }
    
    // 添加最后一个单词
    if (currentWord) {
      words.push(currentWord);
    }
    
    // 清空原有内容
    this.element.textContent = '';
    
    // 为每个单词/字符创建 span
    words.forEach((word) => {
      if (word.match(/^\s+$/)) {
        // 保留空格
        this.element.appendChild(document.createTextNode(word));
      } else if (word.trim() !== '') {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        this.element.appendChild(span);
      }
    });
  }

  applyAnimations() {
    const el = this.element;
    const scroller = this.options.scrollContainerRef || window;

    // 旋转动画
    gsap.fromTo(
      el,
      { 
        transformOrigin: '0% 50%', 
        rotate: this.options.baseRotation,
        force3D: true
      },
      {
        ease: 'none',
        rotate: 0,
        force3D: true,
        scrollTrigger: {
          trigger: el,
          scroller: scroller,
          start: 'top bottom',
          end: this.options.rotationEnd,
          scrub: 1,
          invalidateOnRefresh: true
        }
      }
    );

    const wordElements = el.querySelectorAll('.word');

    if (wordElements.length === 0) {
      return;
    }

    // 设置初始状态
    gsap.set(wordElements, {
      opacity: this.options.baseOpacity,
      filter: this.options.enableBlur ? `blur(${this.options.blurStrength}px)` : 'none',
      force3D: true
    });

    // 组合透明度和模糊动画，确保丝滑
    const animationProps = {
      opacity: 1,
      force3D: true
    };

    if (this.options.enableBlur) {
      animationProps.filter = 'blur(0px)';
    }

    gsap.to(wordElements, {
      ...animationProps,
      ease: 'none',
      stagger: {
        amount: 2,
        from: 'start'
      },
      scrollTrigger: {
        trigger: el,
        scroller: scroller,
        start: 'top bottom',
        end: this.options.wordAnimationEnd,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
  }

  destroy() {
    // 清除所有 ScrollTrigger 实例
    ScrollTrigger.getAll().forEach(trigger => {
      if (trigger.trigger === this.element) {
        trigger.kill();
      }
    });
  }
}

// 导出到全局作用域
window.ScrollReveal = ScrollReveal;

