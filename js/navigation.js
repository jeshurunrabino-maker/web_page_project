const activateWorkspaceTab = (targetSectionId, shouldScroll = true) => {
  document.querySelectorAll('.nav-btn').forEach((tabButton) => {
    const isSelected = tabButton.dataset.target === targetSectionId;
    tabButton.classList.toggle('active', isSelected);
    tabButton.setAttribute('aria-selected', String(isSelected));
    tabButton.tabIndex = isSelected ? 0 : -1;
  });

  document.querySelectorAll('.tool-section').forEach((section) => {
    const isVisible = section.id === targetSectionId;
    section.classList.toggle('active', isVisible);
    section.hidden = !isVisible;
    section.setAttribute('aria-hidden', String(!isVisible));
  });

  renderQuickConstants(targetSectionId);

  if (shouldScroll) {
    const workspaceSection = getById('sec-workspace');
    if (workspaceSection) {
      workspaceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

const bindMobileNavDrawer = () => {
  const mobileNavButton = getById('mobile-nav-btn');
  const mobileNavDrawer = getById('mobile-nav-drawer');
  if (!mobileNavButton || !mobileNavDrawer) return;

  mobileNavButton.addEventListener('click', () => {
    const isCurrentlyOpen = !mobileNavDrawer.hidden;
    mobileNavDrawer.hidden = isCurrentlyOpen;
    mobileNavButton.setAttribute('aria-expanded', String(!isCurrentlyOpen));
  });

  mobileNavDrawer.querySelectorAll('a').forEach((drawerLink) => {
    drawerLink.addEventListener('click', () => {
      mobileNavDrawer.hidden = true;
      mobileNavButton.setAttribute('aria-expanded', 'false');
    });
  });
};

const bindScratchpadControls = () => {
  const toggleRailButton = getById('toggle-scratchpad-btn');
  const workspaceLayout = getById('workspace-layout');
  const scratchpadPanel = getById('session-scratchpad');

  if (toggleRailButton && workspaceLayout && scratchpadPanel) {
    toggleRailButton.addEventListener('click', () => {
      const willHide = !scratchpadPanel.hidden;
      scratchpadPanel.hidden = willHide;
      workspaceLayout.classList.toggle('is-rail-hidden', willHide);
      toggleRailButton.setAttribute('aria-expanded', String(!willHide));
      toggleRailButton.textContent = willHide ? 'Show Scratchpad' : 'Hide Scratchpad';
    });
  }

  const clearHistoryButton = getById('clear-history-btn');
  if (clearHistoryButton) {
    clearHistoryButton.addEventListener('click', () => {
      const scratchpadList = getById('scratchpad-list');
      if (scratchpadList) {
        scratchpadList.innerHTML = '<li class="scratchpad-empty">Run any calculation to log it here.</li>';
      }
    });
  }
};

const bindTabKeyboardNavigation = () => {
  const tabNavigation = document.querySelector('.tab-nav');
  if (!tabNavigation) return;

  tabNavigation.addEventListener('keydown', (event) => {
    const tabs = [...tabNavigation.querySelectorAll('.nav-btn')];
    let focusedIndex = tabs.indexOf(document.activeElement);
    if (focusedIndex < 0) return;

    if (event.key === 'ArrowRight') {
      focusedIndex = (focusedIndex + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      focusedIndex = (focusedIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      focusedIndex = 0;
    } else if (event.key === 'End') {
      focusedIndex = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    tabs[focusedIndex].focus();
    activateWorkspaceTab(tabs[focusedIndex].dataset.target, false);
  });
};

const initNavigationAndShell = () => {
  document.querySelectorAll('.nav-btn').forEach((tabButton) => {
    tabButton.addEventListener('click', () => {
      activateWorkspaceTab(tabButton.dataset.target, false);
    });
  });

  document.querySelectorAll('[data-open-tab]').forEach((deepLinkTrigger) => {
    deepLinkTrigger.addEventListener('click', () => {
      activateWorkspaceTab(deepLinkTrigger.dataset.openTab, true);
    });
  });

  bindMobileNavDrawer();
  bindScratchpadControls();
  bindTabKeyboardNavigation();
  activateWorkspaceTab('sec-conversion', false);
};