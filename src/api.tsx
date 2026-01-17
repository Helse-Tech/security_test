const WP_API_URL = "https://ventral.no/legenettside_backend/wp-json";

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export const login = async (username, password) => {
  // 1. Get JWT token
  const res = await fetch(`${WP_API_URL}/jwt-auth/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error("Login failed");
  const tokenData = await res.json();

  // 2. Fetch real user info
  const meRes = await fetch(`${WP_API_URL}/wp/v2/users/me`, {
    headers: {
      Authorization: `Bearer ${tokenData.token}`,
    },
  });

  if (!meRes.ok) throw new Error("Failed to fetch user info");
  const user = await meRes.json();
  console.log("USER:", user);

  // 3. Return combined user object
  return {
    token: tokenData.token,
    id: user.id,
    username: user.name,
    description: user.description || "",
    profileImg: user.url,
  };
};

export const fetchPostsByUser = async (userId, token) => {
  const res = await fetch(
    `${WP_API_URL}/wp/v2/posts?author=${userId}&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) throw new Error("Failed to fetch posts");
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
  console.log("RES", res);
  return res.json();
};

// Function for registration
export const registerUser = async (formData: {
  user: string;
  email: string;
  pass: string;
}) => {
  // 1. Get admin token
  const tokenRes = await fetch(`${WP_API_URL}/jwt-auth/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error("Failed to get admin access");
  }

  const tokenData = await tokenRes.json();
  const adminToken = tokenData.token;

  // 2. Create user
  return fetch(`${WP_API_URL}/wp/v2/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: formData.user,
      email: formData.email,
      password: formData.pass,
    }),
  });
};

// Function for password reset
export const sendResetCode = (email: string) =>
  fetch(`${WP_API_URL}/custom/v1/reset-password/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

export const verifyResetCode = (email: string, code: string) =>
  fetch(`${WP_API_URL}/custom/v1/validate-code/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, validation_code: code }),
  });

export const updatePassword = (email: string, newPassword: string) =>
  fetch(`${WP_API_URL}/custom/v1/set-password/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, new_password: newPassword }),
  });

// Contact function
export const handleContact = async (form: {
  name: string;
  email: string;
  msg: string;
}) => {
  return fetch(`${WP_API_URL}/contact-form/v1/send-email-ventral/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: form.name,
      email: form.email,
      message: form.msg,
    }),
  });
};
