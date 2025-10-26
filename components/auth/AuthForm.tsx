"use client";

import { useState } from "react";
import { z } from "zod";
import { Castle, Sword, Crown } from "lucide-react";
import { FantasyButton } from "@/components/ui";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  familyCode: z.string().min(1, "Family code is required"),
});

const createFamilySchema = z.object({
  name: z.string().min(1, "Family name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  userName: z.string().min(2, "Your name must be at least 2 characters"),
});

interface AuthFormProps {
  type: "login" | "register" | "create-family";
  onSubmit: (data: Record<string, string>) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export default function AuthForm({
  type,
  onSubmit,
  isLoading = false,
  error,
}: AuthFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const getSchema = () => {
    switch (type) {
      case "login":
        return loginSchema;
      case "register":
        return registerSchema;
      case "create-family":
        return createFamilySchema;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "login":
        return "Enter the Realm";
      case "register":
        return "Join the Guild";
      case "create-family":
        return "Found New Guild";
    }
  };

  const getFields = () => {
    const common = [
      {
        name: "email",
        label: "Email Address",
        type: "email",
        placeholder: "hero@example.com",
      },
    ];

    switch (type) {
      case "login":
        return [
          ...common,
          {
            name: "password",
            label: "Password",
            type: "password",
            placeholder: "••••••••",
          },
        ];
      case "register":
        return [
          {
            name: "name",
            label: "Hero Name",
            type: "text",
            placeholder: "Sir Galahad",
          },
          ...common,
          {
            name: "password",
            label: "Password",
            type: "password",
            placeholder: "••••••••",
          },
          {
            name: "familyCode",
            label: "Guild Code",
            type: "text",
            placeholder: "BraveKnights123",
          },
        ];
      case "create-family":
        return [
          {
            name: "name",
            label: "Guild Name",
            type: "text",
            placeholder: "The Brave Knights",
          },
          {
            name: "userName",
            label: "Your Hero Name",
            type: "text",
            placeholder: "Sir Galahad",
          },
          ...common,
          {
            name: "password",
            label: "Password",
            type: "password",
            placeholder: "••••••••",
          },
        ];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    console.log(
      "AuthForm handleSubmit called, type:",
      type,
      "formData:",
      formData,
    );

    try {
      const schema = getSchema();
      const validatedData = schema.parse(formData);
      console.log("AuthForm calling onSubmit with:", validatedData);
      await onSubmit(validatedData);
      console.log("AuthForm onSubmit completed");
    } catch (error) {
      console.log("AuthForm onSubmit error:", error);
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(errors);
      }
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="fantasy-card p-4 sm:p-8 w-full max-w-md mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold mb-2">
          {getTitle()}
        </h2>
        {type === "create-family" && (
          <p className="text-gray-400 text-sm">
            Establish your family&apos;s legendary guild and become the Guild
            Master
          </p>
        )}
        {type === "register" && (
          <p className="text-gray-400 text-sm">
            Join an existing guild with your family code
          </p>
        )}
        {type === "login" && (
          <p className="text-gray-400 text-sm">Welcome back, noble hero!</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {getFields().map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              {field.label}
            </label>
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              data-testid={`input-${field.name}`}
              placeholder={field.placeholder}
              value={formData[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-full px-4 py-4 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-base touch-target"
              disabled={isLoading}
            />
            {validationErrors[field.name] && (
              <p className="mt-1 text-sm text-red-400">
                {validationErrors[field.name]}
              </p>
            )}
          </div>
        ))}

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <FantasyButton
          type="submit"
          data-testid="auth-submit-button"
          isLoading={isLoading}
          className="w-full justify-center"
          size="lg"
        >
          {isLoading ? (
            "Processing..."
          ) : (
            <>
              {type === "login" && (
                <span className="flex items-center gap-2">
                  <Castle className="w-5 h-5" />
                  Enter Realm
                </span>
              )}
              {type === "register" && (
                <span className="flex items-center gap-2">
                  <Sword className="w-5 h-5" />
                  Join Guild
                </span>
              )}
              {type === "create-family" && (
                <span className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Found Guild
                </span>
              )}
            </>
          )}
        </FantasyButton>
      </form>
    </div>
  );
}
