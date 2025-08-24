/**
 * Analytics Routes
 * Handles page views, user activity tracking, and analytics reports
 */

const express = require('express');
const { firebaseAdmin } = require('../firebaseAdmin');
const { authenticateToken, requireAuth, requireAdmin } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiting for analytics endpoints
const analyticsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 analytics requests per minute
  message: {
    error: 'Too many analytics requests from this IP, please try again later.',
    retryAfter: '1 minute'
  }
});

// Helper function to get date range
const getDateRange = (period) => {
  const now = new Date();
  const endDate = new Date(now);
  let startDate;
  
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'yesterday':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  return { startDate, endDate };
};

// Helper function to format date for grouping
const formatDateForGrouping = (date, groupBy) => {
  const d = new Date(date);
  
  switch (groupBy) {
    case 'hour':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;
    case 'day':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    case 'week':
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      return `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate()) / 7)).padStart(2, '0')}`;
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    default:
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
};

/**
 * Track Page View
 * POST /api/analytics/pageview
 */
router.post('/pageview', analyticsLimiter, authenticateToken, async (req, res) => {
  try {
    const {
      page,
      title,
      referrer,
      userAgent,
      sessionId,
      duration = null
    } = req.body;
    
    if (!page) {
      return res.status(400).json({
        error: 'Page URL is required',
        code: 'PAGE_REQUIRED'
      });
    }
    
    const realtimeDb = firebaseAdmin.getDatabase();
    
    // Create page view data
    const pageViewData = {
      page,
      title: title || null,
      referrer: referrer || null,
      userAgent: userAgent || req.get('User-Agent'),
      sessionId: sessionId || null,
      userId: req.user?.uid || null,
      ipAddress: req.ip,
      timestamp: new Date().toISOString(),
      duration,
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    };
    
    // Store in Realtime Database
    await realtimeDb.ref('analytics/pageviews').push(pageViewData);
    
    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    const dailyStatsRef = realtimeDb.ref(`analytics/daily/${today}`);
    
    await dailyStatsRef.transaction((currentData) => {
      if (currentData === null) {
        return {
          date: today,
          pageviews: 1,
          uniqueVisitors: req.user?.uid ? 1 : 0,
          visitors: [req.user?.uid || req.ip].filter(Boolean),
          pages: { [page]: 1 }
        };
      }
      
      currentData.pageviews = (currentData.pageviews || 0) + 1;
      
      // Track unique visitors
      const visitorId = req.user?.uid || req.ip;
      if (visitorId && (!currentData.visitors || !currentData.visitors.includes(visitorId))) {
        currentData.visitors = currentData.visitors || [];
        currentData.visitors.push(visitorId);
        currentData.uniqueVisitors = currentData.visitors.length;
      }
      
      // Track page counts
      currentData.pages = currentData.pages || {};
      currentData.pages[page] = (currentData.pages[page] || 0) + 1;
      
      return currentData;
    });
    
    res.json({
      success: true,
      message: 'Page view tracked successfully'
    });
    
  } catch (error) {
    console.error('Track page view error:', error.message);
    res.status(500).json({
      error: 'Failed to track page view',
      code: 'PAGEVIEW_TRACK_FAILED'
    });
  }
});

/**
 * Track Custom Event
 * POST /api/analytics/event
 */
router.post('/event', analyticsLimiter, authenticateToken, async (req, res) => {
  try {
    const {
      event,
      category,
      action,
      label,
      value,
      properties = {}
    } = req.body;
    
    if (!event || !category || !action) {
      return res.status(400).json({
        error: 'Event name, category, and action are required',
        code: 'EVENT_DETAILS_REQUIRED'
      });
    }
    
    const realtimeDb = firebaseAdmin.getDatabase();
    
    // Create event data
    const eventData = {
      event,
      category,
      action,
      label: label || null,
      value: value || null,
      properties,
      userId: req.user?.uid || null,
      sessionId: properties.sessionId || null,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };
    
    // Store event
    await realtimeDb.ref('analytics/events').push(eventData);
    
    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
    
  } catch (error) {
    console.error('Track event error:', error.message);
    res.status(500).json({
      error: 'Failed to track event',
      code: 'EVENT_TRACK_FAILED'
    });
  }
});

/**
 * Get Analytics Overview
 * GET /api/analytics/overview
 */
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const { startDate, endDate } = getDateRange(period);
    
    const realtimeDb = firebaseAdmin.getDatabase();
    
    // Get daily stats for the period
    const dailyStatsRef = realtimeDb.ref('analytics/daily');
    const snapshot = await dailyStatsRef.once('value');
    const dailyData = snapshot.val() || {};
    
    // Filter data by date range
    const filteredData = Object.keys(dailyData)
      .filter(date => {
        const dateObj = new Date(date);
        return dateObj >= startDate && dateObj <= endDate;
      })
      .reduce((acc, date) => {
        acc[date] = dailyData[date];
        return acc;
      }, {});
    
    // Calculate totals
    let totalPageviews = 0;
    let totalUniqueVisitors = 0;
    const allVisitors = new Set();
    const pageStats = {};
    
    Object.values(filteredData).forEach(dayData => {
      totalPageviews += dayData.pageviews || 0;
      
      if (dayData.visitors) {
        dayData.visitors.forEach(visitor => allVisitors.add(visitor));
      }
      
      if (dayData.pages) {
        Object.keys(dayData.pages).forEach(page => {
          pageStats[page] = (pageStats[page] || 0) + dayData.pages[page];
        });
      }
    });
    
    totalUniqueVisitors = allVisitors.size;
    
    // Get top pages
    const topPages = Object.entries(pageStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));
    
    // Calculate period comparison (previous period)
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate.getTime() - 1);
    
    const prevData = Object.keys(dailyData)
      .filter(date => {
        const dateObj = new Date(date);
        return dateObj >= prevStartDate && dateObj <= prevEndDate;
      })
      .reduce((acc, date) => {
        acc[date] = dailyData[date];
        return acc;
      }, {});
    
    let prevPageviews = 0;
    const prevVisitors = new Set();
    
    Object.values(prevData).forEach(dayData => {
      prevPageviews += dayData.pageviews || 0;
      if (dayData.visitors) {
        dayData.visitors.forEach(visitor => prevVisitors.add(visitor));
      }
    });
    
    const prevUniqueVisitors = prevVisitors.size;
    
    // Calculate changes
    const pageviewsChange = prevPageviews > 0 
      ? ((totalPageviews - prevPageviews) / prevPageviews * 100).toFixed(1)
      : totalPageviews > 0 ? 100 : 0;
    
    const visitorsChange = prevUniqueVisitors > 0
      ? ((totalUniqueVisitors - prevUniqueVisitors) / prevUniqueVisitors * 100).toFixed(1)
      : totalUniqueVisitors > 0 ? 100 : 0;
    
    res.json({
      success: true,
      overview: {
        period,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        metrics: {
          pageviews: {
            total: totalPageviews,
            change: parseFloat(pageviewsChange)
          },
          uniqueVisitors: {
            total: totalUniqueVisitors,
            change: parseFloat(visitorsChange)
          },
          avgPageviewsPerVisitor: totalUniqueVisitors > 0 
            ? (totalPageviews / totalUniqueVisitors).toFixed(2)
            : 0
        },
        topPages,
        dailyData: Object.keys(filteredData)
          .sort()
          .map(date => ({
            date,
            pageviews: filteredData[date].pageviews || 0,
            uniqueVisitors: filteredData[date].uniqueVisitors || 0
          }))
      }
    });
    
  } catch (error) {
    console.error('Get analytics overview error:', error.message);
    res.status(500).json({
      error: 'Failed to get analytics overview',
      code: 'ANALYTICS_OVERVIEW_FAILED'
    });
  }
});

