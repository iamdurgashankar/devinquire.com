// Page management API functions
const API_BASE_URL =
  process.env.NODE_ENV === "development" ? "http://localhost:8000" : "";

export async function createPage(pageData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/create_page.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(pageData),
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to create page");
    }

    if (!data.success) {
      throw new Error(data.message || "Failed to create page");
    }

    return data;
  } catch (err) {
    console.error("Create page error:", err);
    throw new Error(err.message || "Failed to create page. Please try again.");
  }
}

export async function getPage(id = null, includeDeleted = false) {
  const url = new URL(`${API_BASE_URL}/api/get_page.php`);
  if (id) url.searchParams.append("id", id);
  if (includeDeleted) url.searchParams.append("deleted", "1");

  const res = await fetch(url, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to get page");
  return res.json();
}

export async function savePage(id, content) {
  const res = await fetch(`${API_BASE_URL}/api/save_page.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, content }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to save page");
  return res.json();
}

export async function deletePage(id) {
  const res = await fetch(`${API_BASE_URL}/api/delete_page.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete page");
  return res.json();
}

export async function renamePage(id, newId, title) {
  const res = await fetch("/api/rename_page.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, newId, title }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to rename page");
  return res.json();
}

export async function duplicatePage(id, newId) {
  const res = await fetch("/api/duplicate_page.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, newId }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to duplicate page");
  return res.json();
}

export async function restorePage(id) {
  const res = await fetch("/api/restore_page.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to restore page");
  return res.json();
}
