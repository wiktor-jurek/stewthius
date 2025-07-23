// Umami analytics utility functions
type EventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: EventData) => void;
    };
  }
}

/**
 * Track a custom event with Umami Analytics
 * @param eventName - The name of the event to track
 * @param eventData - Optional data to include with the event
 */
export const trackEvent = (eventName: string, eventData?: EventData) => {
  if (typeof window !== 'undefined' && window.umami) {
    try {
      window.umami.track(eventName, eventData);
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  }
};

/**
 * Track when a user clicks an external link
 * @param url - The URL being opened
 * @param linkType - The type of link (e.g., 'tiktok', 'external')
 * @param context - Additional context about where the link was clicked
 */
export const trackExternalLink = (url: string, linkType: string, context?: string) => {
  const eventData: EventData = {
    url,
    link_type: linkType,
  };
  
  if (context) {
    eventData.context = context;
  }
  
  trackEvent('external_link_click', eventData);
};

/**
 * Track when a user clicks a button or interactive element
 * @param buttonName - The name or identifier of the button
 * @param section - The section or component where the button was clicked
 * @param additionalData - Any additional data to track
 */
export const trackButtonClick = (buttonName: string, section: string, additionalData?: EventData) => {
  trackEvent('button_click', {
    button_name: buttonName,
    section,
    ...additionalData,
  });
};

/**
 * Track user interactions with charts or data visualizations
 * @param chartType - The type of chart (e.g., 'rating', 'sentiment', 'ingredients')
 * @param action - The action taken (e.g., 'filter_change', 'hover', 'click')
 * @param value - The value or selection made
 */
export const trackChartInteraction = (chartType: string, action: string, value?: string | number) => {
  const eventData: EventData = {
    chart_type: chartType,
    action,
  };
  
  if (value !== undefined) {
    eventData.value = value;
  }
  
  trackEvent('chart_interaction', eventData);
};

/**
 * Track pagination or table interactions
 * @param tableType - The type of table (e.g., 'video_table')
 * @param action - The action taken (e.g., 'next_page', 'previous_page', 'filter')
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 */
export const trackTableInteraction = (tableType: string, action: string, currentPage?: number, totalPages?: number) => {
  const eventData: EventData = {
    table_type: tableType,
    action,
  };
  
  if (currentPage !== undefined) {
    eventData.current_page = currentPage;
  }
  
  if (totalPages !== undefined) {
    eventData.total_pages = totalPages;
  }
  
  trackEvent('table_interaction', eventData);
}; 