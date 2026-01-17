import { useState, useEffect } from "react";
import "./App.css";
import * as API from "./api";

// --- Reusable Components ---

const Input = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  isPassword = false,
}) => {
  const [show, setShow] = useState(false);
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="input-group">
      <label>{label}</label>
      <div className="input-wrapper">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {isPassword && (
          <button
            type="button"
            className="btn-icon"
            onClick={() => setShow(!show)}
          >
            {show ? "👁️" : "🙈"}
          </button>
        )}
      </div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: "0.25rem 0.75rem" }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// --- Main Application ---

function App() {
  const [user, setUser] = useState(null); // Stores user info & token

  // Modals State
  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    // Check local storage on load
    const stored = localStorage.getItem("wp_user_data");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("wp_user_data");
    setUser(null);
  };

  return (
    <div className="App">
      {!user ? (
        <LoginPage
          onLogin={(data) => {
            localStorage.setItem("wp_user_data", JSON.stringify(data));
            setUser(data);
          }}
          onOpenRegister={() => setShowRegister(true)}
          onOpenForgot={() => setShowForgot(true)}
        />
      ) : (
        <ProfilePage user={user} onLogout={handleLogout} />
      )}

      {/* --- Modals --- */}

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onLogin={(data) => {
          localStorage.setItem("wp_user_data", JSON.stringify(data));
          setUser(data);
        }}
      />

      <ForgotPasswordModal
        isOpen={showForgot}
        onClose={() => setShowForgot(false)}
      />
      <ContactModal
        isOpen={showContact}
        onClose={() => setShowContact(false)}
      />

      {/* Floating Contact Button */}
      {user && (
        <button className="fab-contact" onClick={() => setShowContact(true)}>
          <span style={{ marginTop: -4 }}>✉️</span>
        </button>
      )}
    </div>
  );
}

// --- Page 1: Login ---

