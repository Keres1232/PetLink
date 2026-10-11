export const PASSWORD_POLICY_HINT =
  "La contraseña debe tener al menos 12 caracteres e incluir mayúscula, minúscula, número y símbolo.";

export const WEAK_PASSWORD_SIGNIN_HINT =
  "Tu contraseña no cumple la política de seguridad actual (mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo). Usa «¿Olvidaste tu contraseña?» para restablecerla y poder ingresar.";

type AuthErrorLike = { message?: string; code?: string } | string | null | undefined;

function getMessage(error: AuthErrorLike): string {
  if (!error) return "";
  return typeof error === "string" ? error : error.message ?? "";
}

function getCode(error: AuthErrorLike): string {
  if (!error || typeof error === "string") return "";
  return error.code ?? "";
}

export function isWeakPasswordError(error: AuthErrorLike): boolean {
  const message = getMessage(error);
  const code = getCode(error);
  return (
    code === "weak_password" ||
    message.includes("Password should be at least") ||
    message.includes("Password should contain")
  );
}

export function translateAuthError(error: AuthErrorLike): string {
  const message = getMessage(error);
  if (message.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (message.includes("Email not confirmed")) return "Confirma tu correo antes de iniciar sesión.";
  if (message.includes("already registered"))
    return "No pudimos completar el registro. Revisa tu correo o intenta iniciar sesión.";
  if (isWeakPasswordError(error)) return PASSWORD_POLICY_HINT;
  return message;
}