/**
 * Get Page Analytics
 * GET /api/analytics/pages
 */
router.get('/pages', requireAdmin, async (req, res) => {
  try {
    const { period = 'week', limit = 20, offset = 0 } = req.query;
    const { startDate, endDate } = getDateRange(period);
    
    const realtimeDb = firebaseAdmin.getDatabase();
    
    // Get page views for the period
    const pageviewsRef = realtimeDb.ref('analytics/pageviews');
    const snapshot = await pageviewsRef
      .orderByChild('timestamp')
      .startAt(startDate.toISOString())
      .endAt(endDate.toISOString())
      .once('value');
    
    const pageviewsData = snapshot.val() || {};
    
    // Aggregate page statistics
    const pageStats = {};
    
    Object.values(pageviewsData).forEach(pageview => {
      const page = pageview.page;
      
      if (!pageStats[page]) {
        pageStats[page] = {
          page,
          views: 0,
          uniqueVisitors: new Set(),
          totalDuration: 0,
          durationsCount: 0,
          referrers: {},
          titles: new Set()
        };
      }
      
      pageStats[page].views++;
      
      if (pageview.userId) {
        pageStats[page].uniqueVisitors.add(pageview.userId);
      } else if (pageview.ipAddress) {
        pageStats[page].uniqueVisitors.add(pageview.ipAddress);
      }
      
      if (pageview.duration && pageview.duration > 0) {
        pageStats[page].totalDuration += pageview.duration;
        pageStats[page].durationsCount++;
      }
      
      if (pageview.referrer) {
        const referrer = pageview.referrer;
        pageStats[page].referrers[referrer] = (pageStats[page].referrers[referrer] || 0) + 1;
      }
      
      if (pageview.title) {
        pageStats[page].titles.add(pageview.title);
      }
    });
    
    // Convert to array and calculate metrics
    const pagesArray = Object.values(pageStats).map(stats => ({
      page: stats.page,
      title: Array.from(stats.titles)[0] || null,
      views: stats.views,
      uniqueVisitors: stats.uniqueVisitors.size,
      avgDuration: stats.durationsCount > 0 
        ? Math.round(stats.totalDuration / stats.durationsCount)
        : null,
      topReferrers: Object.entries(stats.referrers)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([referrer, count]) => ({ referrer, count }))
    }));
    
    // Sort by views
    pagesArray.sort((a, b) => b.views - a.views);
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedPages = pagesArray.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      pages: paginatedPages,
      pagination: {
        total: pagesArray.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < pagesArray.length
      },
      period,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    });
    
  } catch (error) {
    console.error('Get page analytics error:', error.message);
    res.status(500).json({
      error: 'Failed to get page analytics',
      code: 'PAGE_ANALYTICS_FAILED'
    });
  }
});