function LoginPage({ onLogin, onOpenRegister, onOpenForgot }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await API.login(username, password);
      onLogin(userData);
      console.log(userData);
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: "100vh" }}>
      <div className="card">
        <h1 style={{ textAlign: "center", marginBottom: "3rem" }}>
          Security Test
        </h1>
        <form onSubmit={handleSubmit} className="flex-col">
          <Input
            label="Username or Email"
            placeholder="test@gmail.com"
            value={username}
            onChange={setUsername}
          />
          <Input
            label="Password"
            placeholder="********"
            isPassword
            value={password}
            onChange={setPassword}
          />

          {error && (
            <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary">
            Log In
          </button>
        </form>

        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <button className="btn-link" onClick={onOpenForgot}>
            Forgot Password?
          </button>
          <button className="btn-link" onClick={onOpenRegister}>
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Page 2: Profile & Feed ---

function ProfilePage({ user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [bio, setBio] = useState(user.description);
  const [isEditingBio, setIsEditingBio] = useState(false);

  useEffect(() => {
    API.fetchPostsByUser(user.id, user.token)
      .then(setPosts)
      .catch(console.error);
  }, [user]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!title || !body) return;

    // Optimistic UI update
    const newPost = {
      title: { rendered: title },
      content: { rendered: body },
      id: Date.now(),
    };
    setPosts([newPost, ...posts]);
    setTitle("");
    setBody("");

    // Actual API call
    await API.createPost(title, body, user.token);
  };

  const saveBio = async () => {
    // Update local state and storage
    const newUser = { ...user, description: bio };
    localStorage.setItem("wp_user_data", JSON.stringify(newUser));
    setIsEditingBio(false);
    // API Call
    await API.updateUserDescription(user.id, bio, user.token);
  };

  return (
    <div className="container">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "3rem",
        }}
      >
        <h2 style={{ color: "var(--text-main)" }}>Security Test</h2>
        <button onClick={onLogout} className="btn-secondary">
          Log Out
        </button>
      </div>

      {/* Profile Section */}
      <div className="card profile-header">
        <div className="avatar">{user.username[0].toUpperCase()}</div>
        <div className="user-details" style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 5vw, 3rem)",
              margin: 0,
            }}
          >
            {user.username}
          </h1>

          {isEditingBio ? (
            <div className="flex-col" style={{ marginTop: "1rem" }}>
              <Input label="" value={bio} onChange={setBio} placeholder="" />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={saveBio} className="btn-primary">
                  Save
                </button>
                <button
                  onClick={() => setIsEditingBio(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p>{bio}</p>
              <button
                onClick={() => setIsEditingBio(true)}
                className="btn-link"
              >
                Edit Bio
              </button>
            </>
          )}
        </div>
      </div>

      {/* Create Post */}
      <div
        className="card"
        style={{ marginBottom: "2rem", textAlign: "center" }}
      >
        <h3>Create Post</h3>
        <form onSubmit={handlePostSubmit} className="flex-col">
          <Input
            label=""
            placeholder="Post Title"
            value={title}
            onChange={setTitle}
          />
          <textarea
            rows={3}
            placeholder="What's on your mind?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ alignSelf: "center", paddingLeft: 35, paddingRight: 35 }}
          >
            Post
          </button>
        </form>
      </div>

      {/* Feed */}
      <div className="feed-grid">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <div
              className="post-title"
              dangerouslySetInnerHTML={{ __html: post.title.rendered }}
            />
            <div dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Specific Modals ---

const validatePassword = (pwd) => {
  const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(pwd);
};

function RegisterModal({ isOpen, onClose, onLogin }) {
  const [formData, setFormData] = useState({
    user: "",
    email: "",
    pass: "",
    confirm: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    // Password validation
    if (!validatePassword(formData.pass)) {
      setError("Password must have 1 capital, 1 number, and 8+ characters.");
      return;
    }

    if (formData.pass !== formData.confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // 1️⃣ Register the user
      const res = await API.registerUser(formData);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Registration failed");
      }

      // 2️⃣ Automatically log in the new user
      const user = await API.login(formData.user, formData.pass);

      // 3️⃣ Call onLogin callback from App
      onLogin(user);

      // 4️⃣ Reset modal state and close
      setFormData({ user: "", email: "", pass: "", confirm: "" });
      setError("");
      onClose();
    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err.message || "Registration failed.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Account">
      <div className="flex-col">
        <Input
          label="Username"
          value={formData.user}
          onChange={(v) => setFormData({ ...formData, user: v })}
          placeholder=""
        />
        <Input
          label="Email"
          value={formData.email}
          onChange={(v) => setFormData({ ...formData, email: v })}
          placeholder=""
        />
        <Input
          label="Password"
          isPassword
          value={formData.pass}
          onChange={(v) => setFormData({ ...formData, pass: v })}
          placeholder=""
        />
        <Input
          label="Confirm Password"
          isPassword
          value={formData.confirm}
          onChange={(v) => setFormData({ ...formData, confirm: v })}
          placeholder=""
        />

        {error && <small style={{ color: "var(--danger)" }}>{error}</small>}

        <button className="btn-primary" onClick={handleSubmit}>
          Register
        </button>
      </div>
    </Modal>
  );
}

function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  const handleSendCode = async () => {
    try {
      const res = await API.sendResetCode(email);
      if (res.ok) {
        setStep(2);
      }
    } catch (err) {
      console.error("Failed to send reset code", err);
    }
  };

  const handleVerifyCode = async () => {
    try {
      const res = await API.verifyResetCode(email, code);
      if (res.ok) {
        setStep(3);
      }
    } catch (err) {
      console.error("Code verification failed", err);
    }
  };

  const handleSave = async () => {
    if (!validatePassword(newPass)) {
      setError("Password requirements not met.");
      return;
    }

    if (newPass !== confirmPass) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await API.updatePassword(email, newPass);
      if (res.ok) {
        onClose();
        setStep(1);
        setEmail("");
        setCode("");
        setNewPass("");
        setConfirmPass("");
        setError("");
      }
    } catch (err) {
      console.error("Password update failed", err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Password">
      <div className="flex-col">
        {step === 1 && (
          <>
            <p>Enter your email to receive a verification code.</p>
            <Input
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder=""
            />
            <button className="btn-primary" onClick={handleSendCode}>
              Send Code
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p>Code sent to {email}</p>
            <Input
              label="Verification Code"
              value={code}
              onChange={setCode}
              placeholder=""
            />
            <button className="btn-primary" onClick={handleVerifyCode}>
              Verify Code
            </button>
            <button onClick={() => setStep(1)}>Back</button>
          </>
        )}

        {step === 3 && (
          <>
            <Input
              label="New Password"
              isPassword
              value={newPass}
              onChange={setNewPass}
              placeholder=""
            />
            <Input
              label="Confirm New Password"
              isPassword
              value={confirmPass}
              onChange={setConfirmPass}
              placeholder=""
            />

            <ul
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                paddingLeft: "1.2rem",
              }}
            >
              <li>At least 8 characters</li>
              <li>At least 1 Capital letter</li>
              <li>At least 1 Number</li>
            </ul>

            {error && <small style={{ color: "var(--danger)" }}>{error}</small>}

            <button className="btn-primary" onClick={handleSave}>
              Update Password
            </button>
            <button onClick={() => setStep(2)}>Back</button>
          </>
        )}
      </div>
    </Modal>
  );
}

function ContactModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", msg: "" });

  const send = async () => {
    if (!form.name || !form.email || !form.msg) return;

    try {
      await API.handleContact(form);
      setForm({ name: "", email: "", msg: "" });
      onClose();
    } catch (err) {
      console.error("Failed to send contact message", err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact Us">
      <div className="flex-col">
        <Input
          label="Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder=""
        />
        <Input
          label="Email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          placeholder=""
        />
        <div className="input-group">
          <label>Message</label>
          <textarea
            rows={4}
            value={form.msg}
            onChange={(e) => setForm({ ...form, msg: e.target.value })}
          />
        </div>
        <button className="btn-primary" onClick={send}>
          Send Message
        </button>
      </div>
    </Modal>
  );
}

export default App;
