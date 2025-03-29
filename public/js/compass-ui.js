/**
 * COMPASS UI - JavaScript Functionality
 * Handles interactions, data loading, and visualizations for the COMPASS dashboard
 */

// Initialize the COMPASS UI system
const COMPASS = {
  // Configuration
  config: {
    animation: {
      enable: true,
      duration: 600,
      easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
    },
    charts: {
      colors: {
        monochrome: ['#C0C0C0', '#A0A0A0', '#808080', '#606060', '#404040']
      }
    },
    api: {
      baseUrl: '/api/compass'
    }
  },
  
  // State management
  state: {
    theme: 'dark',
    activeSection: 'dashboard',
    programData: null,
    comparisons: null,
    insights: null
  },
  
  // DOM elements cache
  elements: {},
  
  // Chart instances
  charts: {},
  
  // Initialize the UI
  init: function() {
    console.log('Initializing COMPASS UI...');
    
    // Cache DOM elements
    this.cacheElements();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Apply theme from saved preference or system default
    this.applyTheme();
    
    // Load initial data
    this.loadProgramData()
      .then(() => {
        // Initialize charts
        this.initCharts();
        
        // Initialize visualizations
        this.initVisualizations();
        
        // Show the UI (fade in)
        document.body.classList.add('compass-loaded');
      })
      .catch(error => {
        console.error('Error loading program data:', error);
        this.showError('Failed to load program data. Please try again later.');
      });
  },
  
  // Cache DOM elements for performance
  cacheElements: function() {
    // Main sections
    this.elements.sidebar = document.querySelector('.compass-sidebar');
    this.elements.main = document.querySelector('.compass-main');
    this.elements.sections = document.querySelectorAll('.compass-section');
    
    // Navigation
    this.elements.navItems = document.querySelectorAll('.compass-nav li');
    this.elements.themeToggle = document.getElementById('theme-toggle');
    
    // Charts
    this.elements.compassScoreChart = document.getElementById('compassScoreChart');
    
    // Component visualizations
    this.elements.scoreFills = document.querySelectorAll('.score-fill');
    
    // Mobile menu
    this.elements.mobileMenuToggle = document.createElement('button');
    this.elements.mobileMenuToggle.className = 'compass-mobile-menu-toggle';
    this.elements.mobileMenuToggle.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    document.body.appendChild(this.elements.mobileMenuToggle);
  },
  
  // Set up event listeners
  setupEventListeners: function() {
    // Navigation item clicks
    this.elements.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active navigation
        this.elements.navItems.forEach(navItem => navItem.classList.remove('active'));
        item.classList.add('active');
        
        // Get section ID from href attribute
        const sectionId = item.querySelector('a').getAttribute('href').substring(1);
        this.navigateToSection(sectionId);
        
        // Close mobile menu if open
        if (window.innerWidth < 768) {
          this.elements.sidebar.classList.remove('active');
        }
      });
    });
    
    // Theme toggle
    this.elements.themeToggle.addEventListener('click', () => {
      this.toggleTheme();
    });
    
    // Mobile menu toggle
    this.elements.mobileMenuToggle.addEventListener('click', () => {
      this.elements.sidebar.classList.toggle('active');
    });
    
    // Window resize
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));
    
    // Scroll animation
    window.addEventListener('scroll', this.debounce(() => {
      this.animateOnScroll();
    }, 50));
    
    // Listen for data refresh requests
    document.addEventListener('compass:refreshData', () => {
      this.loadProgramData(true);
    });
  },
  
  // Apply the current theme
  applyTheme: function() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('compass-theme');
    
    if (savedTheme) {
      this.state.theme = savedTheme;
    } else {
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        this.state.theme = 'light';
      }
    }
    
    // Apply theme to body
    if (this.state.theme === 'light') {
      document.body.classList.add('compass-theme-light');
    } else {
      document.body.classList.remove('compass-theme-light');
    }
    
    // Update icons and text
    this.updateThemeUI();
  },
  
  // Toggle between light and dark theme
  toggleTheme: function() {
    this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
    
    // Save preference
    localStorage.setItem('compass-theme', this.state.theme);
    
    // Apply the theme
    document.body.classList.toggle('compass-theme-light');
    
    // Update charts for new theme
    this.updateChartsForTheme();
    
    // Update icons and text
    this.updateThemeUI();
  },
  
  // Update theme-related UI elements
  updateThemeUI: function() {
    // Update theme toggle icon and text
    if (this.state.theme === 'light') {
      this.elements.themeToggle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.3545 14.3545C18.59 15.5692 16.3892 16.1387 14.1741 15.9412C11.959 15.7438 9.92806 14.7942 8.47166 13.2802C7.01527 11.7663 6.25813 9.80004 6.33804 7.79629C6.41795 5.79254 7.32833 3.9033 8.87868 2.5C6.20863 3.64167 4.24855 5.83027 3.45543 8.48871C2.66231 11.1471 3.11501 14.0371 4.69878 16.3306C6.28255 18.6241 8.84506 20.0715 11.6467 20.2537C14.4483 20.4358 17.1966 19.3347 19.0711 17.2426C19.2807 17.0123 19.4773 16.7719 19.6606 16.5222C19.8853 16.197 20.0864 15.8587 20.2629 15.5099C20.2938 15.4569 20.3241 15.4051 20.3545 15.3535V14.3545Z" fill="currentColor"/>
          <circle cx="17.5" cy="6.5" r="3.5" fill="currentColor"/>
        </svg>
        Dark Mode
      `;
    } else {
      this.elements.themeToggle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8V16Z" fill="currentColor"/>
          <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20Z" fill="currentColor"/>
        </svg>
        Light Mode
      `;
    }
  },
  
  // Navigate to a specific section
  navigateToSection: function(sectionId) {
    this.state.activeSection = sectionId;
    
    // Update URL without page reload
    history.pushState({section: sectionId}, '', `#${sectionId}`);
    
    // Scroll to section if it exists
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({behavior: 'smooth'});
    }
  },
  
  // Load program data from API
  loadProgramData: function(forceRefresh = false) {
    return new Promise((resolve, reject) => {
      // Show loading state
      if (forceRefresh) {
        this.showLoading();
      }
      
      // If we already have data and aren't forcing a refresh, use cached data
      if (this.state.programData && !forceRefresh) {
        resolve(this.state.programData);
        return;
      }
      
      // Fetch data from API
      fetch(`${this.config.api.baseUrl}/program-data`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch program data');
          }
          return response.json();
        })
        .then(data => {
          // Store data in state
          this.state.programData = data;
          
          // Load comparison data
          return fetch(`${this.config.api.baseUrl}/comparisons`);
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch comparison data');
          }
          return response.json();
        })
        .then(data => {
          // Store comparison data
          this.state.comparisons = data;
          
          // Load AI insights
          return fetch(`${this.config.api.baseUrl}/insights`);
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch insights');
          }
          return response.json();
        })
        .then(data => {
          // Store insights
          this.state.insights = data;
          
          // Hide loading state
          this.hideLoading();
          
          // Update the UI with new data
          this.updateUI();
          
          resolve(this.state.programData);
        })
        .catch(error => {
          console.error('Error loading data:', error);
          this.hideLoading();
          this.showError('Failed to load data. Please try again later.');
          reject(error);
        });
    });
  },
  
  // Update UI with current data
  updateUI: function() {
    // For demonstration, we're simulating the data loading
    // In a real implementation, this would update all UI elements with the data from state
    
    // Update score values with animation
    this.animateScoreValues();
    
    // Update chart data
    this.updateCharts();
    
    // Show a success message
    this.showNotification('Data updated successfully');
  },
  
  // Initialize charts
  initCharts: function() {
    // Main COMPASS score doughnut chart
    if (this.elements.compassScoreChart) {
      const ctx = this.elements.compassScoreChart.getContext('2d');
      
      this.charts.compassScore = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['On-Court (35%)', 'Roster (25%)', 'Infrastructure (20%)', 'Prestige (15%)', 'Academics (5%)'],
          datasets: [{
            data: [84, 77, 89, 81, 94],
            backgroundColor: this.config.charts.colors.monochrome,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: this.state.theme === 'light' ? '#222222' : '#FFFFFF',
                font: {
                  family: 'Inter',
                  size: 11
                },
                padding: 15
              }
            },
            tooltip: {
              backgroundColor: this.state.theme === 'light' ? '#FFFFFF' : '#000000',
              titleColor: this.state.theme === 'light' ? '#000000' : '#FFFFFF',
              bodyColor: '#707070',
              titleFont: {
                size: 14,
                weight: 'bold',
                family: 'Inter'
              },
              bodyFont: {
                size: 13,
                family: 'Inter'
              },
              padding: 12,
              cornerRadius: 4,
              displayColors: false,
              borderColor: this.state.theme === 'light' ? '#EEEEEE' : '#333333',
              borderWidth: 1
            }
          },
          animation: {
            animateRotate: true,
            animateScale: true
          }
        }
      });
    }
    
    // Add more charts here as needed
  },
  
  // Update charts with new data
  updateCharts: function() {
    // Update COMPASS score chart
    if (this.charts.compassScore) {
      // In a real implementation, this would use this.state.programData
      this.charts.compassScore.data.datasets[0].data = [84, 77, 89, 81, 94];
      this.charts.compassScore.update();
    }
    
    // Update other charts as needed
  },
  
  // Update charts for current theme
  updateChartsForTheme: function() {
    if (this.charts.compassScore) {
      // Update legend colors
      this.charts.compassScore.options.plugins.legend.labels.color = 
        this.state.theme === 'light' ? '#222222' : '#FFFFFF';
      
      // Update tooltip colors
      this.charts.compassScore.options.plugins.tooltip.backgroundColor = 
        this.state.theme === 'light' ? '#FFFFFF' : '#000000';
      this.charts.compassScore.options.plugins.tooltip.titleColor = 
        this.state.theme === 'light' ? '#000000' : '#FFFFFF';
      this.charts.compassScore.options.plugins.tooltip.borderColor = 
        this.state.theme === 'light' ? '#EEEEEE' : '#333333';
      
      // Apply updates
      this.charts.compassScore.update();
    }
    
    // Update other charts as needed
  },
  
  // Initialize interactive visualizations
  initVisualizations: function() {
    // Initialize component score visualizations with animation
    this.animateScoreValues();
    
    // Add intersection observer for scroll animations
    this.setupScrollAnimations();
  },
  
  // Animate score values on load or update
  animateScoreValues: function() {
    // Reset score fills
    this.elements.scoreFills.forEach(el => {
      const targetWidth = el.getAttribute('data-target-width') || el.style.width;
      el.setAttribute('data-target-width', targetWidth);
      el.style.width = '0%';
      el.style.transition = 'none';
    });
    
    // Trigger browser reflow
    void this.elements.scoreFills[0]?.offsetWidth;
    
    // Animate to target values
    setTimeout(() => {
      this.elements.scoreFills.forEach(el => {
        el.style.transition = `width 1.2s ${this.config.animation.easing}`;
        el.style.width = el.getAttribute('data-target-width');
      });
    }, 50);
  },
  
  // Set up scroll-based animations
  setupScrollAnimations: function() {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers that don't support IntersectionObserver
      this.animateOnScroll();
      return;
    }
    
    const animatedElements = document.querySelectorAll('.compass-card, .insight-item, .compass-component');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });
    
    animatedElements.forEach(element => {
      observer.observe(element);
    });
  },
  
  // Fallback animation on scroll
  animateOnScroll: function() {
    const animatedElements = document.querySelectorAll('.compass-card:not(.fade-in), .insight-item:not(.fade-in), .compass-component:not(.fade-in)');
    
    animatedElements.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.2;
      
      if (elementPosition < screenPosition) {
        element.classList.add('fade-in');
      }
    });
  },
  
  // Handle window resize events
  handleResize: function() {
    // Adjust UI for current screen size
    if (window.innerWidth < 768) {
      this.elements.sidebar.classList.remove('active');
    }
    
    // Update chart dimensions
    if (this.charts.compassScore) {
      this.charts.compassScore.resize();
    }
  },
  
  // Show loading indicator
  showLoading: function() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'compass-loading-overlay';
    loadingOverlay.innerHTML = `
      <div class="compass-loading">
        <div class="compass-spinner"></div>
        <div class="compass-loading-text">Loading data...</div>
      </div>
    `;
    
    document.body.appendChild(loadingOverlay);
  },
  
  // Hide loading indicator
  hideLoading: function() {
    const loadingOverlay = document.querySelector('.compass-loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('fade-out');
      setTimeout(() => {
        loadingOverlay.remove();
      }, 300);
    }
  },
  
  // Show error message
  showError: function(message) {
    const errorToast = document.createElement('div');
    errorToast.className = 'compass-toast compass-toast-error';
    errorToast.innerHTML = `
      <div class="compass-toast-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="compass-toast-content">${message}</div>
      <button class="compass-toast-close">&times;</button>
    `;
    
    document.body.appendChild(errorToast);
    
    // Add event listener to close button
    errorToast.querySelector('.compass-toast-close').addEventListener('click', () => {
      errorToast.classList.add('fade-out');
      setTimeout(() => {
        errorToast.remove();
      }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(errorToast)) {
        errorToast.classList.add('fade-out');
        setTimeout(() => {
          if (document.body.contains(errorToast)) {
            errorToast.remove();
          }
        }, 300);
      }
    }, 5000);
  },
  
  // Show notification message
  showNotification: function(message) {
    const notification = document.createElement('div');
    notification.className = 'compass-toast compass-toast-info';
    notification.innerHTML = `
      <div class="compass-toast-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="compass-toast-content">${message}</div>
      <button class="compass-toast-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Add event listener to close button
    notification.querySelector('.compass-toast-close').addEventListener('click', () => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.classList.add('fade-out');
        setTimeout(() => {
          if (document.body.contains(notification)) {
            notification.remove();
          }
        }, 300);
      }
    }, 3000);
  },
  
  // Utility: Debounce function for performance
  debounce: function(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  COMPASS.init();
  
  // Add CSS styles for dynamic elements
  const dynamicStyles = document.createElement('style');
  dynamicStyles.textContent = `
    /* Loading overlay */
    .compass-loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 1;
      transition: opacity 0.3s ease;
    }
    
    .compass-loading-overlay.fade-out {
      opacity: 0;
    }
    
    .compass-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
    }
    
    .compass-loading-text {
      color: #FFFFFF;
      font-size: 0.9rem;
    }
    
    /* Toast notifications */
    .compass-toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 450px;
      background-color: var(--dark-gray);
      color: var(--pure-white);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9000;
      animation: slideInRight 0.3s forwards;
    }
    
    .compass-toast.fade-out {
      animation: slideOutRight 0.3s forwards;
    }
    
    .compass-toast-error {
      border-left: 4px solid #A00000;
    }
    
    .compass-toast-info {
      border-left: 4px solid var(--silver);
    }
    
    .compass-toast-icon {
      flex-shrink: 0;
    }
    
    .compass-toast-content {
      flex-grow: 1;
    }
    
    .compass-toast-close {
      background: none;
      border: none;
      color: var(--light-gray);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0 4px;
    }
    
    .compass-toast-close:hover {
      color: var(--pure-white);
    }
    
    /* Mobile menu toggle */
    .compass-mobile-menu-toggle {
      position: fixed;
      top: 20px;
      left: 20px;
      width: 44px;
      height: 44px;
      border-radius: 22px;
      background-color: var(--charcoal);
      border: 1px solid var(--dark-gray);
      color: var(--silver);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      cursor: pointer;
      display: none;
    }
    
    /* Initial page load animation */
    body {
      opacity: 0;
      transition: opacity 0.5s ease-in-out;
    }
    
    body.compass-loaded {
      opacity: 1;
    }
    
    /* Media queries for mobile menu */
    @media (max-width: 768px) {
      .compass-mobile-menu-toggle {
        display: flex;
      }
      
      .compass-main {
        padding-top: 70px;
      }
    }
    
    /* Animations */
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  
  document.head.appendChild(dynamicStyles);
}); 