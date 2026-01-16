const WP_API_URL = "https://ventral.no/wp-json";

export const login = async (username, password) => {
  // Uses JWT Auth plugin endpoint
  const res = await fetch(`${WP_API_URL}/jwt-auth/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json(); // Returns { token, user_email, user_nicename, ... }
};

export const fetchPosts = async () => {
  const res = await fetch(`${WP_API_URL}/wp/v2/posts?per_page=10`);
  return res.json();
};

export const createPost = async (title, content, token) => {
  const res = await fetch(`${WP_API_URL}/wp/v2/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: title,
      content: content,
      status: "publish", // Publish immediately
    }),
  });
  return res.json();
};

export const updateUserDescription = async (userId, description, token) => {
  const res = await fetch(`${WP_API_URL}/wp/v2/users/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ description }),
  });
  return res.json();
};

// Mock function for registration (WP API doesn't allow public reg by default)
export const registerUser = async (data) => {
  // In a real app, you need a custom endpoint or plugin
  console.log("Registering:", data);
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

// Mock function for password reset
export const sendResetCode = async (email) => {
  console.log("Sending code to:", email);
  return new Promise((resolve) => setTimeout(resolve, 1000));
};