/**
 * Get Events Analytics
 * GET /api/analytics/events
 */
router.get('/events', requireAdmin, async (req, res) => {
  try {
    const { period = 'week', category, action, limit = 50, offset = 0 } = req.query;
    const { startDate, endDate } = getDateRange(period);
    
    const realtimeDb = firebaseAdmin.getDatabase();
    
    // Get events for the period
    const eventsRef = realtimeDb.ref('analytics/events');
    const snapshot = await eventsRef
      .orderByChild('timestamp')
      .startAt(startDate.toISOString())
      .endAt(endDate.toISOString())
      .once('value');
    
    const eventsData = snapshot.val() || {};
    
    // Filter events
    let filteredEvents = Object.values(eventsData);
    
    if (category) {
      filteredEvents = filteredEvents.filter(event => event.category === category);
    }
    
    if (action) {
      filteredEvents = filteredEvents.filter(event => event.action === action);
    }
    
    // Aggregate event statistics
    const eventStats = {};
    const categoryStats = {};
    const actionStats = {};
    
    filteredEvents.forEach(event => {
      const eventKey = `${event.category}:${event.action}`;
      
      // Event stats
      if (!eventStats[eventKey]) {
        eventStats[eventKey] = {
          category: event.category,
          action: event.action,
          count: 0,
          uniqueUsers: new Set(),
          labels: {},
          totalValue: 0,
          valueCount: 0
        };
      }
      
      eventStats[eventKey].count++;
      
      if (event.userId) {
        eventStats[eventKey].uniqueUsers.add(event.userId);
      }
      
      if (event.label) {
        eventStats[eventKey].labels[event.label] = (eventStats[eventKey].labels[event.label] || 0) + 1;
      }
      
      if (event.value && typeof event.value === 'number') {
        eventStats[eventKey].totalValue += event.value;
        eventStats[eventKey].valueCount++;
      }
      
      // Category stats
      categoryStats[event.category] = (categoryStats[event.category] || 0) + 1;
      
      // Action stats
      actionStats[event.action] = (actionStats[event.action] || 0) + 1;
    });
    
    // Convert to arrays
    const eventsArray = Object.values(eventStats).map(stats => ({
      category: stats.category,
      action: stats.action,
      count: stats.count,
      uniqueUsers: stats.uniqueUsers.size,
      avgValue: stats.valueCount > 0 ? (stats.totalValue / stats.valueCount).toFixed(2) : null,
      topLabels: Object.entries(stats.labels)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([label, count]) => ({ label, count }))
    }));
    
    // Sort by count
    eventsArray.sort((a, b) => b.count - a.count);
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedEvents = eventsArray.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      events: paginatedEvents,
      summary: {
        totalEvents: filteredEvents.length,
        topCategories: Object.entries(categoryStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([category, count]) => ({ category, count })),
        topActions: Object.entries(actionStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([action, count]) => ({ action, count }))
      },
      pagination: {
        total: eventsArray.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < eventsArray.length
      },
      period,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    });
    
  } catch (error) {
    console.error('Get events analytics error:', error.message);
    res.status(500).json({
      error: 'Failed to get events analytics',
      code: 'EVENTS_ANALYTICS_FAILED'
    });
  }
});

/**
 * Get Real-time Analytics
 * GET /api/analytics/realtime
 */
