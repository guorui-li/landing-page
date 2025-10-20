class CardNav {
  constructor(options = {}) {
    this.options = {
      logo: options.logo || '',
      logoAlt: options.logoAlt || 'Logo',
      items: options.items || [],
      baseColor: options.baseColor || '#fff',
      menuColor: options.menuColor || '#000',
      buttonBgColor: options.buttonBgColor || '#111',
      buttonTextColor: options.buttonTextColor || '#fff',
      ease: options.ease || 'power3.out',
      container: options.container || document.body
    };

    this.isExpanded = false;
    this.isHamburgerOpen = false;
    this.timeline = null;
    this.navElement = null;
    this.cardsElements = [];

    this.init();
  }

  init() {
    this.createHTML();
    this.attachEvents();
    this.createTimeline();
  }

  createHTML() {
    // 创建容器
    const container = document.createElement('div');
    container.className = 'card-nav-container dark-theme';
    container.innerHTML = `
      <nav class="card-nav">
        <div class="card-nav-top">
          <div class="hamburger-menu" role="button" aria-label="Open menu" tabindex="0">
            <div class="hamburger-line"></div>
            <div class="hamburger-line"></div>
          </div>
          
          <div class="logo-container">
            <span class="brand-text">EduProf AI</span>
          </div>
          
          <button type="button" class="card-nav-cta-button">
            Try Now
          </button>
        </div>
        
        <div class="card-nav-content" aria-hidden="true">
          ${this.createCardsHTML()}
        </div>
      </nav>
    `;

    this.options.container.appendChild(container);
    this.navElement = container.querySelector('.card-nav');
    this.cardsElements = container.querySelectorAll('.nav-card');
  }

  createCardsHTML() {
    return this.options.items.slice(0, 3).map((item, idx) => `
      <div class="nav-card" style="background-color: ${item.bgColor}; color: ${item.textColor};">
        <div class="nav-card-label">${item.label}</div>
        <div class="nav-card-links">
          ${item.links.map(link => `
            <a href="${link.href || '#'}" class="nav-card-link" aria-label="${link.ariaLabel}">
              <svg class="nav-card-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 17L17 7M17 7H7M17 7V17"/>
              </svg>
              ${link.label}
            </a>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  createTimeline() {
    if (typeof gsap === 'undefined') {
      return;
    }

    const navEl = this.navElement;
    if (!navEl) return;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(this.cardsElements, { y: 50, opacity: 0 });

    this.timeline = gsap.timeline({ paused: true });

    this.timeline.to(navEl, {
      height: this.calculateHeight(),
      duration: 0.4,
      ease: this.options.ease
    });

    this.timeline.to(this.cardsElements, { 
      y: 0, 
      opacity: 1, 
      duration: 0.4, 
      ease: this.options.ease, 
      stagger: 0.08 
    }, '-=0.1');
  }

  calculateHeight() {
    const navEl = this.navElement;
    if (!navEl) return 260;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content');
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 260;
  }

  attachEvents() {
    const container = this.options.container.querySelector('.card-nav-container');
    if (!container) return;

    // 汉堡菜单点击事件
    const hamburger = container.querySelector('.hamburger-menu');
    if (hamburger) {
      hamburger.addEventListener('click', () => this.toggleMenu());
      hamburger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleMenu();
        }
      });
    }

    // CTA按钮点击事件
    const ctaButton = container.querySelector('.card-nav-cta-button');
    if (ctaButton) {
      ctaButton.addEventListener('click', () => {
        // 滚动到功能区域
        const featuresSection = document.getElementById('features');
        if (featuresSection) {
          featuresSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // 窗口大小变化事件
    window.addEventListener('resize', () => this.handleResize());

    // 点击外部关闭菜单
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target) && this.isExpanded) {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    if (!this.isExpanded) {
      this.openMenu();
    } else {
      this.closeMenu();
    }
  }

  openMenu() {
    this.isHamburgerOpen = true;
    this.isExpanded = true;
    
    const container = this.options.container.querySelector('.card-nav-container');
    const hamburger = container?.querySelector('.hamburger-menu');
    const content = container?.querySelector('.card-nav-content');
    
    if (hamburger) {
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-label', 'Close menu');
    }
    
    if (content) {
      content.setAttribute('aria-hidden', 'false');
    }

    if (this.timeline) {
      this.timeline.play(0);
    } else {
      // 使用CSS动画作为后备
      this.animateWithCSS(true);
    }
  }

  closeMenu() {
    this.isHamburgerOpen = false;
    
    const container = this.options.container.querySelector('.card-nav-container');
    const hamburger = container?.querySelector('.hamburger-menu');
    const content = container?.querySelector('.card-nav-content');
    
    if (hamburger) {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-label', 'Open menu');
    }
    
    if (content) {
      content.setAttribute('aria-hidden', 'true');
    }

    if (this.timeline) {
      this.timeline.eventCallback('onReverseComplete', () => {
        this.isExpanded = false;
      });
      this.timeline.reverse();
    } else {
      // 使用CSS动画作为后备
      this.animateWithCSS(false);
    }
  }

  animateWithCSS(open) {
    const navEl = this.navElement;
    if (!navEl) return;

    if (open) {
      navEl.classList.add('open');
      navEl.style.height = this.calculateHeight() + 'px';
    } else {
      navEl.classList.remove('open');
      navEl.style.height = '60px';
      setTimeout(() => {
        this.isExpanded = false;
      }, 400);
    }
  }

  handleResize() {
    if (!this.timeline || !this.isExpanded) return;

    const newHeight = this.calculateHeight();
    gsap.set(this.navElement, { height: newHeight });

    this.timeline.kill();
    this.createTimeline();
    
    if (this.timeline) {
      this.timeline.progress(1);
    }
  }

  // 控制logo位置的方法
  setLogoPosition(position = 'center', shift = 'none') {
    const container = this.options.container.querySelector('.card-nav-container');
    if (!container) return;
    
    const logoContainer = container.querySelector('.logo-container');
    const brandText = container.querySelector('.brand-text');
    
    if (!logoContainer || !brandText) return;
    
    // 清除之前的位置类
    logoContainer.classList.remove('left', 'right', 'center', 'custom-left', 'custom-right', 'custom-center');
    brandText.classList.remove('shift-left', 'shift-right', 'shift-left-small', 'shift-right-small');
    
    // 设置新的位置
    switch (position) {
      case 'left':
        logoContainer.classList.add('left');
        break;
      case 'right':
        logoContainer.classList.add('right');
        break;
      case 'center':
      default:
        logoContainer.classList.add('center');
        break;
    }
    
    // 设置微调偏移
    switch (shift) {
      case 'left':
        brandText.classList.add('shift-left');
        break;
      case 'right':
        brandText.classList.add('shift-right');
        break;
      case 'left-small':
        brandText.classList.add('shift-left-small');
        break;
      case 'right-small':
        brandText.classList.add('shift-right-small');
        break;
      case 'none':
      default:
        // 不添加任何偏移类
        break;
    }
  }

  destroy() {
    const container = this.options.container.querySelector('.card-nav-container');
    if (container) {
      container.remove();
    }
    
    if (this.timeline) {
      this.timeline.kill();
    }
    
    window.removeEventListener('resize', this.handleResize);
  }
}

// 导出到全局
window.CardNav = CardNav;
