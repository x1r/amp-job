import { z } from "zod";
import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type OTPInputRef = HTMLInputElement | null;

interface OTPInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  invalid?: boolean;
  required?: boolean | "";
  onInputChange?: () => void;
}

const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  className,
  invalid,
  required,
  onInputChange,
}) => {
  const initialOtp = value
    ? String(value).padStart(6, "0").split("").slice(0, 6)
    : ["", "", "", "", "", ""];

  const [otp, setOtp] = useState<string[]>(initialOtp);
  const inputRefs = useRef<OTPInputRef[]>([]);

  useEffect(() => {
    const allFilled = otp.every((digit) => digit !== "");

    if (allFilled) {
      const otpValue = parseInt(otp.join(""), 10);
      onChange(otpValue);
    }
  }, [otp, onChange]);

  const handleChange = (index: number, value: string): void => {
    if (value.length > 1) return;

    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (onInputChange) {
      onInputChange();
    }

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pastedData.length > 0) {
      const newOtp = Array(6).fill("");
      for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);

      const nextEmptyIndex = newOtp.findIndex((digit) => digit === "");
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0);
    }
  };

  return (
    <div className={`bg-white transition-colors duration-200 max-w-full`}>
      <div className={`flex justify-center gap-3 ${className || ""}`}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            required={required === true || required === ""}
            className={`
                  w-[52px] h-[60px] text-center text-xl font-semibold rounded-lg border-2 transition-all duration-200
                  ${"bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500 "}
                  ${"focus:ring-offset-white !focus-visible:border-gray-100 !focus-visible:ring-1 !focus-visible:ring-gray-100"}
                  ${invalid ? "border-red-500" : ""}
                  `}
            maxLength={1}
            autoComplete="off"
          />
        ))}
      </div>
    </div>
  );
};

export const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordValid, setPasswordValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tfaCodeInvalid, setTfaCodeInvalid] = useState(false);
  const [getNewTFAcode, setGetNewTFAcode] = useState(false);

  const [tfa, setTfa] = useState(false);
  const [tfaCode, setTfaCode] = useState(0);

  useEffect(() => {
    if (!tfa) return;
    const timer = setTimeout(() => {
      setGetNewTFAcode(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [tfa]);

  const handleSubmitLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 200) {
        setTfa(true);
        setIsLoading(false);
      } else {
        const errorData = await response.json();
        setIsLoading(false);
        toast.error(errorData.message);
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("Произошла ошибка при входе");
    }
  };

  const handleSubmitTFA = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const result = fetch("/api/tfa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tfaCode }),
    });

    result.then((res) => {
      if (res.status === 200) {
        toast.success("Вход успешен");
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setTfaCodeInvalid(true);
      }
    });
  };

  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-inter transition-all duration-200"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[440px] p-8 transition-all duration-300 relative">
        <div className="flex flex-col items-center mb-6">
          {tfa && (
            <button
              className="absolute left-4 top-4 w-12 h-12"
              onClick={() => setTfa(false)}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <div className="flex items-center justify-center mb-6 mt-4">
            <div className="relative w-7 h-7 bg-blue-600 rounded-full mr-2">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div className="text-gray-800 font-semibold text-lg">Company</div>
          </div>

          {!tfa ? (
            <div className="text-center w-full">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
                Sign in to your account to continue
              </h1>
            </div>
          ) : (
            <div className="text-center w-full">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
                Two-Factor Authentication
              </h1>
              <p>Enter the 6-digit code from the Google Authenticator app</p>
            </div>
          )}
        </div>

        {!tfa ? (
          <form onSubmit={handleSubmitLogin} className="flex flex-col gap-4">
            <div className="relative">
              <TooltipProvider>
                <Tooltip
                  open={!emailValid && email.length > 0 && isEmailFocused}
                >
                  <TooltipTrigger asChild>
                    <div
                      className={`flex items-center border rounded-lg px-3 h-11 transition duration-200
          focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400
          border-gray-300 hover:border-blue-400`}
                    >
                      <span className="material-symbols-outlined text-gray-500 text-xl mr-2">
                        person
                      </span>
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          const result = z
                            .string()
                            .email()
                            .safeParse(e.target.value);
                          setEmailValid(result.success);
                          if (!result.success) {
                            setEmailError(
                              result.error.issues[0]?.message ||
                                "Invalid email format"
                            );
                          } else {
                            setEmailError("");
                          }
                        }}
                        className="w-full text-base text-gray-800 outline-none placeholder-gray-400 bg-transparent"
                        required
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{emailError || "Email must be in a valid format"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="relative">
              <div
                className={`flex items-center border rounded-lg px-3 h-11 transition duration-200
                  focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400"
                  border-gray-300 hover:border-blue-400
            `}
              >
                <span className="material-symbols-outlined text-gray-500 text-xl mr-2">
                  lock
                </span>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordValid(
                      z.string().min(8).safeParse(e.target.value).success
                    );
                  }}
                  className="w-full text-base text-gray-800 outline-none placeholder-gray-400 bg-transparent"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !emailValid || !passwordValid}
              className={`w-full h-11 rounded-lg font-medium text-lg flex items-center justify-center transition-all duration-300
                ${
                  isLoading || !emailValid || !passwordValid
                    ? "bg-black/[.04] border-[1px] border-[#D9D9D9] cursor-not-allowed text-black/[.25]"
                    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transform hover:-translate-y-0.5 shadow-blue-300/50 text-white"
                }
            `}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Log in"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitTFA} className="flex flex-col gap-4">
            <div className="relative">
              <div>
                <OTPInput
                  value={tfaCode}
                  onChange={(value: number) => {
                    setTfaCode(value);
                  }}
                  onInputChange={() => {
                    setTfaCodeInvalid(false);
                  }}
                  className={`w-full text-base text-gray-800`}
                  invalid={tfaCodeInvalid}
                  required
                />
              </div>
            </div>
            {tfaCodeInvalid && (
              <p className="text-red-500 text-sm">Invalid code</p>
            )}
            {getNewTFAcode && String(tfaCode).length === 0 && (
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-11 rounded-lg font-medium text-lg flex items-center justify-center transition-all duration-300
              ${
                isLoading
                  ? "bg-black/[.04] border-[1px] border-[#D9D9D9] cursor-not-allowed text-black/[.25]"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transform hover:-translate-y-0.5 shadow-blue-300/50 text-white"
              }
              
            `}
                onClick={() => setGetNewTFAcode(false)}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  "Get new code"
                )}
              </button>
            )}
            {String(tfaCode).length === 6 && (
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-11 rounded-lg font-medium text-lg flex items-center justify-center transition-all duration-300
              ${
                isLoading
                  ? "bg-black/[.04] border-[1px] border-[#D9D9D9] cursor-not-allowed text-black/[.25]"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transform hover:-translate-y-0.5 shadow-blue-300/50 text-white"
              }
            `}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  "Continue"
                )}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