router.get('/realtime', requireAdmin, async (req, res) => {
  try {
    const realtimeDb = firebaseAdmin.getDatabase();
    
    // Get recent page views (last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const pageviewsRef = realtimeDb.ref('analytics/pageviews');
    const snapshot = await pageviewsRef
      .orderByChild('timestamp')
      .startAt(thirtyMinutesAgo)
      .once('value');
    
    const recentPageviews = snapshot.val() || {};
    
    // Aggregate real-time data
    const activePages = {};
    const activeUsers = new Set();
    const recentActivity = [];
    
    Object.entries(recentPageviews).forEach(([id, pageview]) => {
      // Active pages
      const page = pageview.page;
      if (!activePages[page]) {
        activePages[page] = {
          page,
          title: pageview.title,
          activeUsers: new Set(),
          recentViews: 0
        };
      }
      
      activePages[page].recentViews++;
      
      if (pageview.userId) {
        activePages[page].activeUsers.add(pageview.userId);
        activeUsers.add(pageview.userId);
      } else if (pageview.ipAddress) {
        activePages[page].activeUsers.add(pageview.ipAddress);
        activeUsers.add(pageview.ipAddress);
      }
      
      // Recent activity
      recentActivity.push({
        id,
        type: 'pageview',
        page: pageview.page,
        title: pageview.title,
        timestamp: pageview.timestamp,
        userId: pageview.userId || null
      });
    });
    
    // Convert active pages to array
    const activePagesArray = Object.values(activePages).map(page => ({
      page: page.page,
      title: page.title,
      activeUsers: page.activeUsers.size,
      recentViews: page.recentViews
    }));
    
    // Sort by active users
    activePagesArray.sort((a, b) => b.activeUsers - a.activeUsers);
    
    // Sort recent activity by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      realtime: {
        activeUsers: activeUsers.size,
        activePages: activePagesArray.slice(0, 10),
        recentActivity: recentActivity.slice(0, 20),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Get real-time analytics error:', error.message);
    res.status(500).json({
      error: 'Failed to get real-time analytics',
      code: 'REALTIME_ANALYTICS_FAILED'
    });
  }
});

/**
 * Export Analytics Data
 * GET /api/analytics/export
 */
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const { period = 'month', format = 'json', type = 'all' } = req.query;
    const { startDate, endDate } = getDateRange(period);
    
    const realtimeDb = firebaseAdmin.getDatabase();
    const exportData = {};
    
    // Export page views
    if (type === 'all' || type === 'pageviews') {
      const pageviewsRef = realtimeDb.ref('analytics/pageviews');
      const pageviewsSnapshot = await pageviewsRef
        .orderByChild('timestamp')
        .startAt(startDate.toISOString())
        .endAt(endDate.toISOString())
        .once('value');
      
      exportData.pageviews = pageviewsSnapshot.val() || {};
    }
    
    // Export events
    if (type === 'all' || type === 'events') {
      const eventsRef = realtimeDb.ref('analytics/events');
      const eventsSnapshot = await eventsRef
        .orderByChild('timestamp')
        .startAt(startDate.toISOString())
        .endAt(endDate.toISOString())
        .once('value');
      
      exportData.events = eventsSnapshot.val() || {};
    }
    
    // Export daily stats
    if (type === 'all' || type === 'daily') {
      const dailyRef = realtimeDb.ref('analytics/daily');
      const dailySnapshot = await dailyRef.once('value');
      const dailyData = dailySnapshot.val() || {};
      
      // Filter by date range
      exportData.daily = Object.keys(dailyData)
        .filter(date => {
          const dateObj = new Date(date);
          return dateObj >= startDate && dateObj <= endDate;
        })
        .reduce((acc, date) => {
          acc[date] = dailyData[date];
          return acc;
        }, {});
    }
    
    // Add metadata
    exportData.metadata = {
      exportedAt: new Date().toISOString(),
      period,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      type
    };
    
    if (format === 'csv') {
      // Convert to CSV format (simplified)
      let csvContent = 'Type,Date,Page,Event,Category,Action,Value\n';
      
      // Add pageviews to CSV
      if (exportData.pageviews) {
        Object.entries(exportData.pageviews).forEach(([id, pageview]) => {
          csvContent += `pageview,${pageview.timestamp},"${pageview.page}",,,\n`;
        });
      }
      
      // Add events to CSV
      if (exportData.events) {
        Object.entries(exportData.events).forEach(([id, event]) => {
          csvContent += `event,${event.timestamp},,"${event.event}","${event.category}","${event.action}",${event.value || ''}\n`;
        });
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${period}-${Date.now()}.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${period}-${Date.now()}.json"`);
      res.json(exportData);
    }
    
  } catch (error) {
    console.error('Export analytics error:', error.message);
    res.status(500).json({
      error: 'Failed to export analytics data',
      code: 'ANALYTICS_EXPORT_FAILED'
    });
  }
});

module.exports = router;