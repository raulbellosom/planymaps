"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  User,
  Mail,
  Shield,
  Camera,
  Check,
  X,
  Lock,
  KeyRound,
  Upload,
  UserCircle,
  Smartphone,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import {
  BlueprintButton,
  BlueprintPasswordInput,
  BlueprintStrengthMeter,
} from "@/components/auth";
import { showSuccess, showError } from "@/lib/toast";
import { uploadUserAvatar } from "@/services/avatar-service";

export default function ProfilePage() {
  const {
    user,
    isLoading: authLoading,
    updateProfile,
    changePassword,
    updateAvatar,
    resendVerification,
  } = useAuth();
  const router = useRouter();

  const [isEditingName, setIsEditingName] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      requestAnimationFrame(() => {
        setName(user.name || "");
      });
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const getAvatarUrl = useCallback(() => {
    if (!user) return null;
    // Check if user has an avatar set in prefs
    const prefs = user.prefs as Record<string, unknown>;
    if (prefs?.avatarUrl) {
      return prefs.avatarUrl as string;
    }
    return null;
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      showError("Invalid file", validation.error || "Invalid file");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateAvatarFile = (
    file: File,
  ): { valid: boolean; error?: string } => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Please upload a JPG, PNG, GIF, or WebP image.",
      };
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: "Image must be smaller than 10MB." };
    }
    return { valid: true };
  };

  const handleSaveAvatar = async () => {
    if (!selectedFile || !user) return;

    setIsSavingAvatar(true);
    try {
      const avatarUrl = await uploadUserAvatar(user.$id, selectedFile);
      await updateAvatar(avatarUrl);
      showSuccess("Avatar updated", "Your profile photo has been updated.");
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      showError(
        "Upload failed",
        err instanceof Error ? err.message : "Failed to upload avatar.",
      );
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleCancelAvatar = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      showError("Name required", "Please enter your name.");
      return;
    }
    setIsSavingName(true);
    try {
      await updateProfile(name.trim());
      showSuccess("Name updated", "Your name has been updated successfully.");
      setIsEditingName(false);
    } catch {
      showError("Update failed", "Failed to update name. Please try again.");
    } finally {
      setIsSavingName(false);
    }
  };

  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return false;
    }
    if (!/[a-z]/.test(pwd)) {
      setPasswordError("Password must contain a lowercase letter.");
      return false;
    }
    if (!/[A-Z]/.test(pwd)) {
      setPasswordError("Password must contain an uppercase letter.");
      return false;
    }
    if (!/\d/.test(pwd)) {
      setPasswordError("Password must contain a number.");
      return false;
    }
    return true;
  };

  const handleSavePassword = async () => {
    setPasswordError("");
    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (!validatePassword(newPassword)) return;
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("New password must be different.");
      return;
    }

    setIsSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      showSuccess(
        "Password changed",
        "Your password has been updated successfully.",
      );
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      showError(
        "Update failed",
        "Failed to change password. Please try again.",
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    try {
      await resendVerification();
      showSuccess(
        "Verification sent",
        "Please check your email for verification link.",
      );
    } catch {
      showError(
        "Failed to send",
        "Failed to send verification email. Please try again.",
      );
    } finally {
      setIsResendingVerification(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--navy-900)] flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--cyan-500)] border-t-transparent"
          style={{ animationDuration: "1s" }}
        />
      </div>
    );
  }

  if (!user) return null;

  const avatarUrl = getAvatarUrl();

  return (
    <div className="min-h-screen bg-[var(--navy-900)]">
      <Navbar />
      <div className="fixed inset-0 opacity-[0.08] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--navy-600) 1px, transparent 1px), linear-gradient(to bottom, var(--navy-600) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative z-10 p-6 max-w-3xl mx-auto pt-20 md:pt-24 space-y-6">
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-[var(--cyan-400)] tracking-tight">
            Profile Settings
          </h1>
          <p className="text-[var(--gray-400)] mt-1">
            Manage your account information and preferences
          </p>
        </div>

        {/* Avatar Section */}
        <div className="glass-panel rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-[var(--cyan-400)]" />
            Profile Photo
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative group">
              {previewUrl || avatarUrl ? (
                <img
                  src={previewUrl || avatarUrl || ""}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/10"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[var(--navy-700)] flex items-center justify-center border-4 border-white/10">
                  <UserCircle className="w-16 h-16 text-[var(--cyan-500)]" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              {selectedFile ? (
                <div className="space-y-4">
                  <p className="text-white text-sm">
                    Selected: {selectedFile.name}
                  </p>
                  <div className="flex gap-3">
                    <BlueprintButton
                      variant="primary"
                      size="sm"
                      onClick={handleSaveAvatar}
                      isLoading={isSavingAvatar}
                      leftIcon={<Check className="w-4 h-4" />}
                    >
                      Upload
                    </BlueprintButton>
                    <BlueprintButton
                      variant="secondary"
                      size="sm"
                      onClick={handleCancelAvatar}
                      leftIcon={<X className="w-4 h-4" />}
                    >
                      Cancel
                    </BlueprintButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[var(--gray-400)] text-sm">
                    Upload a photo from your device
                  </p>
                  <BlueprintButton
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<Upload className="w-4 h-4" />}
                  >
                    Upload Photo
                  </BlueprintButton>
                  <BlueprintButton
                    variant="secondary"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                    leftIcon={<Smartphone className="w-4 h-4" />}
                  >
                    Take Photo
                  </BlueprintButton>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileSelect(e)}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={(e) => handleFileSelect(e)}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Personal Info Section */}
        <div className="glass-panel rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--cyan-400)]" />
            Personal Information
          </h2>
          <div className="space-y-4">
            {/* Name */}
            <div className="flex items-center justify-between p-4 bg-[var(--navy-800)]/50 rounded-lg">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-[var(--cyan-500)]/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-[var(--cyan-400)]" />
                </div>
                {!isEditingName ? (
                  <div className="flex-1">
                    <p className="text-[var(--gray-400)] text-sm">Name</p>
                    <p className="text-white font-medium">
                      {name || "Not set"}
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex gap-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 px-4 py-2 bg-[var(--navy-800)] border-2 border-[var(--navy-600)] rounded-lg text-white focus:border-[var(--cyan-500)] outline-none transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                )}
              </div>
              {!isEditingName ? (
                <BlueprintButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditingName(true)}
                >
                  Edit
                </BlueprintButton>
              ) : (
                <div className="flex gap-2">
                  <BlueprintButton
                    variant="primary"
                    size="sm"
                    onClick={handleSaveName}
                    isLoading={isSavingName}
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    Save
                  </BlueprintButton>
                  <BlueprintButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsEditingName(false);
                      setName(user.name || "");
                    }}
                    leftIcon={<X className="w-4 h-4" />}
                  >
                    Cancel
                  </BlueprintButton>
                </div>
              )}
            </div>

            {/* Email (Read-only) */}
            <div className="flex items-center justify-between p-4 bg-[var(--navy-800)]/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--cyan-500)]/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[var(--cyan-400)]" />
                </div>
                <div>
                  <p className="text-[var(--gray-400)] text-sm">Email</p>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
              </div>
              <span className="text-[var(--gray-500)] text-sm">
                Cannot be changed
              </span>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="glass-panel rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--cyan-400)]" />
            Security
          </h2>

          {/* Email Verification Status */}
          <div className="flex items-center justify-between p-4 bg-[var(--navy-800)]/50 rounded-lg mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--cyan-500)]/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-[var(--cyan-400)]" />
              </div>
              <div>
                <p className="text-[var(--gray-400)] text-sm">
                  Email Verification
                </p>
                <p
                  className={`font-medium ${user.emailVerification ? "text-green-400" : "text-yellow-400"}`}
                >
                  {user.emailVerification ? "Verified" : "Pending verification"}
                </p>
              </div>
            </div>
            {!user.emailVerification && (
              <BlueprintButton
                variant="secondary"
                size="sm"
                onClick={handleResendVerification}
                isLoading={isResendingVerification}
                leftIcon={<Mail className="w-4 h-4" />}
              >
                Resend
              </BlueprintButton>
            )}
          </div>

          {/* Password Recovery Link */}
          <div className="p-4 bg-[var(--navy-800)]/50 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--cyan-500)]/10 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-[var(--cyan-400)]" />
                </div>
                <div>
                  <p className="text-[var(--gray-400)] text-sm">
                    Forgot Password?
                  </p>
                  <p className="text-white text-sm">Reset using your email</p>
                </div>
              </div>
              <BlueprintButton
                variant="secondary"
                size="sm"
                onClick={() => router.push("/forgot-password")}
                leftIcon={<KeyRound className="w-4 h-4" />}
              >
                Reset Password
              </BlueprintButton>
            </div>
          </div>

          {/* Change Password */}
          <div className="p-4 bg-[var(--navy-800)]/50 rounded-lg">
            {!isChangingPassword ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--cyan-500)]/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[var(--cyan-400)]" />
                  </div>
                  <div>
                    <p className="text-[var(--gray-400)] text-sm">Password</p>
                    <p className="text-white font-medium">
                      Last changed: Never
                    </p>
                  </div>
                </div>
                <BlueprintButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsChangingPassword(true)}
                >
                  Change
                </BlueprintButton>
              </div>
            ) : (
              <div className="space-y-4">
                <BlueprintPasswordInput
                  id="currentPassword"
                  name="currentPassword"
                  label="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <BlueprintPasswordInput
                  id="newPassword"
                  name="newPassword"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                {newPassword && (
                  <BlueprintStrengthMeter password={newPassword} />
                )}
                <BlueprintPasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {passwordError && (
                  <p className="text-red-400 text-sm">{passwordError}</p>
                )}
                <div className="flex gap-3">
                  <BlueprintButton
                    variant="primary"
                    size="sm"
                    onClick={handleSavePassword}
                    isLoading={isSavingPassword}
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    Update Password
                  </BlueprintButton>
                  <BlueprintButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError("");
                    }}
                    leftIcon={<X className="w-4 h-4" />}
                  >
                    Cancel
                  </BlueprintButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
