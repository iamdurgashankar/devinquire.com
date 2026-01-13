import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

class RequestService {
  constructor() {
    this.requestsCollection = 'requests';
    this.notificationsCollection = 'notifications';
  }

  // Create a new request
  async createRequest(requestData) {
    try {
      const request = {
        ...requestData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        response: null,
        assignedEditor: null
      };

      const docRef = await addDoc(collection(db, this.requestsCollection), request);
      
      // Create notification for editors
      await this.createNotification({
        type: 'new_request',
        title: 'New Client Request',
        message: `New request: ${requestData.title}`,
        targetRole: 'editor',
        targetProject: requestData.projectId,
        relatedRequestId: docRef.id,
        priority: requestData.priority
      });

      return { id: docRef.id, ...request };
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  }

  // Get requests by client ID
  async getRequestsByClient(clientId) {
    try {
      const q = query(
        collection(db, this.requestsCollection),
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching client requests:', error);
      throw error;
    }
  }

  // Get requests by editor ID or project
  async getRequestsByEditor(editorId, projectId = null) {
    try {
      let q;
      if (projectId) {
        q = query(
          collection(db, this.requestsCollection),
          where('projectId', '==', projectId),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, this.requestsCollection),
          where('assignedEditor', '==', editorId),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching editor requests:', error);
      throw error;
    }
  }

  // Get all requests (for admin)
  async getAllRequests() {
    try {
      const q = query(
        collection(db, this.requestsCollection),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching all requests:', error);
      throw error;
    }
  }

  // Update request status
  async updateRequestStatus(requestId, status, editorId = null) {
    try {
      const updateData = {
        status,
        updatedAt: serverTimestamp()
      };

      if (editorId) {
        updateData.assignedEditor = editorId;
      }

      await updateDoc(doc(db, this.requestsCollection, requestId), updateData);

      // Get request details for notification
      const requestDoc = await getDoc(doc(db, this.requestsCollection, requestId));
      const requestData = requestDoc.data();

      // Create notification for client
      await this.createNotification({
        type: 'request_status_update',
        title: 'Request Status Updated',
        message: `Your request "${requestData.title}" status changed to ${status}`,
        targetUserId: requestData.clientId,
        relatedRequestId: requestId,
        priority: 'medium'
      });

      return { id: requestId, ...updateData };
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }

  // Add response to request
  async addRequestResponse(requestId, response, editorId) {
    try {
      const responseData = {
        message: response,
        respondedBy: editorId,
        respondedAt: serverTimestamp()
      };

      const updateData = {
        response: responseData,
        status: 'responded',
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, this.requestsCollection, requestId), updateData);

      // Get request details for notification
      const requestDoc = await getDoc(doc(db, this.requestsCollection, requestId));
      const requestData = requestDoc.data();

      // Create notification for client
      await this.createNotification({
        type: 'request_response',
        title: 'Editor Response Received',
        message: `Editor responded to your request: "${requestData.title}"`,
        targetUserId: requestData.clientId,
        relatedRequestId: requestId,
        priority: 'high'
      });

      return { id: requestId, ...updateData };
    } catch (error) {
      console.error('Error adding request response:', error);
      throw error;
    }
  }

  // Delete request
  async deleteRequest(requestId) {
    try {
      await deleteDoc(doc(db, this.requestsCollection, requestId));
      return true;
    } catch (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  }

  // Create notification
  async createNotification(notificationData) {
    try {
      const notification = {
        ...notificationData,
        read: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, this.notificationsCollection), notification);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for user
  async getNotifications(userId, role) {
    try {
      let q;
      if (role === 'admin' || role === 'super_admin') {
        // Admins get all notifications
        q = query(
          collection(db, this.notificationsCollection),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Regular users get notifications targeted to them or their role
        q = query(
          collection(db, this.notificationsCollection),
          where('targetUserId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      await updateDoc(doc(db, this.notificationsCollection, notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Real-time listeners
  subscribeToRequests(callback, filters = {}) {
    try {
      let q = collection(db, this.requestsCollection);
      
      if (filters.clientId) {
        q = query(q, where('clientId', '==', filters.clientId));
      }
      
      if (filters.editorId) {
        q = query(q, where('assignedEditor', '==', filters.editorId));
      }
      
      if (filters.projectId) {
        q = query(q, where('projectId', '==', filters.projectId));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));

      return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(requests);
      });
    } catch (error) {
      console.error('Error subscribing to requests:', error);
      throw error;
    }
  }

  subscribeToNotifications(userId, role, callback) {
    try {
      let q;
      if (role === 'admin' || role === 'super_admin') {
        q = query(
          collection(db, this.notificationsCollection),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, this.notificationsCollection),
          where('targetUserId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }

      return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(notifications);
      });
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      throw error;
    }
  }

  // Request analytics
  async getRequestAnalytics(timeRange = '30d') {
    try {
      const requests = await this.getAllRequests();
      
      const now = new Date();
      const timeRangeMs = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
      };
      
      const cutoffDate = new Date(now.getTime() - timeRangeMs[timeRange]);
      
      const filteredRequests = requests.filter(request => {
        const createdAt = request.createdAt?.toDate() || new Date(request.createdAt);
        return createdAt >= cutoffDate;
      });

      const analytics = {
        total: filteredRequests.length,
        pending: filteredRequests.filter(r => r.status === 'pending').length,
        inProgress: filteredRequests.filter(r => r.status === 'in_progress').length,
        completed: filteredRequests.filter(r => r.status === 'completed').length,
        byPriority: {
          high: filteredRequests.filter(r => r.priority === 'high').length,
          medium: filteredRequests.filter(r => r.priority === 'medium').length,
          low: filteredRequests.filter(r => r.priority === 'low').length
        },
        byCategory: {},
        averageResponseTime: 0,
        completionRate: 0
      };

      // Calculate category distribution
      filteredRequests.forEach(request => {
        analytics.byCategory[request.category] = (analytics.byCategory[request.category] || 0) + 1;
      });

      // Calculate completion rate
      const completedRequests = filteredRequests.filter(r => r.status === 'completed');
      analytics.completionRate = filteredRequests.length > 0 
        ? Math.round((completedRequests.length / filteredRequests.length) * 100) 
        : 0;

      // Calculate average response time (in hours)
      const respondedRequests = filteredRequests.filter(r => r.response);
      if (respondedRequests.length > 0) {
        const totalResponseTime = respondedRequests.reduce((sum, request) => {
          const createdAt = request.createdAt?.toDate() || new Date(request.createdAt);
          const respondedAt = request.response.respondedAt?.toDate() || new Date(request.response.respondedAt);
          return sum + (respondedAt - createdAt);
        }, 0);
        
        analytics.averageResponseTime = Math.round(totalResponseTime / respondedRequests.length / (1000 * 60 * 60));
      }

      return analytics;
    } catch (error) {
      console.error('Error calculating request analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const requestService = new RequestService();
export default requestService;