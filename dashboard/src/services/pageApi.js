// Page management API functions with Firebase integration
import pageManagementService from "./pageManagementService";
import { isFirebaseConfigured } from "../config/firebase";

// Check Firebase configuration but don't throw immediately
const checkFirebaseConfig = () => {
  const configured = isFirebaseConfigured();
  if (!configured) {
    console.error("Firebase is not configured. Please check your Firebase configuration.");
    console.error("This may cause some features to not work properly.");
  }
  return configured;
};

// Initialize check
const firebaseConfigured = checkFirebaseConfig();

export async function createPage(pageData) {
  try {
    if (!firebaseConfigured) {
      throw new Error("Firebase is not configured. Please check your Firebase configuration.");
    }
    return await pageManagementService.createPage(pageData);
  } catch (err) {
    console.error("Create page error:", err);
    throw new Error(err.message || "Failed to create page. Please try again.");
  }
}

export async function getPage(id = null, includeDeleted = false) {
  try {
    if (id) {
      return await pageManagementService.getPage(id);
    }

    const result = await pageManagementService.getPages({ limit: 100 });
    return {
      success: result.success,
      pages: result.success ? result.pages : [],
    };
  } catch (error) {
    console.error("Get page error:", error);
    return { success: false, error: error.message };
  }
}

export async function savePage(id, content) {
  try {
    return await pageManagementService.updatePage(id, {
      content: content,
      htmlContent: content, // Assuming content includes HTML
    });
  } catch (error) {
    console.error("Save page error:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePage(id) {
  try {
    return await pageManagementService.deletePage(id);
  } catch (error) {
    console.error("Delete page error:", error);
    return { success: false, error: error.message };
  }
}

export async function renamePage(id, newId, title) {
  try {
    return await pageManagementService.updatePage(id, {
      title: title,
      slug: newId,
    });
  } catch (error) {
    console.error("Rename page error:", error);
    return { success: false, error: error.message };
  }
}

export async function duplicatePage(id, newId) {
  try {
    // First get the original page
    const originalPage = await pageManagementService.getPage(id);
    if (!originalPage.success) {
      throw new Error("Original page not found");
    }

    return await pageManagementService.duplicatePage(
      id,
      originalPage.page.title + " (Copy)",
      newId
    );
  } catch (error) {
    console.error("Duplicate page error:", error);
    return { success: false, error: error.message };
  }
}

export async function restorePage(id) {
  try {
    // Firebase doesn't have soft delete, so we update status
    return await pageManagementService.updatePage(id, {
      status: "draft",
    });
  } catch (error) {
    console.error("Restore page error:", error);
    return { success: false, error: error.message };
  }
}

// Firebase-specific functions
export async function getPageTemplates() {
  return await pageManagementService.getTemplates({ isPublic: true });
}

export async function createPageTemplate(templateData) {
  return await pageManagementService.createTemplate(templateData);
}

export async function getPageVersions(pageId) {
  return await pageManagementService.getPageVersions(pageId);
}

export async function subscribeToPageUpdates(pageId, callback) {
  return pageManagementService.subscribeToPage(pageId, callback);
}

export async function unsubscribeFromPageUpdates(subscriptionId) {
  return pageManagementService.unsubscribe(subscriptionId);
}

// Check if Firebase is available
export function isFirebaseAvailable() {
  return true; // Always true since we only use Firebase
}
