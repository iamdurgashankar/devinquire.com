// Page management API functions - Firebase only
import firebaseService from './firebaseService';

export async function createPage(pageData) {
  try {
    return await firebaseService.createPage(pageData);
  } catch (err) {
    console.error("Create page error:", err);
    throw new Error(err.message || "Failed to create page. Please try again.");
  }
}

export async function getPage(id = null, includeDeleted = false) {
  try {
    if (includeDeleted) {
      return await firebaseService.getDeletedPages();
    }
    return id ? await firebaseService.getPage(id) : await firebaseService.getPages();
  } catch (err) {
    console.error("Get page error:", err);
    throw new Error(err.message || "Failed to get page");
  }
}

export async function savePage(id, content) {
  try {
    return await firebaseService.savePage(id, content);
  } catch (err) {
    console.error("Save page error:", err);
    throw new Error(err.message || "Failed to save page");
  }
}

export async function deletePage(id) {
  try {
    return await firebaseService.deletePage(id);
  } catch (err) {
    console.error("Delete page error:", err);
    throw new Error(err.message || "Failed to delete page");
  }
}

export async function renamePage(id, newId, title) {
  try {
    return await firebaseService.renamePage(id, title);
  } catch (err) {
    console.error("Rename page error:", err);
    throw new Error(err.message || "Failed to rename page");
  }
}

export async function duplicatePage(id, newId) {
  try {
    return await firebaseService.duplicatePage(id);
  } catch (err) {
    console.error("Duplicate page error:", err);
    throw new Error(err.message || "Failed to duplicate page");
  }
}

export async function restorePage(id) {
  try {
    return await firebaseService.restorePage(id);
  } catch (err) {
    console.error("Restore page error:", err);
    throw new Error(err.message || "Failed to restore page");
  }
}
